import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActiveLanguagePairSwitcherComponent } from '../../../shared/components/active-language-pair-switcher/active-language-pair-switcher.component';
import { UserStore } from '../../state';

@Component({
  selector: 'app-menu-user',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    ActiveLanguagePairSwitcherComponent,
  ],
  templateUrl: './menu-user.component.html',
  styleUrl: './menu-user.component.scss',
})
export class MenuUserComponent {
  readonly displayName = inject(UserStore).displayName;
}
