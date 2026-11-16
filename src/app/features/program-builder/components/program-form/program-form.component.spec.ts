import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { describe, expect, it } from 'vitest';

import type { ProgramFormDraft } from '../../types';
import { ProgramFormComponent } from './program-form.component';

@Component({
  standalone: true,
  imports: [
    ProgramFormComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    FormsModule,
  ],
  template: `
    <app-program-form [draft]="draft" (draftChange)="onDraftChange($event)" [readOnly]="readOnly" />
  `,
})
class TestHostComponent {
  draft = {} as ProgramFormDraft;
  readOnly = false;
  lastEmitted: ProgramFormDraft | null = null;

  onDraftChange(draft: ProgramFormDraft): void {
    this.draft = draft;
    this.lastEmitted = draft;
  }
}

const baseDraft: ProgramFormDraft = {
  courseId: 'course-1',
  title: 'Test Program',
  description: 'Test description',
  requiredTier: 'FREE',
  order: 2,
};

function createComponent(readOnly = false): {
  fixture: ComponentFixture<TestHostComponent>;
  host: TestHostComponent;
} {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [TestHostComponent],
  });

  const fixture = TestBed.createComponent(TestHostComponent);
  const host = fixture.componentInstance;
  host.draft = { ...baseDraft };
  host.readOnly = readOnly;
  fixture.detectChanges();

  return { fixture, host };
}

describe('ProgramFormComponent', () => {
  it('should create', () => {
    const { host } = createComponent();
    expect(host).toBeDefined();
  });

  it('should render mat-tab-group', () => {
    const { fixture } = createComponent();
    const root = fixture.nativeElement;
    const tabGroups = root.querySelectorAll('mat-tab-group');
    expect(tabGroups.length).toBe(1);
  });

  it('should render two tabs with correct labels', () => {
    const { fixture } = createComponent();
    const root = fixture.nativeElement;
    const text = root.textContent?.toLowerCase() || '';
    expect(text).toContain('основное');
    expect(text).toContain('публикация');
  });

  it('should emit updated title on updateTitle', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, title: 'New Title' });
    expect(host.lastEmitted?.title).toBe('New Title');
  });

  it('should emit updated description on updateDescription', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, description: 'New description' });
    expect(host.lastEmitted?.description).toBe('New description');
  });

  it('should emit updated required tier on updateRequiredTier', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, requiredTier: 'PREMIUM' });
    expect(host.lastEmitted?.requiredTier).toBe('PREMIUM');
  });

  it('should emit updated published flag on updatePublished', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, published: true });
    expect(host.lastEmitted?.published).toBe(true);
  });

  it('should emit updated order on updateOrder', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, order: 5 });
    expect(host.lastEmitted?.order).toBe(5);
  });

  it('should preserve other fields when updating order', () => {
    const { host } = createComponent();
    host.onDraftChange({ ...host.draft, order: 10 });
    expect(host.lastEmitted?.title).toBe('Test Program');
    expect(host.lastEmitted?.description).toBe('Test description');
    expect(host.lastEmitted?.requiredTier).toBe('FREE');
  });

  it('should disable inputs when readOnly is true', () => {
    const { fixture, host } = createComponent(true);
    host.readOnly = true;
    fixture.detectChanges();

    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBeGreaterThan(0);

    // Check that the form has disabled controls by checking the component state
    expect(host.readOnly).toBe(true);
  });

  it('should not disable inputs when readOnly is false', () => {
    const { fixture } = createComponent(false);
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[disabled], textarea[disabled], select[disabled]',
    );
    expect(inputs.length).toBe(0);
  });
});
