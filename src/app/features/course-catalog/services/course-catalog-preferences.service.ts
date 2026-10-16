import { Injectable, computed, inject } from '@angular/core';

import { UserStore } from '../../../entities/user/model/user.store';
import { DraftsStore } from '../services/drafts-store';
import { CourseCatalogLanguagePairManagerService } from './course-catalog-language-pair-manager.service';

/**
 * Сервис вычисляемых значений для course-catalog.
 *
 * Содержит computed-сигналы, зависящие от языковых пар и настроек.
 * Не выполняет мутаций — только чтение.
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogPreferencesService {
  private readonly userStore = inject(UserStore);
  private readonly drafts = inject(DraftsStore);
  private readonly pairManager = inject(CourseCatalogLanguagePairManagerService);

  /**
   * Можно ли удалять языковые пары (длина > 1).
   */
  readonly canRemovePair = computed(() => this.userStore.languagePairs().length > 1);

  /**
   * Языковая пара для настроек.
   */
  readonly settingsEntry = computed(() => {
    const id = this.drafts.settingsPairIdDraft();
    const pairs = this.userStore.languagePairs();
    return pairs.find((entry) => entry.id === id) ?? pairs[0] ?? null;
  });

  /**
   * Метка для настроечной пары (known → learning).
   */
  readonly settingsCourseLabel = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.userStore.formatEntryLabel(entry) : '';
  });

  /**
   * Нужно ли показывать CJK-настройки.
   */
  readonly showCjkPreferences = computed(() => {
    const entry = this.settingsEntry();
    return entry ? this.pairManager.shouldShowCjkPreferences(entry.pair) : false;
  });

  /**
   * Нужно ли показывать фонетические настройки.
   */
  readonly showPhoneticPreferences = computed(() => {
    const entry = this.settingsEntry();
    if (!entry) return false;
    return entry.pair.learning === 'en' || entry.pair.learning === 'zh';
  });

  /**
   * Нужно ли показывать настройки длительности tracing.
   */
  readonly showTracingSettings = computed(() => {
    const entry = this.settingsEntry();
    return entry ? entry.pair.learning === 'zh' : false;
  });

  /**
   * Доступные опции романизации.
   */
  readonly romanizationOptions = computed(() => this.pairManager.romanizationOptions());
}
