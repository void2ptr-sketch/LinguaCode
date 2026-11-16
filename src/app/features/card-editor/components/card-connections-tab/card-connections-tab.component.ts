import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { CardIndexMetaOverride } from '../../../../entities/card/model';
import {
  CardCatalogHierarchyService,
  type CourseOption,
  type LessonOption,
  type ScenarioOption,
} from '../../../../entities/card/lib/services/card-catalog-hierarchy.service';

/**
 * Minimal connection fields for the draft.
 *
 * @remarks
 * Contains only the hierarchy reference fields — avoids circular dependency
 * with the full CardDraft type.
 */
export type ConnectionsDraft = {
  courseId: string | undefined;
  programId: string | undefined;
  lessonId: string | undefined;
  scenarioId: string | undefined;
};

/**
 * Connections tab component for the card form.
 *
 * @remarks
 * Displays and edits all connection fields: language_pair_id (read-only),
 * course, program, lesson, and scenario with cascading loading.
 * Loads hierarchy independently via CardCatalogHierarchyService.
 */
@Component({
  selector: 'app-card-connections-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './card-connections-tab.component.html',
  styleUrl: './card-connections-tab.component.scss',
})
export class CardConnectionsTabComponent implements OnInit {
  private readonly hierarchyService = inject(CardCatalogHierarchyService);

  /** Required draft containing only connection fields. */
  readonly draft = input.required<ConnectionsDraft>();

  /** Optional card index meta override for language_pair_id. */
  readonly meta = input<CardIndexMetaOverride | undefined>(undefined);

  /** Emits the updated course ID. */
  readonly courseIdChange = output<string>();

  /** Emits the updated program ID. */
  readonly programIdChange = output<string>();

  /** Emits the updated lesson ID. */
  readonly lessonIdChange = output<string>();

  /** Emits the updated scenario ID. */
  readonly scenarioIdChange = output<string>();

  /** Loading indicator for the hierarchy. */
  readonly loading = signal(false);

  /** Available courses for the current language pair, loaded asynchronously. */
  readonly availableCourses = signal<readonly CourseOption[]>([]);

  /** Available programs for the selected course, loaded asynchronously. */
  readonly availablePrograms = signal<readonly { id: string; title: string }[]>([]);

  /** Available lessons for the selected program, loaded asynchronously. */
  readonly availableLessons = signal<readonly LessonOption[]>([]);

  /** Available scenarios for the selected lesson. */
  readonly availableScenarios = signal<readonly ScenarioOption[]>([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      // Загружаем курсы через CardCatalogHierarchyService.
      // Используем дефолтные значения языков, так как язык определяется на уровне CardFormComponent.
      const courses = await this.hierarchyService.loadCourses('ru', 'en', 'ru_en');
      this.availableCourses.set(courses);

      // Если у карточки уже выбрана иерархия — загружаем программы, уроки и сценарии.
      const draft = this.draft();
      if (draft.courseId) {
        const programs = await this.hierarchyService.loadPrograms(draft.courseId);
        this.availablePrograms.set(
          programs.map((program) => ({ id: program.id, title: program.title })),
        );
      }
      if (draft.programId) {
        const lessons = await this.hierarchyService.loadLessons(draft.programId);
        this.availableLessons.set(lessons);
      }
      if (draft.programId && draft.lessonId) {
        const scenarios = this.hierarchyService.getScenariosForLesson(draft.programId, draft.lessonId);
        this.availableScenarios.set(scenarios);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Updates the selected course and resets dependent fields.
   *
   * @param courseId - The selected course ID (empty string to deselect).
   */
  async updateCourseId(courseId: string): Promise<void> {
    this.courseIdChange.emit(courseId);
    this.availablePrograms.set([]);
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (courseId) {
      const programs = await this.hierarchyService.loadPrograms(courseId);
      this.availablePrograms.set(
        programs.map((program) => ({ id: program.id, title: program.title })),
      );
    }
  }

  /**
   * Updates the selected program and resets dependent fields.
   *
   * @param programId - The selected program ID (empty string to deselect).
   */
  async updateProgramId(programId: string): Promise<void> {
    this.programIdChange.emit(programId);
    this.availableLessons.set([]);
    this.availableScenarios.set([]);

    if (programId) {
      const lessons = await this.hierarchyService.loadLessons(programId);
      this.availableLessons.set(lessons);
    }
  }

  /**
   * Updates the selected lesson and resets scenarios.
   *
   * @param lessonId - The selected lesson ID (empty string to deselect).
   */
  async updateLessonId(lessonId: string): Promise<void> {
    this.lessonIdChange.emit(lessonId);
    this.availableScenarios.set([]);

    if (lessonId) {
      const programId = this.draft().programId;
      if (programId) {
        const scenarios = this.hierarchyService.getScenariosForLesson(programId, lessonId);
        this.availableScenarios.set(scenarios);
      }
    }
  }

  /**
   * Updates the selected scenario.
   *
   * @param scenarioId - The selected scenario ID.
   */
  updateScenarioId(scenarioId: string): void {
    this.scenarioIdChange.emit(scenarioId);
  }
}
