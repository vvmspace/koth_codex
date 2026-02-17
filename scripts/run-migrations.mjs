import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const migrationsDir = path.resolve('supabase/migrations');
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn('[migrate] SUPABASE_DB_URL/DATABASE_URL is not set, skipping migrations.');
  process.exit(0);
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const { rows } = await client.query('select 1 from schema_migrations where version = $1', [file]);
    if (rows.length > 0) {
      console.log(`[migrate] already applied: ${file}`);
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`[migrate] applying: ${file}`);
    await client.query('begin');
    await client.query(sql);
    await client.query('insert into schema_migrations(version) values($1)', [file]);
    await client.query('commit');
    console.log(`[migrate] applied: ${file}`);
  }
} catch (error) {
  await client.query('rollback');
  console.error('[migrate] failed', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
