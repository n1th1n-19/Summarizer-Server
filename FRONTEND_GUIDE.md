# Frontend Implementation Guide
## AI Research Paper Summarizer Backend Integration

This guide provides comprehensive instructions for frontend developers to integrate with the AI Research Paper Summarizer backend API.

## 🚀 Quick Start

### Backend Configuration
- **Base URL**: `http://localhost:3001` (development)
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json` (except file uploads)
- **CORS**: Configured for `http://localhost:3000`

### Required Headers
```javascript
// For authenticated requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 🔐 Authentication Flow

### 1. User Registration
```javascript
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: userData.name,        // 2-50 chars, letters and spaces only
      email: userData.email,      // Valid email format
      password: userData.password // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  // Save token and user data
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};
```

### 2. User Login
```javascript
const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};
```

### 3. Google OAuth Integration
```javascript
// Redirect to Google OAuth
const initiateGoogleAuth = () => {
  window.location.href = 'http://localhost:3001/auth/google';
};

// Handle OAuth callback (create this route in your frontend router)
// URL: /auth/callback?token=JWT_TOKEN
const handleOAuthCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('authToken', token);
    // Fetch user profile
    fetchUserProfile().then(user => {
      localStorage.setItem('user', JSON.stringify(user));
      // Redirect to dashboard
      window.location.href = '/dashboard';
    });
  } else {
    // Handle error
    const error = urlParams.get('error');
    console.error('OAuth error:', error);
    window.location.href = '/login?error=' + error;
  }
};
```

### 4. JWT Token Management
```javascript
class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  isAuthenticated() {
    return !!this.token;
  }

  async verifyToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch('http://localhost:3001/auth/verify', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
    window.location.href = '/login';
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

const auth = new AuthService();
```

## 📄 Document Management

### 1. File Upload Component
```javascript
const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    if (title) formData.append('title', title);

    try {
      const response = await fetch('http://localhost:3001/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      // Refresh document list or redirect
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleFileUpload}>
      <input
        type="file"
        accept=".pdf,.docx,.txt,.xlsx"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={uploading}
      />
      <input
        type="text"
        placeholder="Document title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={uploading}
      />
      <button type="submit" disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  );
};
```

### 2. Document List with Pagination
```javascript
const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDocuments = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/documents?page=${page}&limit=10&sortBy=createdAt&sortOrder=desc`,
        {
          headers: auth.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.data);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handlePageChange = (newPage) => {
    fetchDocuments(newPage);
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="document-list">
            {documents.map(doc => (
              <DocumentCard key={doc.id} document={doc} onUpdate={fetchDocuments} />
            ))}
          </div>
          
          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button 
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

### 3. Document Actions
```javascript
const DocumentCard = ({ document, onUpdate }) => {
  const [generating, setGenerating] = useState(false);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const response = await fetch(
        `http://localhost:3001/documents/${document.id}/summarize`,
        {
          method: 'POST',
          headers: auth.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const result = await response.json();
      alert('Summary generated successfully!');
      onUpdate(); // Refresh the document list
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const generateEmbeddings = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/documents/${document.id}/embeddings`,
        {
          method: 'POST',
          headers: auth.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate embeddings');
      }

      alert('Embeddings generated successfully!');
    } catch (error) {
      console.error('Error generating embeddings:', error);
      alert('Failed to generate embeddings');
    }
  };

  const deleteDocument = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/documents/${document.id}`,
        {
          method: 'DELETE',
          headers: auth.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      onUpdate(); // Refresh the document list
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <div className="document-card">
      <h3>{document.title}</h3>
      <p>Status: {document.status}</p>
      <p>Size: {(document.fileSize / 1024).toFixed(1)} KB</p>
      <p>Created: {new Date(document.createdAt).toLocaleDateString()}</p>
      
      <div className="actions">
        <button 
          onClick={generateSummary} 
          disabled={generating || !document.extractedText}
        >
          {generating ? 'Generating...' : 'Generate Summary'}
        </button>
        <button 
          onClick={generateEmbeddings}
          disabled={!document.extractedText}
        >
          Generate Embeddings
        </button>
        <button onClick={deleteDocument}>Delete</button>
      </div>
    </div>
  );
};
```

## 🔍 Search Functionality

### Semantic Document Search
```javascript
const DocumentSearch = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const response = await fetch('http://localhost:3001/documents/search', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          query: query.trim(),
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      onResults(results.results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search documents semantically..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={searching}
      />
      <button type="submit" disabled={!query.trim() || searching}>
        {searching ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};
```

## 💬 Chat Integration

### 1. Chat Session Management
```javascript
const ChatManager = ({ documentId }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);

  const createChatSession = async (title) => {
    try {
      const response = await fetch('http://localhost:3001/chat/sessions', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          documentId,
          title: title || 'New Chat'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }

      const session = await response.json();
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      setMessages([]);
      return session;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  };

  const loadChatSession = async (sessionId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/chat/sessions/${sessionId}`,
        { headers: auth.getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to load chat session');
      }

      const sessionData = await response.json();
      setCurrentSession(sessionData);
      setMessages(sessionData.messages || []);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const fetchChatSessions = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/chat/sessions?documentId=${documentId}`,
        { headers: auth.getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }

      const data = await response.json();
      setSessions(data.data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  useEffect(() => {
    fetchChatSessions();
  }, [documentId]);

  return { sessions, currentSession, messages, createChatSession, loadChatSession };
};
```

### 2. Chat Interface
```javascript
const ChatInterface = ({ documentId }) => {
  const { sessions, currentSession, messages, createChatSession, loadChatSession } = ChatManager({ documentId });
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentSession) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(
        `http://localhost:3001/chat/sessions/${currentSession.id}/messages`,
        {
          method: 'POST',
          headers: auth.getAuthHeaders(),
          body: JSON.stringify({ content: messageContent })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      // Update messages with both user message and AI response
      setMessages(prev => [...prev, result.userMessage, result.aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setNewMessage(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const quickQuery = async (message) => {
    setSending(true);
    try {
      const response = await fetch('http://localhost:3001/chat/query', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          documentId,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Quick query failed');
      }

      const result = await response.json();
      alert('Response: ' + result.response);
    } catch (error) {
      console.error('Quick query error:', error);
      alert('Quick query failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <button onClick={() => createChatSession()}>New Chat</button>
        <div className="session-list">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
              onClick={() => loadChatSession(session.id)}
            >
              {session.sessionName}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'USER' ? 'user' : 'ai'}`}
            >
              {message.content || message.message}
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="message-input">
          <input
            type="text"
            placeholder="Ask a question about this document..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending || !currentSession}
            maxLength={2000}
          />
          <button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

## 🛡️ Error Handling

### Global Error Handler
```javascript
class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const handleApiResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || 'An error occurred',
      response.status,
      error.details
    );
  }
  return response.json();
};

// Usage example
const safeApiCall = async (apiCall) => {
  try {
    return await apiCall();
  } catch (error) {
    if (error.status === 401) {
      // Token expired, redirect to login
      auth.logout();
    } else if (error.status === 429) {
      // Rate limited
      alert('Too many requests. Please wait before trying again.');
    } else if (error.status === 400 && error.details) {
      // Validation errors
      const errorMessages = error.details.map(d => d.message).join(', ');
      alert('Validation errors: ' + errorMessages);
    } else {
      alert('Error: ' + error.message);
    }
    throw error;
  }
};
```

## 📱 React Context Setup

### Authentication Context
```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      dispatch({
        type: 'LOGIN',
        payload: {
          token,
          user: JSON.parse(user)
        }
      });
    }
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    dispatch({
      type: 'LOGIN',
      payload: data
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 🔄 Rate Limiting Awareness

### Rate Limit Handler
```javascript
class RateLimitHandler {
  constructor() {
    this.retryDelays = {
      auth: 15 * 60 * 1000,      // 15 minutes
      upload: 60 * 60 * 1000,   // 1 hour
      ai: 60 * 60 * 1000,       // 1 hour
      search: 60 * 60 * 1000    // 1 hour
    };
  }

  handleRateLimit(error, endpoint) {
    if (error.status === 429) {
      const category = this.getEndpointCategory(endpoint);
      const delay = this.retryDelays[category] || 15 * 60 * 1000;
      
      const retryTime = new Date(Date.now() + delay);
      localStorage.setItem(`rateLimit_${category}`, retryTime.toISOString());
      
      return {
        isRateLimited: true,
        retryAfter: retryTime,
        message: `Rate limit exceeded. Try again after ${retryTime.toLocaleTimeString()}`
      };
    }
    return { isRateLimited: false };
  }

  getEndpointCategory(endpoint) {
    if (endpoint.includes('/auth/')) return 'auth';
    if (endpoint.includes('/upload')) return 'upload';
    if (endpoint.includes('/summarize') || endpoint.includes('/chat/')) return 'ai';
    if (endpoint.includes('/search')) return 'search';
    return 'general';
  }

  isRateLimited(category) {
    const rateLimitTime = localStorage.getItem(`rateLimit_${category}`);
    if (rateLimitTime) {
      return new Date() < new Date(rateLimitTime);
    }
    return false;
  }
}

const rateLimitHandler = new RateLimitHandler();
```

## 📋 Frontend Checklist

### Essential Components
- [ ] **Authentication**
  - [ ] Login/Register forms
  - [ ] Google OAuth button
  - [ ] Protected route wrapper
  - [ ] Token refresh logic

- [ ] **Document Management**
  - [ ] File upload component
  - [ ] Document list with pagination
  - [ ] Document actions (summarize, delete)
  - [ ] File type validation

- [ ] **Chat Interface**
  - [ ] Chat session list
  - [ ] Message history display
  - [ ] Message input form
  - [ ] Real-time updates

- [ ] **Search & Discovery**
  - [ ] Semantic search input
  - [ ] Search results display
  - [ ] Filter options

- [ ] **Error Handling**
  - [ ] Global error boundaries
  - [ ] Rate limit awareness
  - [ ] Offline handling
  - [ ] Loading states

### Performance Optimization
- [ ] **Caching Strategy**
  - [ ] Cache user data
  - [ ] Cache document list
  - [ ] Cache chat sessions

- [ ] **Lazy Loading**
  - [ ] Document thumbnails
  - [ ] Chat message history
  - [ ] Paginated content

- [ ] **State Management**
  - [ ] React Context/Redux
  - [ ] Local state optimization
  - [ ] Memory cleanup

### Security Best Practices
- [ ] **Token Management**
  - [ ] Secure token storage
  - [ ] Auto logout on expiry
  - [ ] CSRF protection

- [ ] **Input Validation**
  - [ ] Client-side validation
  - [ ] Sanitize user input
  - [ ] File type checking

- [ ] **Privacy**
  - [ ] No sensitive data in URLs
  - [ ] Clear data on logout
  - [ ] HTTPS in production

This guide provides everything needed to build a complete frontend application that integrates seamlessly with the AI Research Paper Summarizer backend API.