import { randomInt } from "node:crypto";

export class Record {    
}
export class Room extends Record{
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
export class User extends Record{
    public session: string;
    public game: Map<string, any>;
    constructor(
        public username: string,
        public password: string,
        session?: string,
        game?: Map<string, any>
    ) {
        super();
        if (session === undefined) this.session = ''
        else this.session = session;

        if (game === undefined) this.game = new Map<string, any>()
        else this.game = game;
    }
    static check(user: Object) {
        return ('username' in user) &&
            ('password' in user) &&
            ('game' in user) &&
            ('session' in user) &&
            (typeof user.username === 'string') &&
            (typeof user.password === 'string') &&
            (user.game instanceof Map) &&
            (typeof user.session === 'string') &&
            Object.keys(user).length <= 4;
    }
}

export class DB_api<T extends Record> {
    private _db: Map<string, T>;
    constructor() {
        this._db = new Map<string, T>();
    }
    public get(uid: string) {
        return this._db.get(uid);
    }
    public add(uid: string, record: T) {
        this._db.set(uid, record)
        return this._db.get(uid);
    }
    public update(uid: string, record: T) {
        if (this.get(uid)) {
            // record.session = uid;
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
