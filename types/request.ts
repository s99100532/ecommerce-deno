export type APIResponse<T> = {
  success: boolean;
  data?: T;
  errorMessage?: string;
};

export type JWTPayload = {
  sub: string;
  exp: number;
};

export type ContextState = {
  user_id: number;
};
