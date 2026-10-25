import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ScormExportService } from '../../../../entities/course/api/scorm-export.service';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

import type { ScormExportBundle } from '../../../../entities/course/api/mock/scorm-export.types';

/**
 * SCORM export button component.
 *
 * @remarks
 * Downloads a course as a self-contained SCORM JSON bundle.
 * Uses `ScormExportService` to fetch the bundle and creates a Blob download.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scorm-export-button',
  imports: [MatButtonModule, MatIconModule],
  standalone: true,
  templateUrl: './scorm-export-button.component.html',
  styleUrl: './scorm-export-button.component.scss',
})
export class ScormExportButtonComponent {
  readonly courseId = input.required<string>();

  private readonly scormExportService = inject(ScormExportService);
  private readonly logger = inject(AppLoggerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Handles the export click event.
   *
   * Fetches the SCORM bundle and triggers a JSON file download.
   * Shows a snackbar toast on error.
   */
  async onExport(): Promise<void> {
    this.exporting.set(true);
    this.error.set(null);
    try {
      const bundle = await this.scormExportService.export(this.courseId());
      this.downloadScormJson(bundle);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ошибка экспорта');
      this.logger.error('SCORM export failed', err);
      this.snackBar.open('Ошибка экспорта в SCORM', 'Закрыть', { duration: 5_000 });
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Downloads the SCORM bundle as a JSON file.
   *
   * @param bundle - The SCORM export bundle to download.
   */
  private downloadScormJson(bundle: ScormExportBundle): void {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.courseId()}-scorm.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
