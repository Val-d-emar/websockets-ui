import { createHash } from "node:crypto";
import { db_users } from "../db/db";
import {
  reg_user,
  update_winners,
  add_users_to_room,
  create_room,
  update_room,
  add_ships,
  attack,
  randomAttack,
} from "../game/game";
import { WebSocketLive } from "./wsock";
import { single_play } from "../game/bot";

export class Request extends Object {
  type!: string;
  data!: {
    password: string;
    name: string;
    indexRoom: number;
  };
}

export const parse_event = (
  req: Request,
  ws: WebSocketLive,
  sockets: Map<number, WebSocketLive>,
) => {
  switch (req.type) {
    case "reg":
      ws.userId = Number.parseInt(
        createHash("shake256", { outputLength: 4 })
          .update(`${req.data.name}${req.data.password}`)
          .digest("hex"),
        16,
      );
      reg_user(req.data.name, req.data.password, ws, sockets);
      console.log(`userId is ${ws.userId}`);
      console.log(`username is ${db_users.get(ws.userId)?.name}`);
      break;
    case "create_room":
      const room = create_room(ws.userId);
      update_room(ws.userId, room.roomId, sockets);
      update_winners(ws.userId, sockets);
    case "add_user_to_room":
      ws.RoomId = req.data.indexRoom;
      add_users_to_room(ws.userId, ws.RoomId, sockets);
      break;
    case "add_ships":
      add_ships(ws.userId, ws.RoomId, req.data, sockets);
      break;
    case "attack":
      attack(req.data, sockets);
      break;
    case "randomAttack":
      randomAttack(req.data, sockets);
      break;
    case "single_play":
      single_play(ws, sockets);
      break;
  }
};
