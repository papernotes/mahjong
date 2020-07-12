const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3001;

import JsonDatabase from './JsonDatabase';
import Database from './Database';

const db = new JsonDatabase();

app.get('/', (req, res) => {
  res.send('<h1>Hello</h1>');
});

io.on('connection', (socket) => {
  console.log('User connected - ' + socket.id);

  io.to(socket.id).emit('id received', socket.id);

  socket.on("disconnect", () => () => {
    console.log('Use disconnected');
    // TODO remove use from room
  });

  socket.on('newRoom', () => {
    const newRoomId = db.newRoom()
    const newPlayerId = db.addPlayer(newRoomId);
    const res = {
      'roomId': newRoomId,
      'playerId': newPlayerId
    }
    console.log("Created room", res);
    io.to(socket.id).emit('createdNewRoom', res);
  });

  socket.on('drawHead', (payload) => {
    try {
      const res = db.drawHead(payload['roomId'], payload['playerId']);
      io.to(socket.id).emit('drewTile', Object.keys(res)[0]);
    } catch (err) {
      io.to(socket.id).emit('cannotDrawHead', true);
    }
  });

  socket.on('drawTail', (payload) => {
    try {
      const res = db.drawTail(payload['roomId'], payload['playerId']);
      io.to(socket.id).emit('drewTile', Object.keys(res)[0]);
    } catch (err) {
      io.to(socket.id).emit('cannotDrawTail', true);
    }
  });

});

server.listen(port, () => {
  console.log('Listening on *:3001');
});