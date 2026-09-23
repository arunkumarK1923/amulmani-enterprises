-- Amulmani Enterprises schema

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(150) NOT NULL,
  icon        VARCHAR(10) DEFAULT '🏷️',
  category    VARCHAR(50) NOT NULL,          -- labels | hang-tags | cards | stickers | packaging
  image_url   TEXT,                          -- product photo (rendered in a 3D tilt/parallax frame on the frontend)
  description TEXT,
  specs       TEXT[] DEFAULT '{}',
  badges      TEXT[] DEFAULT '{}',
  featured    BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(160) UNIQUE NOT NULL,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(60),
  icon         VARCHAR(10) DEFAULT '📝',
  excerpt      TEXT,
  content      TEXT,
  read_minutes INT DEFAULT 5,
  published_at DATE DEFAULT CURRENT_DATE,
  status       VARCHAR(20) DEFAULT 'published'   -- published | draft
);

CREATE TABLE IF NOT EXISTS enquiries (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  company    VARCHAR(150),
  email      VARCHAR(150),
  mobile     VARCHAR(20) NOT NULL,
  product    VARCHAR(100),
  message    TEXT,
  source     VARCHAR(30) DEFAULT 'contact-form', -- contact-form | quote-modal
  status     VARCHAR(20) DEFAULT 'new',          -- new | contacted | closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe to re-run on a database created before image_url existed
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);