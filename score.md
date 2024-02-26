1. Task: [Websocket battleship server](https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/battleship/assignment.md)
2. Done 13.02.2024 / deadline 27.02.2024
3. Score: 188 / 188

# Scoring: Websocket battleship server

## Basic Scope

- Websocket
  - [X] **+6** Implemented workable websocket server
  - [X] **+6** Handle websocket clients connection/disconnection properly
  - [X] **+10** Websocket server message handler implemented properly
  - [X] **+10** Websocket server message sender implemented properly
- User
  - [X] **+5** Create user with password in temporary database
  - [X] **+5** User validation
- Room
  - [X] **+6** Create game room
  - [X] **+6** Add user to game room
  - [X] **+6** Start game
  - [X] **+6** Finish game
  - [X] **+8** Update room's game state
  - [X] **+4** Update player's turn
  - [X] **+8** Update players winner table
- Ships
  - [X] **+10** Locate ship to the game board
- Game
  - [X] **+8** Attack
  - [X] **+4** Random attack

## Advanced Scope

- [X] **+30** Task implemented on Typescript
- [X] **+20** Codebase is separated (at least 4 modules)
- [X] **+30** Make bot for single play (optionally)

## Forfeits

- [ ] **-95% of total task score** any external tools except `ws`, `cross-env`, `dotenv`, `typescript`, `ts-node`, `ts-node-dev`, `nodemon`, `eslint` and its plugins, `webpack` and its plugins, `prettier`, `@types/*` and testing tools (for example, Jest, Mocha, AVA, Jasmine, Cypress, Storybook, Puppeteer)
- [ ] **-30% of total task score** Commits after deadline (except commits that affect only Readme.md, .gitignore, etc.)
- [ ] **-10** Missing PR or its description is incorrect
- [ ] **-10** No separate development branch
- [ ] **-10** Less than 3 commits in the development branch, not including commits that make changes only to `Readme.md` or similar files (`tsconfig.json`, `.gitignore`, `.prettierrc.json`, etc.)
