<?php

namespace Tests\Feature;

use App\Models\SystemAdminAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuditLogEventsTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, string $schoolId, array $extra = []): User
    {
        return User::factory()->create(array_merge([
            'role' => $role,
            'school_id' => $schoolId,
            'name' => "{$role} {$schoolId}",
            'password' => Hash::make('right-password-1'),
            'is_active' => true,
        ], $extra));
    }

    private function login(string $schoolId, string $password = 'right-password-1')
    {
        return $this->postJson('/api/login', ['school_id' => $schoolId, 'password' => $password]);
    }

    private function entries(string $action)
    {
        return SystemAdminAuditLog::where('action', $action)->orderBy('id')->get();
    }

    public function test_successful_login_and_logout_are_recorded_with_role_and_ip(): void
    {
        $learner = $this->user('learner', '24-A0001');

        $token = $this->login('24-A0001')->assertOk()->json('token');
        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $login = $this->entries('login')->sole();
        $this->assertSame($learner->id, $login->actor_id);
        $this->assertSame('learner', $login->details['actor_role']);
        $this->assertSame('127.0.0.1', $login->details['ip']);
        $this->assertSame('24-A0001', $login->details['school_id']);

        $this->assertSame($learner->id, $this->entries('logout')->sole()->actor_id);
    }

    public function test_failed_logins_and_lockout_are_recorded_without_passwords(): void
    {
        $this->user('academic_admin', 'ADM-A1');

        for ($i = 0; $i < 5; $i++) {
            $this->login('ADM-A1', 'wrong-guess-' . $i)->assertStatus(401);
        }
        $this->login('NO-SUCH-ID', 'whatever-123')->assertStatus(401);

        $failed = $this->entries('login_failed');
        $this->assertCount(6, $failed);
        $this->assertSame('Unknown', $failed[0]->actor_name);
        $this->assertNull($failed[0]->actor_id);
        $this->assertTrue($failed[0]->details['account_exists']);
        $this->assertFalse($failed[5]->details['account_exists']);
        $this->assertSame('NO-SUCH-ID', $failed[5]->target_name);

        $locked = $this->entries('account_locked')->sole();
        $this->assertSame('ADM-A1', $locked->details['school_id']);
        $this->assertSame('academic_admin', $locked->details['target_role']);

        // No password, typed or stored, ever lands in the log.
        $everything = SystemAdminAuditLog::all()->toJson();
        $this->assertStringNotContainsString('wrong-guess', $everything);
        $this->assertStringNotContainsString('whatever-123', $everything);
        $this->assertStringNotContainsString('right-password-1', $everything);
    }

    public function test_deactivated_account_sign_in_is_recorded_as_blocked(): void
    {
        $this->user('instructor', 'INS-A1', ['is_active' => false]);

        $this->login('INS-A1')->assertForbidden();

        $blocked = $this->entries('login_blocked')->sole();
        $this->assertSame('deactivated', $blocked->details['reason']);
    }

    public function test_password_setup_and_change_are_recorded(): void
    {
        $this->user('learner', '24-A0002', ['password_setup_complete' => false]);
        $token = $this->login('24-A0002')->json('token');

        $newToken = $this->withToken($token)
            ->postJson('/api/student/setup-password', [
                'password' => 'learner-own-pass',
                'password_confirmation' => 'learner-own-pass',
            ])->assertOk()->json('token');

        $this->app['auth']->forgetGuards();

        $this->withToken($newToken)
            ->putJson('/api/account/password', [
                'current_password' => 'learner-own-pass',
                'password' => 'learner-newer-pass',
                'password_confirmation' => 'learner-newer-pass',
            ])->assertOk();

        $this->assertCount(1, $this->entries('password_setup'));
        $this->assertCount(1, $this->entries('password_change'));
    }

    public function test_system_admin_profile_changes_are_recorded_with_from_and_to(): void
    {
        $admin = $this->user('system_admin', 'SYS-A1', ['name' => 'Old Name', 'email' => 'old@x.edu']);

        $this->actingAs($admin)
            ->postJson('/api/system-admin/profile', ['name' => 'New Name', 'email' => 'old@x.edu'])
            ->assertOk();

        // Saving without changes adds nothing.
        $this->actingAs($admin)
            ->postJson('/api/system-admin/profile', ['name' => 'New Name', 'email' => 'old@x.edu'])
            ->assertOk();

        $entry = $this->entries('profile_update')->sole();
        $this->assertSame(['name' => ['from' => 'Old Name', 'to' => 'New Name']], $entry->details['changes']);
    }

    public function test_audit_page_gets_role_ip_and_module_as_separate_fields(): void
    {
        $systemAdmin = $this->user('system_admin', 'SYS-A2');
        $this->user('learner', '24-A0003');
        $this->login('24-A0003')->assertOk();
        $this->app['auth']->forgetGuards();

        $log = $this->actingAs($systemAdmin)
            ->getJson('/api/system-admin/audit-logs')
            ->assertOk()
            ->json('logs.0');

        $this->assertSame('login', $log['action']);
        $this->assertSame('Sign-in', $log['module']);
        $this->assertSame('learner', $log['actor_role']);
        $this->assertSame('127.0.0.1', $log['ip']);
        $this->assertArrayNotHasKey('actor_role', $log['details']);
        $this->assertArrayNotHasKey('ip', $log['details']);
    }
}
