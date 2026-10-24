#!/bin/bash
# ============================================
# Seed: Добавить пользователя в пустую БД
# ============================================
# Запуск:
#   bash scripts/seed-admin-user.sh
#
# Переменные окружения (по умолчанию):
#   DB_HOST=localhost
#   DB_PORT=5432
#   DB_NAME=linguacode
#   DB_USER=postgres
#   DB_PASSWORD=postgres
# ============================================

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-linguacode}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/seed-admin-user.sql"

echo "═══════════════════════════════════════════════════════════"
echo "  LinguaCode: Seed Admin User"
echo "═══════════════════════════════════════════════════════════"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  DB:   ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "═══════════════════════════════════════════════════════════"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Install PostgreSQL client tools."
    exit 1
fi

# Check if database is reachable
if ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -d "${DB_NAME}" -U "${DB_USER}" &> /dev/null; then
    echo "❌ Database is not reachable."
    echo "   Check if PostgreSQL is running and credentials are correct."
    exit 1
fi

# Run the SQL script
echo ""
echo "📝 Running seed script..."
export PGPASSWORD="${DB_PASSWORD}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -d "${DB_NAME}" -U "${DB_USER}" -f "${SQL_FILE}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Done!"
echo ""
echo "  Users in database:"
export PGPASSWORD="${DB_PASSWORD}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -d "${DB_NAME}" -U "${DB_USER}" -t -c \
    "SELECT id, display_name, email FROM data.users ORDER BY created_at;" | \
    while read -r line; do
        echo "    $line"
    done
echo ""
echo "  Login credentials:"
echo "    Email:    admin@linguacode.local"
echo "    Password: password"
echo "    (also: student@linguacode.local / password)"
echo "═══════════════════════════════════════════════════════════"
