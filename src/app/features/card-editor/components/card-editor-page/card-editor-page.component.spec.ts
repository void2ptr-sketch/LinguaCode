import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { describe, expect, it } from 'vitest';

import { CardEditorPageComponent } from './card-editor-page.component';
import { CardEditorStore } from '../../services/card-editor.store';
import { CardCatalogSearchStore } from '../../../card-catalog-search';
import { UserStore } from '../../../../core/state';
import { CardEditorDialogService } from '../card-editor-dialog/card-editor-dialog.service';
import { CardTryDialogService } from '../card-try-dialog/card-try-dialog.service';
import type { ContentLanguage } from '../../../../core/models';

describe('CardEditorPageComponent', () => {
  let fixture: ComponentFixture<CardEditorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardEditorPageComponent,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        DatePipe,
      ],
      providers: [
        provideRouter([]),
        CardEditorStore,
        CardCatalogSearchStore,
        UserStore,
        CardEditorDialogService,
        CardTryDialogService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardEditorPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have CardEditorStore injected', () => {
    expect(fixture.componentInstance.store).toBeDefined();
  });

  it('should have CardCatalogSearchStore injected', () => {
    expect(fixture.componentInstance.catalogStore).toBeDefined();
  });

  it('should expose createGroups constant', () => {
    expect(fixture.componentInstance.createGroups).toBeDefined();
  });

  it('should expose createGroupLabels constant', () => {
    expect(fixture.componentInstance.createGroupLabels).toBeDefined();
  });

  it('should expose createGroupHints constant', () => {
    expect(fixture.componentInstance.createGroupHints).toBeDefined();
  });

  it('should expose kindsByGroup constant', () => {
    expect(fixture.componentInstance.kindsByGroup).toBeDefined();
  });

  it('should expose kindLabels constant', () => {
    expect(fixture.componentInstance.kindLabels).toBeDefined();
  });

  it('should expose languageLabels constant', () => {
    expect(fixture.componentInstance.languageLabels).toBeDefined();
  });

  it('should expose difficultyLabels constant', () => {
    expect(fixture.componentInstance.difficultyLabels).toBeDefined();
  });

  it('should expose tagLabel function', () => {
    expect(fixture.componentInstance.tagLabel).toBeDefined();
  });

  it('should entries computed return array', () => {
    fixture.detectChanges();
    const entries = fixture.componentInstance.entries();
    expect(Array.isArray(entries)).toBe(true);
  });

  it('should formatEntryLanguages return formatted string', () => {
    fixture.detectChanges();
    const result = fixture.componentInstance.formatEntryLanguages({
      knownLanguage: 'zh' as ContentLanguage,
      learningLanguage: 'en' as ContentLanguage,
    });
    expect(typeof result).toBe('string');
  });
});
