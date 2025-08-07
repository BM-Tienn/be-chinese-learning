# 📚 CẤU TRÚC MODEL - CHINESE LEARNING PLATFORM

## 🎯 **TỔNG QUAN**

Hệ thống model được thiết kế để hỗ trợ đầy đủ các tính năng của ứng dụng học tiếng Trung, bao gồm:
- Quản lý người dùng và tiến độ học tập
- Hệ thống khóa học và bài học
- Flashcard và từ vựng
- Mục tiêu học tập và thống kê

## 🏗️ **MODEL HIỆN CÓ (TẬN DỤNG)**

### 1. **User** - Người dùng
```javascript
{
  username, email, password, role,
  learningProfile: {
    currentLevel, totalStudyTime, totalWordsLearned,
    totalLessonsCompleted, streak, bestStreak, lastStudyDate
  },
  preferences: {
    theme, language, notifications, dailyGoal
  }
}
```

### 2. **Vocabulary** - Từ vựng toàn cầu
```javascript
{
  chinese, pinyin, vietnameseReading,
  meaning: { primary, secondary, partOfSpeech },
  grammar: { level, frequency, formality },
  examples, related: { synonyms, antonyms, compounds },
  hskLevel, category
}
```

### 3. **Word** - Từ vựng cá nhân
```javascript
{
  user, chinese, pinyin, definition,
  hskLevel, tags, notes
}
```

### 4. **UserProgress** - Tiến độ học tập
```javascript
{
  user, course, lesson, flashcardSet,
  progress, score, timeSpent, completedAt,
  isCompleted, lastStudied, studySessions,
  metadata: { mastery, attempts, streak }
}
```

### 5. **StudySession** - Phiên học tập
```javascript
{
  user, course, lesson, flashcardSet, type,
  startTime, endTime, duration, score, progress,
  isCompleted, vocabularyStudied,
  metadata: { device, location, notes, difficulty }
}
```

## 🆕 **MODEL MỚI (BỔ SUNG)**

### 6. **Course** - Khóa học
```javascript
{
  title, description, level, levelColor, image,
  duration, lessons[], totalLessons,
  students, rating, isNew, isPopular, isActive, order,
  metadata: { difficulty, category, tags }
}
```

### 7. **Lesson** - Bài học
```javascript
{
  title, subtitle, course, level, order, image,
  content, vocabulary[], grammar[], exercises[],
  estimatedTime, difficulty, isActive,
  metadata: { tags, prerequisites, learningObjectives }
}
```

### 8. **FlashcardSet** - Bộ thẻ học
```javascript
{
  title, description, category, type, difficulty,
  color, icon, cards[], cardCount, timeEstimate,
  isNew, isRecommended, isActive, level,
  metadata: { tags, learningObjectives, prerequisites }
}
```

### 9. **UserGoal** - Mục tiêu học tập (CẬP NHẬT)
```javascript
{
  user, type, category, label, current, total, unit,
  color, icon, startDate, endDate,
  isCompleted, isActive, progress,
  metadata: { description, notes, reminders }
}
```

## 🔗 **QUAN HỆ GIỮA CÁC MODEL**

```
User
├── UserGoal (1:N)
├── UserProgress (1:N)
├── StudySession (1:N)
├── Word (1:N)
└── Vocabulary (N:M qua UserProgress)

Course
├── Lesson (1:N)
└── UserProgress (1:N)

Lesson
├── Vocabulary (N:M)
└── UserProgress (1:N)

FlashcardSet
├── Vocabulary (N:M qua cards)
└── UserProgress (1:N)

Vocabulary
├── Word (1:N)
├── UserProgress (N:M)
└── StudySession (N:M qua vocabularyStudied)
```

## 📊 **TÍNH NĂNG HỖ TRỢ**

### **Dashboard**
- ✅ UserGoal: Hiển thị mục tiêu học tập
- ✅ UserProgress: Tiến độ bài học hiện tại
- ✅ StudySession: Thống kê thời gian học

### **Courses**
- ✅ Course: Danh sách khóa học
- ✅ Lesson: Bài học trong khóa học
- ✅ UserProgress: Tiến độ từng khóa học

### **Flashcards**
- ✅ FlashcardSet: Bộ thẻ học
- ✅ Vocabulary: Từ vựng trong thẻ
- ✅ UserProgress: Mức độ thành thạo

### **Lessons**
- ✅ Lesson: Nội dung bài học
- ✅ Vocabulary: Từ vựng bài học
- ✅ UserProgress: Tiến độ và điểm số

## 🎨 **TÍNH NĂNG UI SUPPORT**

### **Dashboard Goals**
```javascript
// UserGoal fields phù hợp với UI
{
  label: "Từ mới", "Chữ Hán", "Bài nghe",
  current: 5, total: 10,
  unit: "từ", "chữ", "bài",
  color: "blue", "green", "purple",
  icon: "BookOpen", "Target", "Play"
}
```

### **Course Cards**
```javascript
// Course fields phù hợp với UI
{
  title: "Giáo trình Hán ngữ 1",
  level: "HSK 1", levelColor: "red",
  duration: "8 tuần", students: 1247,
  rating: 4.8, isNew: true, isPopular: true
}
```

### **Lesson Progress**
```javascript
// UserProgress fields phù hợp với UI
{
  progress: 50, score: 85, timeSpent: 15,
  isCompleted: false, lastStudied: Date
}
```

### **Flashcard Sets**
```javascript
// FlashcardSet fields phù hợp với UI
{
  title: "HSK 1 - Bài 1: Chào hỏi",
  difficulty: "Dễ", mastery: 75,
  cardCount: 15, timeEstimate: "10 phút",
  isNew: true, isRecommended: true
}
```

## 🔧 **IMPLEMENTATION NOTES**

1. **Tận dụng model cũ**: Không thay đổi cấu trúc model hiện có
2. **Bổ sung trường mới**: Thêm các trường cần thiết cho UI
3. **Index tối ưu**: Đã thiết kế index cho query hiệu quả
4. **Validation**: Đầy đủ validation cho data integrity
5. **Populate**: Tự động populate references khi query

## 📈 **NEXT STEPS**

1. Tạo controllers cho các model mới
2. Implement API routes
3. Tạo seed data cho testing
4. Cập nhật frontend để sử dụng API mới
5. Implement real-time updates với Socket.IO 