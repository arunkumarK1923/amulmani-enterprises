module.exports = async function (fastify) {
  const { pg } = fastify;

  fastify.get('/blog', async () => {
    const { rows } = await pg.query(
      `SELECT id, slug, title, category, icon, excerpt, read_minutes, published_at
       FROM blog_posts WHERE status = 'published'
       ORDER BY published_at DESC`
    );
    return { posts: rows };
  });

  fastify.get('/blog/:slug', async (request, reply) => {
    const { rows } = await pg.query(
      "SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'",
      [request.params.slug]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Post not found' });
    return { post: rows[0] };
  });
};