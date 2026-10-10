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

/**
 * User profile page component. Allows users to manage their display name, theme preferences,
 * language pair, and learning proficiency level.
 * @remarks Uses draft signals for form fields that are committed to `UserStore` on save.
 */
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

  /** Current user's display name from the store. */
  readonly displayName = this.userStore.displayName;
  /** User preferences signal from the store. */
  readonly preferences = this.userStore.preferences;
  /** Available content languages. */
  readonly languages = contentLanguages();
  /** Labels for content languages. */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;

  /** Draft value for the user's display name. */
  readonly nameDraft = signal(this.displayName());
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.preferences().learningProficiencyLevel,
  );
  /** Available learning proficiency level options. */
  readonly learningProficiencyOptions = LEARNING_PROFICIENCY_LEVELS;
  /** Draft value for the application theme. */
  readonly themeDraft = signal(this.preferences().theme);
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.preferences().fontSize);
  /** Draft value for the color scheme (light/dark/system). */
  readonly colorSchemeDraft = signal<AppColorScheme>(this.preferences().colorScheme);
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = signal(this.preferences().cardFocusFullscreen);
  /** Currently selected tab index in the settings tabs. */
  readonly selectedTabIndex = signal(0);

  ngOnInit(): void {
    this.learningProficiencyDraft.set(this.preferences().learningProficiencyLevel);
  }

  /**
   * Commits all draft form values to the `UserStore`.
   *
   * @remarks
   * Updates both the display name and all preferences (theme, font size, color scheme,
   * card focus fullscreen, learning proficiency level) in a single call.
   */
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
