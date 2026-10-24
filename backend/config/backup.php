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

$xamppDump = 'C:\xampp\mysql\bin\mysqldump.exe';

return [

    // mysqldump program (XAMPP's when it is installed, else from PATH).
    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH') ?: (is_file($xamppDump) ? $xamppDump : 'mysqldump'),

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
    ],

    // Uploaded files to include: [folder on disk => name inside the zip].
    'folders' => [
        storage_path('app/private') => 'files/private',          // submissions, module materials
        storage_path('app/public/profile-photos') => 'files/public/profile-photos',
    ],

    // Seconds a backup may take.
    'timeout' => 300,
];
