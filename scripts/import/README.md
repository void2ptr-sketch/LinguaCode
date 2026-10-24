# Import Scripts

Скрипты для импорта данных в PostgreSQL.

## Быстрый старт

```bash
# 1. Добавить системного пользователя
bash scripts/import/seed-admin-user.sh

# 2. Сгенерировать SQL из public/data/
node scripts/import/json-to-sql.mjs > /tmp/import-data.sql

# 3. Импортировать в БД
podman exec -i linguacode-postgres psql -U postgres -d linguacode -f /tmp/import-data.sql
```

## Скрипты

| Скрипт | Назначение |
|--------|-----------|
| `json-to-sql.mjs` | Конвертация JSON из `public/data/` в SQL INSERT-оператории |
| `load-seed-to-db.mjs` | Загрузка данных через API (альтернатива SQL) |
| `seed-admin-user.sh` | Создание системного пользователя в БД |
| `import-course-bundle.mjs` | Импорт CourseBundle из JSON |
| `import-perl-interview-idea.mjs` | Импорт Perl-interview idea из Markdown |

## Порядок импорта

1. **seed-admin-user.sh** — создаёт `system@linguacode.local` (password: `password`)
2. **json-to-sql.mjs** — генерирует SQL с заполненными `lesson_id` и `program_id`
3. **psql** — исполняет SQL в PostgreSQL

## Структура

```
scripts/import/
├── json-to-sql.mjs          ← основной скрипт импорта
├── load-seed-to-db.mjs      ← альтернатива через API
├── seed-admin-user.sh       ← создание пользователя
├── seed-admin-user.sql      ← SQL для пользователя
├── import-course-bundle.mjs ← импорт bundle
└── import-perl-interview-idea.mjs ← импорт Perl-идеи
```
