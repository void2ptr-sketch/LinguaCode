import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { UserStore } from '../../../core/state';
import { UserLanguagePairEntry } from '../../../core/models';

@Component({
  selector: 'app-active-language-pair-switcher',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './active-language-pair-switcher.component.html',
  styleUrl: './active-language-pair-switcher.component.scss',
})
export class ActiveLanguagePairSwitcherComponent {
  private readonly userStore = inject(UserStore);

  /** Компактный вид для header. */
  readonly compact = input(false);

  readonly languagePairs = this.userStore.languagePairs;
  readonly activeLanguagePairId = this.userStore.activeLanguagePairId;

  entryLabel(entry: UserLanguagePairEntry): string {
    return this.userStore.formatEntryLabel(entry);
  }

  onActiveChange(id: string): void {
    this.userStore.setActiveLanguagePair(id);
  }
}
