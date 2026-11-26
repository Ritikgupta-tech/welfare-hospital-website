#!/usr/bin/env node

/**
 * WELFARE HOSPITAL — POSTGRESQL PRODUCTION MIGRATION & SEEDING RUNNER
 *
 * Usage:
 *   node scripts/deploy-database.mjs [DATABASE_URL]
 * Or:
 *   DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require" node scripts/deploy-database.mjs
 */

import { execSync } from 'node:child_process';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const dbUrl = process.argv[2] || process.env.DATABASE_URL;

console.log('================================================================');
console.log('WELFARE HOSPITAL — POSTGRESQL SCHEMA MIGRATION & SEEDING RUNNER');
console.log('================================================================');

if (!dbUrl || dbUrl.includes('<user>') || dbUrl.includes('<password>') || dbUrl.includes('<host>')) {
  console.error('\n[ERROR] No valid DATABASE_URL provided!');
  console.log('\nPlease supply your actual PostgreSQL connection string:');
  console.log('  node scripts/deploy-database.mjs "postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"');
  console.log('\nOr set it in your environment:');
  console.log('  $env:DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"');
  console.log('  npm run db:setup\n');
  process.exit(1);
}

// Mask sensitive credentials for display
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':********@');
console.log(`\nTarget Database: ${maskedUrl}`);

async function run() {
  console.log('\n[1/3] Testing PostgreSQL Connectivity...');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const client = await pool.connect();
    const versionRes = await client.query('SELECT version();');
    console.log(`✓ PostgreSQL Connected Successfully!`);
    console.log(`  Engine: ${versionRes.rows[0].version.split(',')[0]}`);
    client.release();
    await pool.end();
  } catch (err) {
    console.error(`✗ Connection Failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n[2/3] Executing Schema Migration (prisma/migrations/0_init/migration.sql)...');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('✓ Database Schema Migration Applied Successfully!');
  } catch (err) {
    console.error('✗ Schema Migration Failed:', err.message);
    process.exit(1);
  }

  console.log('\n[3/3] Running Data Migration Utility (migrateJsonToPostgres)...');
  try {
    execSync('npx tsx src/lib/db/migrate.ts', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('\n✓ All Historical Hospital Records Migrated into PostgreSQL Successfully!');
  } catch (err) {
    console.error('✗ Data Migration Failed:', err.message);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('MIGRATION COMPLETE: Database is fully synchronized and ready!');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
