import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type PracticeSessionSegment = {
  tabIndex: number;
  label: string;
  value: string | null;
  placeholder: string;
  completed: boolean;
  locked: boolean;
  lockReason?: string | null;
};

@Component({
  selector: 'app-practice-session-bar',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './practice-session-bar.component.html',
  styleUrl: './practice-session-bar.component.scss',
})
export class PracticeSessionBarComponent {
  readonly segments = input.required<readonly PracticeSessionSegment[]>();

  readonly segmentSelect = output<number>();

  selectSegment(tabIndex: number, locked: boolean): void {
    if (locked) {
      return;
    }

    this.segmentSelect.emit(tabIndex);
  }
}
