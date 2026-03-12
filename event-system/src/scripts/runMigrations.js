const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

function getDbConfig(overrides = {}) {
  return {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'event_system',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    ...overrides,
  };
}

function splitBatches(sqlText) {
  // Split on lines that contain only "GO" (case-insensitive), like SSMS.
  const lines = sqlText.split(/\r?\n/);
  const batches = [];
  let current = [];
  for (const line of lines) {
    if (/^\s*GO\s*$/i.test(line)) {
      const chunk = current.join('\n').trim();
      if (chunk) batches.push(chunk);
      current = [];
    } else {
      current.push(line);
    }
  }
  const last = current.join('\n').trim();
  if (last) batches.push(last);
  return batches;
}

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE || 'event_system';
  const masterPool = await sql.connect(getDbConfig({ database: 'master' }));
  const request = masterPool.request();
  request.input('dbName', sql.NVarChar(255), dbName);
  await request.query(
    `IF DB_ID(@dbName) IS NULL
     BEGIN
       DECLARE @sql NVARCHAR(MAX) = N'CREATE DATABASE [' + REPLACE(@dbName, ']', ']]') + N']';
       EXEC(@sql);
     END`
  );
  await masterPool.close();
}

async function run() {
  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  await ensureDatabaseExists();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  const pool = await sql.connect(getDbConfig());

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sqlText = fs.readFileSync(fullPath, 'utf8');
      const batches = splitBatches(sqlText);

      console.log(`\n==> Running migration: ${file}`);
      for (const batch of batches) {
        await pool.request().batch(batch);
      }
      console.log(`✓ Migration applied: ${file}`);
    }
    console.log('\nAll migrations completed successfully.');
  } finally {
    await pool.close();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exitCode = 1;
});

