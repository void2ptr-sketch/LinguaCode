import { Injectable, effect, inject } from '@angular/core';

import { UserStore } from '../../../entities/user/model/user.store';
import { DraftsStore } from '../services/drafts-store';
import {
  resolveCjkLearningForPair,
  resolvePhoneticForPair,
} from '../../../entities/user/lib/user-language-pair.utils';
import { shouldShowPalladius } from '../../../entities/phonetic/lib/phonetic-preferences.utils';
import { ROMANIZATION_DISPLAY_ORDER } from '../../../entities/phonetic/model';
import type { UserLanguagePairEntry, UserLanguagePairSettings } from '../../../entities/user/model';
import type { CjkLearningPreferences } from '../../../entities/phonetic/model';
import type { RomanizationOption } from '../../../entities/course/ui/course-display-settings-matrix';

/**
 * Сервис управления языковыми парами для course-catalog.
 *
 * Обрабатывает мутации пар (setActive, remove, add) и синхронизацию
 * настроек пары с черновиками в DraftsStore.
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogLanguagePairManagerService {
  private readonly userStore = inject(UserStore);
  private readonly drafts = inject(DraftsStore);

  /**
   * Эффект: перезагружает каталог при смене активной языковой пары.
   *
   * @param onLoadCallback — колбэк для перезагрузки каталога.
   */
  trackActivePairChange(onLoadCallback: () => Promise<void>): void {
    let lastKnownId: string | null = null;

    effect(() => {
      const activeId = this.userStore.activeLanguagePairId();

      if (lastKnownId !== null && lastKnownId !== activeId) {
        void onLoadCallback();
      }

      lastKnownId = activeId;
    });
  }

  /**
   * Устанавливает активную языковую пару и синхронизирует настройки.
   *
   * @param id — ID пары для активации.
   */
  setActive(id: string): void {
    this.userStore.setActiveLanguagePair(id);
    this.drafts.setSettingsPairIdDraft(id);
    this.syncPairSettingsDrafts();
  }

  /**
   * Удаляет языковую пару и синхронизирует настройки.
   *
   * @param id — ID пары для удаления.
   */
  removePair(id: string): void {
    const wasSettingsTarget = this.drafts.settingsPairIdDraft() === id;
    this.userStore.removeLanguagePair(id);

    if (wasSettingsTarget) {
      this.drafts.setSettingsPairIdDraft(this.userStore.activeLanguagePairId());
    }

    this.syncPairSettingsDrafts();
  }

  /**
   * Добавляет новую языковую пару из черновиков.
   *
   * @returns `true` если пара добавлена, `false` если known == learning.
   */
  addPair(): boolean {
    const known = this.drafts.courseTabKnownLanguageDraft();
    const learning = this.drafts.courseTabLearningLanguageDraft();

    if (known === learning) {
      return false;
    }

    this.userStore.addLanguagePair({ known, learning });
    this.drafts.setSettingsPairIdDraft(this.userStore.activeLanguagePairId());
    this.syncPairSettingsDrafts();
    return true;
  }

  /**
   * Сохраняет настройки языковой пары из черновиков.
   *
   * @param entry — языковая пара для сохранения настроек.
   */
  savePairSettings(entry: UserLanguagePairEntry): void {
    const patch: Partial<UserLanguagePairSettings> = {};

    if (this.shouldShowCjkPreferences(entry.pair)) {
      const cjkPatch: Partial<CjkLearningPreferences> = {};

      cjkPatch.displayRomanizations = [...this.drafts.settingsDisplayRomanizationsDraft()];
      cjkPatch.answerRomanization = [...this.drafts.settingsAnswerRomanizationsDraft()];
      cjkPatch.showTones = this.drafts.settingsToneColorEnabledDraft();
      cjkPatch.toneColorScheme = this.drafts.settingsToneColorSchemeDraft();

      if (this.shouldShowTracingSettings(entry.pair)) {
        cjkPatch.tracingStrokeDurationSec = this.drafts.settingsTracingStrokeDurationDraft();
      }

      patch.cjkLearning = cjkPatch as CjkLearningPreferences;
    }

    if (this.shouldShowPhoneticPreferences(entry.pair)) {
      const phonetic = resolvePhoneticForPair(entry);
      patch.phonetic = {
        showIpa: this.drafts.settingsShowIpaDraft(),
        ipaVariantLabel: this.drafts.settingsIpaVariantLabelDraft().trim() || undefined,
        answerModes: [...this.drafts.settingsAnswerModesDraft()],
        displayOrthography: phonetic.displayOrthography,
      };
    }

    if (patch.cjkLearning || patch.phonetic) {
      this.userStore.updateLanguagePairSettings(entry.id, patch);
      this.syncPairSettingsDrafts();
    }
  }

  /**
   * Синхронизирует настройки языковой пары с черновиками.
   */
  syncPairSettingsDrafts(): void {
    const entry = this.settingsEntry();
    const cjk = resolveCjkLearningForPair(entry);
    const phonetic = resolvePhoneticForPair(entry);

    this.drafts.setSettingsDisplayRomanizationsDraft([...cjk.displayRomanizations]);
    this.drafts.setSettingsAnswerRomanizationsDraft([...cjk.answerRomanization]);
    this.drafts.setSettingsToneColorEnabledDraft(cjk.showTones);
    this.drafts.setSettingsToneColorSchemeDraft(cjk.toneColorScheme);
    this.drafts.setSettingsTracingStrokeDurationDraft(cjk.tracingStrokeDurationSec);
    this.drafts.setSettingsShowIpaDraft(phonetic.showIpa);
    this.drafts.setSettingsIpaVariantLabelDraft(phonetic.ipaVariantLabel ?? '');
    this.drafts.setSettingsAnswerModesDraft([...phonetic.answerModes]);
  }

  // ===== Computed helpers =====

  /**
   * Текущая языковая пара для настроек.
   */
  settingsEntry(): UserLanguagePairEntry | null {
    const id = this.drafts.settingsPairIdDraft();
    const pairs = this.userStore.languagePairs();
    return pairs.find((entry) => entry.id === id) ?? pairs[0] ?? null;
  }

  /**
   * Нужно ли показывать CJK-настройки.
   */
  shouldShowCjkPreferences(pair: { known: string; learning: string }): boolean {
    return shouldShowPalladius(pair.known, pair.learning);
  }

  /**
   * Нужно ли показывать фонетические настройки.
   */
  shouldShowPhoneticPreferences(pair: { known: string; learning: string }): boolean {
    return pair.learning === 'en' || pair.learning === 'zh';
  }

  /**
   * Нужно ли показывать настройки длительности tracing.
   */
  shouldShowTracingSettings(pair: { known: string; learning: string }): boolean {
    return pair.learning === 'zh';
  }

  /**
   * Доступные опции романизации.
   */
  romanizationOptions(): readonly RomanizationOption[] {
    const options: RomanizationOption[] = [
      { value: 'pinyin', label: 'Пиньинь' },
      { value: 'zhuyin', label: 'Жуинь (Bopomofo)' },
    ];

    if (this.shouldShowCjkPreferencesForActive()) {
      options.push({ value: 'palladius', label: 'Палладица' });
    }

    return ROMANIZATION_DISPLAY_ORDER.flatMap((system) => {
      const option = options.find((item) => item.value === system);
      return option ? [option] : [];
    });
  }

  /**
   * Нужно ли показывать CJK для активной пары.
   */
  private shouldShowCjkPreferencesForActive(): boolean {
    const entry = this.settingsEntry();
    return entry ? shouldShowPalladius(entry.pair.known, entry.pair.learning) : false;
  }
}
