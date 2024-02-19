import { createHash, randomInt } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import {
  reg_user,
  update_winners,
  add_users_to_room,
  create_room,
  update_room,
  del_users_rooms,
  add_ships,
  attack,
} from "../game/game";
import { db_users, maxRnd } from "../db/db";

export class WebSocketLive extends WebSocket {
  isAlive = false;
  userId = randomInt(maxRnd);
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
      switch (res.type) {
        case "reg":
          ws.userId = Number.parseInt(
            createHash("shake256", { outputLength: 4 })
              .update(`${res.data.name}${res.data.passwd}`)
              .digest("hex"),
            16,
          );
          ws.send(reg_user(res.data.name, res.data.password, ws.userId));
          sockets.set(ws.userId, ws);
          break;
        case "create_room":
          console.log(`userId is ${ws.userId}`);
          console.log(`username is ${db_users.get(ws.userId)?.name}`);
          // console.log(`users =`, db_users.get_all());
          const rid = create_room(ws.userId);
          if (rid) {
            update_room(ws.userId, rid.roomId, sockets);
            update_winners(ws.userId, sockets);
          }
        case "add_user_to_room":
          ws.RoomId = res.data.indexRoom;
          add_users_to_room(ws.userId, ws.RoomId, sockets);
          break;
        case "add_ships":
          add_ships(ws.userId, ws.RoomId, res.data, sockets);
          break;
        case "attack":
          attack(res.data, sockets);
          break;
      }
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
