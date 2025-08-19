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
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || "10"),
    min: parseInt(process.env.DB_POOL_MIN || "0"),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || "120000"),
    idle: parseInt(process.env.DB_POOL_IDLE || "10000"),
    evict: parseInt(process.env.DB_POOL_EVICT || "1000"),
  },
  retry: {
    max: parseInt(process.env.DB_RETRY_MAX || "3"),
  },
  dialectOptions: {
    statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT || "60000"),
    idle_in_transaction_session_timeout: parseInt(
      process.env.PG_IDLE_IN_TX_TIMEOUT || "60000"
    ),
  },
});

// sequelize.addHook("afterConnect", async (connection: any, config: any) => {
//   await connection.query(`SET TIME ZONE 'Asia/Ho_Chi_Minh'`);
// });

export default sequelize;
