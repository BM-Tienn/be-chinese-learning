class ApiResponse {
    /**
     * Gửi phản hồi thành công với cấu trúc chuẩn.
     * @param {object} res - Đối tượng response của Express.
     * @param {number} statusCode - Mã trạng thái HTTP.
     * @param {array} items - Danh sách items.
     * @param {object} pagination - Thông tin phân trang.
     * @param {string} message - Tin nhắn thành công.
     */
    static success(res, statusCode, items = [], pagination = null, message = 'Thao tác thành công') {
        const responsePayload = {
            status: 'success',
            message,
            data: {
                pagination: pagination || {
                    page: 1,
                    limit: items.length,
                    count: items.length,
                    pageTotal: 1
                },
                items: items
            }
        };
        
        return res.status(statusCode).json(responsePayload);
    }

    /**
     * Gửi phản hồi thành công cho single item.
     * @param {object} res - Đối tượng response của Express.
     * @param {number} statusCode - Mã trạng thái HTTP.
     * @param {object} item - Item đơn lẻ.
     * @param {string} message - Tin nhắn thành công.
     */
    static successSingle(res, statusCode, item, message = 'Thao tác thành công') {
        const responsePayload = {
            status: 'success',
            message,
            data: {
                item: item
            }
        };
        
        return res.status(statusCode).json(responsePayload);
    }

    /**
     * Gửi phản hồi lỗi.
     * @param {object} res - Đối tượng response của Express.
     * @param {number} statusCode - Mã trạng thái HTTP.
     * @param {string} message - Tin nhắn lỗi cho client.
     * @param {string} [errorDetails] - Chi tiết lỗi (cho logging, không gửi cho client ở production).
     */
    static error(res, statusCode, message, errorDetails = null) {
        const responsePayload = {
            status: 'error',
            error: {
                message,
                ...(process.env.NODE_ENV !== 'production' && errorDetails && { details: errorDetails }),
            },
        };
        
        return res.status(statusCode).json(responsePayload);
    }

    /**
     * Tạo thông tin pagination từ query parameters và tổng số items.
     * @param {object} query - Query parameters từ request.
     * @param {number} totalItems - Tổng số items.
     * @returns {object} Thông tin pagination.
     */
    static createPagination(query, totalItems) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const pageTotal = Math.ceil(totalItems / limit);
        
        return {
            page,
            limit,
            count: totalItems,
            pageTotal
        };
    }
}

module.exports = ApiResponse;
