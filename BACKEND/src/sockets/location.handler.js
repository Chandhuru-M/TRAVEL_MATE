    // src/sockets/location.handler.js

function initializeSocketIO(io) {
  // This function runs whenever a new client connects to the server
  io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // --- Handler for joining a group ---
    // The frontend will emit this event when a user opens a group map
    socket.on('join-group', (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.id} joined group: ${groupId}`);
      
      // Optional: Notify others in the group that a new user has joined
      socket.to(groupId).emit('user-joined', { userId: socket.id });
    });

    // --- Handler for receiving a location update ---
    // The frontend will periodically emit this event
    socket.on('send-location', (data) => {
      const { groupId, location } = data; // location should be { lat, lon }

      // Broadcast the received location to everyone else in the same group (room)
      // We include the sender's socket ID so clients know who moved.
      socket.to(groupId).emit('receive-location', { 
        userId: socket.id, 
        location: location 
      });
    });

    // --- Handler for when a client disconnects ---
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Optional: You would need to know which groups the user was in to notify them.
      // This can be handled by storing user/group info in memory or a database.
      // For now, we'll just log the disconnect.
    });
  });
}

module.exports = initializeSocketIO;