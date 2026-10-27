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
        $connection = config('database.default');
        $db = config("database.connections.{$connection}");

        if (!in_array($db['driver'] ?? '', ['mysql', 'mariadb'], true)) {
            throw new RuntimeException('Backups need the MySQL / MariaDB database.');
        }

        $database = (string) $db['database'];
        $optionsFile = tempnam(sys_get_temp_dir(), 'skb');

        try {
            file_put_contents($optionsFile, sprintf(
                "[client]\nuser=\"%s\"\npassword=\"%s\"\nhost=\"%s\"\nport=%d\n",
                addcslashes((string) $db['username'], "\"\\"),
                addcslashes((string) $db['password'], "\"\\"),
                addcslashes((string) ($db['host'] ?? '127.0.0.1'), "\"\\"),
                (int) ($db['port'] ?? 3306)
            ));
            @chmod($optionsFile, 0600);

            $binary = config('backup.mysqldump');

            $base = [
                $binary,
                '--defaults-extra-file=' . $optionsFile,
                '--single-transaction',
                '--default-character-set=utf8mb4',
            ];

            // Newer MariaDB dump tools (the one Debian/Docker installs) refuse
            // MySQL's self-signed certificate by default. The connection stays
            // encrypted when the server offers it; only the certificate check
            // is skipped, unless BACKUP_VERIFY_DB_CERT=true.
            if (!config('backup.verify_server_cert') && $this->isMariaDbTool($binary)) {
                $base[] = '--skip-ssl-verify-server-cert';
            }

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

    /** True for MariaDB's mysqldump / mariadb-dump (they say "MariaDB" in --version). */
    private function isMariaDbTool(string $binary): bool
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
