export type ApiErrorBody = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data: T;
};

export type ApiListResponse<T> = {
  data: readonly T[];
  total?: number;
};

export type HttpApiError = Error & {
  status: number;
  body: ApiErrorBody | null;
};
