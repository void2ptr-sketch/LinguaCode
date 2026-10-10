import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, vi } from 'vitest';

import { CardAppearanceFieldsComponent } from './card-appearance-fields.component';

describe('CardAppearanceFieldsComponent', () => {
  let fixture: ComponentFixture<CardAppearanceFieldsComponent>;
  let component: CardAppearanceFieldsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardAppearanceFieldsComponent,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
      ],
    });
    fixture = TestBed.createComponent(CardAppearanceFieldsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render appearance section', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.card-appearance-fields');
    expect(section).toBeDefined();
  });

  it('should render theme heading', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const h3 = fixture.nativeElement.querySelector('h3');
    expect(h3?.textContent).toBe('Внешний вид');
  });

  it('should render theme input', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const themeInput = fixture.nativeElement.querySelector('mat-label');
    expect(themeInput?.textContent).toContain('Тема');
  });

  it('should render font size selector', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const fontSizeLabel = [...fixture.nativeElement.querySelectorAll('mat-label')].find(
      (l: HTMLElement) => l.textContent?.includes('Размер шрифта'),
    );
    expect(fontSizeLabel).toBeDefined();
  });

  it('should updateTheme emit change', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.appearanceChange.subscribe(spy);

    component.updateTheme('dark');

    expect(spy).toHaveBeenCalledWith({ theme: 'dark', fontSize: 'md' });
  });

  it('should updateFontSize emit change', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.appearanceChange.subscribe(spy);

    component.updateFontSize('lg');

    expect(spy).toHaveBeenCalledWith({ theme: 'azure-blue', fontSize: 'lg' });
  });

  it('should updateFontSize with sm', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'md' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.appearanceChange.subscribe(spy);

    component.updateFontSize('sm');

    expect(spy).toHaveBeenCalledWith({ theme: 'azure-blue', fontSize: 'sm' });
  });

  it('should preserve theme when updating font size', () => {
    fixture.componentRef.setInput('appearance', { theme: 'dark', fontSize: 'sm' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.appearanceChange.subscribe(spy);

    component.updateFontSize('lg');

    expect(spy).toHaveBeenCalledWith({ theme: 'dark', fontSize: 'lg' });
  });

  it('should preserve font size when updating theme', () => {
    fixture.componentRef.setInput('appearance', { theme: 'azure-blue', fontSize: 'lg' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.appearanceChange.subscribe(spy);

    component.updateTheme('dark');

    expect(spy).toHaveBeenCalledWith({ theme: 'dark', fontSize: 'lg' });
  });
});
