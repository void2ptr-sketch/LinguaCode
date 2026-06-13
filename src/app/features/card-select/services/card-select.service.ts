import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { buildFixtureUrl } from '../../../core/api';
import { CardSelectFixture } from '../types';

@Injectable({ providedIn: 'root' })
export class CardSelectService {
  private readonly http = inject(HttpClient);

  loadFixture(): Promise<CardSelectFixture> {
    return firstValueFrom(this.http.get<CardSelectFixture>(buildFixtureUrl('/select-cards.json')));
  }
}
