import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuCardsComponent } from '../menu-cards/menu-cards.component';
import { MenuToolsComponent } from '../menu-tools/menu-tools.component';
import { MenuHelpComponent } from '../menu-help/menu-help.component';
import { MenuUserComponent } from '../menu-user/menu-user.component';

/**
 * Application header component. Renders the top toolbar containing navigation menus.
 * @remarks This component is a simple presentational element with no inputs or outputs.
 */
@Component({
  selector: 'app-main-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatToolbarModule,
    MenuCardsComponent,
    MenuToolsComponent,
    MenuHelpComponent,
    MenuUserComponent,
  ],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss',
})
export class MainHeaderComponent {}
