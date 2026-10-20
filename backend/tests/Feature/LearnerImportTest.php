<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class LearnerImportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'role' => 'academic_admin',
            'school_id' => '99-00001',
            'is_active' => true,
        ]);
    }

    private function spreadsheet(array $rows): UploadedFile
    {
        $book = new Spreadsheet();
        $sheet = $book->getActiveSheet();

        $sheet->fromArray(
            [['Student Name', 'School ID', 'Email', 'Program', 'Contact']],
            null,
            'A1'
        );

        foreach ($rows as $index => $row) {
            $sheet->fromArray([$row], null, 'A' . ($index + 2));
        }

        $path = tempnam(sys_get_temp_dir(), 'learner-import-');
        (new Xlsx($book))->save($path);
        $book->disconnectWorksheets();

        return new UploadedFile(
            $path,
            'learners.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }

    public function test_import_accepts_blank_email_and_reports_skipped_email(): void
    {
        $this->actingAs($this->admin());

        $response = $this->postJson('/api/admin/learners/import', [
            'file' => $this->spreadsheet([
                ['Blank Email Learner', '24-12345', '', 'ETEEAP', ''],
            ]),
        ]);

        $response->assertCreated()
            ->assertJsonPath('imported_count', 1)
            ->assertJsonPath('email_summary.skipped_no_email', 1)
            ->assertJsonPath('learners.0.email_status', 'skipped_no_email')
            ->assertJsonPath('learners.0.email', null);

        $learner = User::where('school_id', '24-12345')->firstOrFail();

        $this->assertSame('learner', $learner->role);
        $this->assertNotEmpty($response->json('learners.0.temporary_password'));
        $this->assertTrue(
            Hash::check(
                $response->json('learners.0.temporary_password'),
                $learner->password
            )
        );
        $this->assertFalse($learner->password_setup_complete);
    }

    public function test_import_rejects_invalid_email_without_creating_learner(): void
    {
        $this->actingAs($this->admin());

        $response = $this->postJson('/api/admin/learners/import', [
            'file' => $this->spreadsheet([
                ['Invalid Email Learner', '24-12346', 'not-an-email', 'ETEEAP', ''],
            ]),
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Invalid email address.']);

        $this->assertDatabaseMissing('users', [
            'school_id' => '24-12346',
        ]);
    }

    public function test_import_with_email_reports_mail_as_not_configured_in_tests(): void
    {
        $this->actingAs($this->admin());

        $response = $this->postJson('/api/admin/learners/import', [
            'file' => $this->spreadsheet([
                ['Email Learner', '24-12347', 'learner@example.com', 'ETEEAP', ''],
            ]),
        ]);

        $response->assertCreated()
            ->assertJsonPath('imported_count', 1)
            ->assertJsonPath('email_summary.not_configured', 1)
            ->assertJsonPath('learners.0.email_status', 'not_configured');

        $this->assertDatabaseHas('users', [
            'school_id' => '24-12347',
            'email' => 'learner@example.com',
            'role' => 'learner',
        ]);
    }
}
