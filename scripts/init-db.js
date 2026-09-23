require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------------------------
// Connection setup
// ---------------------------------------------------------------------------
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

// Detect whether we're hitting an external Render host that needs SSL.
// Render internal hosts look like: <name>-a.<region>-postgres.render.com  (no dot-separated external hostname)
// Render external hosts look like: <name>.<region>-postgres.render.com
// The safest heuristic: enable SSL whenever the URL is NOT a loopback/localhost.
let parsedUrl;
try {
  parsedUrl = new URL(dbUrl);
} catch {
  console.error('❌ DATABASE_URL is not a valid URL. Aborting.');
  process.exit(1);
}

const host = parsedUrl.hostname;
const dbName = parsedUrl.pathname.replace(/^\//, '');
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

// For any non-local host (i.e. Render, RDS, Cloud SQL, etc.) we enable SSL.
// rejectUnauthorized: false is required for Render's self-signed / internal CA certs
// when connecting from outside the Render network.
const sslEnabled = !isLocal;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,   // 10 s to establish connection
  statement_timeout: 30000,         // 30 s per statement
  idleTimeoutMillis: 10000,
  max: 2,                           // small pool — this is a one-shot init script
});

// ---------------------------------------------------------------------------
// Safe diagnostic (never prints the password)
// ---------------------------------------------------------------------------
console.log('');
console.log('🔌 Database connection info:');
console.log(`   host     : ${host}`);
console.log(`   database : ${dbName}`);
console.log(`   SSL      : ${sslEnabled ? 'enabled (rejectUnauthorized=false)' : 'disabled (local)'}`);
console.log('');

// ---------------------------------------------------------------------------
// Main init routine
// ---------------------------------------------------------------------------
(async () => {
  let client;
  try {
    // Eagerly acquire a client so we can detect connection failures early
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');

    const schema = fs.readFileSync(
      path.join(__dirname, '../database/schema.sql'), 'utf8'
    );
    const seed = fs.readFileSync(
      path.join(__dirname, '../database/seed.sql'), 'utf8'
    );

    await client.query(schema);
    console.log('✅ Schema applied (CREATE TABLE IF NOT EXISTS — safe to re-run)');

    await client.query(seed);
    console.log('✅ Seed data inserted (ON CONFLICT DO NOTHING — safe to re-run)');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, hash]
    );
    console.log(`✅ Admin user upserted → username: ${username}`);

    // Quick verification — confirm all four tables exist
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('admin_users','products','blog_posts','enquiries')
      ORDER BY table_name
    `);
    const found = rows.map((r) => r.table_name);
    console.log('');
    console.log('📋 Tables confirmed in database:');
    for (const t of ['admin_users', 'blog_posts', 'enquiries', 'products']) {
      console.log(`   ${found.includes(t) ? '✅' : '❌'} ${t}`);
    }
    console.log('');
    console.log('🎉 Initialisation complete.');
  } catch (err) {
    console.error('');
    console.error('❌ Init failed:', err.message);
    if (err.code) console.error('   PG error code:', err.code);
    if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 Hint: If connecting to a Render External Database URL from');
      console.error('   outside Render, SSL is required. Make sure DATABASE_URL');
      console.error('   points to the *External* Database URL from the Render dashboard.');
    }
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
