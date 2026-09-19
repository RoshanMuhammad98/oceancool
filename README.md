# OceanCool — Service & Payment Records

Replaces the paper register at OceanCool AC Service. A staff member opens the app, adds
a customer, records a job with its amount, and later records the money when it actually
arrives — a day, a month or a year after the work. The pending figure is never typed;
it is always billed minus received.

Single company, single database. No multi-tenant scoping anywhere.

| | |
|---|---|
| Backend | Java 21 · Spring Boot 3.3 · Spring Data JPA · PostgreSQL · REST |
| Frontend | React 18 · Vite 5 · React Router 6 · installable PWA, mobile first |
| Money | `BigDecimal` at scale 2 everywhere |
| Dates | `LocalDate` on the wire as ISO, shown as DD-MM-YYYY |

---

## 1. What you need

- **JDK 21** — `java -version`
- **Maven 3.9+** — `mvn -v` (or use your IDE's bundled Maven)
- **PostgreSQL 14+** running locally
- **Node 20+** — `node -v`

## 2. Backend

### Create the database

PostgreSQL 17 is already installed and running here (service `postgresql-x64-17`, port
5432). Create one empty database — pgAdmin 4 ships with PostgreSQL 17, or from a
terminal:

```bash
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE oceancool;"
```

> **Your `postgres` password is not `postgres`.** The defaults in
> `application.properties` will not connect as they stand, so pass the real one as
> `DB_PASSWORD` — see below.

### Running it from IntelliJ

1. **File → Open** → `C:\Ai\oceancool\backend` — the folder containing `pom.xml`, not
   `oceancool` itself. IntelliJ then treats it as a single Maven project and imports it
   without needing a Maven wrapper.
2. Accept the "load Maven project" prompt and let the dependency import finish.
3. **File → Project Structure → Project** → SDK **corretto-21.0.5** (already installed
   under `C:\Users\mykar\.jdks\`), language level 21.
4. Open `OceanCoolApplication.java` and hit the gutter arrow. IntelliJ creates the run
   configuration itself — in Community Edition that is a plain *Application* config
   rather than a Spring Boot one, which is fine; nothing here needs the Spring plugin.
5. **Put the database password on that run configuration**: Edit Configurations →
   *Environment variables* →

   ```
   DB_PASSWORD=<your postgres password>
   ```

   Every property in `application.properties` reads an environment variable first, so
   the file never has to be edited and no password reaches git.

Lombok generates the entity getters and setters. Its plugin is bundled with IntelliJ
2024.3, but if entity fields show up unresolved, switch on **Settings → Build,
Execution, Deployment → Compiler → Annotation Processors → Enable annotation
processing**.

### Running it with Docker instead

If the local `postgres` password is not to hand, `docker-compose.yml` brings up Postgres
and the API together with no credentials to chase:

```bash
cd C:/Ai/oceancool
docker compose up --build          # http://localhost:8080
docker compose down                # stop, keep the data
docker compose down -v             # stop and wipe the data
```

If port 8080 is taken (another Spring Boot app, say), override the host port and tell
the frontend where to look:

```bash
API_PORT=18080 docker compose up --build
cd frontend && VITE_DEV_API_TARGET=http://localhost:18080 npm run dev
```

### Running it from a terminal

There is no Maven wrapper committed, so borrow IntelliJ's bundled Maven:

```bash
export JAVA_HOME="C:/Users/mykar/.jdks/corretto-21.0.5"
MVN="/c/Program Files/JetBrains/IntelliJ IDEA Community Edition 2024.3.1.1/plugins/maven/lib/maven3/bin/mvn.cmd"
cd C:/Ai/oceancool/backend

"$MVN" test                                                   # 7 tests — the money rules
DB_PASSWORD=<your postgres password> "$MVN" spring-boot:run   # http://localhost:8080
```

### What the first run creates

Tables are created on startup (`spring.jpa.hibernate.ddl-auto=update`), along with:

- **the first staff login** — `admin` / `admin123`
- **demo records** — 4 customers and 8 services covering today, this month, last month
  and a year-old unpaid job, so the dashboard and reports are not empty on first launch

Both are configurable in `backend/src/main/resources/application.properties`, and every
value there takes an environment-variable override:

```properties
app.admin.username=${ADMIN_USERNAME:admin}
app.admin.password=${ADMIN_PASSWORD:admin123}
app.seed-demo=${SEED_DEMO:true}          # set false before handing this to the shop
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/oceancool}
spring.datasource.password=${DB_PASSWORD:postgres}
app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:5173,...}
```

**Change the admin password before this goes anywhere real.**

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:8080`, so the browser makes same-origin
requests in development and CORS never comes up. To point at a different backend while
developing, set `VITE_DEV_API_TARGET`.

