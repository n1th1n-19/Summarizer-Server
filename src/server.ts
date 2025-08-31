import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { testDatabaseConnection } from './config/database';
import passport from './config/passport';
import { generalLimiter, addRateLimitHeaders } from './middleware/rateLimiting';

// Routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import chatRoutes from './routes/chat';
import docsRoutes from './routes/docs';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(addRateLimitHeaders);
app.use(generalLimiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://summarizer-ui.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Passport middleware
app.use(passport.initialize());

// API Routes
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/chat', chatRoutes);
app.use('/docs', docsRoutes);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await testDatabaseConnection();
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'AI Research Paper Summarizer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      documents: '/documents',
      chat: '/chat',
      docs: '/docs'
    }
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.'
  });
});

// Error handling middleware
app.use((error: Error, _req: Request, res: Response, _next: any) => {
  void _next; // Suppress unused variable warning
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message
  });
});

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Test PostgreSQL database connection
    console.log('🔌 Connecting to PostgreSQL database...');
    await testDatabaseConnection();
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: PostgreSQL with native pg driver`);
      console.log(`📝 Database schema should already be in place`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
