import { randomInt } from "node:crypto";

export class Record {
}
export class Room extends Record {
    constructor(
        public roomId: number = randomInt(Number.MAX_SAFE_INTEGER),
        public roomUsers: Map<string, any> = new Map<string, any>()
    ) {
        super();
    }
    static check(room: Object) {
        return ('roomId' in room) &&
            ('roomUsers' in room) &&
            (typeof room.roomId === 'number') &&
            (room.roomUsers instanceof Map) &&
            Object.keys(room).length == 2;
    }
}
export class User extends Record {
    public name: string;
    public password: string;
    public id: string;
    public game: Map<string, any>;
    constructor(
        name?: string,
        password?: string,
        id?: string,
        game?: Map<string, any>
    ) {
        super();
        this.name = (name === undefined) ? `User${randomInt(100)}` : name;
        this.password = (password === undefined) ? '' : password;
        this.id = (id === undefined) ? '' : id;
        this.game = (game === undefined) ? new Map<string, any>() : game;
    }
    static check(user: Object) {
        return ('name' in user) &&
            ('password' in user) &&
            ('game' in user) &&
            ('id' in user) &&
            (typeof user.name === 'string') &&
            (typeof user.password === 'string') &&
            (user.game instanceof Map) &&
            (typeof user.id === 'string') &&
            Object.keys(user).length <= 4;
    }
}

export class DB_api<T extends Record> {
    private _db: Map<string, T>;
    constructor() {
        this._db = new Map<string, T>();
    }
    public get(uid?: string) {
        return uid === undefined ? this._db : this._db.get(uid);
    }
    public add(uid: string, record: T) {
        this._db.set(uid, record)
        return this._db.get(uid);
    }
    public update(uid: string, record: T) {
        if (this.get(uid)) {
            // record.id = uid;
            this._db.set(uid, record);
            return this._db.get(uid);
        }
        return false;
    }
    public del(uid: string) {
        return this._db.delete(uid);
    }
}

export const db_users = new DB_api<User>();
