import { Pool, neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const devVars = path.join(__dirname, '../.dev.vars');
  if (fs.existsSync(devVars)) {
    const line = fs.readFileSync(devVars, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
    if (line) return line.slice('DATABASE_URL='.length).trim();
  }
  console.error('DATABASE_URL not found in env or api/.dev.vars');
  process.exit(1);
}

const connectionString = loadDatabaseUrl();
const pool = new Pool({ connectionString });
const schemaPath = path.join(__dirname, '../../database-schema-neon.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const statements = schema
  .split(';')
  .map((s) => s.replace(/--[^\n]*/g, '').trim())
  .filter((s) => s.length > 0);

console.log(`Running ${statements.length} SQL statements on Neon...`);

for (const statement of statements) {
  try {
    await pool.query(statement);
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.includes('already exists')) {
      console.log('  skip (exists)');
      continue;
    }
    console.error('Failed:', statement.slice(0, 100));
    throw err;
  }
}

await pool.end();
const sql = neon(connectionString);
const counts = await sql`SELECT COUNT(*)::int AS users FROM users`;
console.log('Done. Admin + tables ready. User count:', counts[0]?.users ?? 0);
