import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { DirectionCardInnerComponent } from './direction-card-inner.component';
import {
  DIRECTION_CARD_HELPERS,
  type DirectionCardEvent,
  type DirectionCardHelpers,
} from './direction-card.component';

const mockHelpers: DirectionCardHelpers = {
  getLanguageLabel: (code: string) => code.toUpperCase(),
  getFlagEmoji: () => '🏳',
  getBadgeColor: () => '#fff',
  getBadgeTextColor: () => '#000',
  getBadgeCode: (code: string) => code.toUpperCase(),
};

@Component({
  standalone: true,
  imports: [DirectionCardInnerComponent],
  template: `
    <app-direction-card-inner
      [pairId]="pairId"
      [known]="known"
      [learning]="learning"
      [isActive]="isActive"
      (activate)="onActivate($event)"
      (remove)="onRemove($event)"
    />
  `,
})
class TestHostComponent {
  pairId = '1';
  known = 'en';
  learning = 'ru';
  isActive = false;
  activatedEvent: DirectionCardEvent | null = null;
  removedEvent: DirectionCardEvent | null = null;

  private readonly cdr = inject(ChangeDetectorRef);

  onActivate(event: DirectionCardEvent): void {
    this.activatedEvent = event;
  }

  onRemove(event: DirectionCardEvent): void {
    this.removedEvent = event;
  }

  /** Update an @Input and force OnPush to re-check */
  setInput(
    name: keyof Pick<this, 'pairId' | 'known' | 'learning' | 'isActive'>,
    value: unknown,
  ): void {
    (this as Record<string, unknown>)[name] = value;
    this.cdr.markForCheck();
  }
}

describe('DirectionCardInnerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, DirectionCardInnerComponent],
      providers: [{ provide: DIRECTION_CARD_HELPERS, useValue: mockHelpers }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── inactive state (isActive = false) ──

  it('should render direction codes in uppercase', () => {
    const native = fixture.nativeElement;
    const codes = native.querySelectorAll('.dc-card__code');
    expect(codes[0].textContent?.trim()).toBe('EN');
    expect(codes[1].textContent?.trim()).toBe('RU');
  });

  it('should render labels from helpers', () => {
    const native = fixture.nativeElement;
    const labels = native.querySelectorAll('.dc-card__label');
    expect(labels[0].textContent?.trim()).toBe('EN');
    expect(labels[1].textContent?.trim()).toBe('RU');
  });

  it('should show "Not active" when inactive', () => {
    const native = fixture.nativeElement;
    const sublabel = native.querySelector('.dc-card__sublabel');
    expect(sublabel?.textContent?.trim()).toBe('Not active');
  });

  it('should NOT show checkmark SVG when inactive', () => {
    const native = fixture.nativeElement;
    // The checkmark SVG is inside .dc-card__radio
    const radio = native.querySelector('.dc-card__radio');
    expect(radio?.querySelector('svg')).toBeNull();
  });

  it('should NOT have active class when inactive', () => {
    const native = fixture.nativeElement;
    const card = native.querySelector('.dc-card');
    expect(card?.classList.contains('dc-card--active')).toBe(false);
  });

  it('should show Activate button when inactive', () => {
    const native = fixture.nativeElement;
    const btns = native.querySelectorAll('.dc-card__btn--primary');
    expect(btns.length).toBe(1);
    expect(btns[0].textContent?.trim()).toBe('Activate');
  });

  it('should show Remove button when inactive', () => {
    const native = fixture.nativeElement;
    const removeBtn = native.querySelector('.dc-card__btn--remove');
    expect(removeBtn).toBeTruthy();
  });

  it('should emit activate event when Activate button is clicked', () => {
    const native = fixture.nativeElement;
    const activateBtn = native.querySelector('.dc-card__btn--primary');
    activateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.activatedEvent).toEqual({
      pairId: '1',
      known: 'en',
      learning: 'ru',
    });
  });

  it('should emit remove event when Remove button is clicked', () => {
    const native = fixture.nativeElement;
    const removeBtn = native.querySelector('.dc-card__btn--remove');
    removeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.removedEvent).toEqual({
      pairId: '1',
      known: 'en',
      learning: 'ru',
    });
  });

  // ── active state (isActive = true) ──

  it('should show "Active" when active', () => {
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const sublabel = native.querySelector('.dc-card__sublabel');
    expect(sublabel?.textContent?.trim()).toBe('Active');
  });

  it('should show checkmark SVG when active', () => {
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const radio = native.querySelector('.dc-card__radio');
    expect(radio?.querySelector('svg')).toBeTruthy();
  });

  it('should have active class when active', () => {
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const card = native.querySelector('.dc-card');
    expect(card?.classList.contains('dc-card--active')).toBe(true);
  });

  it('should hide Activate button when active', () => {
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const primaryBtn = native.querySelector('.dc-card__btn--primary');
    expect(primaryBtn?.classList.contains('dc-card__btn--hidden')).toBe(true);
  });

  it('should still show Remove button when active', () => {
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const removeBtn = native.querySelector('.dc-card__btn--remove');
    expect(removeBtn).toBeTruthy();
  });

  it('should emit activate event with correct data when active', () => {
    host.setInput('pairId', '42');
    host.setInput('known', 'zh');
    host.setInput('learning', 'ja');
    host.setInput('isActive', true);
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const activateBtn = native.querySelector('.dc-card__btn--primary');
    activateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.activatedEvent).toEqual({
      pairId: '42',
      known: 'zh',
      learning: 'ja',
    });
  });

  // ── different language codes ──

  it('should render different language codes', () => {
    host.setInput('known', 'zh');
    host.setInput('learning', 'ja');
    fixture.detectChanges();

    const native = fixture.nativeElement;
    const codes = native.querySelectorAll('.dc-card__code');
    expect(codes[0].textContent?.trim()).toBe('ZH');
    expect(codes[1].textContent?.trim()).toBe('JA');
  });

  it('should default isActive to false', () => {
    const native = fixture.nativeElement;
    const card = native.querySelector('.dc-card');
    expect(card?.classList.contains('dc-card--active')).toBe(false);
  });
});
