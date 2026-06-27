# Правила Git для LinguaCode

## 1. Отщепление от `main`

Каждая новая работа начинается от актуальной `main`, а не от старой или чужой ветки.

```bash
git checkout main
git pull
git checkout -b NUMBER_description
```

## 2. Отдельная ветка на каждый запрос

- Один запрос / одна задача = одна ветка.
- Не копить изменения в `main` напрямую.
- Не смешивать несвязанные задачи в одной ветке.

## 3. Имя ветки: `NUMBER_description`

Формат: число, `_`, краткий slug на английском (слова через `-`, lowercase).

| Часть         | Правило                            | Пример                                    |
| ------------- | ---------------------------------- | ----------------------------------------- |
| `NUMBER`      | Порядковый номер задачи            | `1`, `2`, `3`                             |
| `description` | Суть работы, английский, через `-` | `init-docs`, `init-angular`, `add-layout` |

**Как получить NUMBER**

1. Собрать числовые префиксы из:
   - локальных и remote-веток (`1_init-docs`, `2_init-angular`, …);
   - сообщений коммитов в `main` вида `[NUMBER_description] …`.
2. `NUMBER = max(найденные) + 1`.
3. Если совпадений нет — `NUMBER = 1`.

Примеры имён веток:

- `1_init-docs`
- `2_init-angular`
- `3_add-layout`

## 4. Коммит: `[NUMBER_description] краткое описание`

- Префикс в `[…]` = **имя ветки** (одинаковый для всех коммитов в этой ветке).
- Текст после скобок — что сделано; до ~72 символов.
- Не копировать полный текст промпта.
- Язык описания — русский или английский (кратко и по сути).

Примеры:

```bash
git commit -m "[1_init-docs] add project documentation"
git commit -m "[2_init-angular] bootstrap Angular project"
git commit -m "[2_init-angular] add header and footer layout"
git commit -m "[3_add-layout] wire navigation routes"
```

## 5. Push

- Ветку пушить **до merge**, когда работа в ней завершена.
- Push выполняет НЕ **AI** (если не оговорено иное).

```bash
git push -u origin NUMBER_description
```

## 6. Merge

- Способ: **merge commit** (не squash, не rebase в `main`).
- Кто мержит в `main`: **AI**.
- Ветки после merge **не удаляем** (ни локально, ни на remote).
- Перед merge: `ng build` и `npm test` (когда появятся в проекте).

```bash
git checkout main
git pull
git merge --no-ff NUMBER_description -m "Merge branch 'NUMBER_description'"
git push origin main
```

## 7. Запрещено

- Force push в `main` (`git push --force`).
- Коммитить `.env`, ключи, пароли и другие секреты.
- Смешивать несвязанные задачи в одной ветке.

## 8. Полный цикл (шпаргалка)

```bash
# 1. Новая задача
git checkout main && git pull
git checkout -b 2_init-angular

# 2. Работа и коммиты
git add .
git commit -m "[2_init-angular] bootstrap Angular project"

# 3. Push ветки
git push -u origin 2_init-angular

# 4. Merge в main (после проверки сборки)
git checkout main && git pull
git merge --no-ff 2_init-angular -m "Merge branch '2_init-angular'"
git push origin main
```
