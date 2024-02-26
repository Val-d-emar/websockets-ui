// import { createHash } from "node:crypto";
import { createHash, randomInt } from "node:crypto";
import {
  db_games,
  db_rooms,
  db_users,
  db_winners,
  Player,
  User,
  Winner,
} from "../db/db.ts";
import { WebSocketLive } from "../ws/wsock";
import { createRequire } from "module";
import {
  add_ships,
  add_users_to_room,
  attack,
  create_room,
  update_rooms,
  update_winners,
} from "./game";
const require = createRequire(import.meta.url);
const ships_vars = require("./data.json");

export const single_play = (
  ws: WebSocketLive,
  sockets: Map<number, WebSocketLive>,
) => {
  //create Bot
  const botId = Number.parseInt(
    createHash("shake256", { outputLength: 4 })
      .update(`Bot for ${ws.botID}`)
      .digest("hex"),
    16,
  );
  const user = new User(
    `Bot for ${db_users.get(ws.userId)?.name}`,
    `Passwd ${db_users.get(ws.userId)?.name}`,
    botId,
  );

  db_users.add(botId, user);

  const bot_room = create_room(botId);
  update_rooms(sockets);
  const win = db_winners.get(botId);
  if (win === undefined) {
    db_winners.add(botId, new Winner(user.name, 0));
  }

  update_winners(ws.userId, sockets);

  ws.botID = botId;
  ws.RoomId = bot_room.roomId;

  add_users_to_room(ws.userId, ws.RoomId, sockets);

  const botships = ships_vars[randomInt(ships_vars.length)];
  const data = {
    gameId: bot_room.game.idGame,
    ships: botships,
    indexPlayer: botId /* id of the player in the current game session */,
  };

  add_ships(botId, ws.RoomId, data, sockets);

  let xx = randomInt(10);
  let yy = randomInt(10);
  const shots = new Map<number, { x: number; y: number }>();
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      shots.set(x + y * 10, { x: x, y: y });
    }
  }

  const cb = () => {
    const game = db_games.get(bot_room.game.idGame);
    let player: Player | undefined;
    if (game !== undefined) {
      player = game.players.get(ws.userId);
      if (player === undefined) {
        console.error("something went wrong player === undefined");
        setTimeout(cb, 1000);
        return;
      }
    } else console.error("something went wrong game === undefined");

    const cb2 = () => {
      if (bot_room.game.turn != botId) {
        setTimeout(cb2, 1000);
        return;
      } //it isn't your step

      if (player === undefined) {
        setTimeout(cb2, 1000);
        return;
      }
      const field = player.field;

      attack(
        {
          gameId: bot_room.game.idGame,
          x: xx,
          y: yy,
          indexPlayer: botId /* id of the player in the current game session */,
        },
        sockets,
      );
      shots.delete(xx + yy * 10);

      let i = 0;
      shots.forEach((val, key) => {
        if (field[val.y][val.x] >= 200) {
          i++;
          shots.delete(key);
        }
      });
      if (shots.size === 0 || i === 20) {
        //game over
        db_games.del(bot_room.game.idGame);
        db_rooms.del(botId);
        db_users.del(botId);
        return;
      }

      const zone = new Array<{ x: number; y: number }>();

      shots.forEach((val, key) => {
        if (field[val.y][val.x] >= 100) {
          shots.delete(key);
        } else zone.push(val);
      });
      // }
      if (zone.length >= 1) {
        const shot = zone.length == 1 ? 0 : randomInt(zone.length);
        xx = zone[shot].x;
        yy = zone[shot].y;
      }
      if (shots.size > 0) setTimeout(cb2, 1000);
    };
    setTimeout(cb2, 1000);
  };
  setTimeout(cb, 1000);
};
