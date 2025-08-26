import { User, CreateUserData, UpdateUserData } from '../types/user';
import { query } from '../config/database';

export class UserService {
  async create(userData: CreateUserData): Promise<User> {
    try {
      console.log('💾 Creating user in database:', { 
        email: userData.email, 
        googleId: userData.googleId,
        name: userData.name 
      });
      
      const result = await query(`
        INSERT INTO users (email, password_hash, google_id, name, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, password_hash, google_id, name, avatar_url, created_at, updated_at
      `, [
        userData.email,
        userData.passwordHash || null,
        userData.googleId,
        userData.name,
        userData.avatarUrl || null
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      
      console.log('✅ User created in database with ID:', user.id);
      return user;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        console.error('❌ User already exists:', userData.email);
        throw new Error('A user with this email or Google ID already exists');
      }
      console.error('❌ Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      console.log(`🔍 Looking for user with ID: ${id}`);
      
      const result = await query(
        'SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
        [id]
      );

      if (result.rows.length === 0) {
        console.log(`❌ User with ID ${id} not found in database`);
        return null;
      }

      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      console.log(`🔍 Looking for user with email: ${email}`);
      
      const result = await query(
        'SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
        [email]
      );

      if (result.rows.length === 0) {
        console.log(`❌ User with email ${email} not found`);
        return null;
      }

      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      console.log(`🔍 Looking for user with Google ID: ${googleId}`);
      
      const result = await query(
        'SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at FROM users WHERE google_id = $1 LIMIT 1',
        [googleId]
      );

      if (result.rows.length === 0) {
        console.log(`❌ User with Google ID ${googleId} not found`);
        return null;
      }

      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async update(id: number, userData: UpdateUserData): Promise<User> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userData.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`);
        values.push(userData.name);
      }
      if (userData.avatarUrl !== undefined) {
        setParts.push(`avatar_url = $${paramIndex++}`);
        values.push(userData.avatarUrl);
      }
      if (userData.passwordHash !== undefined) {
        setParts.push(`password_hash = $${paramIndex++}`);
        values.push(userData.passwordHash);
      }
      if (userData.googleId !== undefined) {
        setParts.push(`google_id = $${paramIndex++}`);
        values.push(userData.googleId);
      }

      if (setParts.length === 0) {
        throw new Error('No fields to update');
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id); // Add id as last parameter

      const result = await query(`
        UPDATE users 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, password_hash, google_id, name, avatar_url, created_at, updated_at
      `, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Email is already taken by another user');
      }
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: number): Promise<User> {
    try {
      const result = await query(`
        DELETE FROM users 
        WHERE id = $1
        RETURNING id, email, password_hash, google_id, name, avatar_url, created_at, updated_at
      `, [id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    try {
      const result = await query(`
        SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        googleId: row.google_id,
        name: row.name,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  async getUserStats(): Promise<{ total: number; recentCount: number }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalResult, recentResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM users'),
        query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [thirtyDaysAgo])
      ]);

      return {
        total: parseInt(totalResult.rows[0].count),
        recentCount: parseInt(recentResult.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  async getUserWithDocuments(id: number): Promise<(User & { documents: any[] }) | null> {
    try {
      // Get user
      const userResult = await query(
        'SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      // Get user's documents
      const documentsResult = await query(`
        SELECT id, title, file_name, file_type, file_size, status, created_at, updated_at
        FROM documents 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [id]);

      const userRow = userResult.rows[0];
      const user: User & { documents: any[] } = {
        id: userRow.id,
        email: userRow.email,
        passwordHash: userRow.password_hash,
        googleId: userRow.google_id,
        name: userRow.name,
        avatarUrl: userRow.avatar_url,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
        documents: documentsResult.rows.map(doc => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.file_name,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          status: doc.status,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
        }))
      };

      return user;
    } catch (error) {
      console.error('Error getting user with documents:', error);
      throw new Error('Failed to get user with documents');
    }
  }

  async getUserWithStats(id: number): Promise<any> {
    try {
      // Get user
      const userResult = await query(
        'SELECT id, email, password_hash, google_id, name, avatar_url, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      // Get counts
      const [docCountResult, chatCountResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [id]),
        query('SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = $1', [id])
      ]);

      const userRow = userResult.rows[0];
      return {
        id: userRow.id,
        email: userRow.email,
        passwordHash: userRow.password_hash,
        googleId: userRow.google_id,
        name: userRow.name,
        avatarUrl: userRow.avatar_url,
        createdAt: userRow.created_at,
        updatedAt: userRow.updated_at,
        stats: {
          totalDocuments: parseInt(docCountResult.rows[0].count),
          totalChatSessions: parseInt(chatCountResult.rows[0].count),
        }
      };
    } catch (error) {
      console.error('Error getting user with stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}

export default new UserService();