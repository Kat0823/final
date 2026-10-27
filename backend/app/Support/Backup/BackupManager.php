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
  database.sql   every table (temporary tables such as sessions, sign-in
                 tokens and pending email codes without their rows:
                 everyone simply logs in again)
  files/         uploaded files
                 files/private                -> backend/storage/app/private
                 files/public/profile-photos  -> backend/storage/app/public/profile-photos
  manifest.json  when it was made, by whom, and what it holds

NOT included: the backend/.env settings file. Keep your own private copy
of it (it holds the database and email passwords and APP_KEY). Without the
same APP_KEY, the restored system still works, but everyone must log in again.

XAMPP is NOT required. Use whichever applies to your server.

BEFORE YOU START
  If the current system still runs, make a fresh backup of it first.
  If this zip asks for a password, it is the password typed when the
  backup was made. It is not stored anywhere; without it the backup
  cannot be opened. Use 7-Zip or WinRAR (Windows' built-in zip tool
  cannot open AES-protected zips), or "7z x backup.zip" on Linux.

STEP 1 - PUT BACK THE DATABASE (importing replaces the tables already there)
  A) Hosted server (a web host or cloud database):
     Open the host's database panel (for example phpMyAdmin, Adminer or the
     provider's "Import" tool), select the Siknayan database and import
     database.sql. Or, from a terminal that can reach the database:
         mysql -h DB_HOST -P DB_PORT -u DB_USERNAME -p DB_DATABASE < database.sql
     (use the DB_ values from backend/.env; it asks for the password).
  B) Docker (docker compose):
         docker compose exec -T mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < database.sql
  C) This computer (Herd, Laragon, XAMPP or any local MySQL/MariaDB):
     Use phpMyAdmin / HeidiSQL / MySQL Workbench -> Import database.sql,
     or the same "mysql ... < database.sql" command as in A.

STEP 2 - PUT BACK THE UPLOADED FILES
  Copy the folders inside files/ to the places listed above.
  Docker: they are inside the project's backend folder on the host,
  so copy them there.

STEP 3 - START THE SYSTEM
  Make sure backend/.env is in place, then start the backend (it runs any
  missing database updates by itself under Docker; otherwise run
  "php artisan migrate") and log in.
TXT;
    }
}
