const cedictService = require('../services/cedictService');

/**
 * Script để validate file JSON CC-CEDICT trước khi upload
 * Kiểm tra cấu trúc dữ liệu và báo cáo các vấn đề
 */

class CedictValidator {
  constructor() {
    this.validationResults = null;
  }

  /**
   * Validate file JSON CC-CEDICT
   */
  async validateFile(filePath) {
    try {
      console.log(`🔍 Đang validate file: ${filePath}`);
      
      // Sử dụng service để validate
      this.validationResults = await cedictService.validateCedictFile(filePath);
      
      console.log(`📊 Tổng số từ vựng: ${this.validationResults.total}`);

      // In báo cáo
      this.printReport();

    } catch (error) {
      console.error('❌ Lỗi khi validate file:', error.message);
      process.exit(1);
    }
  }

  /**
   * In báo cáo validation
   */
  printReport() {
    console.log('\n📋 BÁO CÁO VALIDATION CC-CEDICT JSON');
    console.log('=' .repeat(50));

    // Thống kê tổng quan
    console.log('\n📊 THỐNG KÊ TỔNG QUAN:');
    console.log(`  Tổng số từ vựng: ${this.validationResults.total}`);
    console.log(`  ✅ Hợp lệ: ${this.validationResults.valid}`);
    console.log(`  ❌ Không hợp lệ: ${this.validationResults.invalid}`);
    console.log(`  📝 Thiếu trường bắt buộc: ${this.validationResults.missingRequired}`);
    console.log(`  ⚠️  Thiếu trường tùy chọn: ${this.validationResults.missingOptional}`);

    // Tỷ lệ thành công
    const successRate = ((this.validationResults.valid / this.validationResults.total) * 100).toFixed(2);
    console.log(`  📈 Tỷ lệ thành công: ${successRate}%`);

    // In lỗi
    if (this.validationResults.errors.length > 0) {
      console.log('\n❌ CÁC LỖI GẶP PHẢI:');
      this.validationResults.errors.slice(0, 10).forEach(error => {
        console.log(`  [${error.index}] "${error.word}": ${error.message}`);
      });
      
      if (this.validationResults.errors.length > 10) {
        console.log(`  ... và ${this.validationResults.errors.length - 10} lỗi khác`);
      }
    }

    // In cảnh báo
    if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️  CÁC CẢNH BÁO:');
      this.validationResults.warnings.slice(0, 10).forEach(warning => {
        console.log(`  [${warning.index}] "${warning.word}": ${warning.message}`);
      });
      
      if (this.validationResults.warnings.length > 10) {
        console.log(`  ... và ${this.validationResults.warnings.length - 10} cảnh báo khác`);
      }
    }

    // Kết luận
    console.log('\n🎯 KẾT LUẬN:');
    if (this.validationResults.invalid === 0) {
      console.log('✅ File JSON hoàn toàn hợp lệ và sẵn sàng upload!');
    } else if (this.validationResults.valid > this.validationResults.invalid) {
      console.log('⚠️  File JSON có một số lỗi nhưng vẫn có thể upload (các từ lỗi sẽ bị bỏ qua)');
    } else {
      console.log('❌ File JSON có quá nhiều lỗi, cần kiểm tra và sửa trước khi upload');
    }

    // Gợi ý sửa lỗi
    if (this.validationResults.errors.length > 0) {
      console.log('\n💡 GỢI Ý SỬA LỖI:');
      const errorTypes = {};
      this.validationResults.errors.forEach(error => {
        errorTypes[error.field] = (errorTypes[error.field] || 0) + 1;
      });
      
      Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([field, count]) => {
          console.log(`  - ${field}: ${count} lỗi`);
        });
    }
  }

  /**
   * Xuất báo cáo ra file
   */
  async exportReport(outputPath) {
    const fs = require('fs').promises;
    
    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        total: this.validationResults.total,
        valid: this.validationResults.valid,
        invalid: this.validationResults.invalid,
        missingRequired: this.validationResults.missingRequired,
        missingOptional: this.validationResults.missingOptional
      },
      errors: this.validationResults.errors,
      warnings: this.validationResults.warnings,
      summary: {
        successRate: ((this.validationResults.valid / this.validationResults.total) * 100).toFixed(2),
        isReadyForUpload: this.validationResults.invalid === 0 || this.validationResults.valid > this.validationResults.invalid
      }
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Báo cáo đã được xuất ra: ${outputPath}`);
  }
}

/**
 * Hàm chính
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Cách sử dụng:');
    console.log('  node validate-cedict-json.js <file-path> [output-report-path]');
    console.log('');
    console.log('📝 Ví dụ:');
    console.log('  node validate-cedict-json.js ./scripts/data/cedict_1_0_ts_utf-8_mdbg_part_44_results.json');
    console.log('  node validate-cedict-json.js ./scripts/data/cedict_1_0_ts_utf-8_mdbg_part_44_results.json ./validation-report.json');
    process.exit(1);
  }

  const filePath = args[0];
  const outputPath = args[1];

  const validator = new CedictValidator();
  await validator.validateFile(filePath);

  if (outputPath) {
    await validator.exportReport(outputPath);
  }
}

// Chạy script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CedictValidator; 