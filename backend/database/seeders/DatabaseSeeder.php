<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    private const ADMIN_SCHOOL_ID = 'ADMIN-001';

    /**
     * Creates the first Academic Admin if it doesn't exist yet. Running the
     * seeder again never changes an existing account's password.
     */
    public function run(): void
    {
        if (User::where('school_id', self::ADMIN_SCHOOL_ID)->exists()) {
            $this->command?->info(self::ADMIN_SCHOOL_ID . ' already exists; left unchanged.');
            return;
        }

        $password = (string) env('SIKNAYAN_SEED_ADMIN_PASSWORD', '');
        $generated = $password === '';

        if ($generated) {
            $password = Str::password(16, symbols: false);
        }

        User::create([
            'school_id' => self::ADMIN_SCHOOL_ID,
            'name' => 'Academic Administrator',
            'email' => null,
            'password' => Hash::make($password),
            'role' => 'academic_admin',
            'program' => null,
            'contact' => null,
            // Temporary password: the admin must choose their own at first login.
            'password_setup_complete' => false,
            'is_active' => true,
        ]);

        if ($generated) {
            $this->command?->warn('Created ' . self::ADMIN_SCHOOL_ID . " with temporary password: {$password}");
            $this->command?->warn('It is shown only once. You will be asked to change it at first login.');
        } else {
            $this->command?->info('Created ' . self::ADMIN_SCHOOL_ID . ' with the password from SIKNAYAN_SEED_ADMIN_PASSWORD.');
        }
    }
}
