const bcrypt = require('bcryptjs');

module.exports = async function (fastify) {
  const { pg } = fastify;

  // ── Login (public) ───────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password) return reply.code(400).send({ error: 'Missing credentials' });

    const { rows } = await pg.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    const token = fastify.jwt.sign({ id: user.id, username }, { expiresIn: '8h' });
    return { token, username };
  });

  // Everything below requires auth
  fastify.addHook('onRequest', fastify.authenticate);

  // ── Dashboard stats ──────────────────────────────────────
  fastify.get('/stats', async () => {
    const [enq, newEnq, prod, posts] = await Promise.all([
      pg.query('SELECT COUNT(*)::int AS c FROM enquiries'),
      pg.query("SELECT COUNT(*)::int AS c FROM enquiries WHERE status = 'new'"),
      pg.query('SELECT COUNT(*)::int AS c FROM products'),
      pg.query('SELECT COUNT(*)::int AS c FROM blog_posts'),
    ]);
    return {
      enquiries: enq.rows[0].c,
      newEnquiries: newEnq.rows[0].c,
      products: prod.rows[0].c,
      blogPosts: posts.rows[0].c,
    };
  });

  // ── Enquiries ────────────────────────────────────────────
  fastify.get('/enquiries', async () => {
    const { rows } = await pg.query('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 200');
    return { enquiries: rows };
  });

  fastify.patch('/enquiries/:id/status', async (request, reply) => {
    const { status } = request.body || {};
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }
    const { rows } = await pg.query(
      'UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, request.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return { ok: true, enquiry: rows[0] };
  });

  fastify.delete('/enquiries/:id', async (request, reply) => {
    await pg.query('DELETE FROM enquiries WHERE id = $1', [request.params.id]);
    return reply.code(204).send();
  });

  // ── Products CRUD ────────────────────────────────────────
  fastify.get('/products', async () => {
    const { rows } = await pg.query('SELECT * FROM products ORDER BY sort_order ASC');
    return { products: rows };
  });

  fastify.post('/products', async (request, reply) => {
    const { name, icon, category, image_url, description, specs, badges } = request.body || {};
    if (!name || !category) return reply.code(400).send({ error: 'name & category required' });
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { rows } = await pg.query(
      `INSERT INTO products (slug, name, icon, category, image_url, description, specs, badges)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [slug, name, icon || '🏷️', category, image_url || null, description || '', specs || [], badges || []]
    );
    return reply.code(201).send({ product: rows[0] });
  });

  fastify.put('/products/:id', async (request, reply) => {
    const { name, icon, category, image_url, description, specs, badges } = request.body || {};
    const { rows } = await pg.query(
      `UPDATE products SET name=$1, icon=$2, category=$3, image_url=$4, description=$5, specs=$6, badges=$7
       WHERE id=$8 RETURNING *`,
      [name, icon, category, image_url || null, description, specs || [], badges || [], request.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    return { product: rows[0] };
  });

  fastify.delete('/products/:id', async (request, reply) => {
    await pg.query('DELETE FROM products WHERE id = $1', [request.params.id]);
    return reply.code(204).send();
  });

  // ── Blog CRUD ────────────────────────────────────────────
  fastify.get('/blog', async () => {
    const { rows } = await pg.query('SELECT * FROM blog_posts ORDER BY published_at DESC');
    return { posts: rows };
  });

  fastify.post('/blog', async (request, reply) => {
    const { title, category, icon, excerpt, content, read_minutes } = request.body || {};
    if (!title) return reply.code(400).send({ error: 'title required' });
    const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { rows } = await pg.query(
      `INSERT INTO blog_posts (slug, title, category, icon, excerpt, content, read_minutes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [slug, title, category || 'General', icon || '📝', excerpt || '', content || '', read_minutes || 5]
    );
    return reply.code(201).send({ post: rows[0] });
  });

  fastify.delete('/blog/:id', async (request, reply) => {
    await pg.query('DELETE FROM blog_posts WHERE id = $1', [request.params.id]);
    return reply.code(204).send();
  });
};