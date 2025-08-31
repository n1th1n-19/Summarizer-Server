const { Client } = require('pg');
require('dotenv').config();

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Test if users table exists
    console.log('📋 Checking users table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Count users
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Total users: ${userCount.rows[0].count}`);

      // List users if any exist
      if (parseInt(userCount.rows[0].count) > 0) {
        const users = await client.query('SELECT id, email, name, google_id, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('📋 Recent users:');
        users.rows.forEach(user => {
          console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
        });
      } else {
        console.log('⚠️  No users found. Complete OAuth flow to create first user.');
      }
    } else {
      console.log('❌ Users table does not exist. Check your database schema setup.');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase();