<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The "forgot password" email: a 5-digit verification code the person
 * types on the Forgot Password page.
 */
class ResetPasswordCode extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $code,
        private readonly int $minutes
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your MPSU ETEEAP LMS verification code: ' . $this->code)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Use this verification code to reset the password of your MPSU ETEEAP LMS account (ID: ' . $notifiable->school_id . '):')
            ->line('# ' . $this->code)
            ->line("The code expires in {$this->minutes} minutes. Do not share it with anyone; school staff will never ask for it.")
            ->line('If you did not ask to reset your password, you can ignore this email. Your password will not change.')
            ->salutation('MPSU ETEEAP LMS');
    }

    /** For tests: the code that was sent. */
    public function code(): string
    {
        return $this->code;
    }
}
