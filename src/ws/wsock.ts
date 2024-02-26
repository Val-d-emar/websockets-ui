import { createHash, randomInt } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";

import { maxRnd } from "../db/db";
import { parse_event } from "./events";
import { del_users_rooms } from "../game/game";

export class WebSocketLive extends WebSocket {
  isAlive = false;
  userId = randomInt(maxRnd);
  botID = randomInt(maxRnd);
  RoomId = 0;
}
export const wss = new WebSocketServer({ port: 3000, clientTracking: true });

const sockets = new Map<number, WebSocketLive>();

const interval = setInterval(function ping() {
  sockets.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

wss.on("connection", function connection(ws: WebSocketLive, request: object) {
  ws.isAlive = true;
  ws.userId =
    "rawHeaders" in request
      ? Number.parseInt(
          createHash("shake256", { outputLength: 4 })
            .update(JSON.stringify(request.rawHeaders))
            .digest("hex"),
          16,
        )
      : randomInt(maxRnd);

  ws.on("error", console.error);
  ws.on("pong", function a() {
    ws.isAlive = true;
  });

  ws.on("message", function message(msg) {
    console.log(`Received message ${msg} from user ${ws.userId}`);
    try {
      const res = JSON.parse(msg.toString());
      if (typeof res.data === "string" && res.data.length > 1) {
        res.data = JSON.parse(res.data);
      }
      parse_event(res, ws, sockets);
      console.log(res);
    } catch (e) {
      console.error("Error data parsing", e);
    }
  });

  ws.on("close", function () {
    clearInterval(interval);
    sockets.delete(ws.userId);
    del_users_rooms(ws.userId, sockets);
  });
});
