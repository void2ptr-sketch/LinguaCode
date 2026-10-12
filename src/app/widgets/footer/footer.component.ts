import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Application footer component. Renders the bottom toolbar of the main layout shell.
 * @remarks This component is a simple presentational element with no inputs or outputs.
 */
@Component({
  selector: 'app-footer',
  imports: [MatToolbarModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
