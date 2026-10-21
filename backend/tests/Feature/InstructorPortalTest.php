<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\Notification;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Every endpoint the Instructor portal (teacher/*.html) calls.
 */
class InstructorPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $instructor;
    private User $otherInstructor;
    private User $learner;
    private Course $class;
    private Module $module;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->admin = User::factory()->create(['role' => 'academic_admin', 'school_id' => 'ADM-IP', 'is_active' => true]);
        $this->instructor = User::factory()->create([
            'role' => 'instructor', 'school_id' => 'INS-101', 'name' => 'Prof Reyes',
            'email' => 'reyes@x.edu', 'is_active' => true, 'password' => Hash::make('instructor-pass'),
            'owner_admin_id' => $this->admin->id,
        ]);
        $this->otherInstructor = User::factory()->create([
            'role' => 'instructor', 'school_id' => 'INS-102', 'is_active' => true, 'owner_admin_id' => $this->admin->id,
        ]);
        $this->learner = User::factory()->create([
            'role' => 'learner', 'school_id' => '24-11111', 'name' => 'Ana Cruz', 'is_active' => true,
            'password' => Hash::make('learner-pass'), 'owner_admin_id' => $this->admin->id,
        ]);
        $this->class = Course::create([
            'name' => 'Web Development', 'code' => 'WEB-101', 'is_active' => true,
            'instructor_id' => $this->instructor->id, 'owner_admin_id' => $this->admin->id,
        ]);
        $this->class->learners()->attach($this->learner->id);
        $this->module = Module::create([
            'course_id' => $this->class->id, 'title' => 'HTML Basics', 'is_published' => true, 'module_order' => 1,
        ]);
    }

    private function submit(): Submission
    {
        $this->actingAs($this->learner)
            ->post('/api/student/submissions', [
                'module_id' => $this->module->id,
                'file' => UploadedFile::fake()->createWithContent('work.pdf', '%PDF-1.4 my work'),
            ], ['Accept' => 'application/json'])
            ->assertSuccessful();

        return Submission::firstOrFail();
    }

    public function test_dashboard(): void
    {
        $this->actingAs($this->instructor)->getJson('/api/instructor/dashboard')
            ->assertOk()->assertJsonPath('success', true);
    }

    public function test_classes_list_and_detail(): void
    {
        $this->actingAs($this->instructor)->getJson('/api/instructor/classes')
            ->assertOk()
            ->assertJsonCount(1, 'classes')
            ->assertJsonPath('classes.0.code', 'WEB-101')
            ->assertJsonPath('classes.0.learner_count', 1);

        $this->actingAs($this->instructor)->getJson("/api/instructor/classes/{$this->class->id}")
            ->assertOk()->assertJsonPath('success', true);

        // Another instructor's view of this class is refused.
        $this->actingAs($this->otherInstructor)->getJson("/api/instructor/classes/{$this->class->id}")
            ->assertNotFound();
    }

    public function test_add_and_edit_a_module(): void
    {
        $created = $this->actingAs($this->instructor)
            ->postJson("/api/instructor/classes/{$this->class->id}/modules", ['title' => 'CSS Basics', 'is_published' => true])
            ->assertCreated()
            ->json('module');

        $this->actingAs($this->instructor)
            ->putJson("/api/instructor/modules/{$created['id']}", ['title' => 'CSS Basics (updated)'])
            ->assertOk()->assertJsonPath('module.title', 'CSS Basics (updated)');

        $this->actingAs($this->otherInstructor)
            ->putJson("/api/instructor/modules/{$created['id']}", ['title' => 'Hijack'])
            ->assertNotFound();
    }

    public function test_submissions_list_file_and_grade(): void
    {
        $submission = $this->submit();

        $this->actingAs($this->instructor)->getJson('/api/instructor/submissions')
            ->assertOk()
            ->assertJsonCount(1, 'submissions')
            ->assertJsonPath('submissions.0.learner.name', 'Ana Cruz');

        $file = $this->actingAs($this->instructor)->get("/api/instructor/submissions/{$submission->id}/file")->assertOk();
        $this->assertSame('%PDF-1.4 my work', $file->streamedContent());

        $this->actingAs($this->otherInstructor)->get("/api/instructor/submissions/{$submission->id}/file")->assertForbidden();

        $this->actingAs($this->instructor)
            ->postJson("/api/instructor/submissions/{$submission->id}/grade", ['score' => 90, 'max_score' => 100, 'feedback' => 'Good'])
            ->assertSuccessful();

        $this->assertDatabaseHas('grades', ['submission_id' => $submission->id, 'instructor_id' => $this->instructor->id]);
    }

    public function test_notifications(): void
    {
        $this->submit(); // creates a "New Submission" notification for the instructor

        $list = $this->actingAs($this->instructor)->getJson('/api/instructor/notifications')->assertOk();
        $id = $list->json('notifications.0.id');
        $this->assertNotNull($id);

        $this->actingAs($this->instructor)->postJson("/api/instructor/notifications/{$id}/read")->assertOk();
        $this->assertTrue(Notification::find($id)->is_read);

        $this->actingAs($this->instructor)->postJson('/api/instructor/notifications/read-all')->assertOk();
    }

    public function test_profile_and_password(): void
    {
        $this->actingAs($this->instructor)->getJson('/api/instructor/profile')
            ->assertOk()->assertJsonPath('user.school_id', 'INS-101');

        $this->actingAs($this->instructor)
            ->putJson('/api/instructor/profile', ['name' => 'Prof R. Reyes', 'email' => 'reyes@x.edu', 'contact' => '0917'])
            ->assertOk()->assertJsonPath('user.name', 'Prof R. Reyes');

        $this->actingAs($this->instructor)
            ->postJson('/api/instructor/profile/password', [
                'current_password' => 'instructor-pass',
                'new_password' => 'brand-new-pass',
                'new_password_confirmation' => 'brand-new-pass',
            ])
            ->assertOk();
    }

    public function test_other_roles_cannot_use_instructor_endpoints(): void
    {
        foreach ([$this->learner, $this->admin] as $user) {
            foreach ([
                ['GET', '/api/instructor/dashboard'],
                ['GET', '/api/instructor/classes'],
                ['GET', '/api/instructor/submissions'],
                ['GET', '/api/instructor/notifications'],
                ['GET', '/api/instructor/profile'],
                ['POST', "/api/instructor/classes/{$this->class->id}/modules"],
                ['PUT', "/api/instructor/modules/{$this->module->id}"],
            ] as [$method, $uri]) {
                $this->actingAs($user)->json($method, $uri, ['title' => 'x'])->assertForbidden();
            }
        }
    }
}
