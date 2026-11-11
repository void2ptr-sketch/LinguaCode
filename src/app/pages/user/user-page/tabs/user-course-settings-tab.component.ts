import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CourseCatalogSettingsComponent } from '../../../../features/course-catalog/components/course-settings/course-settings.component';
import { UserLanguagePairManagerService } from '../../../../entities/language-pair/services/user-language-pair-manager.service';

/**
 * Tab «Настройки курса»: per-pair learning preferences.
 *
 * @remarks
 * Renders the shared course-catalog settings component once the language
 * dictionary and pair catalog finish loading.
 */
@Component({
  selector: 'app-user-course-settings-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CourseCatalogSettingsComponent],
  styleUrl: '../user-page.component.scss',
  template: `
    <div class="page-card__tab-panel">
      @if (loading()) {
        <div class="settings-page__loading">Loading languages...</div>
      } @else {
        <app-course-catalog-settings />
      }
    </div>
  `,
})
export class UserCourseSettingsTabComponent {
  private readonly pairManager = inject(UserLanguagePairManagerService);

  /** Whether the language dictionary or pair catalog is still loading. */
  protected readonly loading = computed(() => this.pairManager.loading());
}