For a production build, `VITE_API_BASE_URL` must name the deployed API origin:

```bash
cp .env.example .env.local   # set VITE_API_BASE_URL=https://api.yourdomain.com
npm run build                # -> frontend/dist
npm run preview              # serve the build locally
```

Serve `dist/` as a **SPA** — every unknown path must fall back to `index.html`, or a
refresh on `/customers/3` will 404.

## 4. Installing it on a phone

The frontend is a real PWA: `public/manifest.json`, a hand-written service worker in
`public/sw.js`, and a generated icon set in `public/icons/`.

- **Android / Chrome / Edge** — the dashboard shows an *Install OceanCool* bar, and
  Settings has an install button. Both use the browser's own install prompt.
- **iPhone / iPad** — Safari never offers a prompt: **Share → Add to Home Screen**.
  Settings says so on iOS.

Two things are required for the install option to appear at all: the app must be served
over **HTTPS** (localhost is exempt) and the service worker must register. Once
installed it opens full screen with no browser chrome, and the app shell still opens
with no signal — though records themselves need the API, so the screens will show
"Cannot reach the server" until the connection is back.

Service worker strategy:

| Request | Strategy |
|---|---|
| Navigations | network first, cached app shell as fallback |
| `/assets/*`, icons | cache first (Vite fingerprints the filenames) |
| `/api/**` | network only — records must never come from a stale cache |

Bump `CACHE_VERSION` in `public/sw.js` on release to retire old caches.

To redraw the icons after changing the mark: `npm run icons`.

## 5. How the money works

This is the part worth understanding before changing anything.

A `service_records` row carries `amount` (billed), `paid_amount` (received so far) and
`payment_status`. Pending is `amount - paid_amount`, and **status is always derived from
those two numbers** — never set by hand:

| Condition | Status |
|---|---|
| `paid_amount = 0` | `PENDING` |
| `0 < paid_amount < amount` | `PARTIAL` |
| `paid_amount >= amount` | `PAID` |

`ServiceRecordService.applyMoney` is the only method that writes these three fields, so
the status and the figures cannot drift apart. Paying more than the billed amount is
rejected with a 400.

Recording money later — the "serviced in September, cash in October" case — is
`PATCH /api/services/{id}/payment`. It takes the **running total received** for the
record, not an instalment, so re-sending the same value is harmless. The React payment
sheet asks staff what they received *now* and adds it to what was already paid before
calling, because that is the number in their hand.

**There is no `payments` table.** Per-instalment history was dropped from this build on
purpose. When it is wanted, add a `payments` child table, make `paid_amount` its `SUM`,
and keep `applyMoney` as the single writer — no controller, DTO or screen has to change,
because the API already exposes `amount` / `paidAmount` / `pendingAmount` rather than
the storage shape.

Deleting a customer who has service records is refused (400). The caller has to ask
again with `?force=true`, which then removes the history too — so history is never lost
by a mis-tap.

## 6. REST API

