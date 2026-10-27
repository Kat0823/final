<?php

namespace App\Mail;

use App\Models\Grade;
use App\Models\Submission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email to a learner when the instructor grades their activity, or
 * changes the score of an activity already graded.
 */
class ActivityGraded extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Submission $submission,
        public readonly Grade $grade,
        public readonly bool $isNewGrade
    ) {
    }

    public function envelope(): Envelope
    {
        $title = $this->submission->module?->title ?? 'your activity';

        return new Envelope(
            subject: ($this->isNewGrade ? 'Activity graded: ' : 'Grade updated: ') . $title,
        );
    }

    public function content(): Content
    {
        $module = $this->submission->module;
        $course = $module?->course;

        $link = rtrim((string) config('app.frontend_url'), '/')
            . '/student/submission.html?module=' . $this->submission->module_id;

        return new Content(
            markdown: 'mail.activity-graded',
            with: [
                'learnerName' => $this->submission->learner?->name ?? 'Learner',
                'moduleTitle' => $module?->title ?? 'Activity',
                'className' => $course?->name ?? '',
                'classCode' => $course?->code ?? '',
                'score' => self::number($this->grade->score),
                'maxScore' => self::number($this->grade->max_score),
                'feedback' => trim((string) $this->grade->feedback),
                'isNewGrade' => $this->isNewGrade,
                'link' => $link,
            ],
        );
    }

    private static function number(float|int|string|null $value): string
    {
        $number = (float) $value;

        return floor($number) === $number
            ? (string) (int) $number
            : rtrim(rtrim(number_format($number, 2, '.', ''), '0'), '.');
    }
}
