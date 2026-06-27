import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserStore } from '../../state';

@Component({
  selector: 'app-menu-user',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './menu-user.component.html',
  styleUrl: './menu-user.component.scss',
})
export class MenuUserComponent {
  readonly displayName = inject(UserStore).displayName;
}
