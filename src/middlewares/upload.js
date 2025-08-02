const multer = require('multer'); // Thư viện xử lý tải lên tệp
const AppError = require('../utils/appError'); // Lớp lỗi tùy chỉnh
const { FILE_UPLOAD, ERROR_MESSAGES } = require('../utils/constants');

// Cấu hình lưu trữ cho các tệp đã tải lên
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Định nghĩa thư mục đích cho các tệp tải lên
    cb(null, FILE_UPLOAD.UPLOAD_DIR); // Tệp sẽ được lưu vào thư mục 'uploads/'
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
  const allowedTypes = [
    ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    ...FILE_UPLOAD.ALLOWED_JSON_TYPES,
    'audio/wav',
    'audio/mp3',
    'audio/mpeg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Chấp nhận tệp nếu là loại được phép
  } else {
    cb(new AppError(ERROR_MESSAGES.UPLOAD.INVALID_FILE_TYPE, 400), false); // Từ chối tệp và trả lỗi
  }
};

// Khởi tạo Multer với cấu hình lưu trữ và bộ lọc
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_FILE_SIZE // Giới hạn kích thước tệp
  }
});

// Khởi tạo Multer với memory storage cho file JSON
const uploadJson = multer({
  storage: multerMemoryStorage,
  fileFilter: (req, file, cb) => {
    if (FILE_UPLOAD.ALLOWED_JSON_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Chỉ chấp nhận file JSON!', 400), false);
    }
  },
  limits: {
    fileSize: FILE_UPLOAD.MAX_JSON_FILE_SIZE // Giới hạn kích thước file JSON
  }
});

// Middleware để tải lên một tệp duy nhất
exports.uploadSingleFile = (fieldName) => upload.single(fieldName);

// Middleware để tải lên nhiều tệp (nhiều trường)
exports.uploadMultipleFiles = (fields) => upload.fields(fields);

// Middleware để tải lên file JSON
exports.uploadJsonFile = (fieldName) => {
  return uploadJson.single(fieldName);
};

// Middleware để tải lên nhiều file JSON
exports.uploadMultipleJsonFiles = (fieldName, maxCount = FILE_UPLOAD.MAX_JSON_FILES_COUNT) => {
  return multer({
    storage: multerMemoryStorage,
    fileFilter: (req, file, cb) => {
      if (FILE_UPLOAD.ALLOWED_JSON_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Chỉ chấp nhận file JSON!', 400), false);
      }
    },
    limits: {
      fileSize: FILE_UPLOAD.MAX_JSON_FILE_SIZE, // Giới hạn kích thước mỗi file JSON
      files: maxCount // Giới hạn số lượng file
    }
  }).array(fieldName, maxCount);
};

// Middleware để tải lên nhiều file ảnh
exports.uploadMultipleImages = (fieldName, maxCount = FILE_UPLOAD.MAX_IMAGE_FILES_COUNT) => {
  return multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      if (FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Chỉ chấp nhận file ảnh!', 400), false);
      }
    },
    limits: {
      fileSize: FILE_UPLOAD.MAX_IMAGE_FILE_SIZE, // Giới hạn kích thước mỗi file ảnh
      files: maxCount // Giới hạn số lượng file
    }
  }).array(fieldName, maxCount);
};

// Middleware để tải lên nhiều file documents
exports.uploadMultipleDocuments = (fieldName, maxCount = FILE_UPLOAD.MAX_DOCUMENT_FILES_COUNT) => {
  return multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      if (FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Chỉ chấp nhận file documents!', 400), false);
      }
    },
    limits: {
      fileSize: FILE_UPLOAD.MAX_DOCUMENT_FILE_SIZE, // Giới hạn kích thước mỗi file document
      files: maxCount // Giới hạn số lượng file
    }
  }).array(fieldName, maxCount);
};

// Middleware để tải lên nhiều file hỗn hợp (JSON, ảnh, documents)
exports.uploadMultipleMixedFiles = (fieldName, maxCount = FILE_UPLOAD.MAX_FILES_COUNT) => {
  return multer({
    storage: multerStorage,
    fileFilter: multerFilter, // Sử dụng filter đã định nghĩa ở trên
    limits: {
      fileSize: FILE_UPLOAD.MAX_FILE_SIZE, // Giới hạn kích thước mỗi file
      files: maxCount // Giới hạn số lượng file
    }
  }).array(fieldName, maxCount);
};
