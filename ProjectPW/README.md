# ProjectPW

ProjectPW is a hotel booking demo with PHP-rendered pages and a Node.js REST API.
Its page layer uses a small MVC structure; the existing API and `database/db.json`
remain the data and persistence layer so the current browser/API contract stays
unchanged.

## Structure

```text
ProjectPW/
├── app/
│   ├── Controllers/       PHP page controllers and Node API controller
│   ├── Core/              PHP router and view renderer
│   ├── Models/            Node JSON database model
│   ├── Views/pages/       Page templates
│   └── server.js          Node API entry point
├── Assets/                Hotel and destination images
├── CSS/                   Tailwind source and generated stylesheet
├── JS/                    Browser behavior
├── database/db.json       JSON Server data store
└── *.php                  Existing page URLs, routed through app/bootstrap.php
```

The page request flow is `PHP URL -> Router -> page Controller -> View`.
API requests follow `app/server.js -> ApiController -> JsonDatabaseModel -> db.json`.
The PHP and Node.js controllers keep their responsibilities separate while the
browser scripts continue to use the existing API contract on port 3000.
Views contain page markup and cannot be rendered directly.

## Run locally

From this directory, start both services in separate terminals:

```sh
npm run api
npm run serve:php
```

Then open `http://localhost:8000`. Node.js dependencies are installed with
`npm install` if needed. PHP must be available on `PATH`. The PHP router serves
public assets and page entry points while denying direct HTTP access to the
application source and JSON data file.

The API defaults to the demo administrator credentials shown on the login page.
This local demo account and JSON file are not suitable for production use.
Authentication also uses browser `sessionStorage` and in-memory API sessions;
before production, replace these with secure `HttpOnly` cookies and a persistent
session store, and add rate limiting and verified password recovery.
