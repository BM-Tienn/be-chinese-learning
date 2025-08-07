const configurationService = require('../services/configurationService');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');

class ConfigurationController {
  // Lấy tất cả cấu hình theo type
  getConfigurationsByType = catchAsync(async (req, res, next) => {
    const { type } = req.params;
    
    const configurations = await configurationService.getConfigurationsByType(type);
    
    ApiResponse.success(res, 200, configurations, null, `Lấy danh sách cấu hình ${type} thành công`);
  });

  // Lấy tất cả cấu hình
  getAllConfigurations = catchAsync(async (req, res, next) => {
    const configurations = await configurationService.getAllConfigurations();
    
    ApiResponse.success(res, 200, configurations, null, 'Lấy tất cả cấu hình thành công');
  });

  // Lấy cấu hình cho frontend (tất cả types)
  getFrontendConfigurations = catchAsync(async (req, res, next) => {
    const [filters, topics, wordTypes] = await Promise.all([
      configurationService.getConfigurationsByType('filter'),
      configurationService.getConfigurationsByType('topic'),
      configurationService.getConfigurationsByType('wordType')
    ]);

    const response = {
      filters,
      topics,
      wordTypes
    };

    ApiResponse.success(res, 200, response, null, 'Lấy cấu hình frontend thành công');
  });

  // Tạo cấu hình mới (Admin only)
  createConfiguration = catchAsync(async (req, res, next) => {
    const configuration = await configurationService.createConfiguration(req.body);
    
    ApiResponse.successSingle(res, 201, configuration, 'Tạo cấu hình thành công');
  });

  // Cập nhật cấu hình (Admin only)
  updateConfiguration = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const configuration = await configurationService.updateConfiguration(id, req.body);
    
    ApiResponse.successSingle(res, 200, configuration, 'Cập nhật cấu hình thành công');
  });

  // Xóa cấu hình (Admin only)
  deleteConfiguration = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await configurationService.deleteConfiguration(id);
    
    ApiResponse.success(res, 200, [], null, 'Xóa cấu hình thành công');
  });

  // Cập nhật tất cả counts (Admin only)
  updateAllCounts = catchAsync(async (req, res, next) => {
    await configurationService.updateAllCounts();
    
    ApiResponse.success(res, 200, [], null, 'Cập nhật tất cả counts thành công');
  });

  // Khởi tạo cấu hình mặc định (Admin only)
  initializeDefaultConfigurations = catchAsync(async (req, res, next) => {
    await configurationService.initializeDefaultConfigurations();
    
    ApiResponse.success(res, 200, [], null, 'Khởi tạo cấu hình mặc định thành công');
  });

  // Lấy cấu hình cho Courses page
  getCourseFilters = catchAsync(async (req, res, next) => {
    const filters = await configurationService.getConfigurationsByType('filter');
    
    ApiResponse.success(res, 200, filters, null, 'Lấy filters cho Courses thành công');
  });

  // Lấy cấu hình cho Flashcards page
  getFlashcardConfigurations = catchAsync(async (req, res, next) => {
    const [topics, wordTypes] = await Promise.all([
      configurationService.getConfigurationsByType('topic'),
      configurationService.getConfigurationsByType('wordType')
    ]);

    const response = {
      topics,
      wordTypes
    };

    ApiResponse.success(res, 200, response, null, 'Lấy cấu hình Flashcards thành công');
  });

  // Lấy cấu hình theo type cụ thể
  getConfigurationsByTypePublic = catchAsync(async (req, res, next) => {
    const { type } = req.params;
    
    const configurations = await configurationService.getConfigurationsByType(type);
    
    ApiResponse.success(res, 200, configurations, null, `Lấy cấu hình ${type} thành công`);
  });

  // Bulk update configurations (Admin only)
  bulkUpdateConfigurations = catchAsync(async (req, res, next) => {
    const { configurations } = req.body;
    
    if (!Array.isArray(configurations)) {
      return ApiResponse.error(res, 400, 'Dữ liệu configurations phải là một mảng');
    }

    const results = [];
    for (const config of configurations) {
      try {
        if (config._id) {
          // Update existing
          const updated = await configurationService.updateConfiguration(config._id, config);
          results.push(updated);
        } else {
          // Create new
          const created = await configurationService.createConfiguration(config);
          results.push(created);
        }
      } catch (error) {
        results.push({ error: error.message, config });
      }
    }

    ApiResponse.success(res, 200, results, null, 'Cập nhật hàng loạt cấu hình thành công');
  });

  // Export configurations (Admin only)
  exportConfigurations = catchAsync(async (req, res, next) => {
    const configurations = await configurationService.getAllConfigurations();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalConfigurations: configurations.length,
      configurations: configurations
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=configurations.json');
    
    ApiResponse.successSingle(res, 200, exportData, 'Export cấu hình thành công');
  });

  // Import configurations (Admin only)
  importConfigurations = catchAsync(async (req, res, next) => {
    const { configurations } = req.body;
    
    if (!Array.isArray(configurations)) {
      return ApiResponse.error(res, 400, 'Dữ liệu import phải là một mảng configurations');
    }

    const results = [];
    for (const config of configurations) {
      try {
        const created = await configurationService.createConfiguration(config);
        results.push(created);
      } catch (error) {
        results.push({ error: error.message, config });
      }
    }

    ApiResponse.success(res, 200, results, null, 'Import cấu hình thành công');
  });
}

module.exports = new ConfigurationController(); 