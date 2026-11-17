import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LanguageApiService } from '../../../../entities/language-pair/api/language-api.service';
import type { LanguageCreatePayload } from '../../../../entities/language-pair/api/language-api.service';
import type { LanguageDto } from '../../../../entities/language-pair/api/language-dto.types';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';

/**
 * Registry CRUD for `languages` (admin zone, `/admin`).
 *
 * @remarks
 * The global language dictionary (`/languages`) is maintained here only.
 * The learner profile (`/user`) consumes it read-only — "Мои языки" checkboxes
 * write to the user's own preferences, never to this dictionary.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-language-registry',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './language-dictionary.component.html',
  styleUrl: './language-dictionary.component.scss',
})
export class LanguageDictionaryComponent {
  private readonly languageApi = inject(LanguageApiService);
  private readonly languageService = inject(LanguageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Whether languages are loading. */
  readonly loading = () => this.languageService.loading();

  /** Whether the create form is open. */
  readonly creating = signal(false);

  constructor() {
    void this.languageService.load();
  }

  /** All languages from the dictionary. */
  languages(): LanguageDto[] {
    return this.languageService.languages();
  }

  /** Toggles `activeFlag` for a language (optimistic update with rollback). */
  toggleActiveLanguage(lang: LanguageDto): void {
    const previousFlag = lang.activeFlag;

    // Optimistic UI update — flip the switch immediately.
    lang.activeFlag = !previousFlag;
    this.cdr.markForCheck();

    this.languageApi
      .update(lang.id, { activeFlag: lang.activeFlag })
      .then((updated) => {
        this.snackBar.open(
          `Язык «${updated.displayName}» ${updated.activeFlag ? 'активирован' : 'деактивирован'}`,
          'Закрыть',
          { duration: 3000 },
        );
        // Reload in background for full consistency.
        void this.languageService.load();
      })
      .catch((error: unknown) => {
        // Rollback optimistic update on failure.
        lang.activeFlag = previousFlag;
        this.cdr.markForCheck();

        const httpError = error as { status?: number; message?: string };
        const message =
          httpError.status === 403
            ? 'Сессия истекла или доступ запрещён. Обновите страницу и повторите.'
            : `Не удалось обновить язык: ${httpError.message ?? 'Unknown error'}`;
        this.snackBar.open(message, 'Закрыть', { duration: 5000 });
      });
  }

  /** Creates a new language in the dictionary via a prompt-based form. */
  createLanguage(): void {
    const code = prompt('Код языка (например, "de" для немецкого):');
    if (!code) return;

    const displayName = prompt('Название (например, "German"):');
    if (!displayName) return;

    const nativeName = prompt('Название на языке (например, "Deutsch"):');
    if (!nativeName) return;

    const writingDir = prompt('Направление письма (ltr/rtl):') || 'ltr';
    const supportsTones = confirm('Поддерживает тоны? (OK = да, Cancel = нет)');
    const supportsPinyin = confirm('Поддерживает пиньинь? (OK = да, Cancel = нет)');
    const fontFamily = prompt('Семейство шрифтов (например, "Noto Sans"):') || 'Noto Sans';
    const activeFlag = confirm('Активен? (OK = да, Cancel = нет)');

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

    this.creating.set(true);
    this.languageApi
      .create(payload)
      .then((lang) => {
        this.snackBar.open(`Язык «${lang.displayName}» создан`, 'Закрыть', { duration: 3000 });
        return this.languageService.load();
      })
      .catch((error) => {
        this.snackBar.open(`Не удалось создать язык: ${(error as Error).message}`, 'Закрыть', {
          duration: 5000,
        });
      })
      .finally(() => {
        this.creating.set(false);
        this.cdr.markForCheck();
      });
  }

  /** Deletes a language from the dictionary. */
  async deleteLanguage(lang: LanguageDto): Promise<void> {
    if (
      !confirm(
        `Удалить язык «${lang.displayName}» из справочника? Пары с этим языком потеряют смысл.`,
      )
    ) {
      return;
    }

    try {
      await this.languageApi.delete(lang.id);
      await this.languageService.load();
      this.snackBar.open(`Язык «${lang.displayName}» удалён`, 'Закрыть', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Не удалось удалить язык: ${(error as Error).message}`, 'Закрыть', {
        duration: 5000,
      });
    }
  }
}
