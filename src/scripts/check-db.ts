import { query, testDatabaseConnection } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to database');
      return;
    }
    console.log('✅ Database connected successfully');
    
    // Check if User table exists and has data
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log(`👥 Total users in database: ${userCount}`);
    
    // List all users
    const usersResult = await query(`
      SELECT id, email, name, google_id, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Users in database:');
    usersResult.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Google ID: ${user.google_id}`);
    });
    
    if (userCount === 0) {
      console.log('⚠️  No users found. Make sure to complete OAuth flow to create your first user.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.log('💡 Suggestion: Check your DATABASE_URL in .env file');
        console.log('💡 Make sure your database is running and accessible');
      } else if (error.message.includes('does not exist')) {
        console.log('💡 Suggestion: Make sure your database tables are created');
      }
    }
  }
}

checkDatabase().then(() => {
  console.log('✅ Database check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});