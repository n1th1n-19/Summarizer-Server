import userService from '../../src/services/userService';
import prisma from '../../src/config/prisma';

// Mock Prisma
jest.mock('../../src/config/prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedPassword123'
      };

      const mockUser = {
        id: 1,
        ...userData,
        googleId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.create(userData);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData
      });
    });

    it('should handle creation errors', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedPassword123'
      };

      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(userService.create(userData)).rejects.toThrow('Failed to create user');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'john@example.com';
      const mockUser = global.mockUser;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const email = 'john@example.com';

      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(userService.findByEmail(email)).rejects.toThrow('Failed to find user');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = 1;
      const mockUser = global.mockUser;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('should return null when user not found', async () => {
      const userId = 999;

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by Google ID', async () => {
      const googleId = 'google123';
      const mockUser = { ...global.mockUser, googleId };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findByGoogleId(googleId);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId }
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 1;
      const updateData = { name: 'John Updated' };
      const updatedUser = { ...global.mockUser, name: 'John Updated' };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      });
    });

    it('should handle user not found', async () => {
      const userId = 999;
      const updateData = { name: 'John Updated' };

      const prismaError = new Error('User not found');
      (prismaError as any).code = 'P2025';
      mockPrisma.user.update.mockRejectedValue(prismaError);

      await expect(userService.update(userId, updateData)).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = 1;
      const deletedUser = global.mockUser;

      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      const result = await userService.delete(userId);

      expect(result).toEqual(deletedUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('should handle user not found', async () => {
      const userId = 999;

      const prismaError = new Error('User not found');
      (prismaError as any).code = 'P2025';
      mockPrisma.user.delete.mockRejectedValue(prismaError);

      await expect(userService.delete(userId)).rejects.toThrow('User not found');
    });
  });
});