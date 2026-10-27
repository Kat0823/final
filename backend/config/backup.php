<?php

/*
|--------------------------------------------------------------------------
| Data Backup (System Admin)
|--------------------------------------------------------------------------
|
| A backup is one zip: the database (without temporary tables), the
| uploaded files and a restore guide. The .env settings file is never
| included. Backups are kept in storage/app/backups, which is not served
| to the web.
|
*/

/*
| The program that copies the database. In order:
|   1. BACKUP_MYSQLDUMP_PATH in .env, when set;
|   2. "mysqldump" or "mariadb-dump" found on the server (Docker installs
|      it; on a hosted Linux server install the MySQL/MariaDB client);
|   3. XAMPP's copy on Windows, when XAMPP happens to be installed.
| XAMPP is not required.
*/
$findDump = function (): string {
    $finder = new \Symfony\Component\Process\ExecutableFinder();

    foreach (['mysqldump', 'mariadb-dump'] as $name) {
        if ($path = $finder->find($name)) {
            return $path;
        }
    }

    $xamppDump = 'C:\xampp\mysql\bin\mysqldump.exe';

    return is_file($xamppDump) ? $xamppDump : 'mysqldump';
};

return [

    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH') ?: $findDump(),

    // Check the database server's certificate while backing up. Off by
    // default because MySQL's own certificate is self-signed; turn on
    // (BACKUP_VERIFY_DB_CERT=true) when the database has a real certificate.
    'verify_server_cert' => (bool) env('BACKUP_VERIFY_DB_CERT', false),

    // Where backup zips are kept.
    'directory' => storage_path('app/backups'),

    // Tables whose rows are temporary: their structure is saved, their
    // rows are not (after a restore, everyone simply logs in again).
    'skip_data_tables' => [
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
        'sessions',
        'personal_access_tokens',
        'password_reset_tokens',
        'email_change_requests', // pending email changes (short-lived codes)
    ],

    // Uploaded files to include: [folder on disk => name inside the zip].
    'folders' => [
        storage_path('app/private') => 'files/private',          // submissions, module materials
        storage_path('app/public/profile-photos') => 'files/public/profile-photos',
    ],

    // Seconds a backup may take.
    'timeout' => 300,
];
