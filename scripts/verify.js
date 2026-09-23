const fs = require('fs');
const path = require('path');

const required = [
  'server.js', 'package.json', '.env.example',
  'config/db.js',
  'database/schema.sql', 'database/seed.sql',
  'scripts/init-db.js',
  'src/plugins/auth.js',
  'src/routes/api/enquiries.js', 'src/routes/api/products.js',
  'src/routes/api/blog.js', 'src/routes/api/admin.js',
  'public/index.html', 'public/admin.html',
  'public/css/styles.css', 'public/css/admin.css',
  'public/js/three-hero.js', 'public/js/main.js', 'public/js/admin.js',
];

let complete = true;
console.log('\n🔍 Amulmani Enterprises — Project Structure Check\n');
for (const file of required) {
  const p = path.join(__dirname, '..', file);
  const ok = fs.existsSync(p) && fs.statSync(p).size > 0;
  if (!ok) complete = false;
  console.log(`${ok ? '✅' : '❌ MISSING/EMPTY →'} ${file}`);
}
console.log(complete ? '\n🎉 All 19 files present — project is complete!\n' : '\n⚠️ Fill in the missing files, then run: npm run verify\n');
process.exit(complete ? 0 : 1);