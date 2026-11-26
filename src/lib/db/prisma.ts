import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClientInstance: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPoolInstance: pg.Pool | undefined;
}

/**
 * Returns a pooled PrismaClient instance if DATABASE_URL or POSTGRES_URL is configured,
 * otherwise returns null for JSON file-based fallback execution.
 */
export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return null;
  }

  if (!global.__prismaClientInstance) {
    const pool = new pg.Pool({
      connectionString: dbUrl,
      max: process.env.NODE_ENV === 'production' ? 10 : 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co')
        ? { rejectUnauthorized: false }
        : undefined,
    });
    global.__pgPoolInstance = pool;

    const adapter = new PrismaPg(pool);
    global.__prismaClientInstance = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error'],
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
  } catch (err: any) {
    console.warn('[DB] PostgreSQL ping check failed, using fallback store:', err?.message || err);
    return false;
  }
}
