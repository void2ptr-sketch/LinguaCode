import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LanguageDto } from '../../entities/language-pair/api/language-dto.types';
import { LanguageApiService, LanguageCreatePayload } from '../../entities/language-pair/api/language-api.service';
import { LanguageService, LanguageSettingsStore } from '../../entities/language-pair';
import { RoleService } from '../../entities/auth/services/role.service';

/**
 * Language settings page component.
 *
 * @remarks
 * Two-tab interface:
 * - **Languages** — select which languages are available for learning
 * - **Pairs** — configure language pairs from selected languages
 *
 * Settings are persisted to sessionStorage and affect all other features
 * (card search, course catalog, etc.).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-language-settings',
  imports: [
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.scss',
})
export class LanguageSettingsComponent {
  private readonly settingsStore: LanguageSettingsStore = inject(LanguageSettingsStore);
  private readonly languageService: LanguageService = inject(LanguageService);
  private readonly languageApi: LanguageApiService = inject(LanguageApiService);
  private readonly roleService: RoleService = inject(RoleService);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  readonly selectedCodes = this.settingsStore.selectedCodes;
  readonly availableLanguages = computed(() => this.languageService.languages());
  readonly loading = this.languageService.loading;
  readonly configuredPairs = this.settingsStore.configuredPairs;
  readonly activePairId = this.settingsStore.activePairId;
  readonly canWriteLanguages = this.roleService.canWriteLanguages;

  /** Newly selected codes for the add-pair form. */
  readonly newKnownCode = signal<string>('');
  readonly newLearningCode = signal<string>('');

  constructor() {
    // Ensure languages are loaded when the page opens (idempotent — also
    // retries if an earlier attempt failed while unauthenticated).
    void this.languageService.load();
  }

  /** Whether the currently active pair exists. */
  readonly hasActivePair = computed(() => !!this.settingsStore.getActivePair());

  /** Currently active pair label (e.g. "English → Russian"). */
  readonly activePairLabel = computed(() => {
    const pair = this.settingsStore.getActivePair();
    if (!pair) {
      return 'No active pair';
    }
    return `${this.getLanguageLabel(pair.known)} → ${this.getLanguageLabel(pair.learning)}`;
  });

  /** Returns the selected label for a language code. */
  getLanguageLabel(code: string): string {
    const lang = this.languageService.findByCode(code);
    return lang?.displayName ?? code;
  }

  /** Toggles a language in the user's selection. */
  toggleLanguage(code: string): void {
    if (this.selectedCodes().includes(code)) {
      this.settingsStore.removeLanguage(code);
    } else {
      this.settingsStore.addLanguage(code);
    }
  }

  /** Creates a new language pair from selected codes. */
  createPair(): void {
    const known = this.newKnownCode();
    const learning = this.newLearningCode();
    if (!known || !learning || known === learning) {
      return;
    }
    this.settingsStore.createPair(known, learning);
    this.newKnownCode.set('');
    this.newLearningCode.set('');
    this.snackBar.open('Pair added', 'Close', { duration: 3000 });
  }

  /** Removes a configured pair. */
  removePair(pairId: string): void {
    this.settingsStore.removePair(pairId);
  }

  /** Sets the active pair by ID. */
  setActivePair(pairId: string): void {
    this.settingsStore.setActivePair(pairId);
  }

  /** Opens a dialog to create a new language. */
  openCreateLanguageDialog(): void {
    if (!this.canWriteLanguages()) {
      return;
    }
    // For now, use a simple prompt — in the future this could be a proper dialog component
    const code = prompt('Enter language code (e.g., "de" for German):');
    if (!code) return;

    const displayName = prompt('Enter display name (e.g., "German"):');
    if (!displayName) return;

    const nativeName = prompt('Enter native name (e.g., "Deutsch"):');
    if (!nativeName) return;

    const writingDir = prompt('Writing direction (ltr/rtl):') || 'ltr';
    const supportsTones = confirm('Supports tones? (OK=Yes, Cancel=No)');
    const supportsPinyin = confirm('Supports pinyin? (OK=Yes, Cancel=No)');
    const fontFamily = prompt('Font family (e.g., "Noto Sans"):') || 'Noto Sans';
    const activeFlag = confirm('Active? (OK=Yes, Cancel=No)');

    const payload: LanguageCreatePayload = {
      code,
      displayName,
      nativeName,
      writingDir,
      supportsTones,
      supportsPinyin,
      fontFamily,
      activeFlag,
    };

    this.languageApi
      .create(payload)
      .then((lang) => {
        this.snackBar.open(`Language "${lang.displayName}" created`, 'Close', { duration: 3000 });
        // Reload languages
        this.languageService.load().then(() => {
          this.settingsStore.addLanguage(code);
        });
      })
      .catch((error) => {
        this.snackBar.open(
          `Failed to create language: ${(error as Error).message}`,
          'Close',
          { duration: 5000 },
        );
      });
  }

  /** Toggles active status for a language. */
  toggleActiveLanguage(lang: LanguageDto): void {
    if (!this.canWriteLanguages()) {
      this.snackBar.open('You do not have permission to change language status', 'Close', {
        duration: 5000,
      });
      return;
    }

    this.languageApi
      .update(lang.id, { activeFlag: !lang.activeFlag })
      .then((updated) => {
        this.snackBar.open(
          `Language ${updated.activeFlag ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 3000 },
        );
        this.languageService.load();
      })
      .catch((error: unknown) => {
        const httpError = error as { status?: number; message?: string };
        const message =
          httpError.status === 403
            ? 'Permission denied. You do not have permission to change language status.'
            : `Failed to update language: ${httpError.message ?? 'Unknown error'}`;
        this.snackBar.open(message, 'Close', { duration: 5000 });
      });
  }
}
