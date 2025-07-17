/**
 * Utility functions for the Chinese Learning Backend
 */

/**
 * Clean up file path by removing the uploads directory
 * @param {string} filePath 
 * @returns {string}
 */
const cleanupFilePath = (filePath) => {
  return filePath.replace(/^uploads\//, '');
};

/**
 * Validate Chinese text content
 * @param {string} content 
 * @returns {boolean}
 */
const hasChineseContent = (content) => {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(content);
};

/**
 * Generate unique filename
 * @param {string} originalName 
 * @returns {string}
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = originalName.split('.').pop();
  return `document-${timestamp}-${random}.${ext}`;
};

/**
 * Format error response
 * @param {string} message 
 * @param {number} statusCode 
 * @returns {object}
 */
const formatErrorResponse = (message, statusCode = 500) => {
  return {
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format success response
 * @param {object} data 
 * @param {string} message 
 * @returns {object}
 */
const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  cleanupFilePath,
  hasChineseContent,
  generateUniqueFilename,
  formatErrorResponse,
  formatSuccessResponse
}; 