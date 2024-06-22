import { Middleware } from "@oak/oak";
import helper from "./helpers.ts";
import { STATUS_CODE } from "jsr:@oak/commons@0.11/status";

export const authMiddleware: Middleware = async (ctx, next) => {
  const auth = ctx.request.headers.get("Authorization");

  const matches = /Bearer\s*(.*)/.exec(auth ?? "");

  if (matches && matches.length > 0) {
    const token = matches[1];

    try {
      const payload = await helper.getJWTPayload(token);

      ctx.state.user_id = parseInt(payload.sub);
      await next();
    } catch (e) {
      ctx.response.status = STATUS_CODE.Unauthorized;
      helper.setAPIResponse(ctx, { success: false, error_message: e.message });
    }
  } else {
    ctx.response.status = STATUS_CODE.Unauthorized;
    helper.setAPIResponse(ctx, {
      success: false,
      error_message: "Unauthorized",
    });
  }
};
