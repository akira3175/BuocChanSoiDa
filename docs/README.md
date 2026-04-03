# Production & Docker testing

This document describes how to **run the stack in production** with Docker (Caddy + TLS) and how to **run automated tests inside Docker**.

---

## Production (Docker Compose + Caddy)

### Architecture

| Service   | Role |
|-----------|------|
| `backend` | Django `runserver` on port **8000** (internal only; consider a production ASGI/WSGI server for high load) |
| `frontend` | Static build served by **nginx** on port **80** (internal only) |
| `caddy`   | **HTTPS** (Let’s Encrypt), routes traffic on **80/443** |

Routing (see `Caddyfile` at the repo root):

- **`https://{DOMAIN}`** — `/api*` → backend; everything else → frontend SPA.
- **Admin host** (e.g. `foodstreetadmin.alixblu.site`) — all paths → Django (admin, API as configured).

### Prerequisites

1. **DNS**
   - Point your **app domain** `A` record to the server’s public IP.
   - Point the **admin subdomain** `A` record to the **same** IP (if you use a separate host in `Caddyfile`).

2. **Security group / firewall**
   - Allow inbound **TCP 80** and **443** from the internet.
   - Do **not** need to expose backend/frontend ports directly; only Caddy publishes 80/443.

3. **Environment files** (not committed; create on the server)
   - `backend/.env` — database (`DB_*`), `SECRET_KEY`, `DEBUG=False`, PayPal, `CORS_EXTRA_ORIGINS` / `CSRF_TRUSTED_ORIGINS_EXTRA` if needed, `BEHIND_HTTPS_PROXY=true` behind Caddy, etc.
   - `frontend/.env` — optional runtime env for the nginx stage (build-time vars are baked in at `docker build`).

4. **Root `.env` for Compose** (same directory as `docker-compose.yml`) used by **Caddy**:
   - `DOMAIN` — public site hostname (e.g. `foodstreet.example.com`).
   - `ACME_EMAIL` — email for Let’s Encrypt registration.

### Build-time frontend variables (Vite)

The SPA reads `VITE_*` at **build** time. Set them when building, e.g. via a root `.env` or shell:

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Public API base URL (e.g. `https://yourdomain.com/api`) |
| `VITE_PUBLIC_BASE_URL` | Public site origin (no trailing slash) |
| `VITE_PAYPAL_CLIENT_ID` | PayPal client ID (sandbox or live) |

`docker-compose.yml` passes these as **build args** to the `frontend` service; defaults are placeholders — replace with your real URLs.

### Start production stack

From the **repository root**:

```bash
docker compose build
docker compose up -d
```

Rebuild after code or env changes:

```bash
docker compose up -d --build
```

Remove obsolete containers after renaming services in compose:

```bash
docker compose up -d --build --remove-orphans
```

### Operations notes

- **HTTPS**: Caddy obtains certificates via Let’s Encrypt. The container uses **DNS** `8.8.8.8` / `1.1.1.1` so DNS resolution for ACME works reliably.
- **Database**: MySQL/RDS is **outside** this compose file; the backend connects using `DB_HOST` and credentials in `backend/.env`.
- **Disk**: Keep enough free space on the host for images, logs, and Docker layers (small root volumes fill quickly).

---

## Testing with Docker

Tests use a **separate** compose file: `docker-compose.test.yml`. They do **not** start MySQL for the backend; Django tests use **`config.settings_test`** (SQLite in memory).

**Backend env in Docker:** `backend/.env` and `backend/.env.dev` are mounted into the test containers via `env_file` (optional files). The image build **does not** bake in `.env` (it is dockerignored), so PayPal and other secrets must exist in one of those files on the **host** with the same names Django expects: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`.

### What runs

| Service | What it does |
|---------|----------------|
| `backend-test` | Django: `core.tests`, `tours.tests`, `payments.tests.test_api_critical` |
| `backend-test-optional` | PayPal env check (`payments.tests.test_optional`) — may fail if secrets are unset |
| `frontend-test` | Playwright **critical** E2E (`npm run test:e2e`) |
| `frontend-test-optional` | Playwright **optional** E2E (`npm run test:e2e:optional`) |

Frontend E2E uses `frontend/Dockerfile.test` (Playwright base image). **`@playwright/test` in `package.json` must match** the `FROM mcr.microsoft.com/playwright:v…-noble` line in that Dockerfile (same major.minor.patch). If you upgrade Playwright, bump **both** and rebuild.

### One command (recommended)

From the repository root:

```bash
chmod +x scripts/docker-test.sh   # once
./scripts/docker-test.sh
```

The script runs **critical** tests first (failure stops the script). **Optional** steps are run afterward; failures are **printed but do not** fail the script (similar to `continue-on-error` in CI).

### Manual commands

```bash
docker compose -f docker-compose.test.yml build
docker compose -f docker-compose.test.yml run --rm backend-test
docker compose -f docker-compose.test.yml run --rm frontend-test
```

Optional suites:

```bash
docker compose -f docker-compose.test.yml run --rm backend-test-optional
docker compose -f docker-compose.test.yml run --rm frontend-test-optional
```

After changing Playwright or the Dockerfile, force a clean rebuild:

```bash
docker compose -f docker-compose.test.yml build --no-cache frontend-test
```

### CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml` — runs the same Django tests and Playwright E2E **on the runner** (not via `docker-compose.test.yml`), so CI does not require pulling the large Playwright image every time.

### Troubleshooting

| Issue | What to do |
|-------|------------|
| **`no space left on device`** during Docker build | Free disk: `docker system prune -af`, `docker builder prune -af`; enlarge the EBS/root volume. Frontend test image + layers need **several GB** free during build. |
| **Playwright “Executable doesn’t exist” / version mismatch** | Align `Dockerfile.test` `FROM mcr.microsoft.com/playwright:vX.Y.Z-noble` with `package.json` `@playwright/test` **exact** version; rebuild with `--no-cache`. |
| **Chromium crashes in container** | `docker-compose.test.yml` sets `shm_size: "1gb"` for frontend test services; keep it if you fork the file. |

---

## Related paths

| Path | Description |
|------|-------------|
| `docker-compose.yml` | Production: backend, frontend, Caddy |
| `docker-compose.test.yml` | Test-only services |
| `docker-compose.dev.yml` | Local dev (paths may need adjusting for your machine) |
| `Caddyfile` | TLS and reverse proxy rules |
| `frontend/Dockerfile.test` | Playwright E2E image |
| `backend/config/settings_test.py` | SQLite test settings |
