/* ═══════════ Amulmani Enterprises — Frontend Engine ═══════════ */
const API = '/api';

// ── Toast ────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => (el.className = 'toast'), 3800);
}

// ── Navbar ───────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  document.getElementById('toTop').classList.toggle('show', window.scrollY > 600);
});
document.getElementById('toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => document.body.classList.toggle('nav-open'));
document.querySelectorAll('#navLinks a').forEach(a =>
  a.addEventListener('click', () => document.body.classList.remove('nav-open'))
);

// ── Scroll reveal ────────────────────────────────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Animated counters ────────────────────────────────────
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = parseFloat(el.dataset.count), dec = el.dataset.decimal ? 1 : 0;
    let cur = 0; const step = target / 60;
    const tick = () => {
      cur = Math.min(cur + step, target);
      el.textContent = cur.toFixed(dec);
      if (cur < target) requestAnimationFrame(tick);
    };
    tick(); counterIO.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stat-num').forEach(el => counterIO.observe(el));

// ── 3D tilt effect ───────────────────────────────────────
function bindTilt(scope = document) {
  scope.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = ''));
  });
}
bindTilt();

// ── Load products ────────────────────────────────────────
const grid = document.getElementById('productsGrid');
let allProducts = [];

// Gradient palettes for stacked card layers
const cardGradients = [
  ['#a41e22', '#7c1215', '#e08585'],
  ['#7c1215', '#a41e22', '#f0b9b9'],
  ['#5c0f12', '#9e1b1f', '#e08585'],
  ['#9e1b1f', '#5c0f12', '#f0b9b9'],
  ['#a41e22', '#5c0f12', '#d4b3b3'],
  ['#7c1215', '#9e1b1f', '#e08585'],
  ['#5c0f12', '#a41e22', '#f0b9b9'],
  ['#9e1b1f', '#7c1215', '#d4b3b3'],
  ['#a41e22', '#7c1215', '#e08585'],
  ['#5c0f12', '#9e1b1f', '#f0b9b9'],
  ['#7c1215', '#a41e22', '#d4b3b3'],
  ['#9e1b1f', '#5c0f12', '#e08585'],
];

let cardScrollBase = 0;
let lastScrollY = window.scrollY;
let scrollDir = 0; // -1 left, 0 neutral, 1 right (simulated from vertical scroll)

window.addEventListener('scroll', () => {
  const delta = window.scrollY - lastScrollY;
  scrollDir = delta > 2 ? 1 : delta < -2 ? -1 : 0;
  lastScrollY = window.scrollY;
});

function productCard(p, idx) {
  const grads = cardGradients[idx % cardGradients.length];
  const media = p.image_url
    ? `<div class="pc-media-3d">
         <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('img-fallback')">
       </div>`
    : `<div class="pc-media-3d pc-no-img"><span>${p.icon}</span></div>`;
  return `
  <article class="spin-card" data-category="${p.category}" data-idx="${idx}" onclick="window.location='/product.html?id=${p.slug}'">
    <div class="spin-card-stack">
      <div class="spin-layer layer-3" style="background:linear-gradient(135deg, ${grads[2]}dd, ${grads[2]}88);transform:translateZ(-60px) rotate(-4deg) translateY(24px)"></div>
      <div class="spin-layer layer-2" style="background:linear-gradient(135deg, ${grads[1]}dd, ${grads[1]}88);transform:translateZ(-30px) rotate(2deg) translateY(12px)"></div>
      <div class="spin-layer layer-1" style="background:linear-gradient(135deg, ${grads[0]}ee, ${grads[0]}aa)"></div>
      ${media}
      <div class="spin-card-content">
        <span class="spin-card-icon">${p.icon}</span>
        <h3>${p.name}</h3>
        <p>${(p.description || '').slice(0, 80)}${(p.description || '').length > 80 ? '…' : ''}</p>
        <div class="pc-badges">${(p.badges || []).map(b => `<span class="chip cert">${b}</span>`).join('')}${(p.specs || []).slice(0, 3).map(s => `<span class="chip">${s}</span>`).join('')}</div>
        <span class="spin-card-cta">View Product →</span>
      </div>
    </div>
  </article>`;
}

async function loadProducts() {
  try {
    const res = await fetch(`${API}/products`);
    const data = await res.json();
    allProducts = data.products;
    renderProducts('all');
    initProductWheel(allProducts);
  } catch {
    grid.innerHTML = '<div class="loader">⚠️ Could not load catalogue. Is the server running?</div>';
  }
}

function renderProducts(filter) {
  const list = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);
  grid.innerHTML = list.map((p, i) => productCard(p, i)).join('') || '<div class="loader">No products found.</div>';
  requestAnimationFrame(initSpinCards);
}

document.getElementById('productTabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderProducts(tab.dataset.filter);
});

// ── Load blog ────────────────────────────────────────────
async function loadBlog() {
  const blogGrid = document.getElementById('blogGrid');
  try {
    const res = await fetch(`${API}/blog`);
    const { posts } = await res.json();
    blogGrid.innerHTML = posts.map(p => `
      <article class="blog-card tilt reveal in">
        <span class="blog-icon">${p.icon}</span>
        <span class="blog-cat">${p.category} · ${p.read_minutes} min read</span>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <time>${new Date(p.published_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</time>
        <a href="#blog" class="blog-link">Read Article →</a>
      </article>`).join('');
    bindTilt(blogGrid);
  } catch {
    blogGrid.innerHTML = '<div class="loader">Articles coming soon.</div>';
  }
}

// ── Forms → API ──────────────────────────────────────────
function serialize(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

async function submitEnquiry(form, source) {
  const body = { ...serialize(form), source };
  if (!body.name || !body.mobile) { toast('Please fill name and mobile number.', 'error'); return; }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const res = await fetch(`${API}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    toast('✅ Enquiry submitted! We\'ll contact you within 24 hours.');
    form.reset();
    closeQuote();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = btn.dataset.label || 'Submit';
  }
}

document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('button').dataset.label = 'Submit Enquiry →';
  submitEnquiry(e.target, 'contact-form');
});
document.getElementById('quoteForm').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('button').dataset.label = 'Submit Quote Request →';
  submitEnquiry(e.target, 'quote-modal');
});

// ── Quote modal ──────────────────────────────────────────
const modal = document.getElementById('quoteModal');
function openQuote(product) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (product) {
    const sel = document.querySelector('#quoteForm select[name="product"]');
    [...sel.options].forEach(o => { if (o.text.includes(product.split(' ')[0])) sel.value = o.value || o.text; });
  }
}
function closeQuote() { modal.classList.remove('open'); document.body.style.overflow = ''; }

document.querySelectorAll('[data-open-quote]').forEach(b => b.addEventListener('click', () => openQuote()));
document.querySelectorAll('[data-close-quote]').forEach(b => b.addEventListener('click', closeQuote));
modal.addEventListener('click', (e) => { if (e.target === modal) closeQuote(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuote(); });

// ── 3D Spin Card Animation ──────────────────────────────
let spinCards = [];
let spinRaf = null;

function initSpinCards() {
  spinCards = Array.from(document.querySelectorAll('.spin-card'));
  spinCards.forEach(card => {
    card._targetRotY = 0;
    card._currentRotY = 0;
    card._targetRotX = 0;
    card._currentRotX = 0;
    card._hovered = false;
  });
  if (!spinRaf) animateSpinCards();
}

function animateSpinCards() {
  const now = Date.now();
  spinCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    // Scroll-based Y rotation
    if (!card._hovered) {
      card._targetRotY = scrollDir * 18 + Math.sin(now / 1200 + card._idx * 0.7) * 5;
    }
    // Smooth lerp
    card._currentRotY += (card._targetRotY - card._currentRotY) * 0.08;
    card._currentRotX += (card._targetRotX - card._currentRotX) * 0.08;
    // Floating bob
    const bob = Math.sin(now / 1000 + (parseInt(card.dataset.idx) || 0) * 0.9) * 4;
    card.querySelector('.spin-card-stack').style.transform =
      `perspective(900px) rotateY(${card._currentRotY}deg) rotateX(${card._currentRotX}deg) translateY(${bob}px)`;
  });
  spinRaf = requestAnimationFrame(animateSpinCards);
}

// Mouse hover: tilt toward cursor
document.addEventListener('mousemove', (e) => {
  spinCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      card._hovered = true;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card._targetRotY = x * 20;
      card._targetRotX = -y * 15;
    } else if (card._hovered) {
      card._hovered = false;
    }
  });
});
document.addEventListener('mouseleave', () => {
  spinCards.forEach(card => { card._hovered = false; card._targetRotY = 0; card._targetRotX = 0; });
});

// ── Product Scroll Wheel ────────────────────────────────
const wheelColors = [
  ['#a41e22','#5c0f12'], // deep maroon
  ['#7c1215','#b03034'], // crimson
  ['#9e1b1f','#5c0f12'], // logo maroon
  ['#7c1215','#e08585'], // maroon-rose
  ['#5c0f12','#a41e22'], // dark-red
  ['#b03034','#7c1215'], // red-maroon
  ['#a41e22','#e08585'], // maroon-blush
  ['#5c0f12','#7c1215'], // darkest
  ['#9e1b1f','#b03034'], // red duo
  ['#7c1215','#a41e22'], // crimson-maroon
  ['#b03034','#5c0f12'], // red-dark
  ['#e08585','#9e1b1f'], // blush-maroon
];
const wheelIcons = ['🏷️','🎫','📸','📦','✂️','📋','🏷️','🎫','📸','📦','✂️','📋'];

function initProductWheel(products) {
  const track = document.getElementById('wheelTrack');
  if (!track || !products.length) return;
  const filtered = products.filter(p => p.image_url);
  track.innerHTML = filtered.map((p, i) => {
    const [c1, c2] = wheelColors[i % wheelColors.length];
    const icon = wheelIcons[i % wheelIcons.length];
    return `<div class="wheel-card" data-slug="${p.slug}" style="flex: 0 0 200px;">
      <div class="wheel-card-stack">
        <div class="wl wl-1" style="background:linear-gradient(135deg,${c1},${c2})"></div>
        <div class="wl wl-2" style="background:linear-gradient(135deg,${c2},${c1})"></div>
        <div class="wl wl-3" style="background:linear-gradient(135deg,${c1}88,${c2}88)"></div>
        <div class="wheel-card-img"><img src="${p.image_url}" alt="${p.name}" loading="lazy"></div>
        <div class="wheel-card-label"><em>${icon}</em><span>${p.name}</span></div>
      </div>
    </div>`;
  }).join('');

  // Drag / scroll to spin
  const wheel = document.getElementById('productWheel');
  let isDragging = false, startX = 0, scrollLeft = 0, vel = 0, lastX = 0, lastTime = 0;

  // Center the track initially
  const cardW = 224; // 200px + 24px gap
  const totalW = filtered.length * cardW;
  const centerOffset = -(totalW / 2 - wheel.offsetWidth / 2);
  scrollLeft = centerOffset;
  track.style.transform = `translateX(${scrollLeft}px)`;

  // Auto-spin idle animation
  let autoSpin = true, autoDir = 1;
  function autoSpinTick() {
    if (autoSpin && !isDragging) {
      scrollLeft -= 0.3 * autoDir;
      track.style.transform = `translateX(${scrollLeft}px)`;
    }
    requestAnimationFrame(autoSpinTick);
  }
  requestAnimationFrame(autoSpinTick);

  wheel.addEventListener('mousedown', (e) => {
    isDragging = true; autoSpin = false;
    startX = e.clientX; lastX = e.clientX; lastTime = Date.now(); vel = 0;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const now = Date.now();
    const dt = now - lastTime || 1;
    vel = dx / dt * 16; // velocity per frame
    scrollLeft += dx;
    track.style.transform = `translateX(${scrollLeft}px)`;
    lastX = e.clientX; lastTime = now;
  });
  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    // Inertia
    function inertia() {
      if (Math.abs(vel) < 0.1) return autoSpin = true;
      scrollLeft += vel;
      vel *= 0.95;
      track.style.transform = `translateX(${scrollLeft}px)`;
      requestAnimationFrame(inertia);
    }
    inertia();
  });

  // Touch support
  wheel.addEventListener('touchstart', (e) => {
    isDragging = true; autoSpin = false;
    startX = e.touches[0].clientX; lastX = startX; lastTime = Date.now(); vel = 0;
  }, { passive: true });
  wheel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastX;
    const now = Date.now();
    const dt = now - lastTime || 1;
    vel = dx / dt * 16;
    scrollLeft += dx;
    track.style.transform = `translateX(${scrollLeft}px)`;
    lastX = e.touches[0].clientX; lastTime = now;
  }, { passive: true });
  wheel.addEventListener('touchend', () => {
    isDragging = false;
    function inertia() {
      if (Math.abs(vel) < 0.1) return autoSpin = true;
      scrollLeft += vel;
      vel *= 0.95;
      track.style.transform = `translateX(${scrollLeft}px)`;
      requestAnimationFrame(inertia);
    }
    inertia();
  });

  // Wheel card click → product page
  track.addEventListener('click', (e) => {
    const card = e.target.closest('.wheel-card');
    if (card) window.location.href = `/product.html?id=${card.dataset.slug}`;
  });
}

// ── Init ─────────────────────────────────────────────────
loadProducts();
loadBlog();