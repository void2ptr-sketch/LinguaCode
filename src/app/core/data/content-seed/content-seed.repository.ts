/**
 * Репозиторий seed-данных (начальных данных).
 *
 * Загружает начальные данные из файлов в папке public/data/:
 * - Сценарии (scenarios/*.json)
 * - Курсы (courses/*.json)
 * - Карточки (cards/*.json)
 *
 * Данные кэшируются в localStorage и используются, когда mock-интерсепторы
 * активны (useCardsApiMock, useScenariosApiMock, useCoursesApiMock = true).
 *
 * Архитектура:
 * 1. При первом запуске загружает все файлы из manifest
 * 2. Кэширует данные в памяти (content-seed.cache.ts)
 * 3. Mock-интерсепторы используют эти данные для ответов на API-запросы
 * 4. При повторных запусках данные берутся из кэша
 *
 * Пример использования:
 * ```typescript
 * const seedRepo = inject(ContentSeedRepository);
 * await seedRepo.preload();
 * const scenarios = seedRepo.getScenarioSeed();
 * const courses = seedRepo.getCourseSeed();
 * const cards = seedRepo.getCardSeed();
 * ```
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { buildFixtureUrl } from '../../api';
import type { Card, Scenario } from '../../models';
import { normalizeLegacyCards } from '../cards/card-legacy.mapper';
import { normalizeScenario } from '../scenarios/scenario-card-source.utils';

import {
  getCardSeedCache,
  getCourseSeedCache,
  getScenarioSeedCache,
  isContentSeedCacheReady,
  setCardSeedCache,
  setCourseSeedCache,
  setScenarioSeedCache,
} from './content-seed.cache';
import type {
  CardsSeedFixture,
  ContentManifest,
  CoursesSeedFixture,
  ScenariosSeedFixture,
} from './content-seed.types';
import type { CourseCatalogState } from '../courses/course-catalog-state';
import { normalizeStoredCourseCatalog } from '../courses/course-catalog-state';

/**
 * Репозиторий seed-данных (начальных данных).
 *
 * Основные возможности:
 * - Загрузка всех seed-файлов из public/data/ при первом запуске
 * - Кэширование данных в памяти для быстрого доступа
 * - Нормализация данных сценариев и карточек
 * - Поддержка legacy-форматов карточек
 *
 * Жизненный цикл:
 * 1. preload() — загружает все файлы (один раз за сессию)
 * 2. getScenarioSeed() — возвращает сценарии
 * 3. getCourseSeed() — возвращает курсы
 * 4. getCardSeed() — возвращает карточки (нормализованные)
 */
@Injectable({ providedIn: 'root' })
export class ContentSeedRepository {
  /** HTTP-клиент для загрузки файлов */
  private readonly http = inject(HttpClient);

  /**
   * Promise загрузки всех данных.
   * Используется для предотвращения параллельных загрузок.
   * После завершения устанавливается в null.
   */
  private preloadPromise: Promise<void> | null = null;

  /**
   * Предзагружает все seed-данные из файлов.
   *
   * Если данные уже загружены (isContentSeedCacheReady === true),
   * метод сразу возвращает resolved promise.
   *
   * @returns Promise, который разрешается при завершении загрузки
   */
  preload(): Promise<void> {
    if (isContentSeedCacheReady()) {
      return Promise.resolve();
    }

    if (!this.preloadPromise) {
      this.preloadPromise = this.loadAll().catch((error) => {
        this.preloadPromise = null;
        throw error;
      });
    }

    return this.preloadPromise;
  }

  /**
   * Возвращает сценарии из seed-кэша.
   * @returns массив сценариев
   */
  getScenarioSeed(): readonly Scenario[] {
    return getScenarioSeedCache();
  }

  /**
   * Возвращает курсы из seed-кэша.
   * @returns состояние каталога курсов
   */
  getCourseSeed(): CourseCatalogState {
    return getCourseSeedCache();
  }

  /**
   * Возвращает карточки из seed-кэша.
   * Карточки нормализуются через normalizeLegacyCards.
   * @returns массив карточек
   */
  getCardSeed(): readonly Card[] {
    return getCardSeedCache();
  }

  /**
   * Загружает все seed-файлы: сценарии, курсы, карточки.
   *
   * Процесс:
   * 1. Загружает manifest.json (список всех файлов)
   * 2. Параллельно загружает все сценарии, курсы и карточки
   * 3. Нормализует данные
   * 4. Сохраняет в кэш
   *
   * @private
   */
  private async loadAll(): Promise<void> {
    const manifest = await firstValueFrom(
      this.http.get<ContentManifest>(buildFixtureUrl('/content-manifest.json')),
    );

    const [scenarioFixtures, courseFixtures, cardFixtures] = await Promise.all([
      Promise.all(manifest.scenarioFiles.map((file) => this.loadScenarioFixture(file))),
      Promise.all(manifest.courseFiles.map((file) => this.loadCourseFixture(file))),
      Promise.all(manifest.cardFiles.map((file) => this.loadCardFixture(file))),
    ]);

    setScenarioSeedCache(scenarioFixtures.flatMap((fixture) => fixture.scenarios));
    setCourseSeedCache(mergeCourseFixtures(courseFixtures));
    setCardSeedCache(normalizeLegacyCards(cardFixtures.flatMap((fixture) => fixture.cards)));
  }

  /**
   * Загружает файл сценариев и нормализует данные.
   *
   * @param path — путь к файлу
   * @returns объект с нормализованными сценариями
   * @private
   */
  private loadScenarioFixture(path: string): Promise<ScenariosSeedFixture> {
    return firstValueFrom(this.http.get<ScenariosSeedFixture>(buildFixtureUrl(path))).then(
      (fixture) => ({
        scenarios: fixture.scenarios.map((scenario) => normalizeScenario(scenario)),
      }),
    );
  }

  /**
   * Загружает файл курсов и нормализует данные.
   *
   * @param path — путь к файлу
   * @returns нормализованный каталог курсов
   * @private
   */
  private loadCourseFixture(path: string): Promise<CoursesSeedFixture> {
    return firstValueFrom(this.http.get<CoursesSeedFixture>(buildFixtureUrl(path))).then(
      (fixture) => normalizeStoredCourseCatalog(fixture),
    );
  }

  /**
   * Загружает файл карточек.
   * Если файл не найден — возвращает пустой массив.
   *
   * @param path — путь к файлу
   * @returns объект с карточками
   * @private
   */
  private loadCardFixture(path: string): Promise<CardsSeedFixture> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return firstValueFrom(this.http.get<CardsSeedFixture>(buildFixtureUrl(normalizedPath))).catch(
      () => ({ cards: [] }),
    );
  }
}

/**
 * Объединяет несколько файлов курсов в один каталог.
 *
 * Использует уникальные ID для устранения дубликатов.
 *
 * @param fixtures — массив файлов курсов
 * @returns объединённый каталог курсов
 * @private
 */
function mergeCourseFixtures(fixtures: readonly CoursesSeedFixture[]): CourseCatalogState {
  const coursesById = new Map<string, CoursesSeedFixture['courses'][number]>();
  const lessonsById = new Map<string, CoursesSeedFixture['lessons'][number]>();

  for (const fixture of fixtures) {
    for (const course of fixture.courses) {
      coursesById.set(course.id, course);
    }

    for (const lesson of fixture.lessons) {
      lessonsById.set(lesson.id, lesson);
    }
  }

  return {
    courses: [...coursesById.values()],
    lessons: [...lessonsById.values()],
  };
}
