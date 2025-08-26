import { query, testDatabaseConnection } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function resetAndTest() {
  try {
    console.log('🔄 Testing fresh database connection...');
    
    console.log('🔌 Connecting to database...');
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      console.log('❌ Connection failed');
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Test with a simple query first
    console.log('📊 Testing simple query...');
    const result = await query('SELECT 1 as test');
    console.log('Query result:', result.rows[0]);
    
    // Now try counting users
    console.log('👥 Counting users...');
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log(`Found ${userCount} users`);
    
    if (userCount > 0) {
      console.log('📋 Listing users:');
      const usersResult = await query(`
        SELECT id, email, name, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      usersResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    } else {
      console.log('⚠️  No users found. You need to complete OAuth flow first.');
    }
    
    // Test other tables
    console.log('📊 Checking other tables...');
    
    try {
      const docCountResult = await query('SELECT COUNT(*) as count FROM documents');
      console.log(`📄 Documents: ${docCountResult.rows[0].count}`);
    } catch (error) {
      console.log('⚠️  Documents table may not exist');
    }
    
    try {
      const sessionCountResult = await query('SELECT COUNT(*) as count FROM chat_sessions');
      console.log(`💬 Chat Sessions: ${sessionCountResult.rows[0].count}`);
    } catch (error) {
      console.log('⚠️  Chat sessions table may not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.log('💡 Check your DATABASE_URL in .env file');
      } else if (error.message.includes('does not exist')) {
        console.log('💡 Make sure your database schema is set up');
      }
    }
  }
}

// Force exit to prevent hanging
resetAndTest().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});