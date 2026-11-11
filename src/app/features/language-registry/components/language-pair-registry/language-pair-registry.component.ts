import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LanguagePairsApiService } from '../../../../entities/language-pair/api/language-pairs-api.service';
import type { LanguagePairDto } from '../../../../entities/language-pair/api/language-pairs-api.types';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import { buildMirrorGroupKey } from '../../../../entities/language-pair/utils/language-pair.utils';

/** A registry pair direction normalized for display. */
type RegistryPair = {
  id: number;
  knownCode: string;
  learningCode: string;
};

/** Mirror-grouped registry pairs (e.g. EN↔RU) for display. */
type RegistryPairGroup = {
  key: string;
  pairs: RegistryPair[];
};

/**
 * Registry CRUD for `language_pairs` (author zone, `/tools/language-pairs`).
 *
 * @remarks
 * This is the SINGLE place where the global backend registry
 * (`/language-pairs`) is mutated. The learner profile (`/user`) never writes
 * to the registry — it only consumes it read-only and manages the user's own
 * pairs via `users/preferences`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pair-registry',
  imports: [
    UpperCasePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './language-pair-registry.component.html',
  styleUrl: './language-pair-registry.component.scss',
})
export class LanguagePairRegistryComponent {
  private readonly pairsApi = inject(LanguagePairsApiService);
  private readonly languageService = inject(LanguageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Registry pairs loaded from the backend. */
  readonly pairs = signal<LanguagePairDto[]>([]);
  /** Whether registry pairs are loading. */
  readonly loading = signal(true);
  /** Guard against double-submit on the create form. */
  readonly creating = signal(false);

  /** All languages for the create form. */
  readonly languages = () => this.languageService.languages();
  /** Whether languages are loading. */
  readonly languagesLoading = () => this.languageService.loading();

  /** Create-form drafts. */
  readonly newKnownCode = signal('');
  readonly newLearningCode = signal('');

  /** Registry pairs grouped by mirror languages. */
  readonly groupedPairs = computed<RegistryPairGroup[]>(() => {
    const groups = new Map<string, RegistryPair[]>();
    for (const p of this.pairs()) {
      const key = buildMirrorGroupKey(p.knownCode, p.learningCode);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({
        id: p.id,
        knownCode: p.knownCode,
        learningCode: p.learningCode,
      });
    }
    return Array.from(groups.entries()).map(([key, pairs]) => ({ key, pairs }));
  });

  constructor() {
    void this.languageService.load();
    void this.reload();
  }

  /** Returns the display label for a language code. */
  getLanguageLabel(code: string): string {
    return this.languageService.findByCode(code)?.displayName ?? code;
  }

  /** Creates a registry pair from the form drafts. */
  async createPair(): Promise<void> {
    const knownCode = this.newKnownCode();
    const learningCode = this.newLearningCode();
    if (!knownCode || !learningCode || knownCode === learningCode || this.creating()) {
      return;
    }

    const duplicate = this.pairs().some(
      (p) => p.knownCode === knownCode && p.learningCode === learningCode,
    );
    if (duplicate) {
      this.snackBar.open('Такая пара уже есть в реестре', 'Закрыть', { duration: 3000 });
      return;
    }

    this.creating.set(true);
    try {
      await this.pairsApi.create({ knownCode, learningCode });
      this.newKnownCode.set('');
      this.newLearningCode.set('');
      await this.reload();
      this.snackBar.open('Пара добавлена в реестр', 'Закрыть', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Не удалось создать пару: ${(error as Error).message}`, 'Закрыть', {
        duration: 5000,
      });
    } finally {
      this.creating.set(false);
    }
  }

  /** Deletes a registry pair by ID. */
  async deletePair(pair: RegistryPair): Promise<void> {
    const label = `${this.getLanguageLabel(pair.knownCode)} → ${this.getLanguageLabel(pair.learningCode)}`;
    if (!confirm(`Удалить пару «${label}» из реестра? Пользователи больше не смогут её выбрать.`)) {
      return;
    }

    try {
      await this.pairsApi.delete(pair.id);
      await this.reload();
      this.snackBar.open('Пара удалена из реестра', 'Закрыть', { duration: 3000 });
    } catch (error) {
      this.snackBar.open(`Не удалось удалить пару: ${(error as Error).message}`, 'Закрыть', {
        duration: 5000,
      });
    }
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.pairs.set(await this.pairsApi.listAll());
    } catch {
      this.pairs.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }
}
