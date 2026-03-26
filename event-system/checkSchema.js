const { sql, poolPromise } = require('./config/db');

async function checkSchema() {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications'");
  console.log(JSON.stringify(result.recordset, null, 2));
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
