import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Represents a single step in the practice session flow.
 *
 * @remarks
 * Each segment corresponds to a tab in the learning flow:
 * course → lesson → scenario. Tracks completion and locking state.
 */
export type PracticeSessionSegment = {
  /** Target tab index to navigate to. */
  tabIndex: number;
  /** Display label for the segment (e.g., 'Программа', 'Урок', 'Сценарий'). */
  label: string;
  /** Current value/selection for the segment, or null if not selected. */
  value: string | null;
  /** Placeholder text shown when no value is selected. */
  placeholder: string;
  /** Whether this segment has been completed (value selected). */
  completed: boolean;
  /** Whether this segment is locked (cannot be selected). */
  locked: boolean;
  /** Optional reason why the segment is locked. */
  lockReason?: string | null;
};

/**
 * Horizontal bar showing the current state of a practice session.
 *
 * @remarks
 * Displays segments (course, lesson, scenario) with completion and lock indicators.
 * Clicking a segment navigates to its tab (if not locked).
 *
 * @example
 * ```html
 * <app-practice-session-bar
 *   [segments]="sessionSegments"
 *   (segmentSelect)="onSegmentSelect($event)">
 * </app-practice-session-bar>
 * ```
 */
@Component({
  selector: 'app-practice-session-bar',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './practice-session-bar.component.html',
  styleUrl: './practice-session-bar.component.scss',
})
export class PracticeSessionBarComponent {
  /** Array of session segments to display (course, lesson, scenario steps). */
  readonly segments = input.required<readonly PracticeSessionSegment[]>();

  /** Emits when the user selects a segment. Payload is the zero-based tab index. */
  readonly segmentSelect = output<number>();

  /**
   * Handles segment selection.
   *
   * @param tabIndex - The tab index to navigate to.
   * @param locked - Whether the segment is locked.
   * @remarks
   * No-op if the segment is locked.
   */
  selectSegment(tabIndex: number, locked: boolean): void {
    if (locked) {
      return;
    }

    this.segmentSelect.emit(tabIndex);
  }
}
