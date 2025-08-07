const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { REQUEST, SECURITY } = require('./utils/constants');

// Import middleware
const { applySecurityMiddleware } = require('./middlewares/security');
const { requestLogger, errorLogger } = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vocabularyRoutes = require('./routes/vocabularyRoutes');
const wordRoutes = require('./routes/wordRoutes');
const courseRoutes = require('./routes/courseRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const configurationRoutes = require('./routes/configurationRoutes');

// Import database connection
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Security middleware
applySecurityMiddleware(app);

// Body parser middleware
app.use(express.json({ limit: REQUEST.MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: REQUEST.MAX_URL_ENCODED_SIZE }));

// Cookie parser middleware
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);

// CORS configuration
app.use(cors({
  origin: SECURITY.CORS.ALLOWED_ORIGINS,
  credentials: SECURITY.CORS.CREDENTIALS,
  methods: SECURITY.CORS.ALLOWED_METHODS,
  allowedHeaders: SECURITY.CORS.ALLOWED_HEADERS
}));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  docExpansion: 'list',
  filter: true,
  tryItOutEnabled: true,
  showRequestHeaders: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use(`${REQUEST.API_PREFIX}/auth`, authRoutes);
app.use(`${REQUEST.API_PREFIX}/users`, userRoutes);
app.use(`${REQUEST.API_PREFIX}/vocabularies`, vocabularyRoutes);
app.use(`${REQUEST.API_PREFIX}/words`, wordRoutes);
app.use(`${REQUEST.API_PREFIX}/courses`, courseRoutes);
app.use(`${REQUEST.API_PREFIX}/flashcards`, flashcardRoutes);
app.use(`${REQUEST.API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${REQUEST.API_PREFIX}/configurations`, configurationRoutes);

// 404 handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error handling middleware
app.use(errorLogger);
app.use(errorHandler);

module.exports = app; 