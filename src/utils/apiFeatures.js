const { REQUEST, DATABASE } = require('./constants');

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterQuery = {};
  }

  // Filter method
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.filterQuery = JSON.parse(queryStr);
    this.query = this.query.find(this.filterQuery);

    return this;
  }

  // Sort method
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(`${DATABASE.DEFAULT_SORT_ORDER === -1 ? '-' : ''}${DATABASE.DEFAULT_SORT_FIELD}`);
    }

    return this;
  }

  // Limit fields method
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // Pagination method
  paginate() {
    this.page = this.queryString.page * 1 || REQUEST.DEFAULT_PAGE;
    this.limit = this.queryString.limit * 1 || REQUEST.DEFAULT_LIMIT;
    
    // Giới hạn limit tối đa
    if (this.limit > REQUEST.MAX_LIMIT) {
      this.limit = REQUEST.MAX_LIMIT;
    }
    
    this.skip = (this.page - 1) * this.limit;

    this.query = this.query.skip(this.skip).limit(this.limit);

    return this;
  }

  // Search method
  search() {
    if (this.queryString.search) {
      const searchQuery = {
        $or: [
          { chinese: { $regex: this.queryString.search, $options: 'i' } },
          { pinyin: { $regex: this.queryString.search, $options: 'i' } },
          { 'meaning.primary': { $regex: this.queryString.search, $options: 'i' } },
          { 'meaning.secondary': { $regex: this.queryString.search, $options: 'i' } }
        ]
      };

      // Ghi đè filter query hiện tại với search query
      this.filterQuery = searchQuery;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Date range filter
  dateRange() {
    if (this.queryString.startDate || this.queryString.endDate) {
      const dateFilter = {};
      
      if (this.queryString.startDate) {
        dateFilter.$gte = new Date(this.queryString.startDate);
      }
      
      if (this.queryString.endDate) {
        dateFilter.$lte = new Date(this.queryString.endDate);
      }

      this.filterQuery.createdAt = dateFilter;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Status filter
  statusFilter() {
    if (this.queryString.status) {
      this.filterQuery.status = this.queryString.status;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Level filter
  levelFilter() {
    if (this.queryString.level) {
      this.filterQuery.level = this.queryString.level;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Category filter
  categoryFilter() {
    if (this.queryString.category) {
      this.filterQuery.category = this.queryString.category;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Difficulty filter
  difficultyFilter() {
    if (this.queryString.difficulty) {
      this.filterQuery.difficulty = this.queryString.difficulty;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Tag filter
  tagFilter() {
    if (this.queryString.tags) {
      const tags = this.queryString.tags.split(',');
      this.filterQuery.tags = { $in: tags };
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Price range filter
  priceRange() {
    if (this.queryString.minPrice || this.queryString.maxPrice) {
      const priceFilter = {};
      
      if (this.queryString.minPrice) {
        priceFilter.$gte = parseFloat(this.queryString.minPrice);
      }
      
      if (this.queryString.maxPrice) {
        priceFilter.$lte = parseFloat(this.queryString.maxPrice);
      }

      this.filterQuery.price = priceFilter;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Rating filter
  ratingFilter() {
    if (this.queryString.minRating) {
      this.filterQuery.rating = { $gte: parseFloat(this.queryString.minRating) };
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // In stock filter
  inStockFilter() {
    if (this.queryString.inStock === 'true') {
      this.filterQuery.stock = { $gt: 0 };
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Featured filter
  featuredFilter() {
    if (this.queryString.featured === 'true') {
      this.filterQuery.featured = true;
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Popular filter (by views or sales)
  popularFilter() {
    if (this.queryString.popular === 'true') {
      this.query = this.query.sort('-views -sales');
    }

    return this;
  }

  // Random selection
  random() {
    if (this.queryString.random === 'true') {
      this.query = this.query.aggregate([
        { $sample: { size: parseInt(this.queryString.limit) || 10 } }
      ]);
    }

    return this;
  }

  // Near location (for location-based queries)
  nearLocation() {
    if (this.queryString.lng && this.queryString.lat) {
      const lng = parseFloat(this.queryString.lng);
      const lat = parseFloat(this.queryString.lat);
      const maxDistance = parseFloat(this.queryString.maxDistance) || 10000; // 10km default

      this.filterQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      };

      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Text search with multiple fields
  textSearch() {
    if (this.queryString.q) {
      const searchTerm = this.queryString.q;
      const searchFields = this.queryString.searchFields ? 
        this.queryString.searchFields.split(',') : 
        ['word', 'pinyin', 'meaning'];

      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' }
        }))
      };

      this.filterQuery = { ...this.filterQuery, ...searchQuery };
      this.query = this.query.find(this.filterQuery);
    }

    return this;
  }

  // Get pagination info
  getPaginationInfo() {
    return {
      page: this.page,
      limit: this.limit,
      skip: this.skip
    };
  }

  // Get filter query
  getFilterQuery() {
    return this.filterQuery;
  }
}

module.exports = ApiFeatures; 