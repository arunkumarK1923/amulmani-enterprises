module.exports = async function (fastify) {
  const { pg } = fastify;

  // Public — create enquiry (contact form / quote modal)
  fastify.post('/enquiries', async (request, reply) => {
    const { name, company, email, mobile, product, message, source } = request.body || {};

    if (!name || !mobile) {
      return reply.code(400).send({ error: 'Name and mobile number are required.' });
    }

    const { rows } = await pg.query(
      `INSERT INTO enquiries (name, company, email, mobile, product, message, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [
        String(name).slice(0, 100),
        company ? String(company).slice(0, 150) : null,
        email ? String(email).slice(0, 150) : null,
        String(mobile).slice(0, 20),
        product ? String(product).slice(0, 100) : null,
        message ? String(message).slice(0, 2000) : null,
        source === 'quote-modal' ? 'quote-modal' : 'contact-form',
      ]
    );

    return reply.code(201).send({ ok: true, id: rows[0].id });
  });
};