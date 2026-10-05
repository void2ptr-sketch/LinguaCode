import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import type {
  AppColorScheme,
  LearningProficiencyLevel,
  UserPreferences,
} from '../../../models';
import { LEARNING_PROFICIENCY_LEVELS } from '../../../models/learning-proficiency.types';
import { UserStore } from '../../../state';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../../data/language-pair/language-pair.utils';

@Component({
  selector: 'app-user-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent implements OnInit {
  private readonly userStore = inject(UserStore);

  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;
  readonly languages = contentLanguages();
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  readonly nameDraft = signal(this.displayName());
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.preferences().learningProficiencyLevel,
  );
  readonly learningProficiencyOptions = LEARNING_PROFICIENCY_LEVELS;
  readonly themeDraft = signal(this.preferences().theme);
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  readonly colorSchemeDraft = signal<AppColorScheme>(this.preferences().colorScheme);
  readonly cardFocusFullscreenDraft = signal(this.preferences().cardFocusFullscreen);
  readonly selectedTabIndex = signal(0);

  ngOnInit(): void {
    this.learningProficiencyDraft.set(this.preferences().learningProficiencyLevel);
  }

  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });
  }
}
