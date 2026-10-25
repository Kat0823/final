<?php

namespace Tests\Feature;

use Tests\TestCase;

class LoginValidationTest extends TestCase
{
    public function test_login_rejects_missing_credentials(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors([
            'school_id',
            'password',
        ]);
    }

    public function test_demo_failed_assertion(): void
    {
        $response = $this->postJson('/api/login', []);

        // Corrected assertion: missing credentials return HTTP 422.
        $response->assertUnprocessable();
    }
}
