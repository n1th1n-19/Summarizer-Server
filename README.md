# AI Research Paper Summarizer Server

A TypeScript-based backend server for processing and summarizing research papers using AI services.

## Tech Stack

### Core Framework

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript

### Security & Middleware

- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logging
- **multer** - File upload handling

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

- **openai** - OpenAI SDK (compatible with OpenRouter)
- **@supabase/supabase-js** - Supabase client
- **OpenRouter** - Access to DeepSeek R1 and other models

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
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "jsonwebtoken": "^9.0.2",
  "passport": "^0.6.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-jwt": "^4.0.1",
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "xlsx": "^0.18.5",
  "file-type": "^18.7.0",
  "openai": "^4.20.1",
  "dotenv": "^16.3.1",
  "@supabase/supabase-js": "^2.38.5",
  "zod": "^3.22.4"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.8.7",
  "@types/express": "^4.17.20",
  "@types/cors": "^2.8.14",
  "@types/morgan": "^1.9.7",
  "@types/multer": "^1.4.8",
  "@types/jsonwebtoken": "^9.0.4",
  "@types/passport": "^1.0.14",
  "@types/passport-google-oauth20": "^2.0.13",
  "@types/passport-jwt": "^3.0.11",
  "@types/pdf-parse": "^1.1.4",
  "@typescript-eslint/eslint-plugin": "^6.9.0",
  "@typescript-eslint/parser": "^6.9.0",
  "eslint": "^8.52.0",
  "nodemon": "^3.0.1",
  "rimraf": "^5.0.5",
  "ts-node": "^10.9.1",
  "typescript": "^5.2.2"
}
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file
4. Run development server: `npm run dev`
5. Build for production: `npm run build`
6. Start production server: `npm start`

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - Run TypeScript type checking
- `npm run clean` - Clean build directory

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

# AI Service
OPENROUTER_API_KEY=your_openrouter_api_key

# Database (Supabase)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
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

## Supabase + Prisma Database Setup

This project uses **Supabase** as the PostgreSQL database provider with **Prisma** as the ORM for type-safe database operations.

### Quick Setup

1. **Create a Supabase Project**:

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be ready (usually 1-2 minutes)

2. **Get Database Credentials**:

   - Go to Project Settings > Database
   - Copy the **Connection Pooling** URL for `DATABASE_URL` (port 6543)
   - Copy the **Direct Connection** URL for `DIRECT_URL` (port 5432)

3. **Update Environment Variables** (only database URLs needed):

   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-region.pooler.supabase.com:6543/postgres
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

4. **Push Database Schema**:
   ```bash
   npm run db:push
   ```
<!-- 
### Database Management Commands

```bash
# Generate Prisma client (run after schema changes)
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Create and run migrations (for production)
npm run db:migrate

# View and edit data in browser
npm run db:studio

# Reset database (warning: deletes all data)
npm run db:reset
``` -->

### Database Schema

The Prisma schema includes:

- **Users** - JWT authentication and user profiles
- **Documents** - Uploaded files with extracted text and summaries
- **DocumentEmbeddings** - Vector embeddings for semantic search
- **ChatSessions** - Chat conversation sessions
- **ChatMessages** - Individual chat messages and responses

### Authentication System

This project uses **Google OAuth 2.0 ONLY** for secure authentication:

- ✅ **JWT tokens** generated by your Express server after Google OAuth
- ✅ **Google OAuth 2.0** with passport.js (only authentication method)
- ✅ **No password storage** - enhanced security
- ✅ **Full control** over authentication logic
- ✅ **Supabase only for database** - no auth dependencies

### Vector Storage

Supabase supports the `pgvector` extension for vector operations. The schema is configured to store document embeddings as `Float[]` arrays, making it ready for semantic search and RAG implementations.

## OpenRouter Integration with DeepSeek R1

This project uses OpenRouter to access the free DeepSeek R1 model. Here's how to set it up:


### DeepSeek R1 Model Benefits

- **Free tier**: No cost for basic usage
- **High quality**: Advanced reasoning capabilities
- **Fast responses**: Optimized for production use
- **Research-focused**: Excellent for academic content

### Rate Limits

- Check OpenRouter documentation for current rate limits
- Implement exponential backoff for retries
- Consider caching responses for repeated requests

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