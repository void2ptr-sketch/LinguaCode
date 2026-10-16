import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Application footer component. Renders the bottom toolbar of the main layout shell.
 * @remarks This component is a simple presentational element with no inputs or outputs.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-footer',
  imports: [MatToolbarModule],
  templateUrl: './main-footer.component.html',
  styleUrl: './main-footer.component.scss',
})
export class MainFooterComponent {}
