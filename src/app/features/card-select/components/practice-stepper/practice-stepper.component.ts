import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * State of a single step in the practice stepper.
 *
 * @remarks
 * Used to render the step navigation bar during a practice session.
 */
export type PracticeStepState = {
  /** Zero-based index of the step. */
  index: number;
  /** Display label for the step. */
  label: string;
  /** Whether the step has been completed. */
  done: boolean;
  /** Whether this is the currently active step. */
  current: boolean;
  /** Whether the step is locked (not yet accessible). */
  locked: boolean;
};

@Component({
  selector: 'app-practice-stepper',
  imports: [MatIconModule],
  templateUrl: './practice-stepper.component.html',
  styleUrl: './practice-stepper.component.scss',
})
export class PracticeStepperComponent {
  /** Array of steps to display in the stepper. */
  readonly steps = input.required<readonly PracticeStepState[]>();

  /** Emits when the user selects a step. Payload is the zero-based step index. */
  readonly stepSelect = output<number>();

  selectStep(index: number, locked: boolean): void {
    if (locked) {
      return;
    }

    this.stepSelect.emit(index);
  }
}
