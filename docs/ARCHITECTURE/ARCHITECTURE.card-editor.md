# Архитектура: редактор карточек (`card-editor`)

Каталог карточек + CRUD в dialog. Маршрут `/tools/cards`.

## Назначение

Авторинг и поиск карточек; index + payload; preview и try dialog.

## Структура

```text
features/card-editor/
├── components/
│   ├── card-appearance-fields/        # поля appearance
│   ├── card-create-wizard/            # wizard создания (G12)
│   ├── card-editor-dialog/            # create/edit shell
│   ├── card-editor-discard-dialog/    # подтверждение отправки изменений
│   ├── card-form/                     # shell + kind-forms (G12)
│   ├── card-form-answers-tab/         # вкладка ответов формы
│   ├── card-form-question-tab/        # вкладка вопроса формы
│   ├── card-form-settings-panel/      # панель настроек формы
│   ├── card-form-phonetics-panel/     # панель фонетики формы
│   ├── card-form-tabs/                # табы формы
│   ├── card-meta-fields/              # поля индексной метаданных
│   ├── card-options-editor/           # редактор вариантов ответа
│   ├── card-preview/                  # предпросмотр карточки
│   ├── card-try-dialog/               # диалог тестирования карточки
│   └── lexeme-fields/                 # поля для иероглифов/слов
├── services/
│   └── card-editor.store.ts           # стор редактора (providedIn: component-level)
├── types/                             # типы фичи
├── utils/
│   ├── draft/                         # черновики
│   ├── form/                          # валидация форм
│   ├── index-meta/                    # индексная метаданные
│   ├── options/                       # варианты ответов
│   ├── tone/                          # тоновые утилиты
│   ├── ux/                            # UX-утилиты
│   └── validation/                    # валидация
└── index.ts                           # barrel-экспорт
```

> **Примечание:** `card-editor-page` — это страница (page), а не компонент фичи. Она расположена в `pages/card-editor/card-editor-page/` и является точкой входа маршрута `/tools/cards`. Компоненты фичи (`features/card-editor/components/`) импортируются страницей.

## Поток CRUD

```mermaid
stateDiagram-v2
  [*] --> Catalog: /tools/cards
  Catalog --> DialogCreate: «Создать»
  Catalog --> DialogEdit: строка → edit
  DialogCreate --> Save: CardEditorStore
  DialogEdit --> Save
  Save --> Catalog: reload index
  Catalog --> TryDialog: «Протестировать»
```

Из Проводника контента диалог открывается с контекстом сценария:
`openCreate(kind, context)` / `openEdit(cardId)`. После сохранения страница
обновляет старый и новый узел сценария через `refreshScenarioNode()`.

## Особенности (G12)

- Режимы **Базовый / Расширенный** в dialog.
- Kind-forms: choice, input, pairs, media, code-select.
- Bilingual fields + `PhoneticLexeme` (G9/G10).
- Index meta синхронизируется при save (`CardIndexEntry`).
- Метаданные диалога: `requiredTier`, `published`, `slug` (read-only),
  `languagePairId` (read-only), иерархия `courseId → programId → lessonId → scenarioId`,
  `order`; `cardMeta` участвует в dirty-tracking.
- `CardEditorStore` публикует `lastSavedCard` — страница использует его для обновления
  дерева/выбора узла после online-save.

## Интеграция с backend

- `CardBackendAdapter` — единственная точка преобразования `Card` ↔ backend DTO:
  читает `languagePairId`, `programId`, `published`, `order`, `slug`;
  пишет `tags`, `difficulty`, `requiredTier`, иерархию, `order`, `published`.
- `CardCreateRequest` не содержит `id`/`authorId`; пустой `slug` не отправляется.
- `CardUpdateRequest.requiredTier` опционален — отправляется только при наличии значения.
- Привязка к сценарию — `ScenarioCardsService` (`POST/DELETE/PATCH /scenarios/:id/cards`),
  обёрнутый в `ScenariosApiService.addCard/removeCard/moveCard`.
- Offline: `executeWithOfflineFallback` ставит `card.create/update/delete` в sync queue,
  а метаданные сохраняются в overlay (`upsertCardIndexMetaOverride`).

## Зависимости

- `entities/card/lib/card-catalog-search/` — `CardCatalogSearchStore`
- `entities/card/` — `CardSearchService`, `CardRepository`
- `entities/chinese/ui/` — `LexemeDisplayComponent`, `PinyinKeyboardComponent` (для preview)

## Связанные документы

- [CARD-CATALOG.md](./COMMON/CARD-CATALOG.md) · [EDITOR-UX.md](./FEATURES/EDITOR-UX.md) · [CJK-CONTENT.md](./CONTENT/CJK-CONTENT.md)
