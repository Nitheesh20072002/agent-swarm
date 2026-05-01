
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigrations() {
  // Use DATABASE_URL if available, otherwise fall back to individual params
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'ai_agent_swarm',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });

  try {
    console.log('🔄 Running database migrations...');
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      console.log(`  📄 Running ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await pool.query(sql);
      console.log(`  ✅ ${file} completed`);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
