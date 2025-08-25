import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Clean up after all tests
});

// Mock external services for tests
jest.mock('../src/config/openrouter', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }
}));

// Mock Prisma for unit tests (will be overridden in integration tests)
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn()
    },
    documentEmbedding: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn()
    },
    chatSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    $queryRaw: jest.fn()
  },
  testPrismaConnection: jest.fn().mockResolvedValue(true)
}));

// Global test utilities
declare global {
  var mockUser: any;
  var mockDocument: any;
}

global.mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

global.mockDocument = {
  id: 1,
  userId: 1,
  title: 'Test Document',
  fileName: 'test.pdf',
  fileType: 'application/pdf',
  fileSize: 1024,
  fileUrl: null,
  extractedText: 'This is test content for the document.',
  summary: 'Test summary',
  status: 'COMPLETED',
  createdAt: new Date(),
  updatedAt: new Date()
};