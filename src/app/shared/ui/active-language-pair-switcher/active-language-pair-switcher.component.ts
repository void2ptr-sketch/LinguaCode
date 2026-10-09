import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { UserStore } from '../../../core/state';
import { UserLanguagePairEntry } from '../../../core/models';

/**
 * Active language pair switcher component. Provides a dropdown to select the active
 * language pair from the user's configured pairs.
 * @remarks Used in the header and various feature pages for language pair switching.
 */
@Component({
  selector: 'app-active-language-pair-switcher',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './active-language-pair-switcher.component.html',
  styleUrl: './active-language-pair-switcher.component.scss',
})
export class ActiveLanguagePairSwitcherComponent {
  private readonly userStore = inject(UserStore);

  /** Render in compact mode for the header. */
  readonly compact = input(false);

  /** Available language pairs from the user store. */
  readonly languagePairs = this.userStore.languagePairs;
  /** Active language pair ID from the user store. */
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  onActiveChange(id: string): void {
    this.userStore.setActiveLanguagePair(id);
  }
}
