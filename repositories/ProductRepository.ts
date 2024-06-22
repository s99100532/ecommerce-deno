import { ERROR_MESSAGE } from "../constants.ts";
import { RepositoryError } from "../exceptions.ts";
import { Product } from "../types/models.ts";
import Repository from "./Repository.ts";

export default class ProductRepository extends Repository {
  async getAvalibleProductByIds(
    ids: string[],
  ): Promise<Pick<Product, "id" | "price" | "quantity">[]> {
    try {
      const result = await this.dbClient.query(
        `select id, quantity, price from products where id in (${
          ids
            .map(() => "?")
            .join(",")
        }) and quantity > 0`,
        [ids],
      );
      return result;
    } catch (e) {
      this.logger.error(e);

      throw new RepositoryError(ERROR_MESSAGE.ERROR_UNKNOWN);
    }
  }
}
