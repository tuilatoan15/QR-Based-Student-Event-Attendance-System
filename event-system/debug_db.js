const { poolPromise, sql } = require('./config/db');

async function test() {
  try {
    const pool = await poolPromise;
    console.log('Querying top 5 attendance records...');
    const res = await pool.request().query('SELECT TOP 5 * FROM attendances');
    console.log('Attendances:', res.recordset);

    console.log('Querying top 5 registrations with status attended...');
    const res2 = await pool.request().query("SELECT TOP 5 * FROM registrations WHERE status = 'attended'");
    console.log('Registrations (attended):', res2.recordset);

    console.log('Testing the JOIN used in adminController...');
    const res3 = await pool.request().query(`
      SELECT TOP 5
        a.id AS attendance_id,
        r.id AS registration_id,
        a.checkin_time,
        r.status
      FROM registrations r
      LEFT JOIN attendances a ON a.registration_id = r.id
      WHERE r.status = 'attended'
    `);
    console.log('Join Result:', res3.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
