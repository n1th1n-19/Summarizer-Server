import { PrismaClient } from '@prisma/client';

async function resetAndTest() {
  let prisma: PrismaClient | undefined;
  
  try {
    console.log('🔄 Creating fresh Prisma client...');
    
    // Create a completely fresh client
    prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    
    console.log('✅ Connection successful');
    
    // Test with a simple query first
    console.log('📊 Testing simple query...');
    const result = await prisma.$executeRaw`SELECT 1`;
    console.log('Query result:', result);
    
    // Now try counting users
    console.log('👥 Counting users...');
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users`);
    
    if (userCount > 0) {
      console.log('📋 Listing users:');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    } else {
      console.log('⚠️  No users found. You need to complete OAuth flow first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (prisma) {
      console.log('🔌 Disconnecting...');
      await prisma.$disconnect();
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