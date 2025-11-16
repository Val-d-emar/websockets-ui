import { httpServer } from "./src/http_server/index.js";
import { startWebSocketServer } from "./src/ws/wsock.ts";
import "dotenv/config";

const HTTP_PORT = process.env.HTTP_PORT || 8181;

httpServer.listen(HTTP_PORT, "localhost", () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
  startWebSocketServer();
});
