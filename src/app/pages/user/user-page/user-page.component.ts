import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { LanguageService } from '../../../entities/language-pair/services/language.service';
import { AvailablePairsService } from '../../../entities/language-pair/services/available-pairs.service';
import { UserStore } from '../../../entities/user/model';
import { CourseCatalogLanguagePairManagerService } from '../../../features/course-catalog/services/course-catalog-language-pair-manager.service';
import { UserProfileDraftService } from './user-profile-draft.service';
import { UserProfileTabComponent } from './tabs/user-profile-tab.component';
import { UserLanguagesTabComponent } from './tabs/user-languages-tab.component';
import { UserPairsTabComponent } from './tabs/user-pairs-tab.component';
import { UserCourseSettingsTabComponent } from './tabs/user-course-settings-tab.component';
import { UserAppearanceTabComponent } from './tabs/user-appearance-tab.component';

/**
 * User profile page (learner zone) — thin tab shell.
 *
 * @remarks
 * Tab layout (0–4) — ALL tabs operate on the user's own `users/preferences`:
 * - **Пользователь** — profile name and proficiency
 *   (`UserProfileTabComponent`)
 * - **Мои языки** — pick languages for learning; read-only consumption of
 *   the `/languages` dictionary; dictionary CRUD lives in `/admin`
 *   (`UserLanguagesTabComponent`)
 * - **Мои пары** — activate / remove the user's own pairs; new pairs are
 *   added from the user's selected languages (registry `/language-pairs`
 *   CRUD lives in `/tools/language-pairs`, author zone)
 *   (`UserPairsTabComponent`, mutations via
 *   `UserLanguagePairManagerService`)
 * - **Настройки курса** — per-pair learning preferences
 *   (`UserCourseSettingsTabComponent`)
 * - **Внешний вид** — theme, font size, color scheme
 *   (`UserAppearanceTabComponent`)
 *
 * Form drafts and the save action live in `UserProfileDraftService`
 * (page-scoped provider) so that cross-tab drafts are committed together.
 * Pair catalog state lives in `UserLanguagePairManagerService`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    UserProfileTabComponent,
    UserLanguagesTabComponent,
    UserPairsTabComponent,
    UserCourseSettingsTabComponent,
    UserAppearanceTabComponent,
  ],
  providers: [UserProfileDraftService],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent {
  /** Index of the active tab (0 = Пользователь, 1 = Мои языки, 2 = Мои пары, 3 = Настройки курса, 4 = Внешний вид). */
  readonly selectedTabIndex = signal(0);

  private readonly userStore = inject(UserStore);
  private readonly languageService = inject(LanguageService);
  private readonly availablePairs = inject(AvailablePairsService);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;

  /** Shared draft state + save action for all tabs. */
  protected readonly drafts = inject(UserProfileDraftService);

  constructor() {
    // Ensure languages are loaded when the page opens (idempotent — also
    // retries if an earlier attempt failed while unauthenticated).
    void this.languageService.load();
    // Load language pairs from the backend
    void this.availablePairs.load();
    // Sync pair settings drafts for the course catalog settings tab
    this.pairManager.syncPairSettingsDrafts();
  }
}
