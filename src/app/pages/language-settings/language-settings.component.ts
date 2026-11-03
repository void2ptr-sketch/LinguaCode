import { Component, ChangeDetectionStrategy, inject, computed, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
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
import {
  LanguageApiService,
  LanguageCreatePayload,
} from '../../entities/language-pair/api/language-api.service';
import { LanguageService, LanguageSettingsStore } from '../../entities/language-pair';
import { AvailablePairsService } from '../../entities/language-pair/lib/available-pairs.service';
import { RoleService } from '../../entities/auth/services/role.service';
import { LanguagePairsService } from '../../shared/api/generated/language-pairs';

// ── Grouping types ──────────────────────────────────────────────

/** A single direction within a grouped card. */
export interface DirectionItem {
  /** DB pair ID (stringified number). */
  id: string;
  known: string;
  learning: string;
  isActive: boolean;
}

/** A grouped pair of mirror directions (e.g. EN↔RU). */
export interface PairGroup {
  /** Canonical key — sorted language codes joined by a pipe. */
  key: string;
  /** Both directions (0–2). */
  directions: DirectionItem[];
  /** Total configured directions for this pair. */
  count: number;
}

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
    UpperCasePipe,
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
  private readonly availablePairs: AvailablePairsService = inject(AvailablePairsService);
  private readonly languagePairsApi: LanguagePairsService = inject(LanguagePairsService);
  private readonly languageApi: LanguageApiService = inject(LanguageApiService);
  private readonly roleService: RoleService = inject(RoleService);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  readonly selectedCodes = this.settingsStore.selectedCodes;
  readonly availableLanguages = computed(() => this.languageService.languages());
  readonly loading = this.languageService.loading;
  /** DB pairs filtered by selected + active languages. */
  readonly configuredPairs = computed(() =>
    this.availablePairs.visiblePairs().map((p) => ({
      id: String(p.id),
      known: p.knownCode,
      learning: p.learningCode,
    })),
  );
  readonly activePairId = this.settingsStore.activePairId;
  readonly canWriteLanguages = this.roleService.canWriteLanguages;

  /** Newly selected codes for the add-pair form. */
  readonly newKnownCode = signal<string>('');
  readonly newLearningCode = signal<string>('');

  /** Pairs grouped by mirror languages (EN↔RU, EN↔DE …). */
  readonly groupedPairs = computed(() => {
    const pairs = this.configuredPairs();
    const activeId = this.activePairId();
    const groups = new Map<string, DirectionItem[]>();

    for (const p of pairs) {
      // Canonical key: sorted codes so EN|RU === RU|EN
      const sorted = [p.known, p.learning].sort();
      const key = sorted.join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({
        id: p.id,
        known: p.known,
        learning: p.learning,
        isActive: p.id === (activeId ?? ''),
      });
    }

    return Array.from(groups.entries()).map(([key, directions]) => ({
      key,
      directions,
      count: directions.length,
    }));
  });

  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    // Ensure languages are loaded when the page opens (idempotent — also
    // retries if an earlier attempt failed while unauthenticated).
    void this.languageService.load();
    // Load language pairs from the backend
    void this.availablePairs.load();
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

  /** Returns a flag emoji for a language code, or empty string if no flag is available. */
  getFlagEmoji(code: string): string {
    if (!code || code.length < 2) return '';
    const upper = code.toUpperCase();

    // Language flag mapping (ISO 639-1 codes)
    const emojiMap: Record<string, string> = {
      EN: '\u{1F1EC}\u{1F1E7}',
      RU: '\u{1F1F7}\u{1F1FA}',
      DE: '\u{1F1E9}\u{1F1EA}',
      ZH: '\u{1F1E8}\u{1F1F3}',
      JA: '\u{1F1EF}\u{1F1F5}',
      FR: '\u{1F1EB}\u{1F1F7}',
      ES: '\u{1F1EA}\u{1F1F8}',
      KO: '\u{1F1F0}\u{1F1F7}',
      AR: '\u{1F1E6}\u{1F1E8}',
      PT: '\u{1F1F5}\u{1F1F9}',
      IT: '\u{1F1EE}\u{1F1F9}',
      NL: '\u{1F1F3}\u{1F1F1}',
      PL: '\u{1F1F5}\u{1F1F1}',
      TR: '\u{1F1F9}\u{1F1F7}',
      CS: '\u{1F1E8}\u{1F1F8}',
      SV: '\u{1F1F8}\u{1F1FB}',
      DA: '\u{1F1E9}\u{1F1F0}',
      FI: '\u{1F1EB}\u{1F1EE}',
      NO: '\u{1F1F3}\u{1F1F4}',
      HU: '\u{1F1ED}\u{1F1FA}',
      HE: '\u{1F1EE}\u{1F1F1}',
      TH: '\u{1F1F9}\u{1F1ED}',
      VI: '\u{1F1FB}\u{1F1EE}',
      UK: '\u{1F1FA}\u{1F1F6}',
      LT: '\u{1F1F1}\u{1F1F9}',
      LV: '\u{1F1F1}\u{1F1FB}',
      EE: '\u{1F1EA}\u{1F1EA}',
      RO: '\u{1F1F7}\u{1F1F4}',
      BG: '\u{1F1E7}\u{1F1EC}',
      HR: '\u{1F1ED}\u{1F1F7}',
      SK: '\u{1F1F8}\u{1F1F0}',
      SL: '\u{1F1F1}\u{1F1EE}',
      CA: '\u{1F1E8}\u{1F1E6}',
      GL: '\u{1F1EC}\u{1F1F1}',
      EU: '\u{1F1EA}\u{1F1FA}',
      ID: '\u{1F1EE}\u{1F1E9}',
      MS: '\u{1F1F2}\u{1F1F8}',
      TL: '\u{1F1F5}\u{1F1FD}',
    };

    const found = emojiMap[upper];
    if (found) return found;

    // Two-letter code that isn't in the map → try to build a flag
    if (code.length === 2 && this._isValidCountryCode(code)) {
      return this._codeToEmoji(code);
    }

    // No flag available (e.g. C++, PERL, JS) → return empty; template shows CSS badge
    return '';
  }

  /** Deterministic background color from language code hash. */
  getBadgeColor(code: string): string {
    if (!code) return 'var(--mat-sys-outline-variant)';
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 82%)`;
  }

  /** Deterministic text color matching the background hue. */
  getBadgeTextColor(code: string): string {
    if (!code) return 'var(--mat-sys-on-surface-variant)';
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 50%, 25%)`;
  }

  /** First two letters for the CSS badge fallback. */
  getBadgeCode(code: string): string {
    if (!code) return '';
    // Strip non-alpha (C++ → CC, JavaScript → JS)
    const alpha = code.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return alpha.length >= 2 ? alpha.slice(0, 2) : code.toUpperCase().slice(0, 2);
  }

  private _isValidCountryCode(code: string): boolean {
    // RFC 3066 / ISO 3166-1: only A-Z
    return /^[A-Z]{2}$/.test(code.toUpperCase());
  }

  private _codeToEmoji(code: string): string {
    if (code.length < 2) return '🏳';
    const c1 = code[0].toUpperCase().charCodeAt(0);
    const c2 = code[1].toUpperCase().charCodeAt(0);
    if (c1 < 65 || c1 > 90 || c2 < 65 || c2 > 90) return '🏳';
    const f1 = String.fromCodePoint(0x1f1e6 + (c1 - 65));
    const f2 = String.fromCodePoint(0x1f1e6 + (c2 - 65));
    return f1 + f2;
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
  async createPair(): Promise<void> {
    const known = this.newKnownCode();
    const learning = this.newLearningCode();
    if (!known || !learning || known === learning) {
      return;
    }

    try {
      await this.languagePairsApi.languagePairsCreate({
        knownCode: known,
        learningCode: learning,
      });

      // Refresh the pairs list
      await this.availablePairs.load();

      this.newKnownCode.set('');
      this.newLearningCode.set('');
      this.snackBar.open('Pair added', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(
        `Failed to create pair: ${(error as Error).message}`,
        'Close',
        { duration: 5000 },
      );
    }
  }

  /** Removes a configured pair. */
  async removePair(pairId: string): Promise<void> {
    try {
      const numericId = Number(pairId);
      if (Number.isNaN(numericId)) {
        return;
      }
      await this.languagePairsApi.languagePairsDelete(numericId);

      // Refresh the pairs list
      await this.availablePairs.load();

      this.snackBar.open('Pair removed', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(
        `Failed to remove pair: ${(error as Error).message}`,
        'Close',
        { duration: 5000 },
      );
    }
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
        this.snackBar.open(`Failed to create language: ${(error as Error).message}`, 'Close', {
          duration: 5000,
        });
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

    const previousFlag = lang.activeFlag;

    // Optimistic UI update — flip the switch immediately
    lang.activeFlag = !previousFlag;
    this.cdr.markForCheck();

    this.languageApi
      .update(lang.id, { activeFlag: lang.activeFlag })
      .then((updated) => {
        this.snackBar.open(
          `Language ${updated.activeFlag ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 3000 },
        );
        // Reload in background for full consistency (only if loaded was false)
        void this.languageService.load();
      })
      .catch((error: unknown) => {
        // Rollback optimistic update on failure
        lang.activeFlag = previousFlag;
        this.cdr.markForCheck();

        const httpError = error as { status?: number; message?: string };
        const message =
          httpError.status === 403
            ? 'Session expired or access denied. Please refresh the page and try again.'
            : `Failed to update language: ${httpError.message ?? 'Unknown error'}`;
        this.snackBar.open(message, 'Close', { duration: 5000 });
      });
  }
}
