<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the OLD email address so the owner knows when someone asked to
 * change it ("requested") and when it was changed ("completed"). The new
 * address is shown only partly hidden.
 */
class EmailChangeAlert extends Notification
{
    use Queueable;

    public const REQUESTED = 'requested';
    public const COMPLETED = 'completed';

    public function __construct(
        private readonly string $stage,
        private readonly string $maskedNewEmail,
        private readonly string $name,
        private readonly string $schoolId
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)->greeting('Hello ' . $this->name . ',');

        if ($this->stage === self::COMPLETED) {
            $message
                ->subject('Your email address was changed — MPSU ETEEAP LMS')
                ->line('The email address of your MPSU ETEEAP LMS account (ID: ' . $this->schoolId . ') was changed to ' . $this->maskedNewEmail . '.')
                ->line('From now on, password reset codes and school emails go to the new address. This address will no longer receive them.');
        } else {
            $message
                ->subject('Email change requested — MPSU ETEEAP LMS')
                ->line('Someone signed in to your MPSU ETEEAP LMS account (ID: ' . $this->schoolId . ') and asked to change its email address to ' . $this->maskedNewEmail . '.')
                ->line('Your email address has not changed yet. It changes only after the code sent to the new address is entered.');
        }

        return $message
            ->line('If this was not you, sign in, cancel the request (or change your email back), change your password, and contact your administrator.')
            ->salutation('MPSU ETEEAP LMS');
    }

    public function stage(): string
    {
        return $this->stage;
    }
}
