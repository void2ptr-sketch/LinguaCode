import { Component, ChangeDetectionStrategy, EventEmitter, Output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ScenarioPickerComponent } from '../../../../entities/scenario/ui/scenario-picker/scenario-picker.component';
import type { CardDifficulty } from '../../../../entities/card/model';

/**
 * Section component for scenario selection in the card select page.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-scenario-picker-section',
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    ScenarioPickerComponent,
  ],
  templateUrl: './scenario-picker-section.component.html',
  styleUrl: './scenario-picker-section.component.scss',
})
export class ScenarioPickerSectionComponent {
  /** Selected course ID. */
  readonly selectedCourseId = input.required<string>();

  /** Selected lesson ID. */
  readonly selectedLessonId = input<string>('');

  /** Lesson title display. */
  readonly lessonTitle = input.required<string>();

  /** Course title display. */
  readonly courseTitle = input.required<string>();

  /** Whether a lesson must be selected before scenarios can be chosen. */
  readonly requiresLessonForScenarios = input.required<boolean>();

  /** Whether the current course allows open practice (no lesson selection required). */
  readonly isOpenPractice = input.required<boolean>();

  /** Whether to show the difficulty filter UI. */
  readonly showDifficultyFilter = input.required<boolean>();

  /** Available difficulty levels. */
  readonly difficultyLevels = input.required<readonly string[]>();

  /** Labels for difficulty levels. */
  readonly difficultyLabels = input.required<Record<string, string>>();

  /** Selected difficulty filter (null = no filter). */
  readonly selectedDifficulty = input<string | null>(null);

  /** Scenario IDs available for the picker. */
  readonly allowedScenarioIds = input<readonly string[] | null>(null);

  /** Selected scenario ID within the current lesson. */
  readonly selectedScenarioId = input.required<string>();

  /** Hint text for the current step. */
  readonly nextStepHint = input.required<string>();

  /** Whether a scenario is selected. */
  readonly canStartPractice = input.required<boolean>();

  /** Event emitted when difficulty filter changes. */
  @Output() readonly difficultyChange = new EventEmitter<CardDifficulty | null>();

  /** Event emitted when a scenario is selected. */
  @Output() readonly selectedScenarioIdChange = new EventEmitter<string>();

  /** Event emitted when the picker label changes. */
  @Output() readonly scenarioLabelChange = new EventEmitter<string>();

  /** Event emitted when navigating to lessons tab. */
  @Output() readonly goToLessons = new EventEmitter<void>();

  /** Event emitted when clicking "next". */
  @Output() readonly nextClick = new EventEmitter<void>();

  /** Handles difficulty filter change. */
  onDifficultyChange(value: CardDifficulty | null): void {
    this.difficultyChange.emit(value);
  }

  /** Handles scenario selection change. */
  onSelectedScenarioIdChange(event: string): void {
    this.selectedScenarioIdChange.emit(event);
  }

  /** Handles scenario label change event. */
  onScenarioLabelChange(label: string): void {
    this.scenarioLabelChange.emit(label);
  }

  /** Handles "go to lessons" button click. */
  onGoToLessons(): void {
    this.goToLessons.emit();
  }

  /** Handles "next" button click. */
  onNextClick(): void {
    this.nextClick.emit();
  }
}
