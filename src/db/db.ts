import { randomInt } from "node:crypto";
export const maxRnd = Math.pow(2, 47);

export class Record {}

export class Winner extends Record {
  constructor(
    public name: string,
    public wins: number,
  ) {
    super();
  }
}
export class Game extends Record {
  constructor(
    public roomId: number,
    public idGame: number = randomInt(maxRnd),
    public gamers: Map<number, User> = new Map<number, User>(),
  ) {
    super();
  }
  static check(game: object) {
    return (
      "roomId" in game &&
      "idGame" in game &&
      "gamers" in game &&
      typeof game.roomId === "number" &&
      typeof game.idGame === "number" &&
      game.gamers instanceof Map &&
      Object.keys(game).length == 3
    );
  }
}

export class Room extends Record {
  constructor(
    public roomId: number = randomInt(maxRnd),
    public roomUsers: Map<string, User> = new Map<string, User>(),
  ) {
    super();
  }
  static check(room: object) {
    return (
      "roomId" in room &&
      "roomUsers" in room &&
      typeof room.roomId === "number" &&
      room.roomUsers instanceof Map &&
      Object.keys(room).length == 2
    );
  }
}
export class User extends Record {
  public name: string;
  public password: string;
  public id: string;
  public game: Map<string, Record>;
  constructor(
    name?: string,
    password?: string,
    id?: string,
    game?: Map<string, Record>,
  ) {
    super();
    this.name = name === undefined ? `User${randomInt(maxRnd)}` : name;
    this.password = password === undefined ? "" : password;
    this.id = id === undefined ? "" : id;
    this.game = game === undefined ? new Map<string, Record>() : game;
  }
  static check(user: object) {
    return (
      "name" in user &&
      "password" in user &&
      "game" in user &&
      "id" in user &&
      typeof user.name === "string" &&
      typeof user.password === "string" &&
      user.game instanceof Map &&
      typeof user.id === "string" &&
      Object.keys(user).length <= 4
    );
  }
}

export class DB_api<K extends string | number, T extends Record> {
  private _db: Map<K, T>;
  constructor() {
    this._db = new Map<K, T>();
  }
  public get(uid: K) {
    return this._db.get(uid);
  }
  public get_all() {
    return this._db;
  }
  public add(uid: K, record: T) {
    this._db.set(uid, record);
    return this._db.get(uid);
  }
  public update(uid: K, record: T) {
    if (this.get(uid)) {
      // record.id = uid;
      this._db.set(uid, record);
      return this._db.get(uid);
    }
    return false;
  }
  public del(uid: K) {
    return this._db.delete(uid);
  }
}

export const db_users = new DB_api<string, User>();
export const db_rooms = new DB_api<number, Room>();
export const db_games = new DB_api<string, Game>();
export const db_winners = new DB_api<string, Winner>();
