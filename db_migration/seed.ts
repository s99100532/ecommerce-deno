import { parse } from "@std/csv";
import { Client } from "mysql";
import { Product } from "../types/models.ts";
import helper from "../helpers.ts";

const run_seed = async (client: Client) => {
  const seed_csv = await Deno.readTextFile(
    `${import.meta.dirname}/product_items.csv`,
  );
  const seed = parse(seed_csv, {
    skipFirstRow: true,
    strip: true,
  }) as unknown as Product[];

  const values = seed.map(
    (item) =>
      "(" +
      [
        `"${item.id}"`,
        `"${item.product_name}"`,
        `${item.price}`,
        `${item.quantity}`,
        `"${item.category}"`,
      ].join(",") +
      ")",
  );

  const stmts = `INSERT INTO 
products (id, product_name, price, quantity, category) values 
  ${values.join(",")}
  `;

  await client.execute(stmts);
};

if (import.meta.main) {
  // Open a database
  const client = await helper.getDBClient();

  await run_seed(client);
}
