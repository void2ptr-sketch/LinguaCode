import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CardAppearance } from '../../../models';
import { UserStore } from '../../../state';

@Component({
  selector: 'app-user-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent {
  private readonly userStore = inject(UserStore);

  readonly user = this.userStore.user;
  readonly displayName = this.userStore.displayName;
  readonly preferences = this.userStore.preferences;

  nameDraft = this.displayName();
  themeDraft = this.preferences().theme;
  fontSizeDraft: CardAppearance['fontSize'] = this.preferences().fontSize;

  saveProfile(): void {
    this.userStore.updateDisplayName(this.nameDraft);
    this.userStore.updatePreferences({
      theme: this.themeDraft,
      fontSize: this.fontSizeDraft,
    });
  }
}
