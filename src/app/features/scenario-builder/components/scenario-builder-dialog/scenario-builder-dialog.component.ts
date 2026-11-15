import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { CardCatalogSearchStore } from '../../../../entities/card/lib/store/card-catalog-search.store';
import { CardEditorDiscardDialogComponent } from '../../../../shared/ui/dialogs';
import { UserStore } from '../../../../entities/user/model/user.store';
import { ProgramsApiService } from '../../../../entities/program/api';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import {
  emptyScenarioFormDraft,
  formDraftToScenarioDraft,
  scenarioToFormDraft,
  serializeScenarioFormDraft,
  type ScenarioFormDraft,
} from '../../utils/scenario-form-draft.utils';
import { ScenarioEditorFormComponent } from '../scenario-editor-form/scenario-editor-form.component';
import type {
  ScenarioBuilderDialogData,
  ScenarioBuilderDialogResult,
} from './scenario-builder-dialog.types';
import type { ProgramWithLessons } from '../../../../entities/program/model';
import type { Lesson } from '../../../../entities/course/model/lesson.types';

/**
 * Scenario builder dialog component. Provides a modal interface for creating and editing scenarios,
 * including card selection (fixed, criteria-based, or snapshot).
 * @remarks Tracks dirty state to prompt on unsaved changes.
 */
@Component({
  selector: 'app-scenario-builder-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ScenarioEditorFormComponent,
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './scenario-builder-dialog.component.html',
  styleUrl: './scenario-builder-dialog.component.scss',
})
export class ScenarioBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<ScenarioBuilderDialogComponent, ScenarioBuilderDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<ScenarioBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(ScenarioBuilderStore);
  private readonly userStore = inject(UserStore);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly languagePairsApi = inject(LanguagePairsApiService);

  /** Current scenario form draft being edited or created. */
  readonly draft = signal<ScenarioFormDraft>(emptyScenarioFormDraft());
  /** Internal snapshot of the initial draft for dirty tracking. */
  private readonly initialSnapshot = signal('');

  /** Whether the draft has unsaved changes compared to the initial snapshot. */
  readonly dirty = computed(
    () => serializeScenarioFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  /** Dialog title, derived from the current mode and editor state. */
  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новый сценарий';
    }

    if (this.store.isReadOnly()) {
      return 'Просмотр сценария';
    }

    return 'Редактирование';
  });

  /** Programs loaded for the currently selected course. */
  readonly programs = signal<readonly ProgramWithLessons[]>([]);
  /** Lessons loaded for the currently selected program. */
  readonly lessons = signal<readonly Lesson[]>([]);
  /** Available language pairs from the registry. */
  readonly languagePairs = signal<readonly LanguagePairDto[]>([]);

  async ngOnInit(): Promise<void> {
    // Языковые пары и список курсов нужны в обоих режимах. Без курсов
    // dropdown «Привязка к курсу» не находит опцию для pre-filled courseId
    // и отображается пустым — в том числе при редактировании из Проводника,
    // который вызывает только `loadList()` и не наполняет `store.courses()`.
    await Promise.all([this.loadLanguagePairs(), this.store.loadCourses()]);

    if (this.data.mode === 'create') {
      this.store.startCreate();
      const context = {
        languagePairId: this.data.languagePairId,
        courseId: this.data.courseId,
        programId: this.data.programId,
        lessonId: this.data.lessonId,
      };
      const nextDraft = await this.store.createDraft(context);
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeScenarioFormDraft(nextDraft));

      // Предзагрузить программы если известен courseId
      const draftCourseId = this.draft().courseId;
      if (draftCourseId) {
        await this.loadPrograms(draftCourseId);
      }
      // Предзагрузить уроки если известен programId
      const draftProgramId = this.draft().programId;
      if (draftProgramId) {
        await this.loadLessons(draftProgramId);
      }
      return;
    }

    await this.store.startEdit(this.data.scenarioId);
    const scenario = this.store.editingScenario();

    if (!scenario) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = scenarioToFormDraft(scenario);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeScenarioFormDraft(nextDraft));

    // Load programs if a course is selected
    if (nextDraft.courseId) {
      await this.loadPrograms(nextDraft.courseId);
    }
    // Load lessons if a program is selected
    if (nextDraft.programId) {
      await this.loadLessons(nextDraft.programId);
    }
  }

  private async loadLanguagePairs(): Promise<void> {
    try {
      const pairs = await this.languagePairsApi.listAll();
      this.languagePairs.set(pairs);
    } catch {
      this.languagePairs.set([]);
    }
  }

  /**
   * Updates the current form draft with a new draft object.
   *
   * @param nextDraft - The updated scenario form draft.
   */
  updateDraft(nextDraft: ScenarioFormDraft): void {
    const previous = this.draft();
    this.draft.set(nextDraft);

    // Load programs when course changes. Compare against the previous draft:
    // `this.draft()` already holds `nextDraft` at this point.
    if (nextDraft.courseId !== previous.courseId) {
      this.programs.set([]);
      this.lessons.set([]);
      if (nextDraft.courseId) {
        void this.loadPrograms(nextDraft.courseId);
      }
    }

    // Load lessons when program changes (also drop stale lesson options).
    if (nextDraft.programId !== previous.programId) {
      this.lessons.set([]);
      if (nextDraft.programId) {
        void this.loadLessons(nextDraft.programId);
      }
    }
  }

  private async loadPrograms(courseId: string): Promise<void> {
    try {
      const programs = await this.programsApi.getByCourse(courseId);
      this.programs.set(programs);
    } catch {
      this.programs.set([]);
    }
  }

  private async loadLessons(programId: string): Promise<void> {
    try {
      const lessons = await this.programsApi.getLessons(programId);
      this.lessons.set(lessons);
    } catch {
      this.lessons.set([]);
    }
  }

  /**
   * Saves the current scenario draft.
   *
   * @remarks
   * Creates a new scenario in `create` mode or updates the existing one in `edit` mode.
   * Closes the dialog with `{ saved: true, scenarioId }` on success.
   */
  async saveScenario(): Promise<void> {
    const payload = formDraftToScenarioDraft(this.draft());

    if (this.data.mode === 'create') {
      const scenario = await this.store.createScenario(payload);
      if (scenario) {
        this.dialogRef.close({ saved: true, scenarioId: scenario.id });
      }
      return;
    }

    const saved = await this.store.updateScenario(this.data.scenarioId, payload);
    if (saved) {
      this.dialogRef.close({ saved: true, scenarioId: this.data.scenarioId });
    }
  }

  /**
   * Cancels the current edit and closes the dialog.
   *
   * @remarks
   * Prompts for confirmation if the draft has unsaved changes.
   * Closes the dialog with `{ saved: false }` on confirmation.
   */
  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancelEdit();
    this.dialogRef.close({ saved: false });
  }

  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
