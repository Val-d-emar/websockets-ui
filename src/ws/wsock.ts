import { createHash } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { reg_user, update_room, update_winners } from '../game/game';
import { db_users } from '../db/db';

export const wss = new WebSocketServer({ port: 3000, clientTracking: true });

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
// const sessionParser = {
//   saveUninitialized: false,
//   secret: '$eCuRiTy',
//   resave: false
// };

const map = new Map();

// wss.on('upgrade', function (request, socket, head) {
//   // socket.on('error', onSocketError);

//   console.log('Parsing session from request...');

//   return;///
//   if (!request.session.session_ID) {
//     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
//     socket.destroy();
//     return;
//   }
//   else {
//     console.log('Session is parsed!');

//     // socket.removeListener('error', onSocketError);

//     wss.handleUpgrade(request, socket, head, function (ws) {
//       wss.emit('connection', ws, request);
//     });
//   }
// });

wss.on('connection', function connection(ws: WebSocket, request: any) {//, client: any
  // wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  // const session_ID = createHash('sha256').update(JSON.stringify(request.rawHeaders)).digest('hex');
  const session_ID = '';
  let userId = '';
  // console.log(request);
  map.set(session_ID, '');

  ws.on('message', function message(msg) {
    console.log(`Received message ${msg} from user ${session_ID}`);
    // console.log(`Received message ${msg} from user ${client}`);
    try {
      let res = JSON.parse(msg.toString());
      if ((typeof res.data === 'string') && (res.data.length > 1)) {
        res.data = JSON.parse(res.data);
      }
      switch (res.type) {
        case 'reg':
          userId = createHash('sha256').update(`${res.data.name}${res.data.passwd}`).digest('hex');
          ws.send(reg_user(res.data.name, res.data.password, userId));
          map.set(session_ID, userId);
          break;
        case 'create_room':
          if (userId !== '') {
            console.log(`userId is ${userId}`);
            console.log(`username is ${db_users.get(userId)?.name}`);
            console.log(`users =`, db_users.get());
            ws.send(update_room(userId))
            ws.send(update_winners(userId))
          } else console.log('Oops! userId is empty!');
          break;
      }
      console.log(res)

    } catch (e) {
      console.error('Error data parsing', e);
    }
  });

  // ws.send(JSON.stringify(
  //   {
  //     type: "reg",
  //     data: JSON.stringify(
  //       {
  //         name: "nameError",
  //         index: 10,
  //         error: true,
  //         errorText: "Введите имя игрока",
  //       }),
  //     id: 0,
  //   }
  // ));

  ws.on('close', function () {
    map.delete(session_ID);
  });

});
