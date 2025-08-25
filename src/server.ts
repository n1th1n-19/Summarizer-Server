import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { testPrismaConnection } from './config/prisma';
import passport from './config/passport';
import { generalLimiter, addRateLimitHeaders } from './middleware/rateLimiting';

// Routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import chatRoutes from './routes/chat';
import docsRoutes from './routes/docs';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(addRateLimitHeaders);
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  const dbStatus = await testPrismaConnection();
  
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
app.use((error: Error, _req: Request, res: Response, _next: Function) => {
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
    // Test Prisma database connection
    console.log('🔌 Connecting to Supabase with Prisma...');
    await testPrismaConnection();
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: Supabase PostgreSQL with Prisma ORM`);
      console.log(`📝 Run 'npm run db:push' to sync database schema`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;