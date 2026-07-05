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

@Injectable({ providedIn: 'root' })
export class ContentSeedRepository {
  private readonly http = inject(HttpClient);

  private preloadPromise: Promise<void> | null = null;

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

  getScenarioSeed(): readonly Scenario[] {
    return getScenarioSeedCache();
  }

  getCourseSeed(): CourseCatalogState {
    return getCourseSeedCache();
  }

  getCardSeed(): readonly Card[] {
    return getCardSeedCache();
  }

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

  private loadScenarioFixture(path: string): Promise<ScenariosSeedFixture> {
    return firstValueFrom(
      this.http.get<ScenariosSeedFixture>(buildFixtureUrl(path)),
    ).then((fixture) => ({
      scenarios: fixture.scenarios.map((scenario) => normalizeScenario(scenario)),
    }));
  }

  private loadCourseFixture(path: string): Promise<CoursesSeedFixture> {
    return firstValueFrom(this.http.get<CoursesSeedFixture>(buildFixtureUrl(path))).then(
      (fixture) => normalizeStoredCourseCatalog(fixture),
    );
  }

  private loadCardFixture(path: string): Promise<CardsSeedFixture> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return firstValueFrom(
      this.http.get<CardsSeedFixture>(buildFixtureUrl(normalizedPath)),
    ).catch(() => ({ cards: [] }));
  }
}

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
