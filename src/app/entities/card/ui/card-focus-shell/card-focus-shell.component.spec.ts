import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UserPersistence } from '../../../user/model/user.persistence';
import { UserStore } from '../../../user/model/user.store';
import { CardFocusShellComponent } from './card-focus-shell.component';

describe('CardFocusShellComponent', () => {
  let fixture: ComponentFixture<CardFocusShellComponent>;
  let userStore: UserStore;

  beforeEach(async () => {
    localStorage.clear();
    document.body.classList.remove('card-focus-shell-open');

    await TestBed.configureTestingModule({
      imports: [CardFocusShellComponent],
      providers: [provideNoopAnimations(), UserStore, UserPersistence],
    }).compileComponents();

    userStore = TestBed.inject(UserStore);
    fixture = TestBed.createComponent(CardFocusShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.classList.remove('card-focus-shell-open');
    localStorage.clear();
  });

  it('should toggle fullscreen and lock body scroll', () => {
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;
    const initialParent = host.parentElement;
    expect(component.fullscreen()).toBe(false);

    component.toggleFullscreen();
    expect(component.fullscreen()).toBe(true);
    // Without a transformed ancestor the host stays in place; the fullscreen
    // layer is rendered with `position: fixed` + high z-index.
    expect(host.parentElement).toBe(initialParent);
    expect(document.body.classList.contains('card-focus-shell-open')).toBe(true);
    // The toggle only affects the current session and never overwrites the
    // profile preference.
    expect(userStore.preferences().cardFocusFullscreen).toBe(false);

    component.toggleFullscreen();
    expect(component.fullscreen()).toBe(false);
    expect(host.parentElement).toBe(initialParent);
    expect(document.body.classList.contains('card-focus-shell-open')).toBe(false);
    expect(userStore.preferences().cardFocusFullscreen).toBe(false);
  });

  it('should detach host to body when a transformed ancestor breaks fixed positioning', () => {
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    // Simulate a dialog-like transformed ancestor.
    const wrapper = document.createElement('div');
    wrapper.style.transform = 'translateX(0)';
    wrapper.appendChild(host);
    document.body.appendChild(wrapper);

    component.toggleFullscreen();
    expect(component.fullscreen()).toBe(true);
    expect(host.parentElement).toBe(document.body);

    component.toggleFullscreen();
    expect(component.fullscreen()).toBe(false);
    expect(host.parentElement).toBe(wrapper);
  });

  it('should exit fullscreen on Escape and persist preference', () => {
    const component = fixture.componentInstance;
    userStore.updatePreferences({ cardFocusFullscreen: true });
    component.toggleFullscreen();

    component.onEscape();

    expect(component.fullscreen()).toBe(false);
    // Escape exit is temporary: the profile preference is preserved.
    expect(userStore.preferences().cardFocusFullscreen).toBe(true);
  });

  it('should auto enter fullscreen on learning when preference is enabled', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBe(true);
  });

  it('should exit fullscreen when auto enter is disabled without clearing preference', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('autoEnterFullscreen', false);
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBe(false);
    expect(userStore.preferences().cardFocusFullscreen).toBe(true);
  });

  it('should not re-enter fullscreen when exiting via Escape on learning tab', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.fullscreen()).toBe(true);

    fixture.componentInstance.onEscape();
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBe(false);
    // Escape exit is temporary: the profile preference is preserved, and the
    // auto-enter is suppressed for this shell instance only.
    expect(userStore.preferences().cardFocusFullscreen).toBe(true);
  });

  it('should not re-enter fullscreen when exiting via toggle on learning tab', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.fullscreen()).toBe(true);

    fixture.componentInstance.toggleFullscreen();
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBe(false);
    // Toggle exit is temporary: the profile preference is preserved, and the
    // auto-enter is suppressed for this shell instance only.
    expect(userStore.preferences().cardFocusFullscreen).toBe(true);
  });

  it('should exit fullscreen on document keydown escape', () => {
    fixture.componentInstance.toggleFullscreen();
    expect(fixture.componentInstance.fullscreen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.fullscreen()).toBe(false);
  });

  it('should allow manual fullscreen when auto enter is disabled', () => {
    fixture.componentRef.setInput('autoEnterFullscreen', false);
    fixture.detectChanges();

    fixture.componentInstance.toggleFullscreen();
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBe(true);
    expect(document.body.classList.contains('card-focus-shell-open')).toBe(true);
  });
});
