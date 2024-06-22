import { Context } from "@oak/oak";
import { Client } from "mysql";
import { JWTPayload } from "./types/request.ts";
import { ZodError } from "zod";
import { ERROR_MESSAGE } from "./constants.ts";
import { create, Header, verify } from "djwt";
import { OrderError, RepositoryError, UserError } from "./exceptions.ts";
import { getLogger, Logger } from "@std/log";
import { APIResponse } from "./types/dto.ts";

const jwtHeader: Header = { alg: "HS512", typ: "JWT" };

const container: {
  dbClient?: Client;
  logger?: Logger;
} = {};

const getEnv = (key: string) => {
  return Deno.env.get(key) || "";
};

const getDBClient = async () => {
  if (!container.dbClient) {
    container.dbClient = await new Client().connect({
      hostname: getEnv("DB_HOST"),
      username: getEnv("DB_USERNAME"),
      db: getEnv("DB_NAME"),
      password: getEnv("DB_PASSWORD"),
    });
  }

  return container.dbClient;
};

const getAppLogger = () => {
  if (!container.logger) {
    container.logger = getLogger();
  }

  return container.logger;
};

const setAPIResponse = <T extends object>(
  context: Context,
  response: APIResponse<T>,
) => {
  context.response.type = "application/json";
  context.response.body = response;

  return context;
};

/**
 * Catch the error and turn into Error Response
 *
 * @param context
 * @param f
 */
const wrapError = async (context: Context, f: () => unknown) => {
  try {
    await f();
  } catch (e) {
    if (
      e instanceof RepositoryError ||
      e instanceof UserError ||
      e instanceof OrderError
    ) {
      setAPIResponse(context, {
        success: false,
        error_message: e.message,
      });
    } else if (e instanceof ZodError) {
      setAPIResponse(context, {
        success: false,
        error_message: e.issues[0].message,
      });
    } else {
      setAPIResponse(context, {
        success: false,
        error_message: ERROR_MESSAGE.ERROR_UNKNOWN,
      });
    }
  }
};

const JWTKey = await crypto.subtle.importKey(
  "jwk",
  JSON.parse(getEnv("JWT_SECRET")),
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

const getJWTPayload = async (token: string) => {
  const payload = await verify<JWTPayload>(token, JWTKey);

  return payload;
};

const generateToken = async (payload: JWTPayload) => {
  const token = await create(jwtHeader, payload, JWTKey);

  return token;
};

const getRequestBody = (context: Context) => {
  return context.request.body.json();
};

export default {
  getRequestBody,
  getEnv,
  getDBClient,
  getAppLogger,
  setAPIResponse,
  wrapError,
  getJWTPayload,
  generateToken,
};
