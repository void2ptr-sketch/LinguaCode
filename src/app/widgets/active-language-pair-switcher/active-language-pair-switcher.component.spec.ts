import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it } from 'vitest';

import { ActiveLanguagePairSwitcherComponent } from './active-language-pair-switcher.component';
import { UserStore } from '../../core/state';

describe('ActiveLanguagePairSwitcherComponent', () => {
  let fixture: ComponentFixture<ActiveLanguagePairSwitcherComponent>;
  let component: ActiveLanguagePairSwitcherComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ActiveLanguagePairSwitcherComponent,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
      ],
      providers: [UserStore],
    });

    fixture = TestBed.createComponent(ActiveLanguagePairSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have compact input', () => {
    expect(component.compact()).toBe(false);
  });

  it('should have languagePairs signal', () => {
    expect(component.languagePairs).toBeDefined();
  });

  it('should have activeLanguagePairId signal', () => {
    expect(component.activeLanguagePairId).toBeDefined();
  });

  it('should have entryLabel method', () => {
    expect(component.entryLabel).toBeDefined();
    expect(typeof component.entryLabel).toBe('function');
  });

  it('should have onActiveChange method', () => {
    expect(component.onActiveChange).toBeDefined();
    expect(typeof component.onActiveChange).toBe('function');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-form-field, p')).toBeTruthy();
  });
});
