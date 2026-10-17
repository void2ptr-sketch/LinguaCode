import {
  ChangeDetectionStrategy,
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
 * Card focus shell component. Provides fullscreen mode for card practice.
 *
 * @remarks
 * The host element stays in its original place; fullscreen is achieved with
 * `position: fixed` + a high z-index. The host is only detached and appended to
 * `<body>` when an ancestor creates a containing block for fixed positioning
 * (e.g. a transformed dialog container), which would otherwise break the
 * fullscreen overlay. Supports keyboard (Escape) exit and auto-enter on the
 * learning tab.
 *
 * The `cardFocusFullscreen` profile preference is the single source of truth:
 * the toggle button and Escape only affect the current session and never
 * overwrite the profile setting. Exiting fullscreen is temporary — reopening
 * the scenario (a new shell instance) restores the profile mode.
 */
@Component({
  selector: 'app-card-focus-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
   * A manual exit (Escape/toggle) suppresses re-entry for this shell instance
   * only; a new instance (reopened scenario) applies the profile setting again.
   */
  readonly autoEnterFullscreen = input(false);

  /**
   * Whether the shell is currently in fullscreen mode.
   * @remarks
   * When true, the shell covers the viewport via `position: fixed`. The host is
   * moved to `<body>` only when a transformed ancestor would break fixed
   * positioning.
   */
  readonly fullscreen = signal(false);

  private autoEnterWasActive = false;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: Node | null = null;
  private manualExit = false;

  constructor() {
    effect(() => {
      const autoEnter = this.autoEnterFullscreen();
      const preferFullscreen = this.userStore.preferences().cardFocusFullscreen;

      if (autoEnter && preferFullscreen && !this.fullscreen() && !this.manualExit) {
        this.enterFullscreen();
      } else if (this.autoEnterWasActive && !autoEnter && this.fullscreen()) {
        // Уход с вкладки «Обучение» — закрыть overlay, не меняя сохранённое предпочтение.
        // Возврат на вкладку снова применит режим из профиля (manualExit не выставляется).
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
   * The exit is temporary: the profile preference is not changed, and the
   * auto-enter is suppressed for this shell instance only.
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullscreen()) {
      this.exitFullscreen(true);
    }
  }

  /**
   * Toggles fullscreen mode for the current session.
   * @remarks
   * Enters fullscreen if not already active, exits otherwise. The profile
   * preference is never changed here — the toggle only affects the current
   * session, so reopening the scenario restores the profile mode.
   */
  toggleFullscreen(): void {
    if (this.fullscreen()) {
      this.exitFullscreen(true);
      return;
    }

    this.enterFullscreen();
  }

  private enterFullscreen(): void {
    if (this.fullscreen()) {
      return;
    }

    this.manualExit = false;
    this.fullscreen.set(true);
    this.attachShellToBody();
    document.body.classList.add(CARD_FOCUS_BODY_LOCK_CLASS);
  }

  private exitFullscreen(markManualExit: boolean): void {
    if (!this.fullscreen()) {
      return;
    }

    if (markManualExit) {
      this.manualExit = true;
    }

    this.fullscreen.set(false);
    this.restoreShellParent();
    document.body.classList.remove(CARD_FOCUS_BODY_LOCK_CLASS);
  }

  /**
   * Detaches the host and appends it to `<body>` only when an ancestor creates
   * a containing block for fixed positioning (transform, filter, perspective,
   * will-change, contain). Otherwise the host stays in place and the fullscreen
   * layer is rendered with `position: fixed`, keeping dialogs and their chrome
   * intact below it.
   */
  private attachShellToBody(): void {
    const host = this.elementRef.nativeElement;
    const parent = host.parentElement;

    if (!parent || parent === document.body) {
      return;
    }

    if (!this.hasFixedPositionContainingAncestor(host)) {
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

  private hasFixedPositionContainingAncestor(host: HTMLElement): boolean {
    let node: HTMLElement | null = host.parentElement;

    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        style.willChange.includes('transform') ||
        style.contain.includes('paint') ||
        style.contain.includes('layout')
      ) {
        return true;
      }
      node = node.parentElement;
    }

    return false;
  }
}
