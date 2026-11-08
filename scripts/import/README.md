# Import Scripts

Скрипты для импорта данных в PostgreSQL (schema `app_data`).

## Быстрый старт

```bash
# 1. Сгенерировать SQL из public/data/
cd /home/alex/workspace/Angular.LinguaCode
python3 scripts/import/generate-import-sql.py 2>/dev/null > /tmp/import-data.sql

# 2. Импортировать в БД
podman cp /tmp/import-data.sql linguacode-postgres:/tmp/import-data.sql
podman exec -i linguacode-postgres psql -U postgres -d linguacode -f /tmp/import-data.sql

# 3. Проверить
podman exec linguacode-postgres psql -U postgres -d linguacode -c \
  "SELECT count(*) FROM app_data.cards; SELECT count(*) FROM app_data.scenarios;"
```

## Скрипты

| Скрипт | Назначение |
|--------|-----------|
| `generate-import-sql.py` | **Основной** — генерация SQL INSERT из `public/data/` JSON |
| `json-to-sql.mjs` | Конвертация JSON → SQL (Node.js, устарел) |
| `load-seed-to-db.mjs` | Загрузка данных через API (альтернатива SQL) |
| `seed-admin-user.sh` | Создание системного пользователя в БД |
| `import-course-bundle.mjs` | Импорт CourseBundle из JSON |
| `import-perl-interview-idea.mjs` | Импорт Perl-interview idea из Markdown |

## Порядок импорта

1. **generate-import-sql.py** — генерирует SQL с заполненными `lesson_id`, `program_id`, `language_pair_id`
2. **psql** — исполняет SQL в PostgreSQL

## Структура

```
scripts/import/
├── generate-import-sql.py       ← основной скрипт импорта (Python)
├── json-to-sql.mjs              ← устарел (Node.js)
├── load-seed-to-db.mjs          ← альтернатива через API
├── seed-admin-user.sh           ← создание пользователя
├── seed-admin-user.sql          ← SQL для пользователя
├── import-course-bundle.mjs     ← импорт bundle
└── import-perl-interview-idea.mjs ← импорт Perl-идеи
```

## Особенности генерации

- **Schema**: `app_data` (backend Liquibase)
- **language_pair_id**: используются существующие ID из БД (39-76)
- **Предварительный скан**: все scenario/lesson IDs назначаются ДО обработки карточек
- **Маппинг кодов**: `cpp` → `cplus` (код языка в БД)
- **lesson_order**: минимум 1 (check constraint `> 0`)
- **FK validation**: cards с несуществующими lesson_id → `NULL`
