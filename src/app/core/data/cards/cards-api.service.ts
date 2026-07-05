import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { Card, CardSearchCriteria, CardSearchPage } from '../../models';
import type { ApiResponse } from '../../api/api.types';
import { buildApiUrl, buildCardSearchParams } from '../../api';

@Injectable({ providedIn: 'root' })
export class CardsApiService {
  private readonly http = inject(HttpClient);

  search(criteria: CardSearchCriteria): Promise<CardSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<CardSearchPage>>(buildApiUrl('/cards/search'), {
        params: buildCardSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  getById(cardId: string): Promise<Card> {
    return firstValueFrom(this.http.get<ApiResponse<Card>>(buildApiUrl(`/cards/${cardId}`))).then(
      (response) => response.data,
    );
  }

  getByIds(cardIds: readonly string[]): Promise<readonly Card[]> {
    if (cardIds.length === 0) {
      return Promise.resolve([]);
    }

    return firstValueFrom(
      this.http.post<ApiResponse<readonly Card[]>>(buildApiUrl('/cards/batch'), {
        ids: cardIds,
      }),
    ).then((response) => response.data);
  }
}
