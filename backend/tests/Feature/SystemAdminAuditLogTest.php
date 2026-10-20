<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemAdminAuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, string $schoolId): User
    {
        return User::factory()->create([
            'role' => $role,
            'school_id' => $schoolId,
            'is_active' => true,
        ]);
    }

    public function test_system_admin_sees_audit_entries_newest_first(): void
    {
        $systemAdmin = $this->user('system_admin', 'SYS-AL-01');
        $this->user('academic_admin', 'ADM-AL-00'); // keeps one active admin

        $this->actingAs($systemAdmin)
            ->postJson('/api/system-admin/academic-administrators', [
                'name' => 'Audit Target',
                'school_id' => 'ADM-AL-01',
                'password' => 'initial-password',
                'password_confirmation' => 'initial-password',
            ])
            ->assertCreated();

        $targetId = User::where('school_id', 'ADM-AL-01')->value('id');

        $this->actingAs($systemAdmin)
            ->putJson("/api/system-admin/academic-administrators/{$targetId}", [
                'is_active' => false,
            ])
            ->assertOk();

        $response = $this->actingAs($systemAdmin)
            ->getJson('/api/system-admin/audit-logs')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'logs');

        $response->assertJsonPath('logs.0.action', 'deactivate')
            ->assertJsonPath('logs.0.target_name', 'Audit Target')
            ->assertJsonPath('logs.0.actor_name', $systemAdmin->name)
            ->assertJsonPath('logs.0.details.is_active.from', true)
            ->assertJsonPath('logs.0.details.is_active.to', false)
            ->assertJsonPath('logs.1.action', 'create')
            ->assertJsonPath('logs.1.details.school_id', 'ADM-AL-01');

        $this->assertNotNull($response->json('logs.0.created_at'));
    }

    public function test_other_roles_cannot_read_audit_logs(): void
    {
        foreach (['academic_admin', 'instructor', 'learner'] as $index => $role) {
            $this->actingAs($this->user($role, "AL-ROLE-{$index}"))
                ->getJson('/api/system-admin/audit-logs')
                ->assertForbidden();
        }
    }

    public function test_audit_logs_require_login(): void
    {
        $this->getJson('/api/system-admin/audit-logs')->assertUnauthorized();
    }
}
