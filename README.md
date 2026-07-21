# Girafe IQ CRM

Production-oriented multi-tenant CRM for **any industry**.

**Stack:** Laravel 12 · Inertia · React · TypeScript · Tailwind · Sanctum · Spatie Permission

## Phase 0 (complete)

- Clean architecture folders (Services, Repositories, DTOs, Policies, …)
- Multi-tenant `companies` + `company_id` scoping
- Spatie roles/permissions (teams = company)
- Sanctum API scaffolding
- Auth (Breeze) + CRM app shell (sidebar, dark/light)
- Dashboard KPI placeholders + module route stubs
- Demo tenant seeder

## Quick start (local SQLite)

```bash
cd girafe-iq-crm
cp .env.example .env   # if needed
php artisan key:generate
touch database/database.sqlite
# ensure DB_CONNECTION=sqlite in .env
php artisan migrate:fresh --seed
npm install && npm run build
php artisan serve
```

Open http://127.0.0.1:8000

### Demo login

| Email | Password |
|-------|----------|
| admin@girafeiq.local | password |

## Server / MySQL setup

The app needs **all migrations** on the server database (38 tables). Local SQLite is separate from the server DB.

### Option A — SSH / terminal (preferred)

In the server project `.env`, set MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

Then run:

```bash
php artisan migrate --force
php artisan db:seed --class=PermissionSeeder --force
php artisan permission:cache-reset
php artisan config:clear
php artisan cache:clear
```

### Option B — phpMyAdmin import

1. Create an empty MySQL database (utf8mb4).
2. On the server run `php artisan migrate --force` (preferred), **or** import migrations via SSH.
3. If you already have tables but are missing invites, import `database/schema/add_team_invitations.sql`.
4. Then run:

```bash
php artisan db:seed --class=PermissionSeeder --force
php artisan permission:cache-reset
```

### Tables that must exist

`users`, `companies`, `company_settings`, `sessions`, `cache`, `jobs`,  
`permissions`, `roles`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`,  
`lead_statuses`, `lead_sources`, `leads`, `enquiries`, `pipelines`, `pipeline_stages`,  
`deals`, `follow_ups`, `customers`, `documents`, `accounts`, `contacts`,  
`automation_rules`, `message_templates`, `outbound_messages`, `campaigns`, … (full list in the SQL file)

## Next (Phase 1)

Custom fields engine · Industry packs · Full onboarding wizard

See `docs/` for architecture notes.
