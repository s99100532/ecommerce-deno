import { Middleware } from "@oak/oak";
import helper from "./helpers.ts";
import { Status } from "@oak/oak";

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
      ctx.response.status = Status.Unauthorized;
      helper.setAPIResponse(ctx, { success: false, error_message: e.message });
    }
  } else {
    ctx.response.status = Status.Unauthorized;
    helper.setAPIResponse(ctx, {
      success: false,
      error_message: "Unauthorized",
    });
  }
};
