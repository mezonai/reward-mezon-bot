import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CallTools } from "./tools/call_tools";
import { ListTools } from "./tools/list_tools";
import sequelize from "./config/database";
import { client } from "./config/mezon-client";

dotenv.config();

const server = new Server(
  {
    name: "mezon-reward",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ListTools);
server.setRequestHandler(CallToolRequestSchema, async (request) =>
  CallTools(request)
);



async function main() {
  try {
    try {
      await sequelize.authenticate();
      console.log("✅ Kết nối PostgreSQL thành công");
      await sequelize.sync({ alter: true });
      const transport = new StdioServerTransport();
      await server.connect(transport);
      await client.login()
      console.log("Mezon MCP Clan running on stdio");
    } catch (error) {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
