require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');

    await pool.query(schema);
    console.log('✅ Schema created');

    await pool.query(seed);
    console.log('✅ Seed data inserted');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, hash]
    );
    console.log(`✅ Admin user ready → ${username} / ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Init failed:', err.message);
    process.exit(1);
  }
})();