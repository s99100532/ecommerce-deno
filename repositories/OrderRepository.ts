import { ERROR_MESSAGE } from "../constants.ts";
import { RepositoryError } from "../exceptions.ts";
import { Order, OrderItem, OrderStatus, Product } from "../types/models.ts";
import Repository from "./Repository.ts";

export default class OrderRepository extends Repository {
  async getUserOrders(
    userId: number,
  ): Promise<
    (
      & Pick<OrderItem, "order_id">
      & Pick<Order, "status" | "user_id">
      & Product
    )[]
  > {
    try {
      const orders = await this.dbClient.query(
        `
      select oi.order_id, p.*, o.status, o.user_id from order_item as oi inner join products as p on p.id = oi.product_id inner join orders as o on o.id = oi.order_id where o.user_id = ?
      `,
        [userId],
      );

      return orders;
    } catch (e) {
      this.logger.error(e);

      throw new RepositoryError(ERROR_MESSAGE.ERROR_UNKNOWN);
    }
  }
  async createOrder(
    userId: number,
    orderProducts: { id: string; price: number }[],
    amount: number,
  ): Promise<Order> {
    try {
      const result = await this.dbClient.transaction<Order>(async (conn) => {
        const createOrderStmt =
          `INSERT INTO orders (user_id, status) values (?, ?)`;
        const orderStatus = OrderStatus.CREATED;

        const orderCreateResult = await conn.execute(createOrderStmt, [
          userId,
          orderStatus,
        ]);

        const orderId = orderCreateResult.lastInsertId;

        if (!orderId) {
          throw new Error("order create fail");
        }

        const createItemsStmt =
          `INSERT INTO order_item (order_id, product_id) values
          ${orderProducts.map(() => "(?, ?)").join(",")}`;

        const createItemResult = await conn.execute(
          createItemsStmt,
          orderProducts
            .map((pd) => [orderId, pd.id])
            .flat(),
        );

        if (!createItemResult.affectedRows) {
          throw new Error("items create fail");
        }

        const updateQuantityStmt =
          `UPDATE products SET quantity = quantity - 1 where id in 
          (${orderProducts.map((_) => "?").join(",")})`;

        const updateQuantityResult = await conn.execute(
          updateQuantityStmt,
          orderProducts.map((p) => p.id),
        );

        if (updateQuantityResult.affectedRows != orderProducts.length) {
          throw new Error("quantity update fail");
        }

        const updateBalanceStmt =
          `UPDATE users SET balance = balance - ? where id = (?) `;

        const updateBalanceResult = await conn.execute(updateBalanceStmt, [
          amount,
          userId,
        ]);

        if (updateBalanceResult.affectedRows != 1) {
          throw new Error("balance update fail");
        }

        return {
          id: orderId,
          status: orderStatus,
          user_id: userId,
        };
      });

      return result;
    } catch (e) {
      this.logger.error(e);

      throw new RepositoryError(ERROR_MESSAGE.ERROR_CREATE_ORDER);
    }
  }
}
