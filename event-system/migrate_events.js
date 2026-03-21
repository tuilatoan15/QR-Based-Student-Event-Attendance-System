const { poolPromise } = require('./config/db');

async function migrate() {
  try {
    const pool = await poolPromise;
    console.log('Connected to DB. Running migration...');
    // check if column already exists
    const checkColumns = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'images'
    `);
    
    if (checkColumns.recordset.length === 0) {
      await pool.request().query('ALTER TABLE events ADD images NVARCHAR(MAX)');
      console.log('Migration successful: Added images column to events table');
    } else {
      console.log('Migration skipped: images column already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
