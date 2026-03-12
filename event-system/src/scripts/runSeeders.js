const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

function getDbConfig() {
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
  };
}

function splitBatches(sqlText) {
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

async function run() {
  const seedsDir = path.join(__dirname, '..', '..', 'database', 'seeds');
  if (!fs.existsSync(seedsDir)) {
    throw new Error(`Seeds directory not found: ${seedsDir}`);
  }

  const files = fs
    .readdirSync(seedsDir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => {
      const order = (name) => {
        const n = name.toLowerCase();
        if (n.includes('seed_users')) return 1;
        if (n.includes('seed_events')) return 2;
        if (n.includes('seed_demo_data')) return 3;
        return 99;
      };
      const oa = order(a);
      const ob = order(b);
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b);
    });

  if (files.length === 0) {
    console.log('No seed files found.');
    return;
  }

  const pool = await sql.connect(getDbConfig());

  try {
    for (const file of files) {
      const fullPath = path.join(seedsDir, file);
      const sqlText = fs.readFileSync(fullPath, 'utf8');
      const batches = splitBatches(sqlText);

      console.log(`\n==> Running seed: ${file}`);
      for (const batch of batches) {
        await pool.request().batch(batch);
      }
      console.log(`✓ Seed applied: ${file}`);
    }
    console.log('\nAll seeders completed successfully.');
  } finally {
    await pool.close();
  }
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});

