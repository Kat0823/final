<?php

namespace Tests\Feature;

use App\Models\AuditLogEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * New accounts: set a new password, then add an email. Until the email
 * is added, the account can only add it or log out, and every sign-in
 * says the email is still needed.
 */
class EmailAfterPasswordSetupTest extends TestCase
{
    use RefreshDatabase;

    private function newAccount(string $role, string $schoolId): User
    {
        return User::factory()->create([
            'role' => $role,
            'school_id' => $schoolId,
            'email' => null,
            'password' => Hash::make('Temp-pass-1'),
            'password_setup_complete' => false,
            'is_active' => true,
        ]);
    }

    public function test_learner_sets_password_then_must_add_email(): void
    {
        $learner = $this->newAccount('learner', '24-EM001');

        $login = $this->postJson('/api/login', ['school_id' => '24-EM001', 'password' => 'Temp-pass-1'])->assertOk();
        $login->assertJsonPath('first_login', true)->assertJsonPath('email_required', false);

        $token = $this->withToken($login->json('token'))
            ->postJson('/api/student/setup-password', ['password' => 'New-pass-12', 'password_confirmation' => 'New-pass-12'])
            ->assertOk()->json('token');

        // No email yet: everything else is refused.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/student/courses')
            ->assertForbidden()->assertJsonPath('code', 'email_required');

        // Signing in again still asks for the email.
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/login', ['school_id' => '24-EM001', 'password' => 'New-pass-12'])
            ->assertOk()->assertJsonPath('first_login', false)->assertJsonPath('email_required', true);

        // Add it.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/account/email', ['email' => 'Ana.Cruz@Example.com'])
            ->assertOk()->assertJsonPath('user.email', 'ana.cruz@example.com');

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/student/courses')->assertOk();
        $this->postJson('/api/login', ['school_id' => '24-EM001', 'password' => 'New-pass-12'])
            ->assertJsonPath('email_required', false);

        $entry = AuditLogEntry::where('action', 'email_added')->sole();
        $this->assertSame($learner->id, $entry->actor_id);
        $this->assertSame('ana.cruz@example.com', $entry->new_values['email']);
    }

    public function test_instructor_and_academic_admin_must_add_email_too(): void
    {
        foreach (['instructor' => '/api/instructor/dashboard', 'academic_admin' => '/api/admin/profile'] as $role => $page) {
            $user = $this->newAccount($role, strtoupper($role) . '-EM');
            $user->update(['password_setup_complete' => true]);

            $this->actingAs($user)->getJson($page)->assertForbidden()->assertJsonPath('code', 'email_required');
            $this->actingAs($user)->postJson('/api/account/email', ['email' => "{$role}@example.com"])->assertOk();
            $this->actingAs($user->fresh())->getJson($page)->assertOk();
        }
    }

    public function test_email_must_be_valid_and_not_used_by_another_account(): void
    {
        User::factory()->create(['role' => 'learner', 'school_id' => '24-EM009', 'email' => 'taken@example.com']);
        $learner = $this->newAccount('learner', '24-EM002');
        $learner->update(['password_setup_complete' => true]);

        $this->actingAs($learner)->postJson('/api/account/email', ['email' => ''])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'Please enter your email address.');
        $this->actingAs($learner)->postJson('/api/account/email', ['email' => 'not-an-email'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'Please enter a valid email address.');
        $this->actingAs($learner)->postJson('/api/account/email', ['email' => 'taken@example.com'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'That email address is already used by another account.');
        $this->assertNull($learner->fresh()->email);
    }

    public function test_logout_still_works_without_an_email(): void
    {
        $learner = $this->newAccount('learner', '24-EM003');
        $learner->update(['password_setup_complete' => true]);
        $token = $learner->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();
    }

    public function test_accounts_with_an_email_are_not_affected(): void
    {
        $learner = User::factory()->create(['role' => 'learner', 'school_id' => '24-EM004', 'email' => 'ok@example.com', 'password_setup_complete' => true, 'is_active' => true]);

        $this->actingAs($learner)->getJson('/api/student/courses')->assertOk();
    }
}
