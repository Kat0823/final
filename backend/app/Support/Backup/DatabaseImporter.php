<?php

namespace App\Support\Backup;

use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * Puts a backup's database.sql back with the MySQL / MariaDB client
 * ("mysql" or "mariadb"). Every current table is dropped first, so the
 * database ends up exactly as in the backup (then BackupManager runs the
 * migrations to bring it up to the current version). The password goes
 * in a temporary options file, never on the command line.
 */
class DatabaseImporter
{
    public function replaceDatabase(string $sqlPath): void
    {
        DatabaseDumper::connection();

        Schema::dropAllTables();

        $this->import($sqlPath);
    }

    protected function import(string $sqlPath): void
    {
        $database = (string) DatabaseDumper::connection()['database'];
        $optionsFile = DatabaseDumper::writeOptionsFile();
        $input = fopen($sqlPath, 'rb');

        if (!$input) {
            @unlink($optionsFile);
            throw new RuntimeException('The backup database file could not be read.');
        }

        try {
            $binary = self::binary();

            $process = new Process(array_merge(
                [$binary, '--defaults-extra-file=' . $optionsFile, '--default-character-set=utf8mb4'],
                DatabaseDumper::sslOptions($binary),
                [$database]
            ), null, null, $input, (float) config('backup.timeout', 300));

            $process->run();

            if (!$process->isSuccessful()) {
                // The error text is from the mysql client; it never contains the password.
                throw new RuntimeException('The database could not be restored: ' . trim($process->getErrorOutput() ?: 'mysql failed.'));
            }
        } finally {
            fclose($input);
            @unlink($optionsFile);
        }
    }

    /**
     * The client program: BACKUP_MYSQL_PATH, else the one next to the dump
     * program, else mysql / mariadb on the server, else XAMPP's copy.
     * Looked up only when a restore runs.
     */
    public static function binary(): string
    {
        if ($configured = config('backup.mysql')) {
            return $configured;
        }

        $dump = DatabaseDumper::binary();
        $folder = dirname($dump);

        if ($folder !== '.' && $folder !== '') {
            $extension = str_ends_with(strtolower($dump), '.exe') ? '.exe' : '';

            foreach (['mysql', 'mariadb'] as $name) {
                if (is_file($folder . DIRECTORY_SEPARATOR . $name . $extension)) {
                    return $folder . DIRECTORY_SEPARATOR . $name . $extension;
                }
            }
        }

        $finder = new ExecutableFinder();

        foreach (['mysql', 'mariadb'] as $name) {
            if ($path = $finder->find($name)) {
                return $path;
            }
        }

        $xampp = 'C:\xampp\mysql\bin\mysql.exe';

        return is_file($xampp) ? $xampp : 'mysql';
    }
}
