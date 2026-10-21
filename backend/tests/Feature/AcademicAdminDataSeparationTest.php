<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Each Academic Admin sees and manages only the learners, instructors and
 * classes they created.
 */
class AcademicAdminDataSeparationTest extends TestCase
{
    use RefreshDatabase;

    private User $adminA;
    private User $adminB;
    private User $learnerA;
    private User $instructorA;
    private Course $classA;
    private Module $moduleA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminA = User::factory()->create(['role' => 'academic_admin', 'school_id' => 'ADM-A', 'is_active' => true]);
        $this->adminB = User::factory()->create(['role' => 'academic_admin', 'school_id' => 'ADM-B', 'is_active' => true]);

        $this->learnerA = User::factory()->create([
            'role' => 'learner', 'school_id' => '24-10001', 'is_active' => true,
            'owner_admin_id' => $this->adminA->id,
            'password' => Hash::make('learner-pass'),
        ]);
        $this->instructorA = User::factory()->create([
            'role' => 'instructor', 'school_id' => 'INS-A', 'email' => 'ins.a@x.edu', 'is_active' => true,
            'owner_admin_id' => $this->adminA->id,
        ]);
        $this->classA = Course::create([
            'name' => 'Class of A', 'code' => 'A-101', 'is_active' => true,
            'instructor_id' => $this->instructorA->id,
            'owner_admin_id' => $this->adminA->id,
        ]);
        $this->classA->learners()->attach($this->learnerA->id);
        $this->moduleA = Module::create(['course_id' => $this->classA->id, 'title' => 'Module of A']);
    }

    public function test_a_new_admin_starts_with_an_empty_workspace(): void
    {
        $this->actingAs($this->adminB)->getJson('/api/admin/learners')->assertOk()->assertJsonCount(0, 'learners');
        $this->actingAs($this->adminB)->getJson('/api/admin/instructors')->assertOk()->assertJsonCount(0, 'instructors');
        $this->actingAs($this->adminB)->getJson('/api/admin/classes')->assertOk()->assertJsonCount(0, 'classes');

        $this->actingAs($this->adminB)->getJson('/api/admin/dashboard')->assertOk()
            ->assertJsonPath('statistics.learners', 0)
            ->assertJsonPath('statistics.instructors', 0)
            ->assertJsonPath('statistics.classes', 0);

        // The owner still sees everything of theirs.
        $this->actingAs($this->adminA)->getJson('/api/admin/learners')->assertJsonCount(1, 'learners');
        $this->actingAs($this->adminA)->getJson('/api/admin/classes')->assertJsonCount(1, 'classes');
    }

    public function test_another_admins_records_cannot_be_changed_or_deleted(): void
    {
        $b = $this->actingAs($this->adminB);

        $b->putJson("/api/admin/learners/{$this->learnerA->id}", ['name' => 'Hijacked'])->assertNotFound();
        $b->deleteJson("/api/admin/learners/{$this->learnerA->id}")->assertNotFound();
        $b->putJson("/api/admin/instructors/{$this->instructorA->id}", ['name' => 'Hijacked'])->assertNotFound();
        $b->deleteJson("/api/admin/instructors/{$this->instructorA->id}")->assertNotFound();
        $b->putJson("/api/admin/classes/{$this->classA->id}", ['name' => 'Hijacked'])->assertNotFound();
        $b->deleteJson("/api/admin/classes/{$this->classA->id}")->assertNotFound();
        $b->getJson("/api/admin/classes/{$this->classA->id}/learners")->assertNotFound();
        $b->getJson("/api/admin/classes/{$this->classA->id}/modules")->assertNotFound();
        $b->putJson("/api/admin/classes/{$this->classA->id}/modules/sync", ['modules' => []])->assertNotFound();
        $b->deleteJson("/api/admin/classes/{$this->classA->id}/learners/{$this->learnerA->id}")->assertNotFound();

        $this->assertDatabaseHas('users', ['id' => $this->learnerA->id, 'name' => $this->learnerA->name]);
        $this->assertDatabaseHas('courses', ['id' => $this->classA->id, 'name' => 'Class of A']);
        $this->assertDatabaseHas('course_user', ['course_id' => $this->classA->id, 'user_id' => $this->learnerA->id]);
        $this->assertDatabaseHas('modules', ['id' => $this->moduleA->id, 'deleted_at' => null]);
    }

    public function test_cannot_borrow_another_admins_learner_or_instructor(): void
    {
        $classB = Course::create([
            'name' => 'Class of B', 'code' => 'B-101', 'is_active' => true,
            'owner_admin_id' => $this->adminB->id,
        ]);

        $this->actingAs($this->adminB)
            ->postJson("/api/admin/classes/{$classB->id}/learners", ['learner_id' => $this->learnerA->id])
            ->assertStatus(422);

        $this->actingAs($this->adminB)
            ->postJson('/api/admin/classes', ['name' => 'Another of B', 'code' => 'B-102', 'instructor_id' => $this->instructorA->id])
            ->assertStatus(422);

        $this->actingAs($this->adminB)
            ->putJson("/api/admin/classes/{$classB->id}", ['instructor_id' => $this->instructorA->id])
            ->assertStatus(422);
    }

    public function test_new_records_belong_to_the_admin_who_creates_them(): void
    {
        $this->actingAs($this->adminB)->postJson('/api/admin/learners', [
            'name' => 'Learner of B', 'school_id' => '24-20001', 'password' => 'temporary-1',
        ])->assertSuccessful();

        $this->actingAs($this->adminB)->postJson('/api/admin/instructors', [
            'name' => 'Instructor of B', 'school_id' => 'INS-B', 'email' => 'ins.b@x.edu', 'password' => 'temporary-1',
        ])->assertSuccessful();

        $this->actingAs($this->adminB)->postJson('/api/admin/classes', [
            'name' => 'Class of B', 'code' => 'B-201',
        ])->assertSuccessful();

        $this->assertDatabaseHas('users', ['school_id' => '24-20001', 'owner_admin_id' => $this->adminB->id]);
        $this->assertDatabaseHas('users', ['school_id' => 'INS-B', 'owner_admin_id' => $this->adminB->id]);
        $this->assertDatabaseHas('courses', ['code' => 'B-201', 'owner_admin_id' => $this->adminB->id]);

        // And admin A doesn't see them.
        $this->actingAs($this->adminA)->getJson('/api/admin/learners')->assertJsonCount(1, 'learners');
    }

    public function test_school_ids_and_class_codes_stay_unique_across_admins(): void
    {
        $this->actingAs($this->adminB)->postJson('/api/admin/learners', [
            'name' => 'Duplicate', 'school_id' => '24-10001', 'password' => 'temporary-1',
        ])->assertStatus(422);

        $this->actingAs($this->adminB)->postJson('/api/admin/classes', [
            'name' => 'Duplicate', 'code' => 'A-101',
        ])->assertStatus(422);
    }

    public function test_notifications_about_a_learner_go_only_to_their_admin(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['school_id' => '24-10001', 'password' => 'wrong-' . $i]);
        }

        $this->assertSame(1, Notification::where('user_id', $this->adminA->id)->where('type', 'account_locked')->count());
        $this->assertSame(0, Notification::where('user_id', $this->adminB->id)->count());
    }

    public function test_an_admin_who_still_manages_records_cannot_be_deleted(): void
    {
        $systemAdmin = User::factory()->create(['role' => 'system_admin', 'school_id' => 'SYS-SEP', 'is_active' => true]);

        $this->actingAs($systemAdmin)
            ->deleteJson("/api/system-admin/academic-administrators/{$this->adminA->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('users', ['id' => $this->adminA->id]);
    }
}
