<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The "reset your password" email. The link opens reset-password.html on
 * the website (FRONTEND_URL), which sends the token back to the API.
 */
class ResetPasswordLink extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/')
            . '/reset-password.html?' . http_build_query([
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);

        $minutes = (int) config('auth.passwords.users.expire', 60);

        return (new MailMessage)
            ->subject('Reset your MPSU ETEEAP LMS password')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('We received a request to reset the password for your MPSU ETEEAP LMS account (ID: ' . $notifiable->school_id . ').')
            ->action('Reset Password', $url)
            ->line("This link expires in {$minutes} minutes and can be used once.")
            ->line('If you did not ask for this, you can ignore this email. Your password will not change.')
            ->salutation('MPSU ETEEAP LMS');
    }
}
