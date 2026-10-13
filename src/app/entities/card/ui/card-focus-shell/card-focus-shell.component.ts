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

import { UserStore } from '../../../user/model/user.store';

export const CARD_FOCUS_BODY_LOCK_CLASS = 'card-focus-shell-open';

/**
 * Card focus shell component. Provides fullscreen mode for card practice,
 * detaching the host element from its parent and appending after the dialog overlay.
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

  /**
   * Show fullscreen toggle button.
   * @remarks When false, hides the fullscreen control UI while preserving state.
   */
  readonly focusControlsEnabled = input(true);

  /**
   * Auto-enter fullscreen on the Learning tab if enabled in user profile.
   * @remarks
   * When true and the user is on the Learning tab, automatically enters
   * fullscreen mode if the user has `cardFocusFullscreen` preference enabled.
   */
  readonly autoEnterFullscreen = input(false);

  /**
   * CSS class of the parent dialog/overlay to portal the shell next to.
   * @remarks
   * When set (e.g. `'card-try-dialog'`), the shell is inserted as a sibling
   * right after the matching element so it shares the dialog's stacking context.
   * When `null` or `undefined`, the shell is appended to `<body>`.
   */
  readonly portalTarget = input<string | null>(null);

  /**
   * Whether the shell is currently in fullscreen mode.
   * @remarks
   * When true, the host element is detached from its parent and placed next to
   * the target dialog element (or `<body>` when no target is specified).
   */
  readonly fullscreen = signal(false);

  private autoEnterWasActive = false;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;
  private portalSibling: Node | null = null;

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

  /**
   * Exits fullscreen mode when Escape is pressed.
   * @remarks Triggered by the `@HostListener` on `document:keydown.escape`.
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullscreen()) {
      this.exitFullscreen(true);
    }
  }

  /**
   * Toggles fullscreen mode.
   * @remarks
   * Enters fullscreen if not already active, exits otherwise.
   * Persists the preference to the user store.
   */
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
    this.attachShellToPortal();
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

  private attachShellToPortal(): void {
    const host = this.elementRef.nativeElement;
    const parent = host.parentElement;

    if (!parent || parent === document.body) {
      return;
    }

    this.originalParent = parent;
    this.originalNextSibling = host.nextSibling;

    const targetClass = this.portalTarget();
    if (targetClass) {
      const target = this.findPortalTarget(targetClass);
      if (target) {
        target.after(host);
        this.portalSibling = target;
        return;
      }
    }

    document.body.appendChild(host);
    this.portalSibling = null;
  }

  private restoreShellParent(): void {
    const host = this.elementRef.nativeElement;
    const parent = this.originalParent;

    if (!parent) {
      return;
    }

    // If portaled, restore to original parent/sibling
    if (host.parentElement !== parent) {
      if (this.portalSibling) {
        this.portalSibling.parentNode?.removeChild(this.portalSibling);
      } else if (host.parentElement === document.body) {
        document.body.removeChild(host);
      }
    }

    parent.insertBefore(host, this.originalNextSibling);
    this.originalParent = null;
    this.originalNextSibling = null;
    this.portalSibling = null;
  }

  /**
   * Finds the dialog/overlay element matching the given panel class.
   * Searches up from the host element through the DOM tree.
   */
  private findPortalTarget(className: string): HTMLElement | null {
    const host = this.elementRef.nativeElement;
    let current: Node | null = host.parentElement;

    while (current) {
      if (current instanceof HTMLElement && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }
}
