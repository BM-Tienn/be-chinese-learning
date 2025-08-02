const multer = require('multer'); // Thư viện xử lý tải lên tệp
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh

// Cấu hình lưu trữ cho các tệp đã tải lên
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Định nghĩa thư mục đích cho các tệp tải lên
    cb(null, 'uploads/'); // Tệp sẽ được lưu vào thư mục 'uploads/'
  },
  filename: (req, file, cb) => {
    // Định nghĩa tên tệp cho các tệp đã tải lên
    // Ví dụ: user-123abc-167890.jpeg
    const ext = file.mimetype.split('/')[1]; // Lấy phần mở rộng của tệp (ví dụ: 'jpeg', 'wav')
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // Tạo tên tệp duy nhất
  }
});

// Cấu hình lưu trữ trong memory cho file JSON
const multerMemoryStorage = multer.memoryStorage();

// Bộ lọc cho các loại tệp được phép
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || 
      file.mimetype.startsWith('audio') || 
      file.mimetype === 'application/json') {
    cb(null, true); // Chấp nhận tệp nếu là ảnh, âm thanh hoặc JSON
  } else {
    cb(new AppError('Chỉ chấp nhận file ảnh, âm thanh hoặc JSON!', 400), false); // Từ chối tệp và trả lỗi
  }
};

// Khởi tạo Multer với cấu hình lưu trữ và bộ lọc
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn kích thước tệp là 10 MB
  }
});

// Khởi tạo Multer với memory storage cho file JSON
const uploadJson = multer({
  storage: multerMemoryStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ chấp nhận file JSON!', 400), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Giới hạn kích thước file JSON là 50 MB
  }
});

// Middleware để tải lên một tệp duy nhất
exports.uploadSingleFile = (fieldName) => upload.single(fieldName);

// Middleware để tải lên nhiều tệp (nhiều trường)
exports.uploadMultipleFiles = (fields) => upload.fields(fields);

// Middleware để tải lên file JSON
exports.uploadJsonFile = (fieldName) => uploadJson.single(fieldName);

// Ví dụ sử dụng trong một route (được comment):
// router.post('/upload-avatar', authController.protect, upload.uploadSingleFile('avatar'), userController.updateUserAvatar);
// router.post('/upload-media', authController.protect, upload.uploadMultipleFiles([
//   { name: 'images', maxCount: 5 },
//   { name: 'audio', maxCount: 2 }
// ]), someController.uploadMedia);
