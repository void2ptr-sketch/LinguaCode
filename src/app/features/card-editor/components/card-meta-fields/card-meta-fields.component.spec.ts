import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, vi } from 'vitest';

import { CardMetaFieldsComponent } from './card-meta-fields.component';
import type { CardIndexMetaOverride } from '../../../../core/models';

describe('CardMetaFieldsComponent', () => {
  let fixture: ComponentFixture<CardMetaFieldsComponent>;
  let component: CardMetaFieldsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardMetaFieldsComponent,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
      ],
    });
    fixture = TestBed.createComponent(CardMetaFieldsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'easy' });
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should expose difficultyOptions', () => {
    expect(component.difficultyOptions).toBeDefined();
  });

  it('should expose difficultyLabels', () => {
    expect(component.difficultyLabels).toBeDefined();
  });

  it('should have undefined meta by default', () => {
    fixture.detectChanges();
    expect(component.meta()).toBeUndefined();
  });

  it('should updateDifficulty emit change', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner', tags: ['test'] });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateDifficulty('advanced');

    expect(spy).toHaveBeenCalledWith({ difficulty: 'advanced', tags: ['test'] });
  });

  it('should updateDifficulty with intermediate', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateDifficulty('intermediate');

    expect(spy).toHaveBeenCalledWith({ difficulty: 'intermediate' });
  });

  it('should updateTags parse comma-separated string', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner', tags: ['a'] });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateTags('tag1, tag2, tag3');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should updateTags filter empty tags', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateTags('tag1,, tag2,  ');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.tags).toEqual(['tag1', 'tag2']);
  });

  it('should updateTags with single tag', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateTags('single');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.tags).toEqual(['single']);
  });

  it('should updateUpdatedAt emit change', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateUpdatedAt('2024-01-15T10:00:00Z');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.updatedAt).toBe('2024-01-15T10:00:00Z');
  });

  it('should tagsString return empty when meta is undefined', () => {
    fixture.detectChanges();
    expect(component.tagsString()).toBe('');
  });

  it('should tagsString return empty when no tags', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner' });
    fixture.detectChanges();
    expect(component.tagsString()).toBe('');
  });

  it('should tagsString return comma-separated tags', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner', tags: ['tag1', 'tag2', 'tag3'] });
    fixture.detectChanges();
    expect(component.tagsString()).toBe('tag1, tag2, tag3');
  });

  it('should tagsString handle single tag', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner', tags: ['single'] });
    fixture.detectChanges();
    expect(component.tagsString()).toBe('single');
  });

  it('should preserve existing fields when updating difficulty', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'beginner', tags: ['a'], updatedAt: '2024-01-01' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateDifficulty('advanced');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.tags).toEqual(['a']);
    expect(emitted.updatedAt).toBe('2024-01-01');
  });

  it('should preserve existing fields when updating tags', () => {
    fixture.componentRef.setInput('meta', { difficulty: 'advanced', tags: ['old'] });
    fixture.detectChanges();
    const spy = vi.fn();
    component.metaChange.subscribe(spy);

    component.updateTags('new1, new2');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as CardIndexMetaOverride;
    expect(emitted.difficulty).toBe('advanced');
    expect(emitted.tags).toEqual(['new1', 'new2']);
  });
});
