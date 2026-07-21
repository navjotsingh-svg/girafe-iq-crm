<x-mail::message>
# You're invited, {{ $inviteeName }}!

**{{ $inviterName }}** invited you to join **{{ $companyName }}** on {{ $appName }} as **{{ $roleLabel }}**.

Click the button below to create your password and join the team. You'll work under this company account as staff.

<x-mail::panel>
**Email:** {{ $email }}  
**Role:** {{ $roleLabel }}  
**Link expires:** {{ $expiresAt }}
</x-mail::panel>

<x-mail::button :url="$acceptUrl">
Create password & join
</x-mail::button>

If the button doesn't work, open this link: [{{ $acceptUrl }}]({{ $acceptUrl }})

Thanks,<br>
{{ $appName }}
</x-mail::message>