Authentication is `POST /api/auth/login`, which returns an opaque token. The API itself
is currently open: `SecurityConfig` permits all requests, and the React app is what keeps
users off the screens until they have a token. The class comment says exactly which two
lines change when JWT is wanted.

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/auth/login` | `{username, password}` → `{token, userId, username, displayName}` |
| `POST` | `/api/auth/logout` | invalidates the token |
| `GET` | `/api/customers` | `?search=` matches name or phone |
| `GET` | `/api/customers/{id}` | customer **plus** full service history |
| `POST` `PUT` `DELETE` | `/api/customers[/{id}]` | `DELETE` takes `?force=true` |
| `GET` | `/api/services` | `?from=&to=&status=&customerId=&q=` — all optional, they combine |
| `GET` `POST` `PUT` `DELETE` | `/api/services[/{id}]` | |
| `PATCH` | `/api/services/{id}/payment` | `{paidAmount, paymentDate}` — total received |
| `GET` | `/api/dashboard` | today's and this month's figures, total pending, 10 recent |
| `GET` | `/api/reports` | `?from=&to=&groupBy=DAY\|WEEK\|MONTH\|YEAR` |

Controllers return DTOs, never entities. Errors all come back in one shape, with
`fieldErrors` populated on validation failures so the forms can highlight inputs:

```json
{ "timestamp": "...", "status": 400, "error": "Validation failed",
  "message": "Amount is required", "fieldErrors": { "amount": "Amount is required" } }
```

## 7. Layout

```
backend/src/main/java/com/oceancool/
  config/      SecurityConfig · CorsConfig · DataSeeder
  controller/  Auth · Customer · Service · Dashboard · Report
  dto/         requests, responses, ReportGroup (records, not classes)
  entity/      User · Customer · ServiceRecord · PaymentStatus · Auditable
  exception/   GlobalExceptionHandler · ApiError · NotFound/BadRequest/Unauthorized
  repository/  repositories + ServiceRecordSpecifications + CustomerTotalsView
  service/     UserService · CustomerService · ServiceRecordService
               DashboardService · ReportService · Money

frontend/src/
  styles/      tokens.css (palette + type) · base.css (shell) · components.css
  lib/         api.js (the only fetch) · format.js (rupees, dates)
  hooks/       useAsync · useTheme · useInstallPrompt
  ui/          Icons · Sheet · Field · Pill · Toast · Confirm · States
  components/  AppShell · ServiceRow · ServiceFormSheet · ServiceDetailSheet
               CustomerFormSheet · PaymentSheet
  pages/       Login · Dashboard · Customers · CustomerDetail
               Services · Reports · Settings · NotFound
```

## 8. Interface notes

One set of navigation items renders twice from the same markup: bottom tabs below 800px,
a side rail above it, so a tablet and a desktop get a real layout rather than a stretched
phone. Ocean teal is the brand and every interactive surface; copper means money still
owed and green means money received — the same two colours carry through pills, the left
stripe on each row, and the split bars in Reports, so an unpaid job is visible without
reading the row. Archivo sets headings, IBM Plex Sans the body, IBM Plex Mono every
figure, with tabular numerals so columns of rupees line up.

Light and dark are both designed, following the phone by default with an override in
Settings. Colours are only ever read from tokens in `styles/tokens.css`.

## 9. Status

Verified end to end against real PostgreSQL, not mocks.

**Backend** — compiled and tested with Corretto JDK 21.0.5 and Maven 3.9.9:
`Tests run: 7, Failures: 0, Errors: 0` → `BUILD SUCCESS`. Those 7 unit tests pin the
payment-status rules from section 5.

**Container** — `backend/Dockerfile` builds clean (120MB image) and boots in about 10
seconds against Postgres 17, reporting exactly what it should on a fresh database:

```
Created the first staff login 'admin'. Change the password in application.properties.
Seeded 4 demo customers and 8 demo service records.
```

**Schema** — generated as intended: `numeric(12,2)` for `amount` and `paid_amount`,
`date` for the two business dates, `timestamp(6)` for the audit columns, all three
indexes present, a CHECK constraint on `payment_status`, and a customer foreign key
with no delete cascade, so business rule 9 holds at the database level too.

**API** — 38 checks against the running container, all passing: login and its 401/400
paths, dashboard figures, per-customer rollups (`billed - paid = pending` reconciles for
every customer), search by phone fragment and case-insensitive name, 404 on unknown ids,
every service filter (status, date range, free text, `from` after `to` → 400), create
with per-field validation errors, the three status rules, the overpayment refusal, a
part payment followed by settling the balance, the refusal to delete a customer who has
history, and all four report groupings with totals that reconcile.

**Frontend** — production build served and driven through a real browser against that
same container: signed in through the login form, then dashboard, service list, customer
detail and reports all rendered live data with **zero console errors**. Checked at 390px,
820px and 1280px in both light and dark.

### Two things found and fixed during that run

- **CORS on loopback.** A browser treats `http://localhost:4173` and
  `http://127.0.0.1:4173` as different origins, so the app failed every request from one
  of them while the API was perfectly healthy. The dev default is now the origin
  patterns `http://localhost:[*]` and `http://127.0.0.1:[*]`, which also survive Vite
  picking a different port. **Production still has to set `CORS_ORIGINS` explicitly.**
- **Port 8080 collision.** The compose file takes `${API_PORT:-8080}` so another Spring
  Boot app on 8080 does not block it.

### Still unverified

- No deployment has been run — Render, Vercel and Neon configuration in section 10 is
  written but untested, because each needs an account.
- Installing to a phone home screen needs HTTPS, so it could not be exercised locally.
- `ddl-auto=update` is fine for testing. Before this holds records anyone depends on,
  move to Flyway or Liquibase so schema changes are reviewable.

## 10. Free-tier test deployment

Everything below is free and needs no credit card. The split is deliberate:

| Piece | Host | Why |
|---|---|---|
| Database | **Neon** | Free Postgres that does not expire. Render's free Postgres is deleted after 30 days. |
| API | **Render** | Free Docker web service. Java is not one of Render's auto-detected runtimes, hence `backend/Dockerfile`. |
| Frontend | **Vercel** | SPA routing, CDN, and HTTPS — which the PWA install prompt requires. |

You need HTTPS for the real test: a phone cannot install a PWA from `localhost`, so
"Add to Home Screen" only becomes testable once the frontend is deployed.

### Step 0 — push to GitHub

Render and Vercel both deploy from a repository.

```bash
cd C:/Ai/oceancool
git init
git add .
git commit -m "OceanCool: service and payment records"
gh repo create oceancool --private --source=. --push
```

`.gitignore` already keeps `target/`, `node_modules/`, `dist/` and every `.env` out.
No password is committed — all of them arrive as environment variables.

### Step 1 — database on Neon

