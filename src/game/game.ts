// import { createHash } from "node:crypto";
import { randomInt } from "node:crypto";
import {
  db_games,
  db_rooms,
  db_users,
  db_winners,
  Game,
  maxRnd,
  Player,
  Room,
  User,
  Winner,
} from "../db/db.ts";
import { WebSocketLive } from "../ws/wsock";
export const reg_user = (username: string, passwd: string, userId: number) => {
  let res: string;
  const user = new User(username, passwd, userId);
  try {
    res = JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name: username,
        index: 0,
        error: false,
        errorText: "",
      }),
      id: 0,
    });
    db_users.add(userId, user);
  } catch (error) {
    res = JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name: username,
        index: 0,
        error: true,
        errorText: `${error}`,
      }),
      id: 0,
    });
  }
  return res;
};

export const create_room = (uid: number) => {
  const room = new Room();
  const user = db_users.get(uid);
  if (user !== undefined) {
    room.roomUsers.set(uid, user);
  } else {
    console.log("Oops! user is not find!");
  }

  db_rooms.add(room.roomId, room);
  return room;
};

export const update_rooms = (sockets: Map<number, WebSocketLive>) => {
  const r: object[] = [];

  db_rooms.get_all().forEach((room) => {
    const a: object[] = [];
    let i = 0;

    if (room.roomUsers.size > 1) {
      return; //send rooms list, where only one player inside
    }

    room.roomUsers.forEach((user) => {
      a[i++] = {
        name: `${user.name}`,
        index: i,
      };
    });

    r.push({
      roomId: room.roomId,
      roomUsers: a,
    });
  });

  const answer = JSON.stringify({
    type: "update_room",
    data: JSON.stringify(r),
    id: 0,
  });
  sockets.forEach(function each(ws) {
    if (ws.readyState === WebSocketLive.OPEN) {
      ws.send(answer);
    }
  });
  return answer;
};

export const update_room = (
  uid: number,
  rid: number,
  sockets: Map<number, WebSocketLive>,
) => {
  const room = db_rooms.get(rid);
  if (room === undefined) {
    console.log("Oops! room is not find!");
    return "";
  }
  const user = db_users.get(uid);
  if (user !== undefined) {
    room.roomUsers.set(uid, user);
  } else {
    console.log("Oops! user is not find!");
  }

  return update_rooms(sockets);
};

export const update_winners = (
  uid: number,
  sockets: Map<number, WebSocketLive>,
) => {
  const user = db_users.get(uid);
  if (user !== undefined) {
    const win = db_winners.get(uid);
    if (win === undefined) {
      db_winners.add(uid, new Winner(user.name, 0));
    }
  } else {
    console.log("Oops! user is not find!");
  }
  const w: object[] = [];

  db_winners.get_all().forEach((win) => {
    w.push({
      name: win.name,
      wins: win.wins,
    });
  });

  const answer = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(w),
    id: 0,
  });
  sockets.forEach(function each(ws) {
    if (ws.readyState === WebSocketLive.OPEN) {
      ws.send(answer);
    }
  });
  return answer;
};

export const add_users_to_room = (
  uid: number,
  indexRoom: number,
  sockets: Map<number, WebSocketLive>,
) => {
  const room = db_rooms.get(indexRoom);
  if (room === undefined) {
    console.log("Oops! room is not find!");
    return "";
  }
  if (room.roomUsers.get(uid) !== undefined) {
    return; //user is me
  }
  const user = db_users.get(uid);
  if (user !== undefined) {
    room.roomUsers.set(uid, user);
  } else {
    console.log("Oops! user is not find!");
  }

  update_rooms(sockets);

  const game_id = randomInt(maxRnd);

  room.roomUsers.forEach((user, uid) => {
    const ws = sockets.get(uid);
    if (ws !== undefined) {
      if (ws.readyState === WebSocketLive.OPEN) {
        const answer = JSON.stringify({
          type: "create_game", //send for both players in the room
          data: JSON.stringify({
            idGame: game_id,
            idPlayer: uid,
            // \* id for player in the game session, who have sent add_user_to_room request, not enemy *\
          }),
          id: 0,
        });
        ws.send(answer);
      }
    }
  });
  return true;
};

