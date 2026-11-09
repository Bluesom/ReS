# Reservation Synchronization (Laravel)

## Local setup

Run these commands from the Laravel project folder after configuring `.env` with
a reachable database:

```powershell
php artisan migrate
php artisan db:seed
npm run build
php artisan serve
```

In `local` and `testing` environments, `db:seed` imports the bundled sample data
from `database/seeders/data/db.json`. The importer retains the accounts already
defined in that file and is safe to repeat. No additional demo accounts are
created, and no files from the old MVC project are required.

Imported demo accounts:

- Admin: `admin@example.com` / `Admin123!`
- Guest: `jackmahardi@gmail.com` / the password originally set for that account.

The guest's password is stored as a one-way hash in the JSON file and cannot be
read from it. If it is unknown, use the app's password-reset flow. Do not use
demo credentials in production. To run the bundled JSON import again, use
`php artisan app:import-legacy-json`; another JSON path can be supplied as an
optional argument.

To load CSS and JavaScript during development, use a second terminal and run
`npm run dev` instead of `npm run build`.
