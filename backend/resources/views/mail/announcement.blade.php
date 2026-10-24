<x-mail::message>
# {{ $title }}

**{{ $className }}**@if ($classCode) ({{ $classCode }})@endif · posted by {{ $instructorName }}

<x-mail::panel>
{!! nl2br(e($body)) !!}
</x-mail::panel>

<x-mail::button :url="$link" color="success">
Open the announcement
</x-mail::button>

You can reply to the announcement in the LMS. Please do not reply to this email.

MPSU ETEEAP LMS
</x-mail::message>
