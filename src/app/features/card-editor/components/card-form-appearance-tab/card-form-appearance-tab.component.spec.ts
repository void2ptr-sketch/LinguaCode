import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormAppearanceTabComponent } from './card-form-appearance-tab.component';
import type { CardDraft } from '../../types';

describe('CardFormAppearanceTabComponent', () => {
  let component: CardFormAppearanceTabComponent;
  let fixture: ComponentFixture<CardFormAppearanceTabComponent>;

  const draft = {
    kind: 'select',
    title: 'Test',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  } as unknown as CardDraft;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFormAppearanceTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFormAppearanceTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', draft);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have required draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have draftChange output', () => {
    expect(component.draftChange).toBeDefined();
  });

  it('should render appearance fields', () => {
    const fields = fixture.nativeElement.querySelector('app-card-appearance-fields');
    expect(fields).toBeTruthy();
  });

  it('should emit updated draft on updateAppearance', () => {
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updateAppearance({ theme: 'dark', fontSize: 'lg' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ appearance: { theme: 'dark', fontSize: 'lg' } }),
    );
  });
});
