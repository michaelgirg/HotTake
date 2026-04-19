const { Pool } = require('pg');

const ssl =
  process.env.PGSSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
