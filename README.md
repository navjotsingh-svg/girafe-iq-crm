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

## Quick start

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

## Next (Phase 1)

Custom fields engine · Industry packs · Full onboarding wizard

See `docs/` for architecture notes.
