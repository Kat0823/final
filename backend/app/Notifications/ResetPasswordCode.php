<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\HtmlString;

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
            ->line($this->codeCard())
            ->line("The code expires in {$this->minutes} minutes. Do not share it with anyone; school staff will never ask for it.")
            ->line('If you did not ask to reset your password, you can ignore this email. Your password will not change.')
            ->salutation('MPSU ETEEAP LMS');
    }

    /**
     * The code in a centered card. Inline styles and a table, so it
     * looks the same in Gmail, Outlook and phone mail apps.
     */
    private function codeCard(): HtmlString
    {
        $code = e($this->code);
        $minutes = (int) $this->minutes;

        return new HtmlString(<<<HTML
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 18px;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border: 1px solid #cfe5d8; border-top: 4px solid #086b3c; border-radius: 12px; background: #f3faf6;">
                <tr>
                    <td align="center" style="padding: 18px 36px 20px;">
                        <div style="color: #4b5b52; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Verification Code</div>
                        <div style="margin-top: 8px; color: #086b3c; font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; padding-left: 10px;">{$code}</div>
                        <div style="margin-top: 8px; color: #6b7a71; font-size: 12px;">Expires in {$minutes} minutes</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
HTML);
    }

    /** For tests: the code that was sent. */
    public function code(): string
    {
        return $this->code;
    }
}
