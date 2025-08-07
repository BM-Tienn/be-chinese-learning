const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chinese Learning Backend API',
      version: '1.0.0',
      description: 'API documentation cho ứng dụng học tiếng Trung',
      contact: {
        name: 'Chinese Learning Team',
        email: 'support@chineselearning.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5678/api/v1',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Xác thực người dùng (đăng ký, đăng nhập, đăng xuất)'
      },
      {
        name: 'Users',
        description: 'Quản lý người dùng và thông tin cá nhân'
      },
      {
        name: 'Words',
        description: 'Từ vựng cá nhân của người dùng'
      },
      {
        name: 'Vocabularies',
        description: 'Từ vựng chung của ứng dụng'
      },
      {
        name: 'Courses',
        description: 'Quản lý khóa học và bài học'
      },
      {
        name: 'Flashcards',
        description: 'Quản lý flashcard sets và học tập'
      },
      {
        name: 'Dashboard',
        description: 'Thống kê và hoạt động người dùng'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token để xác thực người dùng'
        }
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Số trang hiện tại',
              example: 1
            },
            limit: {
              type: 'integer',
              description: 'Số item trên mỗi trang',
              example: 10
            },
            count: {
              type: 'integer',
              description: 'Tổng số item',
              example: 25
            },
            pageTotal: {
              type: 'integer',
              description: 'Tổng số trang',
              example: 3
            }
          }
        },
        StandardResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
              description: 'Trạng thái response'
            },
            message: {
              type: 'string',
              description: 'Thông điệp response'
            },
            data: {
              type: 'object',
              properties: {
                pagination: {
                  $ref: '#/components/schemas/Pagination'
                },
                items: {
                  type: 'array',
                  description: 'Mảng các item'
                }
              }
            }
          }
        },
        StandardSingleResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
              description: 'Trạng thái response'
            },
            message: {
              type: 'string',
              description: 'Thông điệp response'
            },
            data: {
              type: 'object',
              properties: {
                item: {
                  description: 'Dữ liệu item đơn lẻ'
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID người dùng'
            },
            username: {
              type: 'string',
              description: 'Tên đăng nhập duy nhất'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email người dùng'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              description: 'Vai trò người dùng'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['username', 'email']
        },
        Word: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID từ vựng'
            },
            user: {
              type: 'string',
              description: 'ID người dùng sở hữu từ vựng này'
            },
            chinese: {
              type: 'string',
              description: 'Ký tự tiếng Trung'
            },
            pinyin: {
              type: 'string',
              description: 'Pinyin của từ tiếng Trung'
            },
            definition: {
              type: 'string',
              description: 'Định nghĩa của từ'
            },
            hskLevel: {
              type: 'number',
              description: 'Cấp độ HSK của từ (tùy chọn)'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tags cho từ (tùy chọn)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['user', 'chinese', 'pinyin', 'definition']
        },
        Vocabulary: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID từ vựng'
            },
            chinese: {
              type: 'string',
              description: 'Ký tự tiếng Trung'
            },
            pinyin: {
              type: 'string',
              description: 'Pinyin của từ tiếng Trung'
            },
            vietnameseReading: {
              type: 'string',
              description: 'Cách đọc tiếng Việt của từ tiếng Trung'
            },
            meaning: {
              type: 'object',
              properties: {
                primary: {
                  type: 'string',
                  description: 'Định nghĩa chính của từ'
                },
                secondary: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Định nghĩa phụ của từ'
                },
                partOfSpeech: {
                  type: 'string',
                  description: 'Từ loại (ví dụ: danh từ, động từ, tính từ)'
                }
              },
              required: ['primary']
            },
            grammar: {
              type: 'object',
              properties: {
                level: {
                  type: 'string',
                  description: 'Cấp độ ngữ pháp (ví dụ: HSK1, Advanced)'
                },
                frequency: {
                  type: 'number',
                  description: 'Tần suất sử dụng'
                },
                formality: {
                  type: 'string',
                  description: 'Mức độ trang trọng (ví dụ: neutral, formal, informal, literary)'
                }
              }
            },
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chinese: {
                    type: 'string'
                  },
                  pinyin: {
                    type: 'string'
                  },
                  vietnamese: {
                    type: 'string'
                  }
                }
              },
              description: 'Ví dụ câu'
            },
            related: {
              type: 'object',
              properties: {
                synonyms: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Từ đồng nghĩa'
                },
                antonyms: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Từ trái nghĩa'
                },
                compounds: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Từ ghép liên quan'
                }
              }
            },
            hskLevel: {
              type: 'number',
              nullable: true,
              description: 'Cấp độ HSK của từ (1-6, được suy ra từ grammar.level nếu có)'
            },
            category: {
              type: 'string',
              enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Common', 'Idiom', 'Proverb', 'Advanced', 'Other', 'Place Name', 'Person Name', 'Technical', 'Literary', 'Informal'],
              default: 'Common'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['chinese', 'pinyin', 'meaning']
        },
        Course: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID khóa học'
            },
            title: {
              type: 'string',
              description: 'Tên khóa học'
            },
            description: {
              type: 'string',
              description: 'Mô tả khóa học'
            },
            level: {
              type: 'string',
              enum: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
              description: 'Cấp độ HSK'
            },
            lessons: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Danh sách ID bài học'
            },
            totalLessons: {
              type: 'number',
              description: 'Tổng số bài học'
            },
            duration: {
              type: 'string',
              description: 'Thời gian ước tính hoàn thành'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['title', 'level']
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID bài học'
            },
            title: {
              type: 'string',
              description: 'Tên bài học'
            },
            description: {
              type: 'string',
              description: 'Mô tả bài học'
            },
            course: {
              type: 'string',
              description: 'ID khóa học'
            },
            order: {
              type: 'number',
              description: 'Thứ tự bài học'
            },
            content: {
              type: 'object',
              description: 'Nội dung bài học'
            },
            vocabulary: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Danh sách từ vựng trong bài học'
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed'],
              default: 'not_started',
              description: 'Trạng thái bài học'
            },
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Tiến độ hoàn thành (%)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['title', 'course']
        },
        FlashcardSet: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID flashcard set'
            },
            title: {
              type: 'string',
              description: 'Tên flashcard set'
            },
            description: {
              type: 'string',
              description: 'Mô tả flashcard set'
            },
            user: {
              type: 'string',
              description: 'ID người dùng sở hữu'
            },
            words: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Danh sách ID từ vựng'
            },
            totalWords: {
              type: 'number',
              description: 'Tổng số từ vựng'
            },
            learnedWords: {
              type: 'number',
              description: 'Số từ đã học'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['title', 'user']
        },
        UserGoal: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID mục tiêu'
            },
            user: {
              type: 'string',
              description: 'ID người dùng'
            },
            title: {
              type: 'string',
              description: 'Tên mục tiêu'
            },
            description: {
              type: 'string',
              description: 'Mô tả mục tiêu'
            },
            target: {
              type: 'number',
              description: 'Mục tiêu cần đạt'
            },
            current: {
              type: 'number',
              description: 'Tiến độ hiện tại'
            },
            unit: {
              type: 'string',
              description: 'Đơn vị (từ, bài học, phút)'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled'],
              default: 'active',
              description: 'Trạng thái mục tiêu'
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Hạn chót hoàn thành'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật cuối'
            }
          },
          required: ['user', 'title', 'target']
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Trạng thái lỗi'
            },
            message: {
              type: 'string',
              description: 'Thông điệp lỗi'
            },
            error: {
              type: 'object',
              description: 'Chi tiết lỗi'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/server.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 