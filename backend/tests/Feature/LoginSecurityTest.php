<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $schoolId = 'LS-00001'): User
    {
        return User::factory()->create([
            'school_id' => $schoolId,
            'password' => Hash::make('correct-password'),
            'role' => 'system_admin',
            'is_active' => true,
            'password_setup_complete' => true,
        ]);
    }

    private function attempt(string $schoolId, string $password)
    {
        return $this->postJson('/api/login', [
            'school_id' => $schoolId,
            'password' => $password,
        ]);
    }

    public function test_account_is_locked_after_five_failed_attempts(): void
    {
        $this->account();

        for ($i = 0; $i < 4; $i++) {
            $this->attempt('LS-00001', 'wrong-password')->assertStatus(401);
        }

        // The 5th wrong password locks the account and says so.
        $this->attempt('LS-00001', 'wrong-password')
            ->assertStatus(429)
            ->assertJsonPath('locked', true)
            ->assertJsonPath('message', 'This account is now temporarily locked after 5 failed sign-in attempts. Please try again in 15 minutes, or use "Forgot Password?".');

        // Even the correct password is refused during the lockout.
        $this->attempt('LS-00001', 'correct-password')
            ->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonPath('locked', true);
    }

    public function test_lockout_lasts_fifteen_minutes(): void
    {
        $this->account();

        for ($i = 0; $i < 5; $i++) {
            $this->attempt('LS-00001', 'wrong-password');
        }

        $this->travel(14)->minutes();
        $this->attempt('LS-00001', 'correct-password')->assertStatus(429);

        $this->travel(61)->seconds();
        $this->attempt('LS-00001', 'correct-password')->assertOk();
    }

    public function test_lock_applies_to_the_account_from_any_computer(): void
    {
        $this->account();

        foreach (['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5'] as $ip) {
            $this->withServerVariables(['REMOTE_ADDR' => $ip])->attempt('LS-00001', 'wrong-password');
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.9'])
            ->attempt('LS-00001', 'correct-password')
            ->assertStatus(429);
    }

    public function test_failures_older_than_fifteen_minutes_do_not_count(): void
    {
        $this->account();

        for ($i = 0; $i < 4; $i++) {
            $this->attempt('LS-00001', 'wrong-password')->assertStatus(401);
        }

        $this->travel(16)->minutes();

        $this->attempt('LS-00001', 'wrong-password')->assertStatus(401);
        $this->attempt('LS-00001', 'correct-password')->assertOk();
    }

    public function test_successful_login_resets_the_failure_count(): void
    {
        $this->account();

        for ($i = 0; $i < 4; $i++) {
            $this->attempt('LS-00001', 'wrong-password')->assertStatus(401);
        }

        $this->attempt('LS-00001', 'correct-password')->assertOk();

        for ($i = 0; $i < 4; $i++) {
            $this->attempt('LS-00001', 'wrong-password')->assertStatus(401);
        }

        $this->attempt('LS-00001', 'correct-password')->assertOk();
    }

    public function test_unknown_school_ids_are_also_limited(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->attempt('NO-SUCH-ID', 'whatever')->assertStatus(401);
        }

        $this->attempt('NO-SUCH-ID', 'whatever')->assertStatus(429);
        $this->attempt('NO-SUCH-ID', 'whatever')->assertStatus(429);
    }

    public function test_one_address_cannot_try_many_accounts(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $this->attempt("SPRAY-{$i}", 'password123')->assertStatus(401);
        }

        $this->account('LS-00002');

        $this->attempt('LS-00002', 'correct-password')->assertStatus(429);
    }

    public function test_login_token_expires_after_eight_hours(): void
    {
        $this->account();

        $token = $this->attempt('LS-00001', 'correct-password')->json('token');

        $this->withToken($token)
            ->getJson('/api/system-admin/session')
            ->assertOk();

        $this->travel(481)->minutes();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/system-admin/session')
            ->assertUnauthorized();
    }
}
