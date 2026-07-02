#!/usr/bin/env bash
# Hero frontend API acceptance (requires docker/jira 8090)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export HERO_API_BASE="${HERO_API_BASE:-http://127.0.0.1:8090}"
export HERO_ACCOUNT="${HERO_ACCOUNT:-123456}"
export HERO_PASSWORD_MD5="${HERO_PASSWORD_MD5:-e10adc3949ba59abbe56e057f20f883e}"

echo "========== Hero API Acceptance =========="
echo "BASE: ${HERO_API_BASE}"

node "$ROOT/tests/hero/acceptance.mjs"
echo ""
echo "========== Vitest unit tests =========="
cd "$ROOT" && npm run test:unit
