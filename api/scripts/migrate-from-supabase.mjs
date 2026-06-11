import pg from 'pg';
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TABLES = [
  'users',
  'posts',
  'products',
  'jobs',
  'applications',
  'conversations',
  'messages',
  'connections',
  'link_requests',
  'reports',
  'seller_stats',
];

function loadVar(name, file) {
  if (process.env[name]) return process.env[name];
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return null;
  const line = fs.readFileSync(p, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim() || null;
}

let supabaseUrl = loadVar('SUPABASE_DATABASE_URL', '../.migrate.vars');
const neonUrl = loadVar('DATABASE_URL', '../.dev.vars');

if (!supabaseUrl) {
  console.error('Set SUPABASE_DATABASE_URL in api/.migrate.vars');
  process.exit(1);
}
if (!neonUrl) {
  console.error('Set DATABASE_URL in api/.dev.vars');
  process.exit(1);
}

const REGIONS = [
  'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1',
  'ap-southeast-1', 'ap-northeast-1', 'ap-south-1', 'sa-east-1', 'ca-central-1',
];

async function connectSupabase(url) {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function resolveSupabaseUrl(url) {
  // If direct host fails (IPv6-only), try pooler across regions
  try {
    const client = await connectSupabase(url);
    await client.end();
    return url;
  } catch (directErr) {
    console.log('Direct connection failed:', directErr.message?.slice(0, 80));
  }

  const refMatch = url.match(/db\.([a-z0-9]+)\.supabase\.co/) ||
    url.match(/postgres\.([a-z0-9]+)@/);
  const passMatch = url.match(/postgres(?:\.[a-z0-9]+)?:(.+?)@/);
  if (!refMatch || !passMatch) throw new Error('Cannot parse Supabase URL for pooler fallback');

  const ref = refMatch[1];
  const password = passMatch[1];

  const poolerCandidates = [];
  for (const region of REGIONS) {
    poolerCandidates.push(
      `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      `postgresql://postgres.${ref}:${password}@aws-1-${region}.pooler.supabase.com:6543/postgres`,
    );
  }
  poolerCandidates.push(`postgresql://postgres.${ref}:${password}@${ref}.pooler.supabase.com:6543/postgres`);

  for (const poolerUrl of poolerCandidates) {
    try {
      const client = await connectSupabase(poolerUrl);
      await client.end();
      console.log(`Using pooler: ${poolerUrl.replace(/:([^:@/]+)@/, ':***@')}`);
      return poolerUrl;
    } catch (err) {
      const host = poolerUrl.split('@')[1]?.split('/')[0];
      console.log(`  fail ${host}: ${err.message?.slice(0, 100)}`);
    }
  }
  throw new Error('Could not connect to Supabase. Project may be paused — restore it in the Supabase dashboard first.');
}

supabaseUrl = await resolveSupabaseUrl(supabaseUrl);

const source = new pg.Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
const target = new Pool({ connectionString: neonUrl });

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return rows.length > 0;
}

async function getColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  return rows;
}

function serializeValue(col, val) {
  if (val === null || val === undefined) return null;
  if (col.data_type === 'json' || col.data_type === 'jsonb' || col.udt_name === 'jsonb') {
    return typeof val === 'string' ? val : JSON.stringify(val);
  }
  return val;
}

async function migrateTable(table) {
  const existsOnSource = await tableExists(source, table);
  if (!existsOnSource) {
    console.log(`  skip ${table} (not on Supabase)`);
    return { table, copied: 0, skipped: true };
  }

  const columns = await getColumns(source, table);
  const colNames = columns.map((c) => c.column_name);
  const { rows } = await source.query(`SELECT * FROM ${table}`);
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return { table, copied: 0 };
  }

  await target.query(`TRUNCATE TABLE ${table} CASCADE`);

  const colList = colNames.map((c) => `"${c}"`).join(', ');
  const placeholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = columns.map((col) => serializeValue(col, row[col.column_name]));
    await target.query(insertSql, values);
  }

  console.log(`  ${table}: ${rows.length} rows copied`);
  return { table, copied: rows.length };
}

console.log('Connecting to Supabase...');
await source.connect();
console.log('Connected. Migrating Supabase → Neon...\n');

const results = [];
for (const table of TABLES) {
  try {
    results.push(await migrateTable(table));
  } catch (err) {
    console.error(`  ERROR ${table}:`, err.message);
    results.push({ table, error: err.message });
  }
}

await source.end();
await target.end();

console.log('\n--- Summary ---');
let total = 0;
for (const r of results) {
  if (r.error) console.log(`${r.table}: FAILED — ${r.error}`);
  else if (r.skipped) console.log(`${r.table}: skipped`);
  else {
    console.log(`${r.table}: ${r.copied} rows`);
    total += r.copied || 0;
  }
}
console.log(`\nTotal rows migrated: ${total}`);
