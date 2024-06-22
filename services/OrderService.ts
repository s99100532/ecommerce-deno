import { ERROR_MESSAGE } from "../constants.ts";
import { OrderError, UserError } from "../exceptions.ts";
import {
  OrderRepository,
  ProductRepository,
  UserRepository,
} from "../repositories/mod.ts";

export default class OrderService {
  orderRepository: OrderRepository;
  productRepository: ProductRepository;
  userRepository: UserRepository;
  constructor(
    orderRepository: OrderRepository,
    productRespository: ProductRepository,
    userRespository: UserRepository,
  ) {
    this.orderRepository = orderRepository;
    this.productRepository = productRespository;
    this.userRepository = userRespository;
  }

  async createOrder(userId: number, orderProducts: { product_id: string }[]) {
    const products = await this.productRepository.getAvalibleProductByIds(
      orderProducts.map((p) => p.product_id),
    );

    if (products.length != orderProducts.length) {
      throw new OrderError(ERROR_MESSAGE.ERROR_MISSING_ORDER_PRODUCT);
    }

    const amount = products.reduce((acc, val) => {
      acc += val.price;

      return acc;
    }, 0);

    const userInfo = await this.userRepository.getUserInfo(userId);

    if (!userInfo) {
      throw new UserError(ERROR_MESSAGE.ERROR_USER_NOT_EXISTS);
    }

    if (amount > userInfo.balance) {
      throw new OrderError(ERROR_MESSAGE.ERROR_INSUFFICIENT_BALANCE);
    }

    const order = await this.orderRepository.createOrder(
      userId,
      products,
      amount,
    );

    return order;
  }

  async getUserOrders(userId: number) {
    const orders = await this.orderRepository.getUserOrders(userId);

    return orders;
  }
}
