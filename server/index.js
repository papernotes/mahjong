const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3001

let count = 0

app.get('/', (req, res) => {
  res.send('<h1>Hello</h1>');
});

io.on('connection', (socket) => {
  console.log('User connected - ' + socket.id);
  io.to(`${socket.id}`).emit('id received', socket.id);

  // data should be the new count number
  socket.on('increment count', () => {
    count += 1;
    console.log("increment received");
    io.emit("update count", count);
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

server.listen(port, () => {
  console.log('Listening on *:3001');
});
