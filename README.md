# ReS — Hotel Reservation

ReS is a hotel reservation app for guests and administrators. The Laravel 10
application is in `ProjectPW/`; it uses MySQL for local development and Vite for
frontend assets.

## Features

- Browse hotel information, room types, and offers.
- Register, sign in, manage a guest profile, and request bookings.
- Authenticate API requests with signed JWT bearer tokens (two-hour expiry, with server-side logout and revocation).
- Manage the sample Programs API with JWT-protected CRUD endpoints.
- Administer rooms, room types, guests, bookings, and offers.
- Import the bundled legacy sample data into the Laravel database.

## Requirements

- PHP 8.1 or newer with `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl`, and
  `fileinfo`.
- Composer 2.
- MySQL 8 or a compatible MariaDB server.
- Node.js 20 LTS (or newer) and npm.

## Quick start (Windows / PowerShell)

From the repository root:

```powershell
cd .\ProjectPW
composer install
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
```

Start MySQL and create the database configured in `.env.example` (`laravel`):

```sql
CREATE DATABASE laravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update `.env` if your MySQL host, database name, username, or password differs
from the example. Then migrate and load the local demo data:

```powershell
php artisan migrate --seed
```

Run the app in two terminals from `ProjectPW`. In the first:

```powershell
npm run dev
```

In the second:

```powershell
php artisan serve
```

Open the URL printed by Artisan, usually <http://127.0.0.1:8000>. For a
production-style frontend build, use `npm run build` instead of `npm run dev`.

## Tests and CI

Tests use an isolated in-memory SQLite database by default, so running them
does not touch your local MySQL data:

```powershell
php artisan test
```

For JWT API testing, `POST /api/login` with an account email and password to
receive an `access_token`. Send it as `Authorization: Bearer <access_token>` to
the protected `/api/programs` endpoints (`GET`, `POST`, `PUT /{id}`, `DELETE /{id}`).
The local/testing seed includes `Program A` as a sample record.

GitHub Actions also runs the test suite against MySQL 8 and verifies the
frontend production build on pushes and pull requests.

## Sample data

In `local` and `testing` environments, `php artisan db:seed` imports the bundled
data from `ProjectPW/database/seeders/data/db.json`. The importer can be run
again safely; it does not overwrite existing records with matching source IDs.

The local demo admin is `admin@example.com` / `Admin123!`. Demo credentials are
for local development only and must never be used in production.

## Team notes

- Do not commit `.env`, database credentials, or generated secrets.
- `composer.lock` and `package-lock.json` are committed; use `composer install`
  and `npm ci` so every teammate gets the locked dependency versions.
- The Laravel application is under `ProjectPW/`; this root README is the
  canonical setup guide.

## Troubleshooting

- `php artisan test` is not recognized: install all Composer dependencies with
  `composer install` (do not use `--no-dev` for development).
- `vite` is not recognized: run `npm ci` from `ProjectPW/`.
- `No application encryption key`: run `php artisan key:generate`.
- `Unknown database` or `Access denied`: start MySQL and check the `DB_*` values
  in your local `.env`.
- Do not commit `.env`; it contains machine-specific settings and secrets.
