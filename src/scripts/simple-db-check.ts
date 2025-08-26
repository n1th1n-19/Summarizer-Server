import { query, testDatabaseConnection } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function simpleCheck() {
  try {
    console.log('🔍 Testing database with fresh connection...');
    
    // Test connection first
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.log('❌ Connection failed');
      return;
    }
    
    // Use raw query to test connection and get user count
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    console.log('👥 User count result:', countResult.rows[0]);
    
    // Try to list users
    const usersResult = await query(`
      SELECT id, email, name, google_id, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('📋 Users:');
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Created: ${user.created_at}`);
      });
    } else {
      console.log('  No users found');
    }
    
    // Check table existence
    console.log('📊 Checking table structure...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('🗃️ Available tables:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('💡 The users table does not exist. Make sure your database schema is set up.');
      } else if (error.message.includes('connect')) {
        console.log('💡 Connection failed. Check your DATABASE_URL in .env file');
      }
    }
  }
}

simpleCheck().then(() => {
  console.log('✅ Simple check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});