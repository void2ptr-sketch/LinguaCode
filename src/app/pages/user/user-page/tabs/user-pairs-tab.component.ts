import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DIRECTION_CARD_HELPERS } from '../../../../entities/language-pair/ui/direction-card.component';
import { DirectionCardInnerComponent } from '../../../../entities/language-pair/ui/direction-card-inner.component';
import { RemovePairDialogComponent } from '../../../../entities/language-pair/ui/remove-pair-dialog.component';
import { LanguageSettingsStore } from '../../../../entities/language-pair/store/language-settings.store';
import {
  UserLanguagePairManagerService,
  type SetActivePairResult,
} from '../../../../entities/language-pair/services/user-language-pair-manager.service';
import {
  getLanguageBadgeColor,
  getLanguageBadgeCode,
  getLanguageBadgeTextColor,
} from '../../../../entities/language-pair/utils/language-badge.utils';
import { getLanguageFlagEmoji } from '../../../../entities/language-pair/utils/language-flag.utils';
import type { DirectionCardEvent } from '../../../../entities/language-pair/ui/direction-card.component';

/**
 * Tab «Мои пары»: activate / remove the user's own pairs.
 *
 * @remarks
 * New pairs are added from the user's selected languages; the registry
 * (`/language-pairs`) CRUD lives in `/tools/language-pairs` (author zone).
 * Pair mutations are delegated to `UserLanguagePairManagerService`; this
 * component only handles UI concerns — the confirmation dialog and snackbar
 * messages.
 */
@Component({
  selector: 'app-user-pairs-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    UpperCasePipe,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    DirectionCardInnerComponent,
  ],
  providers: [
    {
      provide: DIRECTION_CARD_HELPERS,
      useFactory: (comp: UserPairsTabComponent) => ({
        getLanguageLabel: (code: string) => comp.getLanguageLabel(code),
        getFlagEmoji: (code: string) => comp.getFlagEmoji(code),
        getBadgeColor: (code: string) => comp.getBadgeColor(code),
        getBadgeTextColor: (code: string) => comp.getBadgeTextColor(code),
        getBadgeCode: (code: string) => comp.getBadgeCode(code),
      }),
      deps: [UserPairsTabComponent],
    },
  ],
  styleUrl: '../user-page.component.scss',
  templateUrl: './user-pairs-tab.component.html',
})
export class UserPairsTabComponent {
  private readonly pairManager = inject(UserLanguagePairManagerService);
  private readonly settingsStore = inject(LanguageSettingsStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Shared view state for the pair catalog (grouping, search, labels). */
  protected readonly helpers = this.pairManager;
  /** Selected language codes — pairs require at least two. */
  protected readonly selectedCodes = this.settingsStore.selectedCodes;

  /** Returns the display label for a language code (delegates to the manager). */
  getLanguageLabel(code: string): string {
    return this.pairManager.getLanguageLabel(code);
  }

  /** Returns a flag emoji for a language code, or empty string if none. */
  getFlagEmoji(code: string): string {
    return getLanguageFlagEmoji(code);
  }

  /** Deterministic background color for a language code badge. */
  getBadgeColor(code: string): string {
    return getLanguageBadgeColor(code);
  }

  /** Deterministic text color for a language code badge. */
  getBadgeTextColor(code: string): string {
    return getLanguageBadgeTextColor(code);
  }

  /** First two letters for the CSS badge fallback. */
  getBadgeCode(code: string): string {
    return getLanguageBadgeCode(code);
  }

  /**
   * Activates a single direction card via the manager and reports failures.
   */
  protected async setActivePair(event: DirectionCardEvent): Promise<void> {
    const result: SetActivePairResult = await this.pairManager.setActivePair(event);
    if (!result.ok) {
      this.snackBar.open(result.reason, 'Закрыть', { duration: 5000 });
    }
  }

  /**
   * Removes a configured pair after a confirmation dialog.
   */
  protected async removePair(event: DirectionCardEvent): Promise<void> {
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

    const result = await this.pairManager.removePair(event);
    if (result.ok) {
      this.snackBar.open('Пара удалена', 'Закрыть', { duration: 3000 });
    } else {
      this.snackBar.open(`Не удалось удалить пару: ${result.reason}`, 'Закрыть', {
        duration: 5000,
      });
    }
  }
}
