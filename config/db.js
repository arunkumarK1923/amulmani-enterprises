const { Pool } = require('pg');

// Auto-detect whether SSL is needed.
// On Render the web service uses the *Internal* Database URL which does not
// require SSL (traffic stays within Render's private network).
// If the URL ever points to an external host (e.g. during local testing),
// SSL is automatically enabled so the driver does not get an ECONNRESET.
function buildPoolConfig(connectionString) {
  if (!connectionString) return { connectionString };

  let host;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    return { connectionString };
  }

  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';

  return {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
  };
}

const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL));

pool.on('error', (err) => console.error('💥 Unexpected PG pool error:', err));

module.exports = pool;
