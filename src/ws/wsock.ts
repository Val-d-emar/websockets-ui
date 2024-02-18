import { createHash, randomInt, randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import {
  reg_user,
  update_winners,
  add_users_to_room,
  create_room,
  update_room,
  del_users_rooms,
} from "../game/game";
import { db_users, maxRnd } from "../db/db";

export class WebSocketLive extends WebSocket {
  isAlive = false;
}
export const wss = new WebSocketServer({ port: 3000, clientTracking: true });

const sockets = new Map<string, WebSocketLive>();

const interval = setInterval(function ping() {
  sockets.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 10000);

wss.on("connection", function connection(ws: WebSocketLive, request: object) {
  ws.isAlive = true;
  let userId =
    "rawHeaders" in request
      ? createHash("shake256", { outputLength: 4 })
        .update(JSON.stringify(request.rawHeaders))
        .digest("hex")
      : `${randomUUID}`;
  // let userId =
  // "rawHeaders" in request
  //   ? Number.parseInt(
  //       createHash("shake256", { outputLength: 4 })
  //         .update(JSON.stringify(request.rawHeaders))
  //         .digest("hex"),
  //       16,
  //     )
  //   : `${randomUUID}`;
  // let userId = randomInt(maxRnd);
  // console.log(request);

  ws.on("error", console.error);
  ws.on("pong", function a() {
    ws.isAlive = true;
  });

  ws.on("message", function message(msg) {
    console.log(`Received message ${msg} from user ${userId}`);
    try {
      const res = JSON.parse(msg.toString());
      if (typeof res.data === "string" && res.data.length > 1) {
        res.data = JSON.parse(res.data);
      }
      switch (res.type) {
        case "reg":
          userId = createHash("shake256", { outputLength: 4 })
            .update(`${res.data.name}${res.data.passwd}`)
            .digest("hex");
          ws.send(reg_user(res.data.name, res.data.password, userId));
          sockets.set(userId, ws);
          break;
        case "create_room":
          if (userId !== "") {
            console.log(`userId is ${userId}`);
            console.log(`username is ${db_users.get(userId)?.name}`);
            console.log(`users =`, db_users.get_all());
            const rid = create_room(userId);
            if (rid) {
              update_room(userId, rid.roomId, sockets);
              update_winners(userId, sockets);
            }
          } else console.log("Oops! userId is empty!");
          break;
        case "add_user_to_room":
          if (userId !== "") {
            console.log(`userId is ${userId}`);
            console.log(`username is ${db_users.get(userId)?.name}`);
            console.log(`users =`, db_users.get_all());
            add_users_to_room(userId, res.data.indexRoom, sockets);
          } else console.log("Oops! userId is empty!");
          break;
      }
      console.log(res);
    } catch (e) {
      console.error("Error data parsing", e);
    }
  });

  ws.on("close", function () {
    clearInterval(interval);
    sockets.delete(userId);
    del_users_rooms(userId, sockets);
  });
});
