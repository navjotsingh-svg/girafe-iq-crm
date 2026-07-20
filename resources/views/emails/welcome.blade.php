<x-mail::message>
# Welcome to {{ $appName }}, {{ $userName }}!

Thanks for registering **{{ $companyName }}**. Your account is ready — finish onboarding to set up your pipeline, team, and lead sources.

<x-mail::button :url="$dashboardUrl">
Continue setup
</x-mail::button>

You can sign in anytime at [{{ $loginUrl }}]({{ $loginUrl }}) with the email you used to register.

Thanks,<br>
{{ $appName }}
</x-mail::message>
