export type JWTPayload = {
  sub: string;
  exp: number;
};

export type ContextState = {
  user_id: number;
};
