require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Import configuration
const connectDB = require('./config/database');

// Import routes
const documentRoutes = require('./routes/documents');
const wordRoutes = require('./routes/words');
const conversationRoutes = require('./routes/conversations');
const aiRoutes = require('./routes/ai');

// Import socket handlers
const socketHandlers = require('./socket/handlers');

// Initialize Express app
const app = express();
const server = http.createServer(app);

const proxyOrigin = process.env.PROXY_ORIGIN || 'http://localhost:5173';
// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: proxyOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: proxyOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Chinese Learning Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Chinese Learning Backend API',
    version: '1.0.0',
    endpoints: {
      documents: '/api/documents',
      words: '/api/words',
      conversations: '/api/conversations',
      health: '/api/health'
    }
  });
});

// Initialize Socket.IO handlers
socketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Chinese Learning Backend Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time connections`);
}); 