import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserStore } from '../../../core/state';

export const CARD_FOCUS_BODY_LOCK_CLASS = 'card-focus-shell-open';

/**
 * Card focus shell component. Provides fullscreen mode for card practice,
 * detaching the host element from its parent and appending to body.
 * @remarks Supports keyboard (Escape) exit, auto-enter on learning tab, and
 * preference persistence via `UserStore`.
 */
@Component({
  selector: 'app-card-focus-shell',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './card-focus-shell.component.html',
  styleUrl: './card-focus-shell.component.scss',
})
export class CardFocusShellComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly userStore = inject(UserStore);

  /** Show fullscreen toggle button. */
  readonly focusControlsEnabled = input(true);

  /** Auto-enter fullscreen on the Learning tab if enabled in user profile. */
  readonly autoEnterFullscreen = input(false);

  /** Whether the shell is currently in fullscreen mode. */
  readonly fullscreen = signal(false);

  private autoEnterWasActive = false;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;

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
      this.restoreShellParent();
      document.body.classList.remove(CARD_FOCUS_BODY_LOCK_CLASS);
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
    this.attachShellToBody();
    document.body.classList.add(CARD_FOCUS_BODY_LOCK_CLASS);

    if (persistPreference) {
      this.userStore.updatePreferences({ cardFocusFullscreen: true });
    }
  }

  private exitFullscreen(persistPreference: boolean): void {
    if (!this.fullscreen()) {
      return;
    }

    this.fullscreen.set(false);
    this.restoreShellParent();
    document.body.classList.remove(CARD_FOCUS_BODY_LOCK_CLASS);

    if (persistPreference) {
      this.userStore.updatePreferences({ cardFocusFullscreen: false });
    }
  }

  private attachShellToBody(): void {
    const host = this.elementRef.nativeElement;
    const parent = host.parentElement;

    if (!parent || parent === document.body) {
      return;
    }

    this.originalParent = parent;
    this.originalNextSibling = host.nextSibling;
    document.body.appendChild(host);
  }

  private restoreShellParent(): void {
    const host = this.elementRef.nativeElement;
    const parent = this.originalParent;

    if (!parent || host.parentElement !== document.body) {
      return;
    }

    parent.insertBefore(host, this.originalNextSibling);
    this.originalParent = null;
    this.originalNextSibling = null;
  }
}
