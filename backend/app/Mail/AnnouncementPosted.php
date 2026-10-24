<?php

namespace App\Mail;

use App\Models\Announcement;
use App\Models\Course;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email to the learners of a class when the instructor posts an
 * announcement. Sent with the learners in BCC, so nobody sees the
 * other learners' addresses.
 */
class AnnouncementPosted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Course $course,
        public readonly Announcement $announcement,
        public readonly string $instructorName
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New announcement in ' . $this->course->name . ': ' . $this->announcement->title,
        );
    }

    public function content(): Content
    {
        $link = rtrim((string) config('app.frontend_url'), '/')
            . '/student/modules.html?course=' . $this->course->id . '#announcements';

        return new Content(
            markdown: 'mail.announcement',
            with: [
                'className' => $this->course->name,
                'classCode' => $this->course->code,
                'title' => $this->announcement->title,
                'body' => $this->announcement->message,
                'instructorName' => $this->instructorName,
                'link' => $link,
            ],
        );
    }
}
