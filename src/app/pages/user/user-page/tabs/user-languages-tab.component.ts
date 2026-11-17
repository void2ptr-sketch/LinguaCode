import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import { UserLanguagePairManagerService } from '../../../../entities/language-pair/services/user-language-pair-manager.service';
import { LanguageSettingsStore } from '../../../../entities/language-pair/store/language-settings.store';
import { RoleService } from '../../../../entities/auth/services/role.service';

/**
 * Tab «Мои языки»: pick languages for learning.
 *
 * @remarks
 * Read-only consumption of the `/languages` dictionary — the dictionary
 * CRUD lives in `/admin`. Toggling a language updates
 * `LanguageSettingsStore` immediately (no draft needed).
 */
@Component({
  selector: 'app-user-languages-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatCardModule, MatCheckboxModule, MatTooltipModule],
  styleUrl: '../user-page.component.scss',
  templateUrl: './user-languages-tab.component.html',
})
export class UserLanguagesTabComponent {
  private readonly languageService = inject(LanguageService);
  private readonly settingsStore = inject(LanguageSettingsStore);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly pairManager = inject(UserLanguagePairManagerService);

  /** Whether the language dictionary or pair catalog is still loading. */
  readonly loading = computed(() => this.pairManager.loading());

  /** Selected language codes from `LanguageSettingsStore`. */
  readonly selectedCodes = this.settingsStore.selectedCodes;

  /** Available content languages from the backend dictionary. */
  readonly availableLanguages = computed(() => this.languageService.languages());

  /**
   * Whether the current user manages the language dictionary (ROLE_ADMIN).
   * Used only to show the hint linking to `/admin` — the profile itself
   * never mutates the dictionary.
   */
  readonly canManageLanguages = this.roleService.canManageSystem;

  /** Toggles a language in the user's selection. */
  toggleLanguage(code: string): void {
    if (this.selectedCodes().includes(code)) {
      this.settingsStore.removeLanguage(code);
    } else {
      this.settingsStore.addLanguage(code);
    }
  }

  /** Opens the language dictionary management page (admin zone). */
  openLanguageAdmin(): void {
    void this.router.navigate(['/admin']);
  }
}
