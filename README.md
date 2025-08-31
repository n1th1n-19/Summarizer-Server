# AI Research Paper Summarizer Server

A TypeScript-based backend server for processing and summarizing research papers using AI services.

## Tech Stack

### Core Framework

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript

### Database

- **PostgreSQL** - Primary database (via native pg driver)
- **pg** - Native PostgreSQL client  
- **Connection pooling** - Efficient database connections

### Security & Middleware

- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logging
- **multer** - File upload handling
- **express-rate-limit** - API rate limiting

### Authentication

- **jsonwebtoken** - JWT token-based auth
- **passport** - Authentication middleware
- **passport-google-oauth20** - Google OAuth strategy
- **passport-jwt** - JWT authentication strategy

### File Processing

- **pdf-parse** - PDF text extraction
- **mammoth** - Microsoft Word (.docx) processing
- **xlsx** - Excel spreadsheet processing
- **file-type** - File type detection

### AI Services

- **@google/generative-ai** - Google Gemini AI integration
- **openai** - OpenAI SDK (compatible with OpenRouter)
- **OpenRouter** - Access to DeepSeek and other models
- **Dual AI Provider Support** - Gemini primary, OpenRouter fallback

### Development Dependencies

- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution environment
- **nodemon** - Development server with auto-restart
- **@types/** packages - Type definitions
- **eslint** - Code linting
- **@typescript-eslint/parser** & **@typescript-eslint/eslint-plugin** - TypeScript ESLint support
- **rimraf** - Cross-platform rm -rf

## Dependencies

### Production Dependencies

```json
{
  "@google/generative-ai": "^0.24.1",
  "compression": "^1.7.4",
  "cookie-parser": "^1.4.6", 
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-rate-limit": "^7.1.5",
  "file-type": "^18.7.0",
  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2",
  "mammoth": "^1.6.0",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "openai": "^4.20.1",
  "passport": "^0.6.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-jwt": "^4.0.1",
  "pdf-parse": "^1.1.1",
  "pg": "^8.16.3",
  "xlsx": "^0.18.5",
  "zod": "^3.25.76"
}
```

### Development Dependencies

```json
{
  "@types/compression": "^1.7.4",
  "@types/cookie-parser": "^1.4.4",
  "@types/cors": "^2.8.14",
  "@types/express": "^4.17.21",
  "@types/jest": "^29.5.6",
  "@types/jsonwebtoken": "^9.0.4",
  "@types/morgan": "^1.9.7",
  "@types/multer": "^1.4.8",
  "@types/node": "^20.8.7",
  "@types/passport": "^1.0.14",
  "@types/passport-google-oauth20": "^2.0.13",
  "@types/passport-jwt": "^3.0.11",
  "@types/pdf-parse": "^1.1.4",
  "@types/pg": "^8.15.5",
  "@types/supertest": "^2.0.15",
  "@typescript-eslint/eslint-plugin": "^6.21.0",
  "@typescript-eslint/parser": "^6.21.0",
  "eslint": "^8.52.0",
  "jest": "^29.7.0",
  "nodemon": "^3.0.1",
  "rimraf": "^5.0.5",
  "supertest": "^6.3.3",
  "ts-jest": "^29.1.1",
  "ts-node": "^10.9.1",
  "tsconfig-paths": "^4.2.0",
  "typescript": "^5.2.2"
}
```

## Getting Started

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file
4. Run development server: `npm run dev`
5. Build for production: `npm run build`
6. Start production server: `npm start`

### Deployment to Render

This project is ready to deploy to [Render](https://render.com) with zero configuration.

#### Option 1: Using render.yaml (Recommended)

1. **Fork this repository** to your GitHub account
2. **Connect to Render**:
   - Go to [render.com](https://render.com) and sign up
   - Click "New" → "Blueprint" 
   - Connect your GitHub repository
3. **Configure Environment Variables** in Render dashboard:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENROUTER_API_KEY=your_openrouter_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Deploy**: Render will automatically create both web service and PostgreSQL database

#### Option 2: Manual Setup

1. **Create Web Service**:
   - Go to Render dashboard → "New" → "Web Service"
   - Connect your repository
   - Configure:
     - **Build Command**: `npm install && npm run build:render`
     - **Start Command**: `npm start`
     - **Health Check Path**: `/health`
2. **Create PostgreSQL Database**:
   - Go to "New" → "PostgreSQL"  
   - Note the connection string
3. **Set Environment Variables**:
   - Add all required environment variables
   - Use the PostgreSQL connection string for `DATABASE_URL`

#### Production URLs
- **Backend**: `https://your-service-name.onrender.com`
- **API Docs**: `https://your-service-name.onrender.com/docs`
- **Health Check**: `https://your-service-name.onrender.com/health`

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript with full validation (lint + typecheck + tests)
- `npm run build:render` - Build for Render deployment (TypeScript only)
- `npm run build:prod` - Production build (clean + TypeScript)
- `npm run start` - Start production server
- `npm run start:prod` - Start production server with NODE_ENV=production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - Run TypeScript type checking
- `npm run clean` - Clean build directory
- `npm run test` - Run tests
- `npm run test:ci` - Run tests for CI/CD

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Google OAuth (Required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:3000

# AI Services
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy the Client ID and Client Secret to your `.env` file

## PostgreSQL Database Setup (Supabase)

This project uses **Supabase PostgreSQL** with native **pg** driver for direct database operations (no ORM).

### Quick Setup with Supabase

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready (usually 1-2 minutes)

2. **Get Database Connection String**:
   - Go to Project Settings > Database
   - Copy the **Connection string** under "Connection pooling"
   - Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

3. **Update Environment Variables**:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

4. **Database Schema**:
   - The application uses raw SQL queries with the native `pg` driver
   - Database tables are created automatically on first run
   - Uses Supabase's managed PostgreSQL with connection pooling
   - No migrations or schema files needed

### Alternative PostgreSQL Providers

You can also use other PostgreSQL providers:
- **Railway**, **Render**, **Neon**, **PlanetScale**, or local PostgreSQL
- Just update the `DATABASE_URL` with your connection string

### Database Schema

The database includes these tables:

- **users** - JWT authentication and user profiles
- **documents** - Uploaded files with extracted text and summaries
- **document_embeddings** - Vector embeddings for semantic search
- **chat_sessions** - Chat conversation sessions
- **chat_messages** - Individual chat messages and responses

### Authentication System

This project uses **Google OAuth 2.0 ONLY** for secure authentication:

- ✅ **JWT tokens** generated by your Express server after Google OAuth
- ✅ **Google OAuth 2.0** with passport.js (only authentication method)
- ✅ **No password storage** - enhanced security
- ✅ **Full control** over authentication logic
- ✅ **Direct SQL queries** - no ORM overhead
- ✅ **Supabase PostgreSQL** - managed database with connection pooling

### Database Operations

- **Supabase PostgreSQL**: Managed database with automatic backups
- **Native pg Driver**: Raw SQL queries with connection pooling
- **Type Safety**: Custom TypeScript interfaces for database models
- **Performance**: Direct database access without ORM overhead
- **Vector Storage**: Supabase supports `pgvector` extension for embeddings
- **Connection Pooling**: Uses Supabase's connection pooler (port 6543)

## Dual AI Provider Support

This project implements a **dual AI provider system** with automatic fallback:

### 🥇 Primary: Google Gemini
- **Model**: Gemini 1.5 Flash
- **Fast & free**: High-quality responses with generous free tier
- **Handles**: Text summarization, chat, keyword extraction

### 🥈 Fallback: OpenRouter + DeepSeek
- **Model**: DeepSeek Chat via OpenRouter
- **Reliable backup**: Automatic fallback if Gemini fails
- **Embeddings**: Uses OpenAI-compatible embedding models

### AI Service Benefits
- **Reliability**: Dual provider ensures high availability
- **Cost Optimization**: Free Gemini first, paid OpenRouter as backup
- **Quality**: Both providers offer excellent AI capabilities
- **Automatic Fallback**: Seamless switching between providers

### Setup Required
```env
# Primary AI Provider
GEMINI_API_KEY=your_gemini_api_key

# Backup AI Provider  
OPENROUTER_API_KEY=your_openrouter_api_key
```

## API Endpoints

### 🏥 Health & Information

- `GET /health` - Health check and system status
- `GET /` - API information and available endpoints
- `GET /docs` - Complete API documentation

### 🔐 Authentication (Google OAuth Only)

- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback handler
- `GET /auth/profile` - Get current user profile (requires JWT)
- `PUT /auth/profile` - Update user profile (name only, requires JWT)
- `POST /auth/logout` - Logout user (client-side token removal)
- `GET /auth/me` - Get current user info (alternative to /profile)
- `GET /auth/verify` - Verify JWT token validity

### 📄 Document Management

- `GET /documents` - Get user documents with pagination (requires JWT)
- `POST /documents/upload` - Upload and process document (requires JWT)
- `GET /documents/:id` - Get specific document details (requires JWT)
- `DELETE /documents/:id` - Delete document (requires JWT)
- `POST /documents/:id/summarize` - Generate new summary for document (requires JWT)
- `POST /documents/:id/embeddings` - Generate vector embeddings for document (requires JWT)
- `POST /documents/search` - Search similar documents using semantic query (requires JWT)

### 💬 Chat & AI Interaction

- `POST /chat/sessions` - Create new chat session for a document (requires JWT)
- `GET /chat/sessions` - Get user's chat sessions with pagination (requires JWT)
- `GET /chat/sessions/:id` - Get specific chat session with message history (requires JWT)
- `DELETE /chat/sessions/:id` - Delete chat session (requires JWT)
- `POST /chat/sessions/:id/messages` - Send message in chat session (requires JWT)
- `POST /chat/query` - Quick query without creating persistent session (requires JWT)

### 📊 Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **File Upload**: 10 uploads per hour per IP
- **AI Operations**: 50 requests per hour per IP
- **Search**: 100 searches per hour per IP

### 🛡️ Security Features

- JWT-based authentication
- Google OAuth 2.0 integration (only authentication method)
- Input sanitization and validation with Zod
- Rate limiting protection
- CORS configuration
- Security headers (Helmet)
- File type validation
- Request logging
- No password storage for enhanced security

## API Usage Examples

### Authentication (Google OAuth Only)

#### Google OAuth Login

```bash
# Redirect user to Google OAuth:
GET /auth/google

# User will be redirected back to your frontend with JWT token:
# http://localhost:3000/auth/callback?token=JWT_TOKEN

# Example successful OAuth response:
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "avatarUrl": "https://lh3.googleusercontent.com/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Update Profile (Name Only)

```bash
PUT /auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Document Management

#### Upload Document

```bash
POST /documents/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

# Form data:
document: [PDF/DOCX/TXT file]
title: "Research Paper Title" (optional)
```

#### Get Documents

```bash
GET /documents?page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer YOUR_JWT_TOKEN

# Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Generate Summary

```bash
POST /documents/123/summarize
Authorization: Bearer YOUR_JWT_TOKEN

# Response
{
  "message": "Summary generated successfully",
  "summary": "This research paper discusses..."
}
```

#### Search Similar Documents

```bash
POST /documents/search
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "query": "machine learning algorithms",
  "limit": 5
}
```

### Chat & AI Interaction

#### Create Chat Session

```bash
POST /chat/sessions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "documentId": 123,
  "title": "Discussion about ML paper" (optional)
}
```

#### Send Message

```bash
POST /chat/sessions/456/messages
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "What are the main findings of this paper?"
}

# Response
{
  "userMessage": {...},
  "aiResponse": {
    "content": "The main findings include..."
  }
}
```

#### Quick Query

```bash
POST /chat/query
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "documentId": 123,
  "message": "Summarize the methodology section"
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

#### Authentication Error (401)

```json
{
  "error": "Access denied",
  "message": "Invalid token"
}
```

#### Rate Limit Error (429)

```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "15 minutes"
}
```