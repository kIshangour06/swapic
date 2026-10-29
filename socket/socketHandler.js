const User = require('../models/User');

module.exports = (io) => {
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.username} (${userId})`);

    // Join user's personal room for notifications
    socket.join(userId);

    // Update online status
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit('user_online', { userId, username: socket.user.username });

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
      console.log(`${socket.user.username} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv_${conversationId}`).emit('typing', {
        userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Real-time message via socket
    socket.on('send_message', async ({ conversationId, content }) => {
      io.to(`conv_${conversationId}`).emit('message_received', {
        conversationId,
        senderId: userId,
        username: socket.user.username,
        content,
        timestamp: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};
