# Выбор карточек и тренировка (Card Select)

> **Статус:** готово. Страница практики с многошаговым выбором контента (Course → Lesson → Scenario) и learning zone.

Связанные документы: [INDEX.md](../INDEX.md) · [ARCHITECTURE.md](../PRODUCT/ARCHITECTURE.md) · [DOMAIN.md](../PRODUCT/DOMAIN.md) · [ARCHITECTURE.card-select.md](../ARCHITECTURE/ARCHITECTURE.card-select.md) · [TASKS.md](../TASKS.md).

## Маршрут и доступ

| Маршрут         | Компонент                 | Роль             |
| --------------- | ------------------------- | ---------------- |
| `/cards/select` | `CardSelectPageComponent` | Все пользователи |

Пункт меню: «Практика» в sidebar.

## Архитектура страницы

```
CardSelectPageComponent
├── Tabs (MatTabGroup)
│   ├── Learning (learning-zone)
│   └── Scenarios (scenario-picker)
├── PracticeSessionBar (top bar)
└── PracticeStepper (progress indicator)
```

### Вкладки

| Вкладка       | Содержимое                       | Состояние      |
| ------------- | -------------------------------- | -------------- |
| **Learning**  | Learning zone с quiz-карточками  | Сессия активна |
| **Scenarios** | Scenario picker (выбор сценария) | Выбор контента |

## Компоненты

### PracticeSessionBar

Верхняя панель сессии: заголовок курса/урока/сценария, прогресс, направление.

| Input                 | Тип              | Назначение                    |
| --------------------- | ---------------- | ----------------------------- |
| `courseTitle`         | `string`         | Название курса                |
| `lessonTitle`         | `string`         | Название урока                |
| `scenarioTitle`       | `string`         | Название сценария             |
| `scenarioSourceLabel` | `string`         | Подпись источника карточек    |
| `progressLabel`       | `string`         | Прогресс «3 / 10»             |
| `cardProgressPercent` | `number`         | Прогресс в % (0–100)          |
| `sessionDirection`    | `CardDirection`  | Направление сессии            |
| `showDirectionToggle` | `boolean`        | Показывать toggle направления |
| `loading`             | `boolean`        | Загрузка карточек             |
| `error`               | `string \| null` | Ошибка загрузки               |
| `completed`           | `boolean`        | Сессия завершена              |

### PracticeStepper

Индикатор прогресса сессии (визуальный stepper).

### LearningZoneComponent

Зона отображения quiz-карточек и обработки ответов пользователя.

| Input                   | Тип                    | Назначение                             |
| ----------------------- | ---------------------- | -------------------------------------- |
| `currentCard`           | `Card \| null`         | Текущая карточка                       |
| `fontSize`              | `'sm' \| 'md' \| 'lg'` | Размер шрифта                          |
| `selectedScenarioId`    | `string`               | ID выбранного сценария                 |
| `isLearningTabActive`   | `boolean`              | Активна ли вкладка обучения            |
| `missingCardsWarning`   | `string \| null`       | Предупреждение о пропущенных карточках |
| `showCourseCertificate` | `boolean`              | Показать чип сертификата               |
| `hasNextLessonScenario` | `boolean`              | Есть ли следующий сценарий урока       |

| Output                   | Назначение                       |
| ------------------------ | -------------------------------- |
| `directionChange`        | Смена направления сессии         |
| `checkAnswer`            | Проверка ответа                  |
| `nextCard`               | Переход к следующей карточке     |
| `optionSelected`         | Выбор варианта (multiple-choice) |
| `answerTextChange`       | Ввод текста (keyboard cards)     |
| `memoryCompleteChange`   | Memory board complete            |
| `flipKnownChange`        | Flip card self-report            |
| `drawSubmittedChange`    | Draw submission state            |
| `drawAnswerChange`       | Draw answer payload              |
| `timeExpired`            | Таймер истёк (timed cards)       |
| `retry`                  | Повторная загрузка               |
| `restart`                | Перезапуск сессии                |
| `goToScenarios`          | Переход к выбору сценариев       |
| `goToNextLessonScenario` | Следующий сценарий урока         |

### Picker-секции

| Компонент                        | Назначение                |
| -------------------------------- | ------------------------- |
| `CoursePickerSectionComponent`   | Выбор курса (Course)      |
| `LessonPickerSectionComponent`   | Выбор урока (Lesson)      |
| `ScenarioPickerSectionComponent` | Выбор сценария (Scenario) |

## Store: CardSelectStore

`@Injectable({ providedIn: 'root' })` — store сессии тренировки.

### Состояние

