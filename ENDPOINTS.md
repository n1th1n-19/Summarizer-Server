# API Endpoints Reference

## Complete Endpoint List

### Health & Information
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health check and database status | ❌ |
| GET | `/` | API information and endpoint list | ❌ |
| GET | `/docs` | Complete API documentation | ❌ |

### Authentication
| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|-------------|
| POST | `/auth/register` | Register new user account | ❌ | ✅ Auth (5/15min) |
| POST | `/auth/login` | Login with email/password | ❌ | ✅ Auth (5/15min) |
| GET | `/auth/profile` | Get current user profile | ✅ JWT | ❌ |
| PUT | `/auth/profile` | Update user profile | ✅ JWT | ❌ |
| POST | `/auth/change-password` | Change user password | ✅ JWT | ❌ |
| POST | `/auth/logout` | Logout (client-side) | ✅ JWT | ❌ |
| GET | `/auth/me` | Get current user info | ✅ JWT | ❌ |
| GET | `/auth/verify` | Verify JWT token validity | ✅ JWT | ❌ |

### Google OAuth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/google` | Initiate Google OAuth login | ❌ |
| GET | `/auth/google/callback` | Google OAuth callback | ❌ |

### Document Management
| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|-------------|
| GET | `/documents` | Get user documents (paginated) | ✅ JWT | ❌ |
| POST | `/documents/upload` | Upload and process document | ✅ JWT | ✅ Upload (10/hour) |
| GET | `/documents/:id` | Get specific document details | ✅ JWT | ❌ |
| DELETE | `/documents/:id` | Delete document | ✅ JWT | ❌ |
| POST | `/documents/:id/summarize` | Generate document summary | ✅ JWT | ✅ AI Ops (50/hour) |
| POST | `/documents/:id/embeddings` | Generate vector embeddings | ✅ JWT | ✅ AI Ops (50/hour) |
| POST | `/documents/search` | Semantic document search | ✅ JWT | ✅ Search (100/hour) |

### Chat & AI Interaction
| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|-------------|
| POST | `/chat/sessions` | Create new chat session | ✅ JWT | ❌ |
| GET | `/chat/sessions` | Get chat sessions (paginated) | ✅ JWT | ❌ |
| GET | `/chat/sessions/:id` | Get session with message history | ✅ JWT | ❌ |
| DELETE | `/chat/sessions/:id` | Delete chat session | ✅ JWT | ❌ |
| POST | `/chat/sessions/:id/messages` | Send message in session | ✅ JWT | ✅ AI Ops (50/hour) |
| POST | `/chat/query` | Quick query without session | ✅ JWT | ✅ AI Ops (50/hour) |

## Request/Response Formats

### Authentication Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Standard Response Format
```json
{
  "message": "Success message",
  "data": { ... },
  "pagination": { ... } // For paginated endpoints
}
```

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [ ... ] // For validation errors
}
```

### Rate Limit Headers
```
X-RateLimit-Policy: General: 100/15min, Auth: 5/15min, Upload: 10/1h, AI: 50/1h
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1234567890
```

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- At least 1 special character
- Not in common password list

### File Upload Limits
- Maximum file size: 50MB
- Supported types: PDF, DOCX, XLSX, TXT
- File extensions: .pdf, .docx, .xlsx, .txt

### Input Validation
- Email: Valid email format, max 255 chars
- Name: 2-50 characters, letters and spaces only
- Document title: 1-255 characters
- Chat messages: 1-2000 characters
- Search queries: 1-500 characters

## HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (email, etc.) |
| 415 | Unsupported Media Type | Wrong content type |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |

## Security Features

- **JWT Authentication**: Stateless token-based auth
- **OAuth 2.0**: Google OAuth integration
- **Rate Limiting**: Multiple tiers (General, Auth, Upload, AI, Search)
- **Input Validation**: Comprehensive validation with express-validator
- **Input Sanitization**: Automatic trimming and cleaning
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configured for specific origins
- **Password Security**: Bcrypt hashing with salt rounds
- **File Type Validation**: MIME type and extension checking
- **Request Logging**: Morgan HTTP request logger