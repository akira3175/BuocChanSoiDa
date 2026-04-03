#!/usr/bin/env bash
# Run backend + frontend test suites in Docker (same commands as CI, isolated images).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Use a separate compose project name so we don't generate "orphan container" warnings
# for your production `docker-compose.yml` stack.
COMPOSE=(docker compose -f docker-compose.test.yml -p buocchansoida-test)

echo "==> Building test images..."
"${COMPOSE[@]}" build

echo "==> Backend (critical)..."
"${COMPOSE[@]}" run --rm backend-test

echo "==> Backend (optional — failure does not stop script)..."
set +e
"${COMPOSE[@]}" run --rm backend-test-optional
BE_OPT=$?
set -e
if [[ "$BE_OPT" -ne 0 ]]; then
  echo "    (optional backend tests exited $BE_OPT — ignored)"
fi

echo "==> Frontend E2E (critical)..."
"${COMPOSE[@]}" run --rm frontend-test

echo "==> Frontend E2E (optional — failure does not stop script)..."
set +e
"${COMPOSE[@]}" run --rm frontend-test-optional
FE_OPT=$?
set -e
if [[ "$FE_OPT" -ne 0 ]]; then
  echo "    (optional frontend E2E exited $FE_OPT — ignored)"
fi

echo "==> Done."
