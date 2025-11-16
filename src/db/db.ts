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

export class Point {
  public x: number = 0;
  public y: number = 0;
  constructor(obj?: object) {
    if (obj !== undefined) {
      this.x = "x" in obj ? Number(obj.x) : 0;
      this.y = "y" in obj ? Number(obj.y) : 0;
    }
  }
}

export enum shipType {
  small = "small",
  medium = "medium",
  large = "large",
  huge = "huge",
}

export class Ship {
  public position: Point = new Point();
  public direction: boolean = true;
  public length: number = 1;
  public type: shipType = shipType.small;
  public destroyed: number = 1;
  constructor(obj: object) {
    this.position = "position" in obj ? new Point(obj.position!) : new Point();
    this.direction = "direction" in obj ? Boolean(obj.direction) : true;
    this.length = "length" in obj ? Number(obj.length) : 1;
    this.destroyed = this.length;
    this.type = "type" in obj ? (obj.type as shipType) : shipType.small;
  }
}

export class Player {
  public score: number = 0;
  public ships: Ship[] = [];
  public field: number[][] = [];
  constructor(
    public indexPlayer: number,
    ships: object,
    field?: number[][],
  ) {
    if (ships instanceof Array) {
      ships.forEach((s) => {
        this.ships.push(new Ship(s));
      });
    } else throw new Error("Wrong ships format");
    if (field === undefined) {
      for (let y = 0; y < 10; y++) {
        this.field.push([]);
        for (let x = 0; x < 10; x++) {
          this.field[y].push(99);
        }
      }
      ships.forEach((s, ind) => {
        if (s.direction) {
          for (let y = s.position.y; y < s.position.y + s.length; y++) {
            this.field![y][s.position.x] = ind;
          }
        } else {
          for (let x = s.position.x; x < s.position.x + s.length; x++) {
            this.field![s.position.y][x] = ind;
          }
        }
      });
    }
  }
}

export class Game extends Record {
  constructor(
    public roomId: number,
    public idGame: number = randomInt(maxRnd),
    public players: Map<number, Player> = new Map<number, Player>(),
    public turn: number = 0,
  ) {
    super();
    if (players.size > 0) {
      players.forEach((_, key) => {
        this.turn = key;
      });
    }
  }
  static check(game: object) {
    return (
      "roomId" in game &&
      "idGame" in game &&
      "players" in game &&
      typeof game.roomId === "number" &&
      typeof game.idGame === "number" &&
      game.players instanceof Map &&
      Object.keys(game).length == 4
    );
  }
}

export class Room extends Record {
  constructor(
    public roomId: number = randomInt(maxRnd),
    public roomUsers: Map<number, User> = new Map<number, User>(),
    public game: Game = new Game(roomId),
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
  public id: number;
  public game: Map<number, Record>;
  constructor(
    name?: string,
    password?: string,
    id?: number,
    game?: Map<number, Record>,
  ) {
    super();
    this.name = name === undefined ? `User${randomInt(maxRnd)}` : name;
    this.password = password === undefined ? "" : password;
    this.id = id === undefined ? 0 : id;
    this.game = game === undefined ? new Map<number, Record>() : game;
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
      typeof user.id === "number" &&
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
      this._db.set(uid, record);
      return this._db.get(uid);
    }
    return false;
  }
  public del(uid: K) {
    return this._db.delete(uid);
  }
}

export const db_users = new DB_api<number, User>();
export const db_rooms = new DB_api<number, Room>();
export const db_games = new DB_api<number, Game>();
export const db_winners = new DB_api<number, Winner>();
