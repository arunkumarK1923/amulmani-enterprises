module.exports = async function (fastify) {
  const { pg } = fastify;

  // Public list (optional ?category=labels)
  fastify.get('/products', async (request) => {
    const { category } = request.query;
    let q = 'SELECT id, slug, name, icon, category, image_url, description, specs, badges, featured FROM products';
    const params = [];
    if (category && category !== 'all') {
      q += ' WHERE category = $1';
      params.push(category);
    }
    q += ' ORDER BY sort_order ASC, id ASC';
    const { rows } = await pg.query(q, params);
    return { products: rows };
  });

  // Public detail
  fastify.get('/products/:slug', async (request, reply) => {
    const { rows } = await pg.query('SELECT * FROM products WHERE slug = $1', [request.params.slug]);
    if (!rows.length) return reply.code(404).send({ error: 'Product not found' });
    return { product: rows[0] };
  });
};