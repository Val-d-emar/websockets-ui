import { createHash } from "node:crypto";
import { db_users, User } from "../db/db.ts"
export const reg_user = (username: string, passwd: string, userId = '') => {
    let res: string;
    if (userId === '') {
        userId = createHash('sha256').update(`${passwd}${username}`).digest('hex');
    }
    let user = new User(
        username,
        passwd,
        userId,
    );
    try {
        res = JSON.stringify(
            {
                type: "reg",
                data: JSON.stringify(
                    {
                        name: username,
                        index: 0,
                        error: false,
                        errorText: "",
                    }),
                id: 0,
            }
        );
        db_users.add(userId, user);
    } catch (error) {
        res = JSON.stringify(
            {
                type: "reg",
                data: JSON.stringify(
                    {
                        name: username,
                        index: 0,
                        error: true,
                        errorText: `${error}`,
                    }),
                id: 0,
            }
        );
    }
    return res;
}

export const create_room = () => {

}

export const update_room = (uid: string) => {
    const room =
    {
        type: "update_room",
        data:
            [
                {
                    roomId: 0,
                    roomUsers:
                        [
                            {
                                name: `${db_users.get(uid)?.username}`,
                                index: 1,
                            }
                        ],
                },
            ],
        id: 0,
    }
    return JSON.stringify(room);
}

export const update_winners = (uid: string) => {
    const winners =
    {
        type: "update_winners",
        data:
            [
                {
                    name: `${db_users.get(uid)?.username}`,
                    wins: 0,
                }
            ],
        id: 0,
    }
    return JSON.stringify(winners);
}

