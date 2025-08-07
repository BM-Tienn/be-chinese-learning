const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to store connected users
  }

  // Initialize socket.io
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Token không được cung cấp'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Người dùng không tồn tại'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Token không hợp lệ'));
      }
    });

    this.setupEventHandlers();
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.io) {
      console.warn('Socket.IO not initialized. Call initialize() first.');
      return;
    }

    this.io.on('connection', (socket) => {
      // Store connected user if authenticated
      if (socket.user) {
        this.connectedUsers.set(socket.user.id, {
          socketId: socket.id,
          user: socket.user
        });

        // Join user to their personal room
        socket.join(`user_${socket.user.id}`);
      }

      // Handle study session events
      socket.on('start_study_session', (data) => {
        this.handleStartStudySession(socket, data);
      });

      socket.on('word_answered', (data) => {
        this.handleWordAnswered(socket, data);
      });

      socket.on('study_session_completed', (data) => {
        this.handleStudySessionCompleted(socket, data);
      });

      // Handle real-time chat events
      socket.on('join_chat_room', (roomId) => {
        socket.join(`chat_${roomId}`);
        socket.emit('joined_chat_room', roomId);
      });

      socket.on('leave_chat_room', (roomId) => {
        socket.leave(`chat_${roomId}`);
        socket.emit('left_chat_room', roomId);
      });

      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Handle notification events
      socket.on('subscribe_notifications', () => {
        if (socket.user) {
          socket.join(`notifications_${socket.user.id}`);
          socket.emit('subscribed_notifications');
        }
      });

      socket.on('unsubscribe_notifications', () => {
        if (socket.user) {
          socket.leave(`notifications_${socket.user.id}`);
          socket.emit('unsubscribed_notifications');
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.user) {
          this.connectedUsers.delete(socket.user.id);
        }
      });
    });
  }

  // Handle start study session
  handleStartStudySession(socket, data) {
    const { sessionId, wordCount } = data;
    
    socket.join(`study_session_${sessionId}`);
    
    // Notify other users in the same session (if collaborative)
    socket.to(`study_session_${sessionId}`).emit('user_joined_study', {
      userId: socket.user?.id || socket.id,
      username: socket.user?.username || socket.id,
      joinedAt: new Date()
    });

    // Send session info to the user
    socket.emit('study_session_started', {
      sessionId,
      wordCount,
      startedAt: new Date()
    });
  }

  // Handle word answered
  handleWordAnswered(socket, data) {
    const { sessionId, wordId, isCorrect, timeSpent } = data;
    
    // Broadcast to other users in the same session
    socket.to(`study_session_${sessionId}`).emit('word_answered_by_user', {
      userId: socket.user?.id || socket.id,
      username: socket.user?.username || socket.id,
      wordId,
      isCorrect,
      timeSpent,
      answeredAt: new Date()
    });

    // Send confirmation to the user
    socket.emit('word_answer_recorded', {
      wordId,
      isCorrect,
      timeSpent
    });
  }

  // Handle study session completed
  handleStudySessionCompleted(socket, data) {
    const { sessionId, results } = data;
    
    // Leave the study session room
    socket.leave(`study_session_${sessionId}`);
    
    // Notify other users in the session
    socket.to(`study_session_${sessionId}`).emit('user_completed_study', {
      userId: socket.user?.id || socket.id,
      username: socket.user?.username || socket.id,
      results,
      completedAt: new Date()
    });

    // Send completion confirmation
    socket.emit('study_session_completed', {
      sessionId,
      results,
      completedAt: new Date()
    });
  }

  // Handle send message
  handleSendMessage(socket, data) {
    const { roomId, message, type = 'text' } = data;
    
    const messageData = {
      userId: socket.user?.id || socket.id,
      username: socket.user?.username || socket.id,
      message,
      type,
      timestamp: new Date()
    };

    // Broadcast to all users in the chat room
    this.io.to(`chat_${roomId}`).emit('new_message', messageData);
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    this.io.to(`notifications_${userId}`).emit('new_notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Send notification to all users
  sendNotificationToAll(notification) {
    this.io.emit('new_notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Send notification to users by role
  sendNotificationToRole(role, notification) {
    this.connectedUsers.forEach((userData, userId) => {
      if (userData.user.role === role) {
        this.sendNotification(userId, notification);
      }
    });
  }

  // Send study reminder
  sendStudyReminder(userId, wordsCount) {
    this.sendNotification(userId, {
      type: 'study_reminder',
      title: 'Nhắc nhở học tập',
      message: `Bạn có ${wordsCount} từ vựng cần ôn tập hôm nay`,
      priority: 'medium'
    });
  }

  // Send achievement notification
  sendAchievement(userId, achievement) {
    this.sendNotification(userId, {
      type: 'achievement',
      title: 'Thành tựu mới!',
      message: `Chúc mừng! Bạn đã đạt được: ${achievement.name}`,
      data: achievement,
      priority: 'high'
    });
  }

  // Send streak notification
  sendStreakNotification(userId, streakDays) {
    this.sendNotification(userId, {
      type: 'streak',
      title: 'Chuỗi học tập!',
      message: `Tuyệt vời! Bạn đã học liên tục ${streakDays} ngày`,
      data: { streakDays },
      priority: 'medium'
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users list
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(userData => ({
      id: userData.user.id,
      username: userData.user.username,
      role: userData.user.role,
      connectedAt: userData.connectedAt
    }));
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send message to specific user
  sendMessageToUser(userId, event, data) {
    const userData = this.connectedUsers.get(userId);
    if (userData) {
      this.io.to(userData.socketId).emit(event, data);
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Broadcast to all users except sender
  broadcastToOthers(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

module.exports = new SocketService(); 