import prisma from '../config/prisma';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        createdAt: true
      }
    });
    
    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Google ID: ${user.googleId}`);
    });
    
    if (userCount === 0) {
      console.log('⚠️  No users found. Make sure to complete OAuth flow to create your first user.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('💡 Suggestion: Check your DATABASE_URL in .env file');
      } else if (error.message.includes('does not exist')) {
        console.log('💡 Suggestion: Run `npx prisma migrate deploy` or `npx prisma db push`');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();