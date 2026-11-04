import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
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
import { UserStore } from '../../entities/user/model';
import { RoleService } from '../../entities/auth/services/role.service';
import { LanguagePairsService } from '../../shared/api/generated/language-pairs';
import type { ContentLanguage } from '../../entities/card/model';
import type { LanguagePair } from '../../entities/language-pair/model/language-pair.types';
import {
  buildMirrorGroupKey,
  isContentLanguage,
} from '../../entities/language-pair/lib/language-pair.utils';
import {
  DIRECTION_CARD_HELPERS,
  DirectionCardEvent,
  DirectionItem,
} from './direction-card/direction-card.component';
import { DirectionCardInnerComponent } from './direction-card/direction-card-inner.component';

// ── Grouping types ──────────────────────────────────────────────

/** Alias map: display name / common variation → ContentLanguage code. */
const CODE_ALIASES: Record<string, ContentLanguage> = {
  'c++': 'cpp',
  cpp: 'cpp',
  'C++': 'cpp',
  javascript: 'js',
  js: 'js',
  JS: 'js',
  haskell: 'hs',
  hs: 'hs',
  Haskell: 'hs',
  rust: 'rs',
  rs: 'rs',
  Rust: 'rs',
};

/** Normalizes a language code from the backend to a valid ContentLanguage. */
function normalizeCode(code: string): ContentLanguage {
  const trimmed = code.trim();
  // Check direct match first
  const lower = trimmed.toLowerCase();
  const alias = CODE_ALIASES[trimmed] || CODE_ALIASES[lower];
  if (alias) return alias;
  // Return as-is if already valid
  return trimmed as ContentLanguage;
}

/** A grouped pair of mirror directions (e.g. EN↔RU). */
export type PairGroup = {
  /** Canonical key — sorted language codes joined by a pipe. */
  key: string;
  /** Both directions (0–2). */
  directions: DirectionItem[];
  /** Total configured directions for this pair. */
  count: number;
};

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
    DirectionCardInnerComponent,
  ],
  providers: [
    {
      provide: DIRECTION_CARD_HELPERS,
      useFactory: (comp: LanguageSettingsComponent) => ({
        getLanguageLabel: (code: string) => comp.getLanguageLabel(code),
        getFlagEmoji: (code: string) => comp.getFlagEmoji(code),
        getBadgeColor: (code: string) => comp.getBadgeColor(code),
        getBadgeTextColor: (code: string) => comp.getBadgeTextColor(code),
        getBadgeCode: (code: string) => comp.getBadgeCode(code),
      }),
      deps: [LanguageSettingsComponent],
    },
  ],
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.scss',
})
export class LanguageSettingsComponent {
  private readonly settingsStore: LanguageSettingsStore = inject(LanguageSettingsStore);
  private readonly userStore: UserStore = inject(UserStore);
  private readonly languageService: LanguageService = inject(LanguageService);
  private readonly availablePairs: AvailablePairsService = inject(AvailablePairsService);
  private readonly languagePairsApi: LanguagePairsService = inject(LanguagePairsService);
  private readonly languageApi: LanguageApiService = inject(LanguageApiService);
  private readonly roleService: RoleService = inject(RoleService);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly selectedCodes = this.settingsStore.selectedCodes;
  readonly availableLanguages = computed(() => this.languageService.languages());
  readonly loading = computed(
    () =>
      this.languageService.loading() ||
      (this.availablePairs.loading() && !this.availablePairs.loaded()),
  );
  /** DB pairs filtered by selected + active languages. */
  readonly configuredPairs = computed(() =>
    this.availablePairs.visiblePairs().map((p) => ({
      id: String(p.id),
      known: normalizeCode(p.knownCode),
      learning: normalizeCode(p.learningCode),
    })),
  );
  readonly canWriteLanguages = this.roleService.canWriteLanguages;

  /** Newly selected codes for the add-pair form. */
  readonly newKnownCode = signal<string>('');
  readonly newLearningCode = signal<string>('');

  /**
   * Pairs grouped by mirror languages (EN↔RU, EN↔DE …).
   *
   * @remarks
   * The `isActive` flag of each direction card is derived from the
   * per-mirror-group highlight (`UserStore.activeByMirrorGroup`), NOT from
   * the global active pair. This isolates events: activation within one
   * mirror pair group never changes the highlight of other mirror pairs.
   */
  readonly groupedPairs = computed(() => {
    const pairs = this.configuredPairs();
    const groupActive = this.userStore.activeByMirrorGroup();
    const groups = new Map<string, DirectionItem[]>();

    for (const p of pairs) {
      const key = buildMirrorGroupKey(p.known, p.learning);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      const marker = groupActive[key];
      const isActive = !!marker && marker.known === p.known && marker.learning === p.learning;
      groups.get(key)!.push({
        id: p.id,
        known: p.known,
        learning: p.learning,
        isActive,
      });
    }

    return Array.from(groups.entries()).map(([key, directions]) => ({
      key,
      directions,
      count: directions.length,
    }));
  });

  constructor() {
    // Ensure languages are loaded when the page opens (idempotent — also
    // retries if an earlier attempt failed while unauthenticated).
    void this.languageService.load();
    // Load language pairs from the backend
    void this.availablePairs.load();
  }

  /** Whether the currently active pair exists. */
  readonly hasActivePair = computed(() => !!this.userStore.activeLanguagePairEntry());

  /** Currently active pair label (e.g. "English → Russian"). */
  readonly activePairLabel = computed(() => {
    const entry = this.userStore.activeLanguagePairEntry();
    if (!entry) {
      return 'No active pair';
    }
    return `${this.getLanguageLabel(entry.pair.known)} → ${this.getLanguageLabel(entry.pair.learning)}`;
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

      // Sync the newly created pair to UserStore so that setActivePair
      // can find a matching entry.  Creating a pair is a single-card
      // event: it must NOT activate the pair or change any mirror-group
      // highlight (hence `activate: false`).
      this.userStore.addLanguagePair(
        { known: known as ContentLanguage, learning: learning as ContentLanguage },
        { activate: false },
      );

      // Refresh the pairs list (force reload after mutation)
      await this.availablePairs.load(true);

      this.newKnownCode.set('');
      this.newLearningCode.set('');
      this.snackBar.open('Pair added', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Failed to create pair: ${(error as Error).message}`, 'Close', {
        duration: 5000,
      });
    }
  }

  /**
   * Activates a single direction card.
   *
   * @remarks
   * Strictly scoped to the card's own mirror pair group: the highlight moves
   * to this card within its group (its mirror sibling is the only other card
   * that may change). Cards of other mirror pairs are never affected. The
   * global active learning pair is synced so the header switcher follows the
   * user's explicit choice.
   */
  setActivePair(event: DirectionCardEvent): void {
    // Resolve the card strictly by its full identity — no ambiguous lookups.
    const pair = this.configuredPairs().find((p) => p.id === event.pairId);
    if (!pair || pair.known !== event.known || pair.learning !== event.learning) {
      return;
    }
    // Validate that both codes are recognized content languages before proceeding.
    if (!isContentLanguage(pair.known) || !isContentLanguage(pair.learning)) {
      return;
    }

    const direction: LanguagePair = {
      known: pair.known as ContentLanguage,
      learning: pair.learning as ContentLanguage,
    };
    const groupKey = buildMirrorGroupKey(direction.known, direction.learning);

    // Ensure a UserStore entry exists for the exact direction — without
    // any activation side effects.
    this.userStore.addLanguagePair(direction, { activate: false });

    // Highlight within this mirror pair group only.
    this.userStore.setActivePairInGroup(groupKey, direction);

    // Sync the global active learning pair (header switcher, learning scope).
    const entry = this.userStore
      .languagePairs()
      .find((e) => e.pair.known === direction.known && e.pair.learning === direction.learning);
    if (entry) {
      this.userStore.setActiveLanguagePair(entry.id);
    }
  }

  /**
   * Removes a configured pair (single-card event).
   *
   * @remarks
   * Affects only the removed direction: the backend row is deleted, the
   * matching UserStore entry is removed, and this group's highlight moves to
   * the mirror sibling (if still configured) or is cleared. Other mirror
   * pair groups are never touched.
   */
  async removePair(event: DirectionCardEvent): Promise<void> {
    try {
      const numericId = Number(event.pairId);
      if (Number.isNaN(numericId)) {
        return;
      }
      // Resolve the card strictly by its full identity — no ambiguous lookups.
      const pair = this.configuredPairs().find((p) => p.id === event.pairId);
      if (!pair || pair.known !== event.known || pair.learning !== event.learning) {
        return;
      }

      await this.languagePairsApi.languagePairsDelete(numericId);

      // Remove the matching UserStore entry (exact codes). The store moves
      // this group's highlight to the mirror sibling or clears it.
      const entry = this.userStore
        .languagePairs()
        .find((e) => e.pair.known === pair.known && e.pair.learning === pair.learning);
      if (entry) {
        this.userStore.removeLanguagePair(entry.id);
      }

      // Refresh the pairs list (force reload after mutation)
      await this.availablePairs.load(true);

      // If the removed direction was this group's highlight and the mirror
      // sibling is still configured, move the highlight to it. This only
      // ever affects the group the removed card belonged to.
      const groupKey = buildMirrorGroupKey(pair.known, pair.learning);
      const marker = this.userStore.activeByMirrorGroup()[groupKey];
      if (marker && marker.known === pair.known && marker.learning === pair.learning) {
        const sibling = this.configuredPairs().find(
          (p) => p.known === pair.learning && p.learning === pair.known,
        );
        if (sibling) {
          this.userStore.setActivePairInGroup(groupKey, {
            known: sibling.known as ContentLanguage,
            learning: sibling.learning as ContentLanguage,
          });
        }
      }

      this.snackBar.open('Pair removed', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Failed to remove pair: ${(error as Error).message}`, 'Close', {
        duration: 5000,
      });
    }
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
