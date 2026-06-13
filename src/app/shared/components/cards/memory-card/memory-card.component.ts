import { Component, input, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MemoryCard } from '../../../../core/models';
import { CardFeedback } from '../../../types';

type MemoryTile = {
  id: string;
  label: string;
  pairId: string;
};

@Component({
  selector: 'app-memory-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './memory-card.component.html',
  styleUrl: './memory-card.component.scss',
})
export class MemoryCardComponent implements OnInit {
  readonly card = input.required<MemoryCard>();
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly memoryComplete = output<boolean>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly flipped = signal<readonly string[]>([]);
  readonly matched = signal<readonly string[]>([]);
  readonly activeTileId = signal<string | null>(null);

  readonly tiles = signal<readonly MemoryTile[]>([]);

  ngOnInit(): void {
    this.resetTiles();
  }

  resetTiles(): void {
    const tiles = this.card().pairs.flatMap((pair, index) => [
      { id: `${index}-front`, label: pair.front, pairId: String(index) },
      { id: `${index}-back`, label: pair.back, pairId: String(index) },
    ]);

    this.tiles.set(this.shuffle(tiles));
    this.flipped.set([]);
    this.matched.set([]);
    this.activeTileId.set(null);
  }

  flipTile(tile: MemoryTile): void {
    if (this.feedback() !== null || this.matched().includes(tile.pairId) || this.flipped().includes(tile.id)) {
      return;
    }

    const active = this.activeTileId();
    if (!active) {
      this.flipped.update((items) => [...items, tile.id]);
      this.activeTileId.set(tile.id);
      return;
    }

    const activeTile = this.tiles().find((item) => item.id === active);
    if (!activeTile) {
      return;
    }

    this.flipped.update((items) => [...items, tile.id]);

    if (activeTile.pairId === tile.pairId) {
      const nextMatched = [...this.matched(), tile.pairId];
      this.matched.set(nextMatched);
      this.activeTileId.set(null);

      if (nextMatched.length === this.card().pairs.length) {
        this.memoryComplete.emit(true);
      }
      return;
    }

    this.activeTileId.set(null);
    window.setTimeout(() => {
      this.flipped.set([]);
    }, 700);
  }

  isVisible(tile: MemoryTile): boolean {
    return this.flipped().includes(tile.id) || this.matched().includes(tile.pairId);
  }

  private shuffle<T>(items: readonly T[]): readonly T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }
}
