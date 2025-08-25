import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Test database connection
export const testPrismaConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Prisma connection failed:', error);
    return false;
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('🔄 Shutting down Prisma...');
  await prisma.$disconnect();
  console.log('✅ Prisma disconnected');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;