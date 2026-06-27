import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-help-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss',
})
export class HelpPageComponent {}
