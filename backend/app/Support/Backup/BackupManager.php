<?php

namespace App\Support\Backup;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use ZipArchive;

/**
 * Creates, lists and deletes Siknayan backups.
 *
 * A backup is one zip in config('backup.directory'):
 *   database.sql   all tables (temporary ones without rows)
 *   files/...      uploaded files (submissions, module materials, photos)
 *   RESTORE.txt    how to restore it
 *   manifest.json  what is inside
 * The .env settings file is never included. With a password, every entry
 * is AES-256 encrypted; the password is not stored anywhere.
 */
class BackupManager
{
    /** File names the server creates; anything else is refused. */
    public const NAME_PATTERN = '/^siknayan-backup-\d{8}-\d{6}\.zip$/';

    public function __construct(private DatabaseDumper $dumper)
    {
    }

    public function directory(): string
    {
        $directory = config('backup.directory');
        File::ensureDirectoryExists($directory, 0700);

        return $directory;
    }

    public function isValidName(string $name): bool
    {
        return (bool) preg_match(self::NAME_PATTERN, $name);
    }

    public function path(string $name): ?string
    {
        if (!$this->isValidName($name)) {
            return null;
        }

        $path = $this->directory() . DIRECTORY_SEPARATOR . $name;

        return is_file($path) ? $path : null;
    }

    /** Saved backups, newest first. */
    public function list(): array
    {
        $items = [];

        foreach (glob($this->directory() . DIRECTORY_SEPARATOR . 'siknayan-backup-*.zip') ?: [] as $path) {
            $name = basename($path);

            if (!$this->isValidName($name)) {
                continue;
            }

            $meta = json_decode((string) @file_get_contents($path . '.json'), true) ?: [];

            $items[] = [
                'name' => $name,
                'size' => filesize($path),
                'created_at' => $meta['created_at'] ?? date(DATE_ATOM, filemtime($path)),
                'created_by' => $meta['created_by'] ?? null,
                'encrypted' => (bool) ($meta['encrypted'] ?? false),
                'counts' => $meta['counts'] ?? null,
                'files' => $meta['files'] ?? null,
            ];
        }

        usort($items, fn ($a, $b) => strcmp($b['name'], $a['name']));

        return $items;
    }

    /**
     * Make a new backup. Only one runs at a time.
     */
    public function create(User $actor, ?string $password = null): array
    {
        $directory = $this->directory();
        $lock = fopen($directory . DIRECTORY_SEPARATOR . '.lock', 'c');

        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
            throw new RuntimeException('Another backup is being made. Please wait a moment and try again.');
        }

        $name = 'siknayan-backup-' . now()->format('Ymd-His') . '.zip';
        $zipPath = $directory . DIRECTORY_SEPARATOR . $name;
        $sqlPath = $directory . DIRECTORY_SEPARATOR . '.database-' . bin2hex(random_bytes(6)) . '.sql';

        try {
            if (is_file($zipPath)) {
                throw new RuntimeException('A backup was just made. Please wait a second and try again.');
            }

            $this->dumper->dump($sqlPath);

            $counts = $this->counts();
            $zip = new ZipArchive();

            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
                throw new RuntimeException('The backup file could not be created.');
            }

            if ($password !== null && $password !== '') {
                $zip->setPassword($password);
            }

            $add = function (string $source, string $entry, bool $fromString = false) use ($zip, $password) {
                $ok = $fromString ? $zip->addFromString($entry, $source) : $zip->addFile($source, $entry);

                if (!$ok) {
                    throw new RuntimeException("Could not add {$entry} to the backup.");
                }

                if ($password !== null && $password !== '') {
                    $zip->setEncryptionName($entry, ZipArchive::EM_AES_256);
                }
            };

            $add($sqlPath, 'database.sql');

            $fileCount = 0;
            $fileBytes = 0;

            foreach (config('backup.folders', []) as $folder => $prefix) {
                if (!is_dir($folder)) {
                    continue;
                }

                $files = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($folder, RecursiveDirectoryIterator::SKIP_DOTS)
                );

                foreach ($files as $file) {
                    if (!$file->isFile() || $file->getFilename() === '.gitignore') {
                        continue;
                    }

                    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($folder) + 1));
                    $add($file->getPathname(), $prefix . '/' . $relative);
                    $fileCount++;
                    $fileBytes += $file->getSize();
                }
            }

            $manifest = [
                'system' => 'Siknayan LMS (MPSU ETEEAP)',
                'created_at' => now()->toIso8601String(),
                'created_by' => $actor->name,
                'database' => config('database.connections.' . config('database.default') . '.database'),
                'counts' => $counts,
                'files' => ['count' => $fileCount, 'bytes' => $fileBytes],
                'encrypted' => $password !== null && $password !== '',
                'not_included' => ['.env settings file', 'rows of temporary tables: ' . implode(', ', config('backup.skip_data_tables', []))],
            ];

            $add(json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), 'manifest.json', true);
            $add($this->restoreGuide(), 'RESTORE.txt', true);

            if (!$zip->close()) {
                throw new RuntimeException('The backup file could not be finished.');
            }

            // A few details to list the backup without opening it (no password).
            $meta = $manifest;
            unset($meta['not_included']);
            file_put_contents($zipPath . '.json', json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return collect($this->list())->firstWhere('name', $name);
        } catch (\Throwable $error) {
            @unlink($zipPath);
            @unlink($zipPath . '.json');
            throw $error;
        } finally {
            @unlink($sqlPath);
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    public function delete(string $name): bool
    {
        $path = $this->path($name);

        if (!$path) {
            return false;
        }

        @unlink($path . '.json');

        return @unlink($path);
    }

    /** How many records the backup holds (shown in the list). */
    private function counts(): array
    {
        $count = fn (string $table) => DB::getSchemaBuilder()->hasTable($table) ? DB::table($table)->count() : 0;

        return [
            'users' => $count('users'),
            'classes' => $count('courses'),
            'modules' => $count('modules'),
            'submissions' => $count('submissions'),
            'grades' => $count('grades'),
        ];
    }

    private function restoreGuide(): string
    {
        return <<<'TXT'
SIKNAYAN LMS - HOW TO RESTORE THIS BACKUP
==========================================

This backup holds:
  database.sql   every table (temporary tables such as sessions and
                 sign-in tokens without their rows: everyone logs in again)
  files/         uploaded files
                 files/private                -> backend\storage\app\private
                 files/public/profile-photos  -> backend\storage\app\public\profile-photos
  manifest.json  when it was made, by whom, and what it holds

NOT included: the backend\.env settings file. Keep your own private copy
of it (it holds the database and email passwords and APP_KEY).

1. Make a fresh backup of the current system first, if it still runs.
2. In the XAMPP Control Panel, start Apache and MySQL.
3. Open http://localhost/phpmyadmin, select (or create) the "siknayan"
   database, open Import, choose database.sql and click Import.
   Importing replaces the tables that are already there.
4. Copy the folders inside files\ back to the places listed above.
5. Make sure backend\.env is in place, then start the backend and log in.

If this zip asks for a password: it is the password typed when the
backup was made. It is not stored anywhere; without it the backup
cannot be opened. Use 7-Zip or WinRAR (Windows' built-in zip tool
cannot open AES-protected zips).
TXT;
    }
}
