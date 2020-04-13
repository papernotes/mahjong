const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3001

app.get('/', (req, res) => {
  res.send('<h1>Hello</h1>');
});

io.on('connection', (socket) => {
  console.log('User connected');

  socket.emit("my_new_connection", () => console.log("Emitting new connection"));
  socket.on("disconnect", () => console.log("User disconnected"));

});

server.listen(port, () => {
  console.log('Listening on *:3001');
});
