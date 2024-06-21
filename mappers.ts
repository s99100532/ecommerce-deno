import { OrderDTO, OrderListResponseData } from "./types/dto.ts";
import { Order, OrderItem, Product } from "./types/models.ts";

//////////////////////////////////////////////////
/// Map the model data to Response data (DTO)  ///
//////////////////////////////////////////////////

function toOrdersWithProducts(
  orders: (Pick<OrderItem, "order_id"> &
    Product &
    Pick<Order, "user_id" | "status">)[]
): OrderListResponseData["orders"] {
  const orderWithProducts: {
    [orderId: number]: OrderDTO;
  } = {};

  orders.forEach(({ order_id, user_id, status, ...product }) => {
    if (!orderWithProducts[order_id]) {
      orderWithProducts[order_id] = {
        user_id,
        id: order_id,
        status,
        items: [],
      };
    }

    orderWithProducts[order_id].items.push({ product });
  });

  return Object.values(orderWithProducts);
}

export { toOrdersWithProducts };
