<x-mail::message>
# You're invited, {{ $inviteeName }}!

**{{ $inviterName }}** invited you to join **{{ $companyName }}** on {{ $appName }} as **{{ $roleLabel }}**.

Use these credentials to sign in:

<x-mail::panel>
**Email:** {{ $email }}  
**Temporary password:** {{ $temporaryPassword }}
</x-mail::panel>

Please change your password after your first login.

<x-mail::button :url="$loginUrl">
Sign in
</x-mail::button>

Thanks,<br>
{{ $appName }}
</x-mail::message>
