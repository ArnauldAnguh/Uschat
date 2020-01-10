import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import cors from 'cors';
import route from './router';
import {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} from './controllers/users.js';

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connect', socket => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit('message', {
      user: 'admin 🗣️',
      text: `${user.name} , welcome to room ${user.room}.`,
      role: 'admin'
    });
    socket.broadcast
      .to(user.room)
      .emit('message', {
        user: 'admin 🗣️ ',
        text: `${user.name} has joined!`,
        role: 'admin'
      });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', {
        user: 'admin' + '🗣️',
        text: `${user.name} has left.`,
        role: 'admin'
      });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});
app.use(cors());
app.use(route);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server connected on PORT ${PORT}`);
});
