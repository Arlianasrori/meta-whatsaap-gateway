import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';
import routes from './routes/index.js';
import  {errorMiddleware}  from './middlewares/error.middleware.js';
import { responseError } from './utils/error.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Konfigurasi __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

// Inisialisasi express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true // Mengizinkan pengiriman cookies dalam permintaan cross-origin
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Untuk memproses cookies

// Logging
if (config.environment === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WhatsApp Gateway API',
  customfavIcon: '',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Routes
app.use('/api', routes);

// 404 handler
app.all('*', (req, res, next) => {
  next(new responseError(404, `Route tidak ditemukan: ${req.originalUrl}`));
});

// Error handling
app.use(errorMiddleware);

export default app; 