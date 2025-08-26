import { User, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  googleId: string; // Required for Google OAuth only
  name: string;
  avatarUrl?: string | null;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  googleId?: string; // Can be updated but must be string if provided
}

export class UserService {
  async create(userData: CreateUserData): Promise<User> {
    try {
      console.log('💾 Creating user in database:', { 
        email: userData.email, 
        googleId: userData.googleId,
        name: userData.name 
      });
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash || null,
          googleId: userData.googleId,
          name: userData.name,
          avatarUrl: userData.avatarUrl || null,
        },
      });
      
      console.log('✅ User created in database with ID:', user.id);
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          console.error('❌ User already exists:', userData.email);
          throw new Error('A user with this email or Google ID already exists');
        }
      }
      console.error('❌ Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      console.log(`🔍 Looking for user with ID: ${id}`);
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!user) {
        console.log(`❌ User with ID ${id} not found in database`);
        return null;
      }
      
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { googleId },
      });
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async update(id: number, userData: UpdateUserData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...(userData.name !== undefined && { name: userData.name }),
          ...(userData.avatarUrl !== undefined && { avatarUrl: userData.avatarUrl }),
          ...(userData.passwordHash !== undefined && { passwordHash: userData.passwordHash }),
          ...(userData.googleId !== undefined && { googleId: userData.googleId }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Email is already taken by another user');
        }
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
      }
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: number): Promise<User> {
    try {
      return await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('User not found');
        }
      }
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  async getUserStats(): Promise<{ total: number; recentCount: number }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, recentCount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
      ]);

      return { total, recentCount };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  async getUserWithDocuments(id: number): Promise<User & { documents: any[] } | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit to recent 10 documents
          },
        },
      });
    } catch (error) {
      console.error('Error getting user with documents:', error);
      throw new Error('Failed to get user with documents');
    }
  }

  async getUserWithStats(id: number): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              documents: true,
              chatSessions: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return {
        ...user,
        stats: {
          totalDocuments: user._count.documents,
          totalChatSessions: user._count.chatSessions,
        },
        _count: undefined, // Remove the _count field
      };
    } catch (error) {
      console.error('Error getting user with stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}

export default new UserService();