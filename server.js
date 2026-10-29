const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Use in-memory MongoDB if no local MongoDB is available
async function getMongoUri() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri() + 'barterdb';
    console.log('🗄️  Using in-memory MongoDB (no local MongoDB detected)');
    return uri;
  } catch (e) {
    return process.env.MONGODB_URI || 'mongodb://localhost:27017/barterdb';
  }
}

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const tradeRoutes = require('./routes/trades');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

const { authenticateSocket } = require('./middleware/auth');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (with in-memory fallback)
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barterdb', {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ MongoDB Connected (local)');
  } catch (err) {
    console.log('⚠️  Local MongoDB not found, starting in-memory MongoDB...');
    try {
      const uri = await getMongoUri();
      await mongoose.connect(uri);
      console.log('✅ In-memory MongoDB Connected');
    } catch (e) {
      console.error('❌ Could not connect to any MongoDB:', e.message);
      process.exit(1);
    }
  }
}

// Attach io to request for routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    platform: 'BarterHub Europa',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

const { seedDatabase } = require('./config/seedData');

// SPA fallback for non-API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Socket.IO handlers
io.use(authenticateSocket);
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
const ALT_PORT = 8000;

// Start server after DB connection & seed
(async () => {
  await connectDB();
  await seedDatabase();

  server.listen(PORT, () => {
    console.log(`🚀 Barter System Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
  });

  // Also listen on port 8000 for convenience
  try {
    const server8000 = http.createServer(app);
    io.attach(server8000);
    server8000.listen(ALT_PORT, () => {
      console.log(`🌐 Also accessible on: http://localhost:${ALT_PORT}`);
    });
  } catch (err) {
    console.warn(`Could not bind to port ${ALT_PORT}:`, err.message);
  }
})();

module.exports = { app, io };
