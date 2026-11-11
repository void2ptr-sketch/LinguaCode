import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RemovePairDialogComponent } from '../../../entities/language-pair/ui/remove-pair-dialog.component';
import { LanguageService, LanguageSettingsStore } from '../../../entities/language-pair';
import { AvailablePairsService } from '../../../entities/language-pair/services/available-pairs.service';
import { UserStore } from '../../../entities/user/model';
import { UserApiService } from '../../../entities/user/api/user-api.service';
import { UserPreferencesApiService } from '../../../entities/user/api/user-preferences-api.service';
import { RoleService } from '../../../entities/auth/services/role.service';
import type { ContentLanguage } from '../../../entities/card/model';
import type { LanguagePair } from '../../../entities/language-pair/model/language-pair.types';
import {
  buildMirrorGroupKey,
  isContentLanguage,
} from '../../../entities/language-pair/utils/language-pair.utils';
import {
  DIRECTION_CARD_HELPERS,
  DirectionCardEvent,
  DirectionItem,
} from '../../../entities/language-pair/ui/direction-card.component';
import { DirectionCardInnerComponent } from '../../../entities/language-pair/ui/direction-card-inner.component';
import { CourseCatalogSettingsComponent } from '../../../features/course-catalog/components/course-settings/course-settings.component';
import { CourseCatalogLanguagePairManagerService } from '../../../features/course-catalog/services/course-catalog-language-pair-manager.service';
import type {
  AppColorScheme,
  UserPreferences,
  UserLanguagePairSettings,
} from '../../../entities/user/model';
import type { LearningProficiencyLevel } from '../../../entities/learning/model';
import { LEARNING_PROFICIENCY_LEVELS } from '../../../entities/learning/model';
import type { UserPreferences as GeneratedUserPreferences } from '../../../shared/api/generated/models';
import type { LanguagePairEntrySettings } from '../../../shared/api/generated/models';

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
 * User profile page component (learner zone). Allows users to manage their display
 * name, theme preferences, language pairs, and learning proficiency level.
 *
 * @remarks
 * Tab layout (0–4) — ALL tabs operate on the user's own `users/preferences`:
 * - **Пользователь** — profile name and proficiency
 * - **Мои языки** — pick languages for learning (read-only consumption of the
 *   `/languages` dictionary; dictionary CRUD lives in `/admin`)
 * - **Мои пары** — activate / remove the user's own pairs; new pairs are added
 *   from the user's selected languages (registry `/language-pairs` CRUD lives
 *   in `/tools/language-pairs`, author zone)
 * - **Настройки курса** — per-pair learning preferences (course catalog settings)
 * - **Внешний вид** — theme, font size, color scheme
 *
 * Uses draft signals for form fields that are committed to `UserStore` on save.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-page',
  imports: [
    FormsModule,
    UpperCasePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    DirectionCardInnerComponent,
    CourseCatalogSettingsComponent,
  ],
  providers: [
    {
      provide: DIRECTION_CARD_HELPERS,
      useFactory: (comp: UserPageComponent) => ({
        getLanguageLabel: (code: string) => comp.getLanguageLabel(code),
        getFlagEmoji: (code: string) => comp.getFlagEmoji(code),
        getBadgeColor: (code: string) => comp.getBadgeColor(code),
        getBadgeTextColor: (code: string) => comp.getBadgeTextColor(code),
        getBadgeCode: (code: string) => comp.getBadgeCode(code),
      }),
      deps: [UserPageComponent],
    },
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent implements OnInit {
  /** Index of the active tab (0 = Пользователь, 1 = Мои языки, 2 = Мои пары, 3 = Настройки курса, 4 = Внешний вид). */
  readonly selectedTabIndex = signal(0);

  private readonly userStore: UserStore = inject(UserStore);
  private readonly settingsStore: LanguageSettingsStore = inject(LanguageSettingsStore);
  private readonly languageService: LanguageService = inject(LanguageService);
  private readonly availablePairs: AvailablePairsService = inject(AvailablePairsService);
  private readonly userApi: UserApiService = inject(UserApiService);
  private readonly userPreferencesApi: UserPreferencesApiService =
    inject(UserPreferencesApiService);
  private readonly roleService: RoleService = inject(RoleService);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;
  /** User preferences signal from the store. */
  readonly preferences = this.userStore.preferences;
  /** Available content languages. */
  readonly languages = () => this.languageService.getCodes();
  /** Labels for content languages. */
  readonly languageLabels = () => this.languageService.getLabels();

  /** Draft value for the user's display name. */
  readonly nameDraft = signal(this.displayName());
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.preferences().learningProficiencyLevel,
  );
  /** Available learning proficiency level options. */
  readonly learningProficiencyOptions = LEARNING_PROFICIENCY_LEVELS;
  /** Draft value for the application theme. */
  readonly themeDraft = signal(this.preferences().theme);
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  /** Draft value for the color scheme (light/dark/system). */
  readonly colorSchemeDraft = signal<AppColorScheme>(this.preferences().colorScheme);
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = signal(this.preferences().cardFocusFullscreen);

  // ── Language settings state ─────────────────────────────────────

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
  /**
   * Whether the current user manages the language dictionary (ROLE_ADMIN).
   * Used only to show the hint linking to `/admin` — the profile itself
   * never mutates the dictionary.
   */
  readonly canManageLanguages = this.roleService.canManageSystem;

  /** Search text for filtering the pair catalog (label or code, e.g. "en", "English"). */
  readonly pairSearch = signal('');

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

  /**
   * Pair catalog filtered by the search text.
   *
   * @remarks
   * The catalog is the read-only view of the registry (`/language-pairs`
   * via `AvailablePairsService`); the profile never writes to it. A direction
   * card is matched when the search text appears in either language's label,
   * native name or code — case-insensitive.
   */
  readonly filteredGroupedPairs = computed(() => {
    const query = this.pairSearch().trim().toLowerCase();
    const groups = this.groupedPairs();
    if (!query) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        directions: group.directions.filter((dir) => this._matchesPairSearch(dir, query)),
      }))
      .filter((group) => group.directions.length > 0);
  });

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

  constructor() {
    // Ensure languages are loaded when the page opens (idempotent — also
    // retries if an earlier attempt failed while unauthenticated).
    void this.languageService.load();
    // Load language pairs from the backend
    void this.availablePairs.load();
    // Sync pair settings drafts for the course catalog settings tab
    this.pairManager.syncPairSettingsDrafts();
  }

  ngOnInit(): void {
    this.learningProficiencyDraft.set(this.preferences().learningProficiencyLevel);
  }

  /**
   * Commits all draft form values to the `UserStore` and persists to backend.
   *
   * @remarks
   * Updates both the display name and all preferences (theme, font size, color scheme,
   * card focus fullscreen, learning proficiency level) in a single call.
   * Also saves per-pair settings (romanization, IPA, tone colors, tracing) for all pairs.
   *
   * Split into two API calls:
   * - `PUT /users/me` — only `displayName` (backend `UserUpdateRequest` has no `preferences`)
   * - `PUT /users/me/preferences` — full preferences via dedicated endpoint
   */
  async saveProfile(): Promise<void> {
    // 1. User-level preferences (local + localStorage)
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });

    // 2a. Отправить displayName на бэкенд (PUT /users/me)
    try {
      await this.userApi.updateMe({
        displayName: this.nameDraft(),
      });
    } catch {
      this.snackBar.open('Не удалось сохранить имя', 'Закрыть', { duration: 5000 });
    }

    // 2b. Отправить ВСЕ preferences на бэкенд (PUT /users/me/preferences)
    try {
      const pairs = this.userStore.languagePairs();

      // Map fontSize ('sm' | 'md' | 'lg') → cardFontSize ('SMALL' | 'MEDIUM' | 'LARGE')
      const fontSizeMap: Record<string, GeneratedUserPreferences['cardFontSize']> = {
        sm: 'SMALL',
        md: 'MEDIUM',
        lg: 'LARGE',
      };

      // Map frontend answerModes ('orthography' | 'ipa') → backend enum ('ORTHOGRAPHY' | 'IPA' | 'AUDIO')
      const answerModeMap: Record<string, string> = {
        orthography: 'ORTHOGRAPHY',
        ipa: 'IPA',
        audio: 'AUDIO',
      };

      function toBackendSettings(
        settings: UserLanguagePairSettings | undefined,
      ): LanguagePairEntrySettings | undefined {
        if (!settings) return undefined;
        const phonetic = settings.phonetic;

        // Transform answerModes from lowercase frontend values to uppercase backend enum
        const transformedPhonetic = phonetic
          ? {
              ...phonetic,
              answerModes: (phonetic.answerModes ?? []).map(
                (m: string) => answerModeMap[m] ?? m.toUpperCase(),
              ),
            }
          : undefined;

        // Cast the rest — types differ slightly between frontend/backend
        return {
          ...transformedPhonetic,
          cjkLearning: settings.cjkLearning as unknown as LanguagePairEntrySettings['cjkLearning'],
          learning: settings.learning as unknown as LanguagePairEntrySettings['learning'],
        } as LanguagePairEntrySettings;
      }

      const payload: GeneratedUserPreferences = {
        theme: this.themeDraft(),
        cardFontSize: fontSizeMap[this.fontSizeDraft()] ?? 'MEDIUM',
        colorScheme: this.colorSchemeDraft(),
        cardFocusFullscreen: this.cardFocusFullscreenDraft(),
        learningProficiencyLevel: this.learningProficiencyDraft(),
        // Flatten frontend languagePairs → backend learningPairs
        learningPairs: pairs.map((p) => ({
          known: p.pair.known,
          learning: p.pair.learning,
          settings: toBackendSettings(p.settings),
        })),
        activeLanguagePairId: this.userStore.activeLanguagePairId(),
        activeByMirrorGroup: this.userStore.activeByMirrorGroup(),
      };

      await this.userPreferencesApi.save(payload);
      this.snackBar.open('Профиль сохранён', 'Закрыть', { duration: 3000 });
    } catch {
      this.snackBar.open('Не удалось сохранить профиль', 'Закрыть', { duration: 5000 });
    }
  }

  // ── Language settings helpers ───────────────────────────────────

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

  /** Opens the language dictionary management page (admin zone). */
  openLanguageAdmin(): void {
    void this.router.navigate(['/admin']);
  }

  private _matchesPairSearch(dir: { known: string; learning: string }, query: string): boolean {
    const fields = [
      dir.known,
      dir.learning,
      this.getLanguageLabel(dir.known),
      this.getLanguageLabel(dir.learning),
      this.languageService.findByCode(dir.known)?.nativeName ?? '',
      this.languageService.findByCode(dir.learning)?.nativeName ?? '',
    ];
    return fields.some((f) => f.toLowerCase().includes(query));
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
  async setActivePair(event: DirectionCardEvent): Promise<void> {
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

    // Find the mirror sibling in UserStore (by known/learning, not by backend ID).
    const mirrorSiblingInStore = this.userStore
      .languagePairs()
      .find((e) => e.pair.known === direction.learning && e.pair.learning === direction.known);

    // Remove mirror sibling from UserStore if it exists.
    if (mirrorSiblingInStore) {
      this.userStore['userState'].update((user) => {
        const nextPairs = user.preferences.languagePairs.filter(
          (e) => e.id !== mirrorSiblingInStore.id,
        );
        return {
          ...user,
          preferences: {
            ...user.preferences,
            languagePairs: nextPairs,
          },
        };
      });
      this.userStore['persist']();
    }

    // Ensure a UserStore entry exists for the exact direction — without
    // any activation side effects. Capture the returned ID to avoid a
    // redundant store lookup that could fail and send `null` to the backend.
    const entryId = this.userStore.addLanguagePair(direction, { activate: false });
    if (!entryId) {
      this.snackBar.open('Не удалось добавить пару', 'Закрыть', { duration: 3000 });
      return;
    }

    // Highlight within this mirror pair group only.
    this.userStore.setActivePairInGroup(groupKey, direction);

    // Sync the global active learning pair (header switcher, learning scope).
    this.userStore.setActiveLanguagePair(entryId);

    // Persist active pair to backend (users/preferences only).
    try {
      await this.userApi.patchUserPreferences({
        activeLanguagePairId: entryId,
        learningPairs: this.userStore
          .languagePairs()
          .map((p) => ({ known: p.pair.known, learning: p.pair.learning })),
      });
    } catch (error) {
      this.snackBar.open(`Не удалось сохранить пару: ${(error as Error).message}`, 'Закрыть', {
        duration: 5000,
      });
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
    // Show confirmation dialog
    const confirmed = await firstValueFrom(
      this.dialog
        .open(RemovePairDialogComponent, {
          data: event,
          width: '400px',
        })
        .afterClosed(),
    );
    if (!confirmed) {
      return;
    }

    try {
      // Resolve the card strictly by its full identity — no ambiguous lookups.
      const pair = this.configuredPairs().find((p) => p.id === event.pairId);
      if (!pair || pair.known !== event.known || pair.learning !== event.learning) {
        this.snackBar.open('Пара не найдена', 'Закрыть', { duration: 3000 });
        return;
      }

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

      // Persist updated pairs to backend (users/preferences only).
      await this.userApi.patchUserPreferences({
        learningPairs: this.userStore
          .languagePairs()
          .map((p) => ({ known: p.pair.known, learning: p.pair.learning })),
        activeLanguagePairId: this.userStore.activeLanguagePairId(),
      });

      this.snackBar.open('Пара удалена', 'Закрыть', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Не удалось удалить пару: ${(error as Error).message}`, 'Закрыть', {
        duration: 5000,
      });
    }
  }
}