1. Sign up at [neon.com](https://neon.com), create a project, pick the region closest
   to you (`ap-southeast-1` / Singapore).
2. On the dashboard open **Connection Details** and switch the snippet type to **Java**.
   You want three values:

   ```
   DB_URL       jdbc:postgresql://ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   DB_USERNAME  neondb_owner
   DB_PASSWORD  <shown once — copy it now>
   ```

   **Keep `?sslmode=require`.** Neon refuses plaintext connections, and without it the
   app fails at startup with a driver SSL error.

No tables to create: JPA creates them on the first boot. The database Neon gives you
(`neondb`) is the one to use — there is no need for a separate `oceancool` database.

### Step 2 — API on Render

1. Sign up at [render.com](https://render.com) and connect the GitHub repo.
2. **New → Blueprint**, select the repo. Render reads `render.yaml` and proposes the
   `oceancool-api` service — plan free, region Singapore, Docker, root `backend/`.
3. It will prompt for the variables marked `sync: false`:

   | Variable | Value |
   |---|---|
   | `DB_URL` `DB_USERNAME` `DB_PASSWORD` | from Neon, step 1 |
   | `ADMIN_PASSWORD` | the staff password you want — **not** `admin123` |
   | `CORS_ORIGINS` | leave as `http://localhost:5173` for now; step 3 replaces it |

4. Deploy. The first build takes 3–5 minutes (Maven downloads inside the container).
   In the logs, look for:

   ```
   Created the first staff login 'admin'. Change the password in application.properties.
   Seeded 4 demo customers and 8 demo service records.
   Started OceanCoolApplication in ...
   ```

   That line about seeding is the proof that schema generation and the database
   connection both worked.

5. Check it from your machine — replace the host with the one Render gives you:

   ```bash
   curl https://oceancool-api.onrender.com/api/dashboard
   ```

### Step 3 — frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com), **Add New → Project**, pick the repo.
2. Set **Root Directory** to `frontend`. `vercel.json` supplies the rest (Vite preset,
   the SPA fallback, and cache headers that stop a stale service worker from freezing
   the app).
3. Add one environment variable:

   ```
   VITE_API_BASE_URL = https://oceancool-api.onrender.com
   ```

   This is read at **build** time, so changing it later needs a redeploy, not just a
   restart.
4. Deploy. You get `https://<something>.vercel.app`.
5. **Go back to Render** and set `CORS_ORIGINS` to that exact Vercel URL, then redeploy
   the API. Until you do, the browser blocks every request and the app shows
   "Cannot reach the server" while the API itself is perfectly healthy — this is the
   single most common thing to get stuck on.

### Step 4 — test it on the phone

Open the Vercel URL on the phone, sign in, then:

- **Android / Chrome** — the dashboard shows the *Install OceanCool* bar. Tap **Install**.
- **iPhone / Safari** — **Share → Add to Home Screen**.

It should then open full screen with no browser bars, with the OceanCool icon on the
home screen. Turn on airplane mode and reopen it: the shell still loads (the service
worker cached it) and the screens report that the server is unreachable — records
themselves are never served from cache, by design.

### Things that will surprise you

- **The first request after 15 idle minutes takes about a minute.** Render's free web
  service spins down when idle and cold-starts on the next request. Neon's free compute
  also suspends, adding a few seconds. So the login screen may hang on the very first
  attempt of the day — that is the free tier, not a bug. A paid Render instance (or any
  always-on host) removes it.
- Render's free plan allows 750 instance-hours per workspace per month, which one
  always-idle service comfortably fits inside.
- Set `SEED_DEMO=false` on Render before the shop starts entering real records, or the
  demo customers reappear on any future empty database.
- `ddl-auto=update` is fine for this test. Before it holds records anyone depends on,
  switch to a migration tool (Flyway or Liquibase) so schema changes are reviewable.

## 11. Testing on a phone without signing up for anything

A PWA will not install over `http://localhost`, but you do not need Render, Neon or
Vercel to get an HTTPS URL. `cloudflared` (already on this machine) hands out a free
throwaway HTTPS address with no account:

```bash
# 1. backend + database, locally
cd C:/Ai/oceancool
API_PORT=18080 docker compose up --build

# 2. a public HTTPS URL for the API  -> prints https://<random>.trycloudflare.com
cloudflared tunnel --url http://localhost:18080

# 3. build the frontend against that URL, and serve it
cd frontend
VITE_API_BASE_URL=https://<random>.trycloudflare.com npm run build
npm run preview -- --port 4173

# 4. a second tunnel, for the frontend
cloudflared tunnel --url http://localhost:4173
```

Open the second tunnel's URL on the phone and install it from there.

Two things to remember:

- The API's `CORS_ORIGINS` has to include the frontend's tunnel URL. Set it in
  `docker-compose.yml` (or as an env var) and restart the API container, or every
  request is blocked — the same trap as section 10, step 3.
- These URLs are ephemeral: they change every time `cloudflared` restarts, and the
  tunnel dies with the terminal. Fine for an afternoon of testing on a phone, not a
  way to run the shop.

