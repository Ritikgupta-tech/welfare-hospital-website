import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClientInstance: PrismaClient | undefined;
}

/**
 * Returns a pooled PrismaClient instance if DATABASE_URL is configured,
 * otherwise returns null for file-based fallback execution.
 */
export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    if (!global.__prismaClientInstance) {
      global.__prismaClientInstance = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return global.__prismaClientInstance;
  }

  // Development / test reuse
  if (!global.__prismaClientInstance) {
    global.__prismaClientInstance = new PrismaClient({
      log: ['error'],
    });
  }
  return global.__prismaClientInstance;
}

export async function isPostgresConnected(): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('[DB] PostgreSQL ping check failed, using fallback store:', err);
    return false;
  }
}
