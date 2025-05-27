import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: (process.env.DB_PASSWORD as string)!,
  database: process.env.DB_NAME as string,
  logging: false,
});

// sequelize.addHook("afterConnect", async (connection: any, config: any) => {
//   await connection.query(`SET TIME ZONE 'Asia/Ho_Chi_Minh'`);
// });

export default sequelize;
