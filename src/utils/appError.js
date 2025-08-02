class AppError extends Error {
  /**
   * @param {string} message - Tin nhắn lỗi sẽ được gửi cho client.
   * @param {number} statusCode - Mã trạng thái HTTP.
   */
  constructor(message, statusCode) {
      super(message);

      this.statusCode = statusCode;
      // Phân biệt lỗi nghiệp vụ (4xx) và lỗi lập trình/hệ thống (5xx)
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true; // Đánh dấu đây là lỗi có thể dự đoán được

      Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;