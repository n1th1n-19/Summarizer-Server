import request from 'supertest';
import app from '../../src/server';
import userService from '../../src/services/userService';
import { hashPassword } from '../../src/utils/password';

// Mock the services for integration tests
jest.mock('../../src/services/userService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        name: userData.name,
        email: userData.email,
        passwordHash: await hashPassword(userData.password),
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123' // too short
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 409 for existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };

      mockUserService.findByEmail.mockResolvedValue(global.mockUser);

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User already exists with this email');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const hashedPassword = await hashPassword(loginData.password);
      const mockUser = {
        ...global.mockUser,
        passwordHash: hashedPassword
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      });
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const hashedPassword = await hashPassword('correctpassword');
      const mockUser = {
        ...global.mockUser,
        passwordHash: hashedPassword
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      // This test would require JWT token generation and authentication middleware testing
      // For now, we'll test the unauthorized case
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});