import { describe, expect, it, vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { FlipCard } from '../../../model';
import { FlipCardComponent } from './flip-card.component';

describe('FlipCardComponent', () => {
  const card: FlipCard = {
    id: 'flip-1',
    kind: 'flip',
    title: 'Карточка-переворот',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    front: 'Здравствуйте',
    back: 'Hello',
  };

  let fixture: ComponentFixture<FlipCardComponent>;
  let component: FlipCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlipCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FlipCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show front side by default (known-to-learning)', () => {
    expect(component.front()).toBe('Здравствуйте');
    expect(component.back()).toBe('Hello');
  });

  it('should swap sides for learning-to-known direction', () => {
    fixture.componentRef.setInput('direction', 'learning-to-known');
    fixture.detectChanges();

    expect(component.front()).toBe('Hello');
    expect(component.back()).toBe('Здравствуйте');
  });

  it('should not be revealed initially', () => {
    expect(component.revealed()).toBe(false);
  });

  it('should reveal the back side on reveal()', () => {
    component.reveal();
    expect(component.revealed()).toBe(true);
  });

  it('should not reveal when feedback is shown', () => {
    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    component.reveal();
    expect(component.revealed()).toBe(false);
  });

  it('should emit flipKnownChange(true) via selectKnown', () => {
    const spy = vi.fn();
    component.flipKnownChange.subscribe(spy);

    component.selectKnown(true);
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.revealed()).toBe(true);
  });

  it('should emit flipKnownChange(false) via selectKnown', () => {
    const spy = vi.fn();
    component.flipKnownChange.subscribe(spy);

    component.selectKnown(false);
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should not emit flipKnownChange when feedback is shown', () => {
    const spy = vi.fn();
    component.flipKnownChange.subscribe(spy);

    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    component.selectKnown(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should reset reveal state when card changes', () => {
    component.reveal();
    expect(component.revealed()).toBe(true);

    fixture.componentRef.setInput('card', { ...card, id: 'flip-2' });
    fixture.detectChanges();

    expect(component.revealed()).toBe(false);
  });

  it('should do nothing on playAudio when audioUrl is missing', () => {
    // No audioUrl — must not throw and keep the card interactive.
    expect(() => component.playAudio()).not.toThrow();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-card')).toBeTruthy();
  });
});
