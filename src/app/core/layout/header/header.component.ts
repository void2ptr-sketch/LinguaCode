import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuCardsComponent } from '../menu-cards/menu-cards.component';
import { MenuToolsComponent } from '../menu-tools/menu-tools.component';
import { MenuHelpComponent } from '../menu-help/menu-help.component';
import { MenuUserComponent } from '../menu-user/menu-user.component';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MenuCardsComponent,
    MenuToolsComponent,
    MenuHelpComponent,
    MenuUserComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
