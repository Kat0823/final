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

return [

    /*
    | The program that copies the database: BACKUP_MYSQLDUMP_PATH when set.
    | Otherwise (null) it is looked up only when a backup is made: first
    | "mysqldump" or "mariadb-dump" on the server (Docker installs it; on a
    | hosted Linux server install the MySQL/MariaDB client), then XAMPP's
    | copy on Windows if XAMPP happens to be installed. XAMPP is not
    | required. (See DatabaseDumper::binary(); looking it up here would
    | slow down every request.)
    */
    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH') ?: null,

    // The program that puts a backup back (Restore): BACKUP_MYSQL_PATH, or
    // null to use "mysql"/"mariadb" next to the dump program or on the server.
    'mysql' => env('BACKUP_MYSQL_PATH') ?: null,

    // Largest backup zip that can be uploaded for a restore (kilobytes).
    // PHP's own upload_max_filesize and post_max_size must allow it too.
    'max_upload_kb' => (int) env('BACKUP_MAX_UPLOAD_KB', 512000),

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
