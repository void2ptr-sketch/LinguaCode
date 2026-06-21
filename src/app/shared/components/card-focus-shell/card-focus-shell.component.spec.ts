import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { UserPersistence } from '../../../core/state/user.persistence';
import { UserStore } from '../../../core/state/user.store';
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
    expect(component.fullscreen()).toBeFalse();

    component.toggleFullscreen();
    expect(component.fullscreen()).toBeTrue();
    expect(document.body.classList.contains('card-focus-shell-open')).toBeTrue();
    expect(userStore.preferences().cardFocusFullscreen).toBeTrue();

    component.toggleFullscreen();
    expect(component.fullscreen()).toBeFalse();
    expect(document.body.classList.contains('card-focus-shell-open')).toBeFalse();
    expect(userStore.preferences().cardFocusFullscreen).toBeFalse();
  });

  it('should exit fullscreen on Escape and persist preference', () => {
    const component = fixture.componentInstance;
    component.toggleFullscreen();

    component.onEscape();

    expect(component.fullscreen()).toBeFalse();
    expect(userStore.preferences().cardFocusFullscreen).toBeFalse();
  });

  it('should auto enter fullscreen on learning when preference is enabled', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBeTrue();
  });

  it('should exit fullscreen when auto enter is disabled without clearing preference', () => {
    userStore.updatePreferences({ cardFocusFullscreen: true });
    fixture.componentRef.setInput('autoEnterFullscreen', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('autoEnterFullscreen', false);
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBeFalse();
    expect(userStore.preferences().cardFocusFullscreen).toBeTrue();
  });

  it('should allow manual fullscreen when auto enter is disabled', () => {
    fixture.componentRef.setInput('autoEnterFullscreen', false);
    fixture.detectChanges();

    fixture.componentInstance.toggleFullscreen();
    fixture.detectChanges();

    expect(fixture.componentInstance.fullscreen()).toBeTrue();
    expect(document.body.classList.contains('card-focus-shell-open')).toBeTrue();
  });
});
