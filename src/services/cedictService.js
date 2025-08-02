const fs = require('fs').promises;
const path = require('path');
const Vocabulary = require('../models/Vocabulary');

class CedictService {
  /**
   * Upload file JSON CC-CEDICT vào database từ file object (multer)
   */
  async uploadCedictFileFromUpload(file) {
    try {
      // Đọc file JSON từ buffer
      const fileContent = file.buffer.toString('utf8');
      const jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData)) {
        throw new Error('File JSON phải chứa một mảng các từ vựng');
      }

      const results = {
        total: jsonData.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        successes: []
      };

      // Xử lý từng từ vựng
      for (let i = 0; i < jsonData.length; i++) {
        const wordData = jsonData[i];
        
        try {
          // Kiểm tra và chuẩn hóa dữ liệu
          const normalizedData = this.normalizeCedictData(wordData);
          
          if (!normalizedData) {
            results.failed++;
            results.errors.push({
              index: i,
              word: wordData.word || 'Unknown',
              error: 'Dữ liệu không hợp lệ hoặc thiếu thông tin bắt buộc'
            });
            continue;
          }

          // Kiểm tra xem từ đã tồn tại chưa
          const existingWord = await Vocabulary.findOne({ chinese: normalizedData.chinese });
          
          if (existingWord) {
            // Update từ hiện có
            const updatedWord = await Vocabulary.findByIdAndUpdate(
              existingWord._id,
              normalizedData,
              { new: true, runValidators: true }
            );
            
            results.success++;
            results.successes.push({
              index: i,
              word: normalizedData.chinese,
              action: 'updated',
              id: updatedWord._id
            });
          } else {
            // Tạo từ mới
            const newWord = await Vocabulary.create(normalizedData);
            
            results.success++;
            results.successes.push({
              index: i,
              word: normalizedData.chinese,
              action: 'created',
              id: newWord._id
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            word: wordData.word || 'Unknown',
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('File JSON không hợp lệ');
      }
      throw new Error('Lỗi khi xử lý file JSON: ' + error.message);
    }
  }

  /**
   * Upload file JSON CC-CEDICT vào database từ file path (legacy method)
   */
  async uploadCedictFile(filePath) {
    try {
      // Đọc file JSON
      const fullPath = path.resolve(filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData)) {
        throw new Error('File JSON phải chứa một mảng các từ vựng');
      }

      const results = {
        total: jsonData.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        successes: []
      };

      // Xử lý từng từ vựng
      for (let i = 0; i < jsonData.length; i++) {
        const wordData = jsonData[i];
        
        try {
          // Kiểm tra và chuẩn hóa dữ liệu
          const normalizedData = this.normalizeCedictData(wordData);
          
          if (!normalizedData) {
            results.failed++;
            results.errors.push({
              index: i,
              word: wordData.word || 'Unknown',
              error: 'Dữ liệu không hợp lệ hoặc thiếu thông tin bắt buộc'
            });
            continue;
          }

          // Kiểm tra xem từ đã tồn tại chưa
          const existingWord = await Vocabulary.findOne({ chinese: normalizedData.chinese });
          
          if (existingWord) {
            // Update từ hiện có
            const updatedWord = await Vocabulary.findByIdAndUpdate(
              existingWord._id,
              normalizedData,
              { new: true, runValidators: true }
            );
            
            results.success++;
            results.successes.push({
              index: i,
              word: normalizedData.chinese,
              action: 'updated',
              id: updatedWord._id
            });
          } else {
            // Tạo từ mới
            const newWord = await Vocabulary.create(normalizedData);
            
            results.success++;
            results.successes.push({
              index: i,
              word: normalizedData.chinese,
              action: 'created',
              id: newWord._id
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            word: wordData.word || 'Unknown',
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Không tìm thấy file JSON');
      }
      if (error instanceof SyntaxError) {
        throw new Error('File JSON không hợp lệ');
      }
      throw new Error('Lỗi khi xử lý file JSON: ' + error.message);
    }
  }

  /**
   * Chuẩn hóa dữ liệu từ CC-CEDICT để phù hợp với schema Vocabulary
   */
  normalizeCedictData(wordData) {
    // Kiểm tra các trường bắt buộc
    if (!wordData.word || !wordData.pinyin || !wordData.meaning?.primary) {
      return null;
    }

    // Chuẩn hóa dữ liệu
    const normalizedData = {
      chinese: wordData.word.trim(),
      pinyin: wordData.pinyin.trim(),
      vietnameseReading: wordData.vietnameseReading?.trim() || '',
      meaning: {
        primary: wordData.meaning.primary.trim(),
        secondary: Array.isArray(wordData.meaning.secondary) ? wordData.meaning.secondary : [],
        partOfSpeech: wordData.meaning.partOfSpeech?.trim() || ''
      },
      grammar: {
        level: wordData.grammar?.level?.trim() || '',
        frequency: wordData.grammar?.frequency || 0,
        formality: wordData.grammar?.formality?.trim() || 'neutral'
      },
      examples: Array.isArray(wordData.examples) ? wordData.examples.map(example => ({
        chinese: example.chinese?.trim() || '',
        pinyin: example.pinyin?.trim() || '',
        vietnamese: example.vietnamese?.trim() || ''
      })) : [],
      related: {
        synonyms: Array.isArray(wordData.related?.synonyms) ? wordData.related.synonyms : [],
        antonyms: Array.isArray(wordData.related?.antonyms) ? wordData.related.antonyms : [],
        compounds: Array.isArray(wordData.related?.compounds) ? wordData.related.compounds : []
      }
    };

    // Xác định HSK level và category từ grammar.level
    const { hskLevel, category } = this.mapLevelToCategory(wordData.grammar?.level);
    normalizedData.hskLevel = hskLevel;
    normalizedData.category = category;

    return normalizedData;
  }

  /**
   * Map level từ CC-CEDICT sang hskLevel và category của Vocabulary
   * @param {string} level - Level từ CC-CEDICT
   * @returns {object} { hskLevel: number|null, category: string }
   */
  mapLevelToCategory(level) {
    if (!level) {
      return { hskLevel: null, category: 'Common' };
    }

    const levelStr = level.trim();

    // Kiểm tra HSK1-6
    const hskMatch = levelStr.match(/HSK(\d)/i);
    if (hskMatch) {
      const hskNumber = parseInt(hskMatch[1]);
      return { 
        hskLevel: hskNumber, 
        category: `HSK${hskNumber}` 
      };
    }

    // Kiểm tra Advanced
    if (levelStr.toLowerCase() === 'advanced') {
      return { 
        hskLevel: null, 
        category: 'Advanced' 
      };
    }

    // Kiểm tra các level khác
    const levelMap = {
      'beginner': { hskLevel: 1, category: 'HSK1' },
      'elementary': { hskLevel: 2, category: 'HSK2' },
      'intermediate': { hskLevel: 3, category: 'HSK3' },
      'literary': { hskLevel: null, category: 'Literary' },
      'technical': { hskLevel: null, category: 'Technical' },
      'informal': { hskLevel: null, category: 'Informal' }
    };

    const mappedLevel = levelMap[levelStr.toLowerCase()];
    if (mappedLevel) {
      return mappedLevel;
    }

    // Mặc định
    return { hskLevel: null, category: 'Common' };
  }

  /**
   * Validate file JSON CC-CEDICT
   */
  async validateCedictFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      if (!Array.isArray(jsonData)) {
        throw new Error('File JSON phải chứa một mảng các từ vựng');
      }

      const validationResults = {
        total: jsonData.length,
        valid: 0,
        invalid: 0,
        missingRequired: 0,
        missingOptional: 0,
        errors: [],
        warnings: []
      };

      // Validate từng từ vựng
      for (let i = 0; i < jsonData.length; i++) {
        this.validateWordData(jsonData[i], i, validationResults);
      }

      return validationResults;

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Không tìm thấy file JSON');
      }
      if (error instanceof SyntaxError) {
        throw new Error('File JSON không hợp lệ');
      }
      throw error;
    }
  }

  /**
   * Validate một từ vựng
   */
  validateWordData(wordData, index, results) {
    const word = wordData.word || 'Unknown';
    let isValid = true;
    let missingRequired = 0;
    let missingOptional = 0;

    // Kiểm tra các trường bắt buộc
    if (!wordData.word) {
      results.errors.push({
        index,
        word,
        field: 'word',
        type: 'required',
        message: 'Thiếu ký tự tiếng Trung'
      });
      missingRequired++;
      isValid = false;
    }

    if (!wordData.pinyin) {
      results.errors.push({
        index,
        word,
        field: 'pinyin',
        type: 'required',
        message: 'Thiếu pinyin'
      });
      missingRequired++;
      isValid = false;
    }

    if (!wordData.meaning?.primary) {
      results.errors.push({
        index,
        word,
        field: 'meaning.primary',
        type: 'required',
        message: 'Thiếu nghĩa chính'
      });
      missingRequired++;
      isValid = false;
    }

    // Kiểm tra các trường tùy chọn
    if (!wordData.vietnameseReading) {
      results.warnings.push({
        index,
        word,
        field: 'vietnameseReading',
        message: 'Thiếu cách đọc Hán Việt'
      });
      missingOptional++;
    }

    if (!wordData.meaning?.partOfSpeech) {
      results.warnings.push({
        index,
        word,
        field: 'meaning.partOfSpeech',
        message: 'Thiếu từ loại'
      });
      missingOptional++;
    }

    if (!wordData.grammar?.level) {
      results.warnings.push({
        index,
        word,
        field: 'grammar.level',
        message: 'Thiếu cấp độ ngữ pháp'
      });
      missingOptional++;
    }

    // Kiểm tra cấu trúc examples
    if (wordData.examples && !Array.isArray(wordData.examples)) {
      results.errors.push({
        index,
        word,
        field: 'examples',
        type: 'structure',
        message: 'Examples phải là một mảng'
      });
      isValid = false;
    }

    // Kiểm tra cấu trúc related
    if (wordData.related) {
      if (!Array.isArray(wordData.related.synonyms)) {
        results.warnings.push({
          index,
          word,
          field: 'related.synonyms',
          message: 'Synonyms phải là một mảng'
        });
      }
      if (!Array.isArray(wordData.related.antonyms)) {
        results.warnings.push({
          index,
          word,
          field: 'related.antonyms',
          message: 'Antonyms phải là một mảng'
        });
      }
      if (!Array.isArray(wordData.related.compounds)) {
        results.warnings.push({
          index,
          word,
          field: 'related.compounds',
          message: 'Compounds phải là một mảng'
        });
      }
    }

    // Cập nhật thống kê
    if (isValid) {
      results.valid++;
    } else {
      results.invalid++;
    }
    results.missingRequired += missingRequired;
    results.missingOptional += missingOptional;
  }
}

module.exports = new CedictService(); 