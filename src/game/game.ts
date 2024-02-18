// import { createHash } from "node:crypto";
import { randomInt, randomUUID } from "node:crypto";
import {
  db_games,
  db_rooms,
  db_users,
  db_winners,
  maxRnd,
  Room,
  User,
  Winner,
} from "../db/db.ts";
import WebSocket from "ws";
export const reg_user = (username: string, passwd: string, userId: string) => {
  let res: string;
  // if (userId === '') {
  //     userId = createHash('sha256').update(`${passwd}${username}`).digest('hex');
  // }
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

export const create_room = (uid: string) => {
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

export const update_rooms = (sockets: Map<string, WebSocket>) => {
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
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(answer);
    }
  });
  return answer;
};

export const update_room = (
  uid: string,
  rid: number,
  sockets: Map<string, WebSocket>,
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
  uid: string,
  sockets: Map<string, WebSocket>,
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
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(answer);
    }
  });
  return answer;
};

export const add_users_to_room = (
  uid: string,
  indexRoom: number,
  sockets: Map<string, WebSocket>,
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
  let i = 0;
  room.roomUsers.forEach((user, uid) => {
    const ws = sockets.get(uid);
    if (ws !== undefined) {
      if (ws.readyState === WebSocket.OPEN) {
        const answer = JSON.stringify({
          type: "create_game", //send for both players in the room
          data: JSON.stringify({
            idGame: game_id,
            idPlayer: i++,
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
  uid: string,
  sockets: Map<string, WebSocket>,
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