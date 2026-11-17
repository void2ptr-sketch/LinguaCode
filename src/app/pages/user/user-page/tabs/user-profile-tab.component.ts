import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { UserProfileDraftService } from '../user-profile-draft.service';

/**
 * Tab «Пользователь»: display name and learning proficiency level.
 *
 * @remarks
 * Binds to the shared `UserProfileDraftService` drafts; nothing is saved
 * until the page's "Сохранить" button commits all tabs.
 */
@Component({
  selector: 'app-user-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule],
  styleUrl: '../user-page.component.scss',
  template: `
    <div class="page-card__tab-panel">
      <mat-form-field appearance="outline">
        <mat-label>Имя</mat-label>
        <input
          matInput
          [ngModel]="drafts.nameDraft()"
          (ngModelChange)="drafts.nameDraft.set($event)"
          name="displayName"
        />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Уровень подготовки</mat-label>
        <mat-select
          [ngModel]="drafts.learningProficiencyDraft()"
          (ngModelChange)="drafts.learningProficiencyDraft.set($event)"
          name="learningProficiencyLevel"
        >
          @for (level of drafts.learningProficiencyOptions; track level.id) {
            <mat-option [value]="level.id">{{ level.label }}</mat-option>
          }
        </mat-select>
        <mat-hint>Влияет на строгость проверки ответов в упражнениях.</mat-hint>
      </mat-form-field>
    </div>
  `,
})
export class UserProfileTabComponent {
  /** Shared draft state provided by `UserPageComponent`. */
  protected readonly drafts = inject(UserProfileDraftService);
}
