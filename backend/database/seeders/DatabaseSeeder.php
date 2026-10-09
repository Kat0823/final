<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'school_id' => 'ADMIN-001',
            ],
            [
                'name' => 'Academic Administrator',
                'email' => 'admin@mpsu.edu.ph',
                'password' => Hash::make('admin123'),
                'role' => 'academic_admin',
                'program' => null,
                'contact' => null,
                'password_setup_complete' => true,
            ]
        );
    }
}