import { Component, DestroyRef, effect, HostListener, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserStore } from '../../../core/state';

const BODY_LOCK_CLASS = 'card-focus-shell-open';

@Component({
  selector: 'app-card-focus-shell',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './card-focus-shell.component.html',
  styleUrl: './card-focus-shell.component.scss',
})
export class CardFocusShellComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly userStore = inject(UserStore);

  /** Показывать кнопку полноэкранного режима (для preview без chrome — false). */
  readonly focusControlsEnabled = input(true);

  /** Авто-вход в fullscreen на вкладке «Обучение», если включено в профиле. */
  readonly autoEnterFullscreen = input(false);

  readonly fullscreen = signal(false);

  private autoEnterWasActive = false;

  constructor() {
    effect(() => {
      const autoEnter = this.autoEnterFullscreen();
      const preferFullscreen = this.userStore.preferences().cardFocusFullscreen;

      if (autoEnter && preferFullscreen && !this.fullscreen()) {
        this.enterFullscreen(false);
      } else if (this.autoEnterWasActive && !autoEnter && this.fullscreen()) {
        // Уход с вкладки «Обучение» — закрыть overlay, не меняя сохранённое предпочтение.
        this.exitFullscreen(false);
      }

      this.autoEnterWasActive = autoEnter;
    });

    this.destroyRef.onDestroy(() => {
      document.body.classList.remove(BODY_LOCK_CLASS);
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullscreen()) {
      this.exitFullscreen(true);
    }
  }

  toggleFullscreen(): void {
    if (this.fullscreen()) {
      this.exitFullscreen(true);
      return;
    }

    this.enterFullscreen(true);
  }

  private enterFullscreen(persistPreference: boolean): void {
    if (this.fullscreen()) {
      return;
    }

    this.fullscreen.set(true);
    document.body.classList.add(BODY_LOCK_CLASS);

    if (persistPreference) {
      this.userStore.updatePreferences({ cardFocusFullscreen: true });
    }
  }

  private exitFullscreen(persistPreference: boolean): void {
    if (!this.fullscreen()) {
      return;
    }

    this.fullscreen.set(false);
    document.body.classList.remove(BODY_LOCK_CLASS);

    if (persistPreference) {
      this.userStore.updatePreferences({ cardFocusFullscreen: false });
    }
  }
}
