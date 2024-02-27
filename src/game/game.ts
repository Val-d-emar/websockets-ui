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

export const reg_user = (
  username: string,
  passwd: string,
  ws: WebSocketLive,
  sockets: Map<number, WebSocketLive>,
) => {
  let user = db_users.get(ws.userId);
  const sock = sockets.get(ws.userId);
  if (sock !== undefined) {
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: username,
          index: 0,
          error: true,
          errorText: `User ${username} is already playing another game!`,
        }),
        id: 0,
      }),
    );
    return;
  } else if (user !== undefined) {
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: username,
          index: 0,
          error: false,
          errorText: "",
        }),
        id: 0,
      }),
    );
    sockets.set(ws.userId, ws);
    return;
  }

  let newuser: boolean = true;
  db_users.get_all().forEach((u) => {
    if (u.name === username) {
      newuser = false;
      ws.send(
        JSON.stringify({
          type: "reg",
          data: JSON.stringify({
            name: username,
            index: 0,
            error: true,
            errorText: `Name ${username} already have another user`,
          }),
          id: 0,
        }),
      );
      return;
    }
  });

  if (newuser) {
    if (user === undefined) user = new User(username, passwd, ws.userId);

    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: username,
          index: 0,
          error: false,
          errorText: "",
        }),
        id: 0,
      }),
    );

    db_users.add(ws.userId, user);
    sockets.set(ws.userId, ws);
    return;
  }
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

    room.roomUsers.forEach((user, uid) => {
      a[i++] = {
        name: `${user.name}`,
        index: uid,
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

  db_winners.get_all().forEach((winner) => {
    w.push({
      name: winner.name,
      wins: winner.wins,
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
    return;
  }
  if (room.roomUsers.get(uid) !== undefined) {
    console.log("Oops! user is me");
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
  let game = db_games.get(game_id);

  if (game === undefined) {
    game = new Game(indexRoom, game_id);
    db_games.add(game_id, game);
  }
  room.game = game;

  room.roomUsers.forEach((_, uid) => {
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

    if (game === undefined) {
      game = new Game(RoomId, gameId);
      db_games.add(gameId, game);
    }
    const room = db_rooms.get(RoomId);
    if (room !== undefined) room.game = game;

    const player = new Player(userId, data.ships);
    game.players.set(userId, player);

    if (game.players.size === 2) {
      game.players.forEach((plr, uid) => {
        const ws = sockets.get(uid);
        if (ws !== undefined) {
          if (ws.readyState === WebSocketLive.OPEN) {
            const answer = JSON.stringify({
              type: "start_game", //send for both players in the room
              data: JSON.stringify({
                ships: plr.ships,
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

const attackXY = (
  xx: number,
  yy: number,
  game: Game,
  sockets: Map<number, WebSocketLive>,
  shot: string,
  indexPlayer: number,
) => {
  game.players.forEach((_player: Player, uid: number) => {
    const ws = sockets.get(uid);
    if (ws !== undefined) {
      if (ws.readyState === WebSocketLive.OPEN) {
        const answer = JSON.stringify({
          type: "attack", //send for both players in the room
          data: JSON.stringify({
            position: {
              x: xx,
              y: yy,
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
};

export const attack = (data: object, sockets: Map<number, WebSocketLive>) => {
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
      return false;
    }

    if (game.turn != indexPlayer) return false; //it isn't your step

    let shot = ""; //"miss"|"killed"|"shot",
    if (game.players.size === 2) {
      game.players.forEach((player, uid) => {
        if (uid != indexPlayer) {
          //alien
          const point: number = player.field[y][x];
          if (point < 10) {
            //is ship "killed"|"shot",
            const ship = player.ships[point];
            if (ship.destroyed <= 1) {
              shot = "killed";
              ship.destroyed = 0;
              console.log(`ship: `, ship);
              console.log(`ship.position: `, ship.position);
              const yy = ship.position.y;
              const xx = ship.position.x;
              const oy = ship.direction;

              for (let i = 0; i < ship.length; i++) {
                const x_ = oy ? xx : xx + i;
                const y_ = oy ? yy + i : yy;
                attackXY(x_, y_, game, sockets, shot, indexPlayer);
                player.field[y_][x_] += 200;
              }
              // shot = "miss";
              for (
                let x_ = xx - 1;
                x_ <= (oy ? xx + 1 : xx + ship.length);
                x_++
              ) {
                for (
                  let y_ = yy - 1;
                  y_ <= (oy ? yy + ship.length : yy + 1);
                  y_++
                ) {
                  if (
                    x_ >= 0 &&
                    y_ >= 0 &&
                    x_ < 10 &&
                    y_ < 10 &&
                    player.field[y_][x_] === 99
                  ) {
                    attackXY(x_, y_, game, sockets, "miss", indexPlayer);
                    player.field[y_][x_] += 100;
                  }
                }
              }
              player.score++;
              if (player.score >= player.ships.length) {
                //finished
                finish(indexPlayer, gameId, sockets);
              }
            } else {
              shot = "shot";
              player.ships[point].destroyed--;
              attackXY(x, y, game, sockets, shot, indexPlayer);
              player.field[y][x] += 100;
            }
          } else if (point == 99) {
            shot = "miss";
            attackXY(x, y, game, sockets, shot, indexPlayer);
            player.field[y][x] += 100;
          } else if (point >= 100 && point < 199) {
            // already shotted
            attackXY(x, y, game, sockets, "shot", indexPlayer);
            shot = "miss";
          } else if (point >= 200) {
            // already killed
            attackXY(x, y, game, sockets, "killed", indexPlayer);
            shot = "miss";
          } else if (point == 199) {
            // already missed
            shot = "miss";
            attackXY(x, y, game, sockets, shot, indexPlayer);
          }
          turn(gameId, sockets, shot === "miss" ? true : false);
          return true;
        }
      });
    } else {
      console.log("Error parsing data");
      return false;
    }
  }
};

export const randomAttack = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { [x: string]: any },
  sockets: Map<number, WebSocketLive>,
) => {
  data.x = randomInt(10);
  data.y = randomInt(10);
  attack(data, sockets);
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
      if (uid != game.turn) {
        game.turn = uid;
        break;
      }
    }
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

export const finish = (
  playerId: number,
  gameId: number,
  sockets: Map<number, WebSocketLive>,
) => {
  const game = db_games.get(gameId);
  if (game === undefined) {
    console.log("Error finding game");
    return;
  }

  game.players.forEach((_, uid) => {
    const ws = sockets.get(uid);
    if (ws !== undefined) {
      if (ws.readyState === WebSocketLive.OPEN) {
        const answer = JSON.stringify({
          type: "finish", //send for both players in the room
          data: JSON.stringify({
            winPlayer: playerId, // id of the player in the current game session
          }),
          id: 0,
        });
        ws.send(answer);
      }
    }
  });
  const winner = db_winners.get(playerId);
  if (winner !== undefined) {
    winner.wins++;
  }
  update_winners(playerId, sockets);
};
