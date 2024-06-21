import { z } from "zod";

export const LoginValidator = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .strict();

export const SignupValidator = z
  .object({
    username: z.string(),
    password: z.string().min(5),
  })
  .strict();

export const CreateOrderValidator = z
  .object({
    items: z.array(z.object({ product_id: z.string() })).min(1),
  })
  .strict();
