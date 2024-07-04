export enum OrderStatus {
  CREATED = "CREATED",
}

export type Order = {
  id: number;
  user_id: number;
  status: OrderStatus;
};

export type OrderItem = {
  order_id: number;
  product_id: string;
};

export type Product = {
  id: string;
  quantity: number;
  version: number;
  price: number;
  product_name: string;
  category: string;
};

export type User = {
  id: number;
  username: string;
  password_hash: string;
  balance: number;
};
