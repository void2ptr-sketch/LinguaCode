import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type PracticeStepState = {
  index: number;
  label: string;
  done: boolean;
  current: boolean;
  locked: boolean;
};

@Component({
  selector: 'app-practice-stepper',
  imports: [MatIconModule],
  templateUrl: './practice-stepper.component.html',
  styleUrl: './practice-stepper.component.scss',
})
export class PracticeStepperComponent {
  readonly steps = input.required<readonly PracticeStepState[]>();

  readonly stepSelect = output<number>();

  selectStep(index: number, locked: boolean): void {
    if (locked) {
      return;
    }

    this.stepSelect.emit(index);
  }
}
