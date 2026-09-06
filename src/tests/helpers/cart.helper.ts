import { pool } from "../../db/db.js";

export const createProductGetId = async (): Promise<number> => {
  const response = await pool.query(
    "insert into products (title,description,price,stock, category) values($1,$2,$3,$4,$5) returning id",
    [
      "Iphone 13 pro max",
      "Iphone 13 pro max with 256gb storage",
      250000,
      15,
      "Phone",
    ],
  );

  return response.rows[0].id;
};

export const deleteProductWithId = async (id: number) => {
  await pool.query("delete from products where id=$1", [id]);
};
export const getCartBelongsToUser = async (userId: number) => {
  const response = await pool.query(
    "select * from carts where user_id=$1 returning id",
    [userId],
  );
  return response.rows[0].id;
};

export const afterEachCleanUp = async (): Promise<void> => {
  await pool.query(
    "delete from cart_items where cart_id=(select id from carts where user_id=(select id from users where email=$1)) and product_id = (select id from products where title = $2)",
    ["test@example.com", "Iphone 13 pro max"],
  );
  await pool.query(
    "delete from carts where user_id= (select id from users where email=$1)",
    ["test@example.com"],
  );
  await pool.query("delete from products where title=$1", [
    "Iphone 13 pro max",
  ]);
  await pool.query("delete from users where email=$1", ["test@example.com"]);
};
