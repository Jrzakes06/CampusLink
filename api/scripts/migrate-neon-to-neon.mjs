import { Pool } from '@neondatabase/serverless';
import pg from 'pg';

const oldDbUrl = 'postgresql://neondb_owner:npg_ahHV0srPd4yR@ep-young-sound-aqffe0w3-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const newDbUrl = 'postgresql://neondb_owner:npg_zAkbV6lOs0wK@ep-super-voice-atm82ehv.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

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

async function migrateNeonToNeon() {
  console.log('🚀 Starting Neon-to-Neon migration...');
  
  // Connect to old database
  const oldClient = new pg.Client({ 
    connectionString: oldDbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  // Connect to new database (using serverless)
  const newPool = new Pool({ connectionString: newDbUrl });
  
  try {
    await oldClient.connect();
    console.log('✅ Connected to old Neon database');
    
    const newClient = await newPool.connect();
    console.log('✅ Connected to new Neon database');
    
    let totalRows = 0;
    
    for (const table of TABLES) {
      try {
        // Get all rows from old database
        const result = await oldClient.query(`SELECT * FROM ${table}`);
        const rows = result.rows;
        
        if (rows.length === 0) {
          console.log(`⏭️  ${table}: 0 rows (skipped)`);
          continue;
        }
        
        // Insert into new database
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map((col) => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
            ON CONFLICT DO NOTHING`;
          
          try {
            await newClient.query(query, values);
          } catch (err) {
            // Handle constraint violations gracefully
            if (!err.message.includes('duplicate key') && !err.message.includes('UNIQUE')) {
              console.warn(`⚠️  Error inserting into ${table}:`, err.message);
            }
          }
        }
        
        totalRows += rows.length;
        console.log(`✅ ${table}: ${rows.length} rows migrated`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`⏭️  ${table}: table not found (skipped)`);
        } else {
          console.warn(`⚠️  ${table}: ${err.message}`);
        }
      }
    }
    
    console.log(`\n✨ Migration complete! ${totalRows} total rows migrated.`);
    newClient.release();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await oldClient.end();
    await newPool.end();
  }
}

migrateNeonToNeon();
