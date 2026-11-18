#!/usr/bin/env bash
# Runs 0001_resense_schema.sql on a throwaway local Postgres 16 and checks the behaviour that matters (see tests.sql).
# Needs: Postgres 16 binaries (brew install postgresql@16) and the portfolio SQL from master-template.
#   PORTFOLIO_SQL=/path/to/master-template/scripts/portfolio/sql/0001_app_memberships.sql supabase/terra/verify.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORTFOLIO_SQL="${PORTFOLIO_SQL:-$HOME/DevS/master-template/scripts/portfolio/sql/0001_app_memberships.sql}"
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
[ -f "$PORTFOLIO_SQL" ] || { echo "portfolio SQL not found: $PORTFOLIO_SQL (set PORTFOLIO_SQL)"; exit 1; }
DIR="$(mktemp -d)"; PORT="${PGPORT:-54329}"
trap 'pg_ctl -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
initdb -U supabase_admin -A trust -D "$DIR/data" >/dev/null
pg_ctl -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null || { cat "$DIR/log"; exit 1; }
run() { psql -X -q -v ON_ERROR_STOP=1 -h "$DIR" -p "$PORT" -U supabase_admin -d postgres "$@"; }
run -f "$HERE/stubs.sql"
run -f "$PORTFOLIO_SQL" >/dev/null
run -f "$HERE/0001_resense_schema.sql"
run -t -A -f "$HERE/tests.sql" | grep -v "^$"
