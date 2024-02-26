import { createHash } from "node:crypto";
import { db_users, Player, User } from "./db";

describe("DB users tests", () => {
  const passwd = "hacker";
  const username = "Ivan Petrov";
  test("test 1", async () => {
    const userId = Number.parseInt(
      createHash("shake256", { outputLength: 4 })
        .update(`${username}${passwd}`)
        .digest("hex"),
      16,
    );
    const user1 = new User(username, passwd, userId);
    expect.assertions(3);
    expect(db_users.add(userId, user1)).toBe(user1);
    expect(db_users.get(userId)).toBe(user1);
    expect(User.check(user1)).toBe(true);
  });

  test("Player tests", () => {
    const inp = `{\"gameId\":46733912736827,\"ships\":[{\"position\":{\"x\":4,\"y\":3},\"direction\":true,\"type\":\"huge\",\"length\":4},{\"position\":{\"x\":6,\"y\":2},\"direction\":true,\"type\":\"large\",\"length\":3},{\"position\":{\"x\":6,\"y\":6},\"direction\":true,\"type\":\"large\",\"length\":3},{\"position\":{\"x\":2,\"y\":1},\"direction\":false,\"type\":\"medium\",\"length\":2},{\"position\":{\"x\":1,\"y\":7},\"direction\":true,\"type\":\"medium\",\"length\":2},{\"position\":{\"x\":0,\"y\":5},\"direction\":false,\"type\":\"medium\",\"length\":2},{\"position\":{\"x\":9,\"y\":6},\"direction\":true,\"type\":\"small\",\"length\":1},{\"position\":{\"x\":2,\"y\":3},\"direction\":true,\"type\":\"small\",\"length\":1},{\"position\":{\"x\":4,\"y\":8},\"direction\":true,\"type\":\"small\",\"length\":1},{\"position\":{\"x\":0,\"y\":1},\"direction\":false,\"type\":\"small\",\"length\":1}],\"indexPlayer\":1}`;
    const data = JSON.parse(inp);
    const ships = data.ships;
    const p = new Player(1, ships);
    console.log(p);
  });
});
