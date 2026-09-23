require('dotenv').config();
const path = require('path');
const fastify = require('fastify')({ logger: true });
const pool = require('./config/db');

// ── Plugins ────────────────────────────────────────────────
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || true,
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'dev-secret-change-me',
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});

// Decorate + DB health
fastify.decorate('pg', pool);
fastify.addHook('onClose', async () => pool.end());

// ── Auth plugin ────────────────────────────────────────────
fastify.register(require('./src/plugins/auth'));

// ── API routes ─────────────────────────────────────────────
fastify.register(require('./src/routes/api/enquiries'), { prefix: '/api' });
fastify.register(require('./src/routes/api/products'),  { prefix: '/api' });
fastify.register(require('./src/routes/api/blog'),      { prefix: '/api' });
fastify.register(require('./src/routes/api/admin'),     { prefix: '/api/admin' });

// Health check
fastify.get('/api/health', async () => {
  const { rows } = await pool.query('SELECT NOW() AS db_time');
  return { status: 'ok', db: rows[0].db_time };
});

// SPA fallbacks
fastify.setNotFoundHandler((req, reply) => {
  if (req.raw.url.startsWith('/api/')) {
    return reply.code(404).send({ error: 'Endpoint not found' });
  }
  return reply.sendFile('index.html');
});

// ── Start ──────────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.ready();
    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
    });
    console.log('🚀 Amulmani Enterprises running → http://localhost:' + (process.env.PORT || 3000));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();    