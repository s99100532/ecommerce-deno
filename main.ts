import { Application, Router } from "@oak/oak";
import UserService from "./services/UserService.ts";
import UserRepository from "./repositories/UserRepository.ts";
import {
  CreateOrderValidator,
  LoginValidator,
  SignupValidator,
} from "./validators.ts";
import helper from "./helpers.ts";
import OrderService from "./services/OrderService.ts";
import ProductRepository from "./repositories/ProductRepository.ts";
import OrderRepository from "./repositories/OrderRepository.ts";
import { authMiddleware } from "./middlewares.ts";
import { ContextState } from "./types/request.ts";
import { toOrdersWithProducts } from "./mappers.ts";
import {
  CreateOrderResponseData,
  LoginResponseData,
  OrderListResponseData,
  SignupResponseData,
} from "./types/dto.ts";
import { ROUTES } from "./constants.ts";

// Create All the dependencies on root level
const app = new Application();
const router = new Router<ContextState>();

const dbClient = await helper.getDBClient();

const userRepository = new UserRepository(dbClient);
const productRepository = new ProductRepository(dbClient);
const orderRepository = new OrderRepository(dbClient);

const userService = new UserService(userRepository);
const orderService = new OrderService(
  orderRepository,
  productRepository,
  userRepository,
);



router.post(ROUTES.SIGNUP, async (context) => {
  await helper.wrapError(context, async () => {
    const { getEnv } = helper;

    const body = await helper.getRequestBody(context);
    const payload = SignupValidator.parse(body);

    await userService.signup(payload.username, payload.password);
    const redirect_url = `${getEnv("APP_URL")}:${getEnv("PORT")}${
      ROUTES.LOGIN
    }`;

    helper.setAPIResponse<SignupResponseData>(context, {
      success: true,
      data: { redirect_url },
    });
  });
});
router.post(ROUTES.LOGIN, async (context) => {
  await helper.wrapError(context, async () => {
    const body = await helper.getRequestBody(context);
    const payload = LoginValidator.parse(body);

    const access_token = await userService.login(
      payload.username,
      payload.password,
    );

    helper.setAPIResponse<LoginResponseData>(context, {
      success: true,
      data: { access_token },
    });
  });
});
router.post(ROUTES.ORDER_CREATE, authMiddleware, async (context) => {
  await helper.wrapError(context, async () => {
    const body = await helper.getRequestBody(context);
    const payload = CreateOrderValidator.parse(body);

    const userId = context.state.user_id;

    const result = await orderService.createOrder(userId, payload.items);

    helper.setAPIResponse<CreateOrderResponseData>(context, {
      success: true,
      data: { order_id: result.id },
    });
  });
});

router.get(ROUTES.MY_ORDERS, authMiddleware, async (context) => {
  await helper.wrapError(context, async () => {
    const userId = context.state.user_id;

    const orders = await orderService.getUserOrders(userId);

    helper.setAPIResponse<OrderListResponseData>(context, {
      success: true,
      data: { orders: toOrdersWithProducts(orders) },
    });
  });
});

app.use(router.routes());
app.use(router.allowedMethods());

if (import.meta.main) {
  const port = parseInt(helper.getEnv("PORT"));

  app.addEventListener("listen", () =>
    console.log(`Server listensing on PORT ${port}`),
  );
  await app.listen({ port });

  app;
}


// Export for testing
export { router, userService, orderService, dbClient };
