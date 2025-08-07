const socketService = require('../services/socketService'); // Import dịch vụ socket

// Module này xuất một hàm nhận đối tượng 'io' (Socket.IO server instance)
module.exports = (io) => {
  // Khởi tạo dịch vụ socket với thể hiện 'io'
  socketService.io = io;
  socketService.setupEventHandlers();

  // Lắng nghe sự kiện 'connection' khi một client kết nối
  io.on('connection', (socket) => {
    // Ví dụ: Xử lý sự kiện tin nhắn trò chuyện
    socket.on('chatMessage', (msg) => {
      // Phát sóng tin nhắn tới tất cả các client đã kết nối
      socketService.broadcast('chatMessage', { sender: socket.id, message: msg });
    });

    // Ví dụ: Xử lý yêu cầu phân tích phát âm
    // Trong một ứng dụng thực tế, điều này sẽ liên quan đến logic phức tạp hơn,
    // có thể gửi dữ liệu âm thanh và nhận lại kết quả phân tích.
    socket.on('analyzePronunciation', (audioData) => {
      // Mô phỏng phân tích và gửi lại kết quả
      const result = {
        score: Math.floor(Math.random() * 100), // Điểm ngẫu nhiên
        feedback: 'Good pronunciation!', // Phản hồi mẫu
        originalText: '你好' // Văn bản gốc mẫu
      };
      socket.emit('pronunciationResult', result); // Gửi kết quả trở lại client gửi yêu cầu
    });

    // Ví dụ: Người dùng tham gia một phòng cụ thể (ví dụ: cho một cuộc trò chuyện hoặc khóa học)
    socket.on('joinRoom', (roomName) => {
      socket.join(roomName); // Cho socket tham gia phòng
      socket.emit('roomJoined', `You have joined room: ${roomName}`); // Thông báo cho client đã tham gia phòng
      socket.to(roomName).emit('userJoined', `${socket.id} has joined the room.`); // Thông báo cho các client khác trong phòng
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      // User disconnected
    });

    // Xử lý lỗi trên socket
    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.id}:`, err); // Ghi log lỗi socket
    });
  });
};
