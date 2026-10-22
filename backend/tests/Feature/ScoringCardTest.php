<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\GradeItem;
use App\Models\Module;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Grading a compiled submission with a scoring card: one row per
 * activity (title, score, over); the grade holds the totals.
 */
class ScoringCardTest extends TestCase
{
    use RefreshDatabase;

    private User $instructor;
    private User $learner;
    private Course $class;
    private Module $module;
    private Submission $submission;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $admin = User::factory()->create(['role' => 'academic_admin', 'school_id' => 'ADM-SC', 'is_active' => true]);
        $this->instructor = User::factory()->create(['role' => 'instructor', 'school_id' => 'INS-SC', 'is_active' => true]);
        $this->learner = User::factory()->create(['role' => 'learner', 'school_id' => '24-SC001', 'is_active' => true]);

        $this->class = Course::create([
            'name' => 'Web Development', 'code' => 'WEB-101', 'is_active' => true,
            'instructor_id' => $this->instructor->id, 'owner_admin_id' => $admin->id,
        ]);
        $this->class->learners()->attach($this->learner->id);
        $this->module = Module::create(['course_id' => $this->class->id, 'title' => 'Module 1', 'is_published' => true, 'module_order' => 1]);

        $this->actingAs($this->learner)->post('/api/student/submissions', [
            'module_id' => $this->module->id,
            'file' => UploadedFile::fake()->createWithContent('compiled.pdf', '%PDF-1.4 all activities'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->submission = Submission::firstOrFail();
    }

    private function grade(array $body)
    {
        return $this->actingAs($this->instructor)
            ->postJson("/api/instructor/submissions/{$this->submission->id}/grade", $body);
    }

    public function test_scoring_card_saves_rows_and_totals(): void
    {
        $this->grade([
            'items' => [
                ['title' => 'Activity 1: HTML page', 'score' => 18, 'max_score' => 20],
                ['title' => 'Activity 2: CSS layout', 'score' => 25.5, 'max_score' => 30],
                ['title' => 'Quiz', 'score' => 9, 'max_score' => 10],
            ],
            'feedback' => 'Good work overall.',
        ])->assertOk()
            ->assertJsonPath('grade.score', '52.50')
            ->assertJsonPath('grade.max_score', '60.00')
            ->assertJsonCount(3, 'grade.items')
            ->assertJsonPath('grade.items.1.title', 'Activity 2: CSS layout');

        // The learner sees the totals and every row, in order.
        $this->actingAs($this->learner)->getJson("/api/student/modules/{$this->module->id}")
            ->assertOk()
            ->assertJsonPath('module.my_submission.grade.percentage', 87.5)
            ->assertJsonCount(3, 'module.my_submission.grade.items')
            ->assertJsonPath('module.my_submission.grade.items.0.title', 'Activity 1: HTML page')
            ->assertJsonPath('module.my_submission.grade.items.0.score', 18)
            ->assertJsonPath('module.my_submission.grade.items.0.max_score', 20);

        $this->actingAs($this->learner)->getJson('/api/student/grades')
            ->assertOk()->assertJsonCount(3, 'grades.0.items');

        // The instructor's submissions list includes the rows too.
        $this->actingAs($this->instructor)->getJson('/api/instructor/submissions')
            ->assertOk()->assertJsonFragment(['title' => 'Quiz']);
    }

    public function test_regrading_replaces_the_rows(): void
    {
        $this->grade(['items' => [['title' => 'A', 'score' => 5, 'max_score' => 10], ['title' => 'B', 'score' => 5, 'max_score' => 10]]])->assertOk();
        $this->grade(['items' => [['title' => 'Only one', 'score' => 40, 'max_score' => 50]]])
            ->assertOk()->assertJsonPath('grade.score', '40.00');

        $this->assertSame(1, GradeItem::count());

        // A single score (old style) clears the rows.
        $this->grade(['score' => 45, 'max_score' => 50])->assertOk();
        $this->assertSame(0, GradeItem::count());
    }

    public function test_invalid_rows_are_refused(): void
    {
        $this->grade(['items' => []])->assertStatus(422);
        $this->grade(['items' => [['title' => '', 'score' => 1, 'max_score' => 2]]])->assertStatus(422);
        $this->grade(['items' => [['title' => 'A', 'score' => 1, 'max_score' => 0]]])->assertStatus(422);
        $this->grade(['items' => [['title' => 'A', 'score' => -1, 'max_score' => 5]]])->assertStatus(422);
        $this->grade(['items' => [['title' => 'Too high', 'score' => 21, 'max_score' => 20]]])
            ->assertStatus(422)->assertJsonPath('message', 'The score of "Too high" cannot be greater than 20.');
        $this->grade(['items' => array_fill(0, 31, ['title' => 'A', 'score' => 1, 'max_score' => 1])])->assertStatus(422);

        $this->assertNull($this->submission->fresh()->grade);
    }

    public function test_other_instructors_cannot_grade(): void
    {
        $other = User::factory()->create(['role' => 'instructor', 'school_id' => 'INS-SC2', 'is_active' => true]);
        $this->actingAs($other)
            ->postJson("/api/instructor/submissions/{$this->submission->id}/grade", ['items' => [['title' => 'A', 'score' => 1, 'max_score' => 2]]])
            ->assertForbidden();
    }
}
