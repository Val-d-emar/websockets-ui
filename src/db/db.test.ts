import { createHash } from "node:crypto";
import { db_users, User } from "./db";

describe("DB tests", () => {
  const passwd = "hacker";
  const username = "Ivan Petrov";
  test("test 1", async () => {
    const userId = createHash("sha256")
      .update(`${passwd}${username}`)
      .digest("hex");
    const user1 = new User(username, passwd, userId);
    expect.assertions(3);
    expect(db_users.add(userId, user1)).toBe(user1);
    expect(db_users.get(userId)).toBe(user1);
    expect(User.check(user1)).toBe(true);
  });

  // test('test 2', () => {

  // });

  // test('test 3', () => {
  //   expect(User.check(user1)).toBe(true);
  // });

  // test('test 4', () => {
  //   delete (user1.id);
  //   expect(User.check(user1)).toBe(true);
  //   let user2 = {
  //     username: "123",
  //     age: 43,
  //     hobbies: []
  //   }
  //   expect(User.check(user2)).toBe(true);
  //   let user3 = {
  //     username: 123,
  //     age: 43,
  //     hobbies: ["hacker"]
  //   }
  //   expect(User.check(user3)).toBe(false);
  // });
});
