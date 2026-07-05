import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  LanguagePair,
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../../models';
import type { ApiResponse } from '../../api/api.types';
import { buildApiUrl } from '../../api/api-url';
import { buildScenarioSearchParams } from '../../api/scenarios/scenarios-api.params.utils';

export type ScenarioWritePayload = {
  title: string;
  description: string;
  cardSource: Scenario['cardSource'];
  published: boolean;
  languagePair?: LanguagePair;
};

@Injectable({ providedIn: 'root' })
export class ScenariosApiService {
  private readonly http = inject(HttpClient);

  search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<ScenarioSearchPage>>(buildApiUrl('/scenarios/search'), {
        params: buildScenarioSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  getById(scenarioId: string): Promise<Scenario> {
    return firstValueFrom(
      this.http.get<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`)),
    ).then((response) => response.data);
  }

  create(payload: ScenarioWritePayload): Promise<Scenario> {
    return firstValueFrom(
      this.http.post<ApiResponse<Scenario>>(buildApiUrl('/scenarios'), payload),
    ).then((response) => response.data);
  }

  update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario> {
    return firstValueFrom(
      this.http.put<ApiResponse<Scenario>>(buildApiUrl(`/scenarios/${scenarioId}`), payload),
    ).then((response) => response.data);
  }

  delete(scenarioId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/scenarios/${scenarioId}`)),
    ).then(() => undefined);
  }

  findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly ScenarioIndexEntry[]>>(
        buildApiUrl(`/scenarios/by-card/${cardId}`),
      ),
    ).then((response) => response.data);
  }
}
