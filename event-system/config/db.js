const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'event_system',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('SQL Server connected');
    return pool;
  })
  .catch((err) => {
    console.error('SQL Server connection error:', err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};

