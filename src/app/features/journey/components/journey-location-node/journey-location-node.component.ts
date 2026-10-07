import {
  Component,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { JourneyLocationNode } from '../../../../core/models/journey.types';
import { JourneyAnalyticsService } from '../../../../core/services/journey-analytics.service';

/** Иконки Material для типов контента. */
const CONTENT_TYPE_ICONS: Record<string, string> = {
  theory: 'menu_book',
  practice: 'edit_note',
  test: 'assignment',
  video: 'play_circle',
  case: 'psychology',
};

/** Иконки Material для статусов. */
const STATUS_ICONS: Record<string, string> = {
  locked: 'lock',
  available: 'radio_button_unchecked',
  'in-progress': 'progress_activity',
  visited: 'visibility',
  completed: 'check_circle',
};

@Component({
  selector: 'app-journey-location-node',
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './journey-location-node.component.html',
  styleUrl: './journey-location-node.component.scss',
})
export class JourneyLocationNodeComponent {
  readonly node = input.required<JourneyLocationNode>();
  readonly selected = input<boolean>(false);

  readonly nodeSelect = output<string>();
  readonly toggleFavorite = output<string>();

  protected readonly analyticsService = inject(JourneyAnalyticsService);

  protected readonly statusIcon = computed(() => {
    return STATUS_ICONS[this.node().status] ?? 'help';
  });

  protected readonly contentTypeIcon = computed(() => {
    return CONTENT_TYPE_ICONS[this.node().contentType] ?? 'help';
  });

  protected readonly isInteractive = computed(() => {
    const status = this.node().status;
    return status !== 'locked';
  });

  protected readonly statusLabel = computed(() => {
    const status = this.node().status;
    switch (status) {
      case 'locked':
        return 'Заблокировано';
      case 'available':
        return 'Доступно';
      case 'in-progress':
        return 'В процессе';
      case 'visited':
        return 'Посещено';
      case 'completed':
        return 'Завершено';
      default:
        return '';
    }
  });

  protected onSelect(): void {
    if (this.isInteractive()) {
      this.nodeSelect.emit(this.node().id);
    }
  }

  protected onToggleFavorite(): void {
    this.toggleFavorite.emit(this.node().id);
  }
}