| Сигнал             | Тип                         | Назначение                                             |
| ------------------ | --------------------------- | ------------------------------------------------------ |
| `cards`            | `readonly Card[]`           | Карточки текущей сессии                                |
| `allCardIds`       | `readonly string[]`         | Все ID карточек сценария (пагинация)                   |
| `scenarioId`       | `string`                    | ID текущего сценария                                   |
| `sessionDirection` | `CardDirection`             | Направление: `known-to-learning` / `learning-to-known` |
| `loading`          | `boolean`                   | Загрузка                                               |
| `error`            | `string \| null`            | Ошибка                                                 |
| `currentIndex`     | `number`                    | Индекс текущей карточки                                |
| `currentPage`      | `number`                    | Индекс текущей страницы                                |
| `loadedPages`      | `Set<number>`               | Кэш загруженных страниц                                |
| `pageSize`         | `25`                        | Карточек на страницу                                   |
| `selectedIndex`    | `number \| null`            | Выбранный вариант (multiple-choice)                    |
| `answerText`       | `string`                    | Введённый текст (keyboard)                             |
| `memoryComplete`   | `boolean`                   | Memory board complete                                  |
| `flipKnown`        | `boolean \| null`           | Flip card self-report                                  |
| `drawSubmitted`    | `boolean`                   | Draw answer submitted                                  |
| `drawAnswer`       | `DrawAnswerPayload \| null` | Payload draw-ответа                                    |
| `feedback`         | `CardFeedback`              | `'correct' \| 'incorrect' \| null`                     |
| `completed`        | `boolean`                   | Сессия завершена                                       |
| `shuffleNonce`     | `number`                    | Nonce для shuffle вариантов                            |
| `memoryBoardNonce` | `number`                    | Nonce для рандомизации memory board                    |

### Derived signals

| Сигнал           | Тип            | Вычисление                                            |
| ---------------- | -------------- | ----------------------------------------------------- |
| `currentCard`    | `Card \| null` | `cards()[currentIndex]`                               |
| `progressLabel`  | `string`       | `"3 / 10"`                                            |
| `isLastCard`     | `boolean`      | `currentIndex >= allCardIds.length - 1`               |
| `canCheckAnswer` | `boolean`      | Card exists, no feedback, not completed, valid answer |
| `canGoNext`      | `boolean`      | `feedback !== null && !completed`                     |

### Методы

| Метод                                 | Описание                                       |
| ------------------------------------- | ---------------------------------------------- |
| `setScenario(scenarioId, allCardIds)` | Начать новую сессию, загрузить первую страницу |
| `loadPage(pageIndex, options?)`       | Загрузить страницу карточек (с кэшированием)   |
| `preloadNext()`                       | Предзагрузка следующей страницы в фоне         |
| `selectOption(index)`                 | Выбрать вариант (multiple-choice)              |
| `setAnswerText(value)`                | Ввести текст (keyboard)                        |
| `setMemoryComplete(value)`            | Memory board                                   |
| `setFlipKnown(value)`                 | Flip card self-report                          |
| `setDrawSubmitted(value)`             | Draw submission                                |
| `setDrawAnswer(payload)`              | Draw answer payload                            |
| `handleTimeExpired()`                 | Таймер истёк (timed cards)                     |
| `checkAnswer()`                       | Проверить ответ → `feedback`                   |
| `nextCard()`                          | Следующая карточка (или completed)             |
| `setSessionDirection(direction)`      | Сменить направление                            |
| `reset()`                             | Сброс store                                    |

### Пагинация

- `pageSize = 25` карточек на страницу
- Страницы кэшируются в `loadedPages`
- `preloadNext()` загружает следующую страницу в фоне
- При `nextCard()` автоматически загружается следующая страница, если карточки не предзагружены

### Answer evaluation

```typescript
const isCorrect = checkCardAnswer(
  card,
  answerState(), // { selectedIndex, answerText, memoryComplete, drawSubmitted, drawAnswer, flipKnown, learningProficiencyLevel }
  sessionDirection,
  getCachedModel, // HanziDataService для draw cards
  shuffleNonce, // Deterministic option shuffling
);
```

## Зависимости

| Слой                   | Зависимости                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| entities/card          | `Card`, `cardDefaultDirection`, `canCheckCardAnswer`, `checkCardAnswer`, `CardFeedback` |
| entities/chinese       | `HanziDataService`, `DrawAnswerPayload`                                                 |
| entities/language-pair | `CardDirection`                                                                         |
| entities/user          | `UserStore` (learningProficiencyLevel)                                                  |
| shared/logger          | `AppLoggerService`                                                                      |

## Связанные пути в коде

```
src/app/features/card-select/
├── components/
│   ├── course-picker-section/       # Выбор курса
│   ├── lesson-picker-section/       # Выбор урока
│   ├── scenario-picker-section/     # Выбор сценария
│   ├── learning-zone/               # Learning zone с quiz-карточками
│   ├── practice-session-bar/        # Верхняя панель сессии
│   └── practice-stepper/            # Индикатор прогресса
├── services/
│   ├── card-select.store.ts         # Store сессии
│   ├── card-select.service.ts       # API load by IDs
│   └── card-select-flow.service.ts  # Flow orchestration
├── types/
├── utils/
└── index.ts
```
