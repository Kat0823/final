<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private User $learner;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();

        $this->learner = User::factory()->create([
            'role' => 'learner', 'school_id' => '24-RS001', 'name' => 'Ana Cruz',
            'email' => 'ana@example.com', 'is_active' => true,
            'password' => Hash::make('old-password'), 'password_setup_complete' => true,
        ]);
    }

    private function requestLink(string $email)
    {
        return $this->postJson('/api/password/forgot', ['email' => $email]);
    }

    private function tokenFor(User $user): string
    {
        $token = null;
        Notification::assertSentTo($user, ResetPasswordLink::class, function ($notification) use (&$token, $user) {
            $mail = $notification->toMail($user);
            parse_str((string) parse_url($mail->actionUrl, PHP_URL_QUERY), $query);
            $token = $query['token'] ?? null;
            return str_contains($mail->actionUrl, '/reset-password.html?') && ($query['email'] ?? null) === $user->email;
        });
        return $token;
    }

    public function test_link_is_emailed_to_the_account_email(): void
    {
        $this->requestLink('Ana@Example.com')->assertOk()->assertJsonPath('success', true);
        Notification::assertSentTo($this->learner, ResetPasswordLink::class);
        $this->assertDatabaseHas('system_admin_audit_logs', ['action' => 'password_reset_request', 'target_id' => $this->learner->id]);
    }

    public function test_same_answer_when_no_account_or_inactive(): void
    {
        $inactive = User::factory()->create(['role' => 'learner', 'school_id' => '24-RS003', 'email' => 'x@example.com', 'is_active' => false]);

        $expected = $this->requestLink('ana@example.com')->json('message');

        foreach (['nobody@example.com', 'x@example.com'] as $email) {
            $this->requestLink($email)->assertOk()->assertJsonPath('message', $expected);
        }

        Notification::assertNotSentTo($inactive, ResetPasswordLink::class);
    }

    public function test_only_an_email_address_is_accepted(): void
    {
        $this->requestLink('24-RS001')->assertStatus(422)->assertJsonValidationErrors('email');
        $this->requestLink('')->assertStatus(422)->assertJsonValidationErrors('email');
        Notification::assertNothingSent();
    }

    public function test_reset_sets_the_new_password_and_signs_out_everywhere(): void
    {
        $this->learner->createToken('old-device');
        $this->requestLink('ana@example.com');
        $token = $this->tokenFor($this->learner);

        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'ana@example.com',
            'password' => 'brand-new-pass', 'password_confirmation' => 'brand-new-pass',
        ])->assertOk()->assertJsonPath('success', true);

        $this->learner->refresh();
        $this->assertTrue(Hash::check('brand-new-pass', $this->learner->password));
        $this->assertSame(0, $this->learner->tokens()->count());
        $this->assertDatabaseHas('system_admin_audit_logs', ['action' => 'password_reset_email', 'target_id' => $this->learner->id]);

        // The new password works at the login page.
        $this->postJson('/api/login', ['school_id' => '24-RS001', 'password' => 'brand-new-pass'])->assertOk();

        // The link works only once.
        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'ana@example.com',
            'password' => 'another-pass-1', 'password_confirmation' => 'another-pass-1',
        ])->assertStatus(422);
    }

    public function test_wrong_token_short_or_mismatched_password_are_refused(): void
    {
        $this->requestLink('ana@example.com');
        $token = $this->tokenFor($this->learner);

        $this->postJson('/api/password/reset', [
            'token' => 'wrong', 'email' => 'ana@example.com',
            'password' => 'brand-new-pass', 'password_confirmation' => 'brand-new-pass',
        ])->assertStatus(422);

        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'ana@example.com',
            'password' => 'short', 'password_confirmation' => 'short',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'ana@example.com',
            'password' => 'brand-new-pass', 'password_confirmation' => 'different-pass',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('old-password', $this->learner->fresh()->password));
    }

    public function test_system_admin_needs_fifteen_characters(): void
    {
        $admin = User::factory()->create([
            'role' => 'system_admin', 'school_id' => 'SYS-RS', 'email' => 'sys@example.com', 'is_active' => true,
        ]);
        $this->requestLink('sys@example.com');
        $token = $this->tokenFor($admin);

        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'sys@example.com',
            'password' => 'twelve-chars', 'password_confirmation' => 'twelve-chars',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/password/reset', [
            'token' => $token, 'email' => 'sys@example.com',
            'password' => 'a long enough passphrase', 'password_confirmation' => 'a long enough passphrase',
        ])->assertOk();
    }

    public function test_requests_are_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->requestLink('nobody@example.com')->assertOk();
        }
        $this->requestLink('nobody@example.com')->assertStatus(429);
    }
}
