import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { UserProfileDraftService } from '../user-profile-draft.service';

/**
 * Tab «Внешний вид»: theme, color scheme, card font size and fullscreen
 * focus preference.
 *
 * @remarks
 * Binds to the shared `UserProfileDraftService` drafts; nothing is saved
 * until the page's "Сохранить" button commits all tabs.
 */
@Component({
  selector: 'app-user-appearance-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  styleUrl: '../user-page.component.scss',
  templateUrl: './user-appearance-tab.component.html',
})
export class UserAppearanceTabComponent {
  /** Shared draft state provided by `UserPageComponent`. */
  protected readonly drafts = inject(UserProfileDraftService);
}
