<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class BsitDefaultCoursesSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            [
                'name' => 'Introduction to Computing',
                'code' => 'IT 101',
            ],
            [
                'name' => 'Computer Programming 1',
                'code' => 'IT 102',
            ],
            [
                'name' => 'Computer Programming 2',
                'code' => 'IT 103',
            ],
            [
                'name' => 'Data Structures and Algorithms',
                'code' => 'IT 104',
            ],
            [
                'name' => 'Web Systems and Technologies',
                'code' => 'IT 105',
            ],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate(
                ['code' => $course['code']],
                [
                    'name' => $course['name'],
                    'program' => 'BSIT',
                    'description' => null,
                    'is_active' => true,
                ]
            );
        }
    }
}
