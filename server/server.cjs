const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});;

const rooms = {};

// Serve React static files from the 'dist' folder (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));
/*
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
*/

io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('join', roomId => {
    socket.join(roomId);
    const clients = io.sockets.adapter.rooms.get(roomId);
    const numClients = clients ? clients.size : 0;
    console.log(`${socket.id} joined room ${roomId}, clients: ${numClients}`);

    console.log(`Current clients in room ${roomId}:`, clients ? [...clients] : []);

    if (numClients === 1) {
      rooms[roomId] = socket.id; // mark first as "owner"
      socket.emit('joined', roomId);
      console.log(`Emitted 'joined' to ${socket.id} for room ${roomId}`);
    } else if (numClients === 2) {
      io.to(roomId).emit('ready');
      console.log(`Emitted 'ready' to room ${roomId}`);
    } else {
      socket.leave(roomId);
      socket.emit('error', 'Room full');
      console.log(`Room ${roomId} full. ${socket.id} was kicked out.`);
    }
  });

  socket.on('signal', ({ type, data }) => {
    const roomsArr = [...socket.rooms].filter(r => r !== socket.id);
    if (roomsArr.length === 0) {
      console.log(`Signal received from ${socket.id} but no room found.`);
      return;
    }
    const roomId = roomsArr[0];
    console.log(`Signal of type '${type}' received from ${socket.id} for room ${roomId}`);
    socket.to(roomId).emit('signal', { type, data });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Change port to 3080 and listen on all interfaces
const PORT = process.env.PORT || 3080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});