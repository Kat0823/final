<?php

namespace App\Support\Backup;

use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Writes the database to an .sql file with mysqldump.
 *
 * All tables are saved with their structure; tables listed in
 * config('backup.skip_data_tables') are saved without their rows.
 * The database password goes into a temporary options file (removed
 * right after), never onto the command line.
 */
class DatabaseDumper
{
    public function dump(string $sqlPath): void
    {
        $database = (string) self::connection()['database'];
        $optionsFile = self::writeOptionsFile();

        try {
            $binary = self::binary();

            $base = array_merge([
                $binary,
                '--defaults-extra-file=' . $optionsFile,
                '--single-transaction',
                '--default-character-set=utf8mb4',
            ], self::sslOptions($binary));

            // 1) Every table's structure (and stored routines / triggers).
            $structure = $this->run(array_merge($base, ['--no-data', '--routines', '--triggers', $database]));

            // 2) The rows, except temporary tables.
            $ignore = array_map(
                fn ($table) => '--ignore-table=' . $database . '.' . $table,
                config('backup.skip_data_tables', [])
            );
            $data = $this->run(array_merge($base, ['--no-create-info', '--skip-triggers'], $ignore, [$database]));

            file_put_contents(
                $sqlPath,
                "-- Siknayan LMS database backup\n-- Structure of all tables, then their rows (temporary tables without rows).\n\n"
                . $structure . "\n" . $data
            );
        } finally {
            @unlink($optionsFile);
        }
    }

    /**
     * The dump program: BACKUP_MYSQLDUMP_PATH, else mysqldump / mariadb-dump
     * on the server, else XAMPP's copy on Windows. Looked up only when a
     * backup is made (searching PATH on every request would be slow).
     */
    public static function binary(): string
    {
        if ($configured = config('backup.mysqldump')) {
            return $configured;
        }

        $finder = new \Symfony\Component\Process\ExecutableFinder();

        foreach (['mysqldump', 'mariadb-dump'] as $name) {
            if ($path = $finder->find($name)) {
                return $path;
            }
        }

        $xamppDump = 'C:\xampp\mysql\bin\mysqldump.exe';

        return is_file($xamppDump) ? $xamppDump : 'mysqldump';
    }

    /** The MySQL / MariaDB connection settings (refused for other databases). */
    public static function connection(): array
    {
        $db = config('database.connections.' . config('database.default'));

        if (!in_array($db['driver'] ?? '', ['mysql', 'mariadb'], true)) {
            throw new RuntimeException('Backups need the MySQL / MariaDB database.');
        }

        return $db;
    }

    /**
     * A temporary client options file with the database login, so the
     * password is never on the command line. The caller deletes it.
     */
    public static function writeOptionsFile(): string
    {
        $db = self::connection();
        $optionsFile = tempnam(sys_get_temp_dir(), 'skb');

        file_put_contents($optionsFile, sprintf(
            "[client]\nuser=\"%s\"\npassword=\"%s\"\nhost=\"%s\"\nport=%d\n",
            addcslashes((string) $db['username'], "\"\\"),
            addcslashes((string) $db['password'], "\"\\"),
            addcslashes((string) ($db['host'] ?? '127.0.0.1'), "\"\\"),
            (int) ($db['port'] ?? 3306)
        ));
        @chmod($optionsFile, 0600);

        return $optionsFile;
    }

    /**
     * Newer MariaDB client tools (the ones Debian/Docker installs) refuse
     * MySQL's self-signed certificate by default. The connection stays
     * encrypted when the server offers it; only the certificate check is
     * skipped, unless BACKUP_VERIFY_DB_CERT=true.
     */
    public static function sslOptions(string $binary): array
    {
        return !config('backup.verify_server_cert') && self::isMariaDbTool($binary)
            ? ['--skip-ssl-verify-server-cert']
            : [];
    }

    /** True for MariaDB's client tools (they say "MariaDB" in --version). */
    public static function isMariaDbTool(string $binary): bool
    {
        $process = new Process([$binary, '--version'], null, null, null, 15.0);
        $process->run();

        return $process->isSuccessful()
            && stripos($process->getOutput() . $process->getErrorOutput(), 'mariadb') !== false;
    }

    private function run(array $command): string
    {
        $process = new Process($command, null, null, null, (float) config('backup.timeout', 300));
        $process->run();

        if (!$process->isSuccessful()) {
            // The error text is from mysqldump; it never contains the password.
            throw new RuntimeException('The database could not be saved: ' . trim($process->getErrorOutput() ?: 'mysqldump failed.'));
        }

        return $process->getOutput();
    }
}
