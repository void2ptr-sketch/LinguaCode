import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Navigation menu component for the tools section. Provides links to course builder,
 * scenario builder, and card editor tools.
 * @remarks This component is a simple presentational element with no inputs or outputs.
 */
@Component({
  selector: 'app-menu-tools',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './menu-tools.component.html',
  styleUrl: './menu-tools.component.scss',
})
export class MenuToolsComponent {}
