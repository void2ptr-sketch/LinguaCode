import { Component, input } from '@angular/core';
import { Card } from '../../../../core/models';
import { CardHostComponent } from '../../../../shared/components/card-host';

@Component({
  selector: 'app-card-preview',
  imports: [CardHostComponent],
  templateUrl: './card-preview.component.html',
  styleUrl: './card-preview.component.scss',
})
export class CardPreviewComponent {
  readonly card = input.required<Card>();
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');
}
