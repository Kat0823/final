<x-mail::message>
# {{ $isNewGrade ? 'Your activity has been graded' : 'Your grade was updated' }}

Hello {{ $learnerName }},

**{{ $moduleTitle }}**@if ($className) · {{ $className }}@if ($classCode) ({{ $classCode }})@endif @endif

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 18px;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border: 1px solid #cfe5d8; border-top: 4px solid #086b3c; border-radius: 12px; background: #f3faf6;">
                <tr>
                    <td align="center" style="padding: 16px 40px 18px;">
                        <div style="color: #4b5b52; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Score</div>
                        <div style="margin-top: 6px; color: #086b3c; font-size: 30px; font-weight: 700;">{{ $score }} / {{ $maxScore }}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

@if ($feedback !== '')
**Feedback from your instructor**

<x-mail::panel>
{!! nl2br(e($feedback)) !!}
</x-mail::panel>
@endif

<x-mail::button :url="$link" color="success">
View the activity
</x-mail::button>

Please do not reply to this email.

MPSU ETEEAP LMS
</x-mail::message>
