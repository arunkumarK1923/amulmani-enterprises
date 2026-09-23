const fp = require('fastify-plugin');

module.exports = fp(async function (fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    // Skip auth for login endpoint
    if (request.url === '/api/admin/login') return;
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});