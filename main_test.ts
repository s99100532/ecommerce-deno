import { testing } from "@oak/oak";
import { ERROR_MESSAGE, ROUTES } from "./constants.ts";
import { router } from "./main.ts";
import { returnsNext, stub } from "@std/testing/mock";
import helper from "./helpers.ts";
import { assertEquals, assertObjectMatch } from "@std/assert";
import { dbClient, orderService, userService } from "./main.ts";

const next = testing.createMockNext();

await dbClient.execute("TRUNCATE TABLE users");
await dbClient.execute("TRUNCATE TABLE products");
await dbClient.execute("TRUNCATE TABLE order_item");
await dbClient.execute("TRUNCATE TABLE orders");

Deno.test("Endpoint Signup", async (t) => {
  const ctx = testing.createMockContext({
    path: ROUTES.SIGNUP,
    method: "POST",
  });

  const mock = stub(
    helper,
    "getRequestBody",
    returnsNext([
      Promise.resolve({
        username: "test_user",
        password: "12345678",
      }),
      Promise.resolve({
        username: "test_user",
        password: "12345678",
      }),
      Promise.resolve({
        username: "test_user11",
        password: "1234",
      }),
    ]),
  );

  await t.step("normal signup", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: true,
    });
  });

  await t.step("repeat username", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: ERROR_MESSAGE.ERROR_USERNAME_EXISTS,
    });
  });

  await t.step("short password", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: "String must contain at least 5 character(s)",
    });
  });

  mock.restore();
});

Deno.test("Endpoint Login", async (t) => {
  const ctx = testing.createMockContext({
    path: ROUTES.LOGIN,
    method: "POST",
  });

  const testUser = {
    username: "test_user_999",
    password: "12345677",
  };

  const testToken = "test_token";

  const mockRequestBody = stub(
    helper,
    "getRequestBody",
    returnsNext([
      Promise.resolve(testUser),
      Promise.resolve({ username: "sdasda", password: "fgfdgdf" }),
      Promise.resolve({ username: testUser.username, password: "fgfdgdf" }),
    ]),
  );
  const mockToken = stub(
    helper,
    "generateToken",
    returnsNext([Promise.resolve(testToken)]),
  );

  await t.step("test normal login", async () => {
    await userService.signup(testUser.username, testUser.password);

    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: true,
      data: {
        access_token: testToken,
      },
    });
  });
  await t.step("test wrong username", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: ERROR_MESSAGE.ERROR_USER_NOT_EXISTS,
    });
  });
  await t.step("test wrong password", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: ERROR_MESSAGE.ERROR_INVALID_PASSWORD,
    });
  });

  mockRequestBody.restore();
  mockToken.restore();
});

Deno.test("Endpoint Create Order", async (t) => {
  const testUser = {
    username: "test_user_create_order",
    password: "12345677",
  };

  const testItems = [
    {
      id: "p9943432432",
      product_name: "test product",
      price: 10,
      quantity: 1,
      category: "test",
    },
  ];

  const testUserInfo = await userService.signup(
    testUser.username,
    testUser.password,
  );
  const token = await userService.login(testUser.username, testUser.password);

  const ctx = testing.createMockContext({
    path: ROUTES.ORDER_CREATE,
    method: "POST",
    headers: [["Authorization", `Bearer ${token}`]],
  });

  await Promise.all(
    testItems.map((item) => {
      return dbClient.execute(
        `INSERT INTO products (id, product_name, price, quantity, category) values
    (?, ?, ?, ?, ?)
    `,
        [item.id, item.product_name, item.price, item.quantity, item.category],
      );
    }),
  );

  const mockRequestBody = stub(
    helper,
    "getRequestBody",
    returnsNext([
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
    ]),
  );

  await t.step("test create order", async () => {
    await router.routes()(ctx, next);

    const orders = await dbClient.query(
      "select id from orders where user_id = ?",
      [testUserInfo.id],
    );

    assertObjectMatch(ctx.response.body as object, {
      success: true,
      data: {
        order_id: orders[0].id,
      },
    });

    const users = await dbClient.query("select * from users where id = ?", [
      testUserInfo.id,
    ]);

    assertEquals(users[0].balance, 90);

    const orderItems = await dbClient.query(
      "select * from products where id = ?",
      [testItems[0].id],
    );

    assertEquals(orderItems[0].quantity, 0);
  });
  await t.step("test create order with no quantity", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: ERROR_MESSAGE.ERROR_MISSING_ORDER_PRODUCT,
    });
  });

  await t.step("test create order with no no balance", async () => {
    await dbClient.query("UPDATE products SET quantity = 10");
    await dbClient.query("UPDATE users SET balance = 0 where id = ?", [
      testUserInfo.id,
    ]);

    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: false,
      error_message: ERROR_MESSAGE.ERROR_INSUFFICIENT_BALANCE,
    });
  });

  mockRequestBody.restore();
});

Deno.test("Endpoint My Order", async (t) => {
  const testUser = {
    username: "test_user_my_order",
    password: "12345677",
  };

  const testItems = [
    {
      id: "p9943432",
      product_name: "test product",
      price: 10,
      quantity: 1,
      category: "test",
    },
  ];

  await Promise.all(
    testItems.map((item) => {
      return dbClient.execute(
        `INSERT INTO products (id, product_name, price, quantity, category) values
    (?, ?, ?, ?, ?)
    `,
        [item.id, item.product_name, item.price, item.quantity, item.category],
      );
    }),
  );

  const testUserInfo = await userService.signup(
    testUser.username,
    testUser.password,
  );

  const token = await userService.login(testUser.username, testUser.password);

  const ctx = testing.createMockContext({
    path: ROUTES.MY_ORDERS,
    method: "GET",
    headers: [["Authorization", `Bearer ${token}`]],
  });

  const order = await orderService.createOrder(
    testUserInfo.id,
    testItems.map((p) => ({ product_id: p.id })),
  );

  await t.step("test my order", async () => {
    await router.routes()(ctx, next);

    assertObjectMatch(ctx.response.body as object, {
      success: true,
      data: {
        orders: [
          {
            ...order,
            items: testItems.map((i) => ({
              product: {
                ...i,
                quantity: i.quantity - 1,
              },
            })),
          },
        ],
      },
    });
  });
});

Deno.test("cocurrent access", async (t) => {
  const testUser = {
    username: "test_user_cocurrent",
    password: "12345677",
  };

  const testItems = [
    {
      id: "p99434sda32",
      product_name: "test product",
      price: 10,
      quantity: 2,
      category: "test",
    },
  ];

  const testUserInfo = await userService.signup(
    testUser.username,
    testUser.password,
  );
  const token = await userService.login(testUser.username, testUser.password);

  const ctx = testing.createMockContext({
    path: ROUTES.ORDER_CREATE,
    method: "POST",
    headers: [["Authorization", `Bearer ${token}`]],
  });

  await Promise.all(
    testItems.map((item) => {
      return dbClient.execute(
        `INSERT INTO products (id, product_name, price, quantity, category) values
    (?, ?, ?, ?, ?)
    `,
        [item.id, item.product_name, item.price, item.quantity, item.category],
      );
    }),
  );

  const mockRequestBody = stub(
    helper,
    "getRequestBody",
    returnsNext([
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
      Promise.resolve({
        items: testItems.map((i) => ({
          product_id: i.id,
        })),
      }),
    ]),
  );

  await t.step("test cocurrent access", async () => {
    await Promise.allSettled([
      router.routes()(ctx, next),
      router.routes()(ctx, next),
      router.routes()(ctx, next),
    ]);

    const orderItems = await dbClient.query(
      "select quantity from products where id = ?",
      [testItems[0].id],
    );

    const orders = await dbClient.query(
      "select count(*) as count from orders where user_id = ?",
      [testUserInfo.id],
    );

    assertEquals(orders[0].count, 1);
    assertEquals(orderItems[0].quantity, testItems[0].quantity - 1);
  });

  mockRequestBody.restore();
});
