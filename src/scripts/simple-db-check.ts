import { PrismaClient } from '@prisma/client';

async function simpleCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database with fresh connection...');
    
    // Use raw query first to test connection
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    console.log('👥 User count result:', result);
    
    // Try to list users
    const users = await prisma.$queryRaw`SELECT id, email, name, google_id, created_at FROM users LIMIT 10`;
    console.log('📋 Users:');
    console.log(users);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();