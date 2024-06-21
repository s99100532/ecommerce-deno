import { assertEquals } from "@std/assert";
import { Status, testing } from "@oak/oak";
import { authMiddleware } from "./middlewares.ts";
import helper from "./helpers.ts";
import { getNumericDate } from "djwt";
import {FakeTime} from "@std/testing/time"

Deno.test("Test Auth middleware", async (t) => {
  await t.step("inject user id", async () => {
    const ctx = testing.createMockContext();
    const next = testing.createMockNext();
    const payload = {
      sub: "7",
      exp: getNumericDate(60 * 60),
    };

    const token = await helper.generateToken(payload);

    ctx.request.headers.set("Authorization", `Bearer ${token}`);

    await authMiddleware(ctx, next);

    assertEquals(ctx.state.user_id, parseInt(payload.sub));
  });

  await t.step("block unauthorized", async () => {
    const ctx = testing.createMockContext();
    const next = testing.createMockNext();

    await authMiddleware(ctx, next);

    assertEquals(ctx.response.status, Status.Unauthorized);
  });

  const exp = getNumericDate(60 * 60 * 24 * 7);

  await t.step("block expired token", async () => {
    const ctx = testing.createMockContext();
    const next = testing.createMockNext();

    // Fake the time after 7 days + 2s
    using _ = new FakeTime(new Date(Date.now() + 60 * 60 * 24 * 7 * 1000+ 2000));
        
    

    const payload = {
      sub: "7",
      exp,
    };


    const token = await helper.generateToken(payload);

    ctx.request.headers.set("Authorization", `Bearer ${token}`);

    await authMiddleware(ctx, next);

    assertEquals(ctx.response.status, Status.Unauthorized);
  });
});