export const del_users_rooms = (
  uid: number,
  sockets: Map<number, WebSocketLive>,
) => {
  const keys: number[] = [];
  db_rooms.get_all().forEach((room, rid) => {
    if (room.roomUsers.size === 1) {
      if (room.roomUsers.get(uid) !== undefined) {
        keys.push(rid);
      }
    }
  });

  keys.forEach((key) => {
    db_rooms.del(key);
  });

  update_rooms(sockets);
};

export const add_ships = (
  userId: number,
  RoomId: number,
  data: object,
  sockets: Map<number, WebSocketLive>,
) => {
  if (
    "gameId" in data &&
    "indexPlayer" in data &&
    data.indexPlayer === userId &&
    "ships" in data &&
    data.ships instanceof Array
  ) {
    const gameId = Number(data.gameId);

    let game = db_games.get(gameId);

    const player = new Player(userId, data.ships);

    if (game === undefined) {
      game = new Game(RoomId, gameId);
      db_games.add(gameId, game);
      const room = db_rooms.get(RoomId);
      if (room !== undefined) room.game = game;
    }
    game.players.set(userId, player);

    if (game.players.size === 2) {
      game.players.forEach((_, uid) => {
        const ws = sockets.get(uid);
        if (ws !== undefined) {
          if (ws.readyState === WebSocketLive.OPEN) {
            const answer = JSON.stringify({
              type: "start_game", //send for both players in the room
              data: JSON.stringify({
                ships: data.ships,
                currentPlayerIndex: uid,
                // \* id for player in the game session, who have sent add_user_to_room request, not enemy *\
              }),
              id: 0,
            });
            ws.send(answer);
          }
        }
      });
      turn(gameId, sockets);
    }
  } else {
    console.log("Error parsing ships");
  }
};

export const attack = (
  // userId: number,
  data: object,
  sockets: Map<number, WebSocketLive>,
) => {
  if (
    "gameId" in data &&
    typeof data.gameId === "number" &&
    "indexPlayer" in data &&
    typeof data.indexPlayer === "number" &&
    "x" in data &&
    typeof data.x === "number" &&
    "y" in data &&
    typeof data.y === "number"
  ) {
    const gameId = data.gameId;
    const game = db_games.get(gameId);
    const x = data.x;
    const y = data.y;
    const indexPlayer = data.indexPlayer;
    if (game === undefined) {
      console.log("Error finding game");
      return;
    }

    if (game.turn != indexPlayer) return; //it isn't your step

    let shot = ""; //"miss"|"killed"|"shot",
    if (game.players.size === 2) {
      game.players.forEach((player, uid) => {
        if (uid != indexPlayer) {
          //alien
          const point = player.field[y][x];
          if (point < 99) {
            //is ship "killed"|"shot",
            if (player.ships[point].length <= 1) {
              shot = "killed";
              player.ships[point].length = 0;
            } else {
              shot = "shot";
              player.ships[point].length--;
            }
          } else {
            shot = "miss";
            // player.field[y][x] = 100 + point;
          }
        }
      });
      game.players.forEach((player, uid) => {
        const ws = sockets.get(uid);
        if (ws !== undefined) {
          if (ws.readyState === WebSocketLive.OPEN) {
            const answer = JSON.stringify({
              type: "attack", //send for both players in the room
              data: JSON.stringify({
                position: {
                  x: x,
                  y: y,
                },
                currentPlayer: indexPlayer, // id of the player in the current game session
                status: shot,
              }),
              id: 0,
            });
            ws.send(answer);
          }
        }
      });
      turn(gameId, sockets, shot === "miss" ? true : false);
    } else {
      console.log("Error parsing data");
      return;
    }
  }
};

export const turn = (
  gameId: number,
  sockets: Map<number, WebSocketLive>,
  turning = true,
) => {
  const game = db_games.get(gameId);
  if (game === undefined) {
    console.log("Error finding game");
    return;
  }

  if (turning) {
    for (const uid of game.players.keys()) {
      // game.players.forEach((_, uid) => {
      if (uid != game.turn) {
        game.turn = uid;
        break;
      }
    }
    // );
  }

  game.players.forEach((_, uid) => {
    const ws = sockets.get(uid);
    if (ws !== undefined) {
      if (ws.readyState === WebSocketLive.OPEN) {
        const answer = JSON.stringify({
          type: "turn", //send for both players in the room
          data: JSON.stringify({
            currentPlayer: game.turn, // id of the player in the current game session
          }),
          id: 0,
        });
        ws.send(answer);
      }
    }
  });
};
