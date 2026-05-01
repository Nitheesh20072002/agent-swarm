
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'update-agent-schema.sql'),
      'utf8'
    );

    console.log('Applying agent schema migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
