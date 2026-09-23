/* ═══════════ Admin Console ═══════════ */
const API = '/api';
let token = localStorage.getItem('am_token');

// ── Helpers ──────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
function toast(msg, type = '') {
  const el = $('#toast');
  el.textContent = msg; el.className = 'toast show ' + type;
  setTimeout(() => (el.className = 'toast'), 3200);
}
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) },
  });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  if (res.status === 204) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// ── Auth ─────────────────────────────────────────────────
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(API + '/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: $('#loginUser').value, password: $('#loginPass').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    token = data.token;
    localStorage.setItem('am_token', token);
    localStorage.setItem('am_user', data.username);
    showDash();
  } catch (err) { $('#loginError').textContent = '❌ ' + err.message; }
});

function logout() {
  localStorage.removeItem('am_token'); localStorage.removeItem('am_user');
  location.reload();
}
$('#logoutBtn').addEventListener('click', logout);

function showDash() {
  $('#loginScreen').classList.add('hidden');
  $('#dash').classList.remove('hidden');
  $('#userName').textContent = localStorage.getItem('am_user') || 'admin';
  loadOverview(); loadEnquiries(); loadProducts(); loadBlog();
}

// ── Tabs ─────────────────────────────────────────────────
document.querySelectorAll('.sidebar nav .nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar nav .nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-' + btn.dataset.tab).classList.add('active');
    $('#pageTitle').textContent = btn.textContent.replace('📊','').replace('📨','').replace('📦','').replace('📝','').trim();
  });
});

// ── Overview ─────────────────────────────────────────────
async function loadOverview() {
  const s = await api('/admin/stats');
  $('#stEnq').textContent = s.enquiries;
  $('#stNew').textContent = s.newEnquiries;
  $('#stProd').textContent = s.products;
  $('#stBlog').textContent = s.blogPosts;
  $('#newCount').textContent = s.newEnquiries;
  const { enquiries } = await api('/admin/enquiries');
  $('#recentEnq').innerHTML = enqRows(enquiries.slice(0, 5));
  bindEnqActions($('#recentEnq'));
}

// ── Enquiries ────────────────────────────────────────────
function enqRows(list) {
  if (!list.length) return '<p class="empty">No enquiries yet.</p>';
  return `<table><thead><tr><th>Date</th><th>Name</th><th>Mobile</th><th>Product</th><th>Source</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(e => `<tr>
      <td>${new Date(e.created_at).toLocaleDateString('en-IN')}</td>
      <td><b>${esc(e.name)}</b>${e.company ? `<br><small>${esc(e.company)}</small>` : ''}</td>
      <td><a href="tel:${esc(e.mobile)}">${esc(e.mobile)}</a>${e.email ? `<br><small>${esc(e.email)}</small>` : ''}</td>
      <td>${esc(e.product || '—')}</td>
      <td><span class="src ${e.source}">${e.source}</span></td>
      <td><select class="status-sel ${e.status}" data-id="${e.id}">
        <option value="new" ${e.status==='new'?'selected':''}>🔵 New</option>
        <option value="contacted" ${e.status==='contacted'?'selected':''}>🟡 Contacted</option>
        <option value="closed" ${e.status==='closed'?'selected':''}>🟢 Closed</option>
      </select></td>
      <td><button class="del" data-del-enq="${e.id}">🗑️</button></td>
    </tr>`).join('')}</tbody></table>`;
}
function bindEnqActions(scope) {
  scope.querySelectorAll('.status-sel').forEach(sel => sel.addEventListener('change', async () => {
    await api(`/admin/enquiries/${sel.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) });
    toast('Status updated ✅'); loadOverview();
  }));
  scope.querySelectorAll('[data-del-enq]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete this enquiry?')) return;
    await api('/admin/enquiries/' + b.dataset.delEnq, { method: 'DELETE' });
    toast('Deleted'); loadEnquiries(); loadOverview();
  }));
}
async function loadEnquiries() {
  const { enquiries } = await api('/admin/enquiries');
  $('#enqTable').innerHTML = enqRows(enquiries);
  bindEnqActions($('#enqTable'));
}

// ── Generic modal ────────────────────────────────────────
const adminModal = $('#adminModal');
function openModal(title, fields, onSubmit) {
  $('#adminModalTitle').textContent = title;
  $('#adminModalForm').innerHTML = fields.map(f =>
    f.type === 'textarea'
      ? `<textarea name="${f.name}" rows="3" placeholder="${f.label}">${esc(f.value||'')}</textarea>`
      : `<input type="${f.type||'text'}" name="${f.name}" placeholder="${f.label}" value="${esc(f.value||'')}" ${f.required?'required':''} />`
  ).join('') + '<button class="btn-primary btn-block" type="submit">Save</button>';
  $('#adminModalForm').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    await onSubmit(body);
    adminModal.classList.remove('open');
    toast('Saved ✅');
  };
  adminModal.classList.add('open');
}
$('#adminModalClose').onclick = () => adminModal.classList.remove('open');
adminModal.addEventListener('click', (e) => { if (e.target === adminModal) adminModal.classList.remove('open'); });

// ── Products CRUD ────────────────────────────────────────
async function loadProducts() {
  const { products } = await api('/admin/products');
  $('#prodTable').innerHTML = `<table><thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Badges</th><th></th></tr></thead><tbody>
    ${products.map(p => `<tr>
      <td>${p.image_url ? `<img src="${esc(p.image_url)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${p.icon}',style:'font-size:1.4rem'}))">` : `<span style="font-size:1.4rem">${p.icon}</span>`}</td>
      <td><b>${esc(p.name)}</b><br><small style="color:#888">${esc((p.description||'').slice(0,70))}…</small></td>
      <td><span class="src">${esc(p.category)}</span></td>
      <td>${(p.badges||[]).map(esc).join(', ') || '—'}</td>
      <td class="row-actions">
        <button data-edit-prod='${esc(JSON.stringify({id:p.id,name:p.name,icon:p.icon,category:p.category,image_url:p.image_url,description:p.description,specs:(p.specs||[]).join(', '),badges:(p.badges||[]).join(', ')}))}'>✏️</button>
        <button class="del" data-del-prod="${p.id}">🗑️</button>
      </td></tr>`).join('')}</tbody></table>`;

  $('#prodTable').querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => {
    const p = JSON.parse(b.dataset.editProd.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
    prodModal(p);
  }));
  $('#prodTable').querySelectorAll('[data-del-prod]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete product?')) return;
    await api('/admin/products/' + b.dataset.delProd, { method: 'DELETE' });
    toast('Deleted'); loadProducts(); loadOverview();
  }));
}
function prodFields(p = {}) {
  return [
    { name: 'name', label: 'Product Name *', value: p.name, required: true },
    { name: 'icon', label: 'Emoji Icon', value: p.icon || '🏷️' },
    { name: 'image_url', label: 'Image URL (product photo)', value: p.image_url },
    { name: 'category', label: 'Category (labels / hang-tags / cards / stickers / packaging) *', value: p.category, required: true },
    { name: 'badges', label: 'Badges (comma separated)', value: p.badges },
    { name: 'specs', label: 'Specs (comma separated)', value: p.specs },
    { name: 'description', label: 'Description', value: p.description, type: 'textarea' },
  ];
}
function prodModal(p = {}) {
  openModal(p.id ? 'Edit Product' : 'Add Product', prodFields(p), async (body) => {
    body.specs = (body.specs || '').split(',').map(s => s.trim()).filter(Boolean);
    body.badges = (body.badges || '').split(',').map(s => s.trim()).filter(Boolean);
    p.id
      ? await api('/admin/products/' + p.id, { method: 'PUT', body: JSON.stringify(body) })
      : await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
    loadProducts(); loadOverview();
  });
}
$('#addProductBtn').addEventListener('click', () => prodModal());

// ── Blog CRUD ────────────────────────────────────────────
async function loadBlog() {
  const { posts } = await api('/admin/blog');
  $('#blogTable').innerHTML = `<table><thead><tr><th>Icon</th><th>Title</th><th>Category</th><th>Published</th><th></th></tr></thead><tbody>
    ${posts.map(p => `<tr>
      <td style="font-size:1.4rem">${p.icon}</td>
      <td><b>${esc(p.title)}</b><br><small style="color:#888">${esc((p.excerpt||'').slice(0,70))}…</small></td>
      <td><span class="src">${esc(p.category)}</span></td>
      <td>${new Date(p.published_at).toLocaleDateString('en-IN')}</td>
      <td><button class="del" data-del-post="${p.id}">🗑️</button></td>
    </tr>`).join('')}</tbody></table>`;
  $('#blogTable').querySelectorAll('[data-del-post]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete post?')) return;
    await api('/admin/blog/' + b.dataset.delPost, { method: 'DELETE' });
    toast('Deleted'); loadBlog(); loadOverview();
  }));
}
$('#addPostBtn').addEventListener('click', () => {
  openModal('New Blog Post', [
    { name: 'title', label: 'Title *', required: true },
    { name: 'category', label: 'Category', value: 'Industry Guide' },
    { name: 'icon', label: 'Emoji Icon', value: '📝' },
    { name: 'read_minutes', label: 'Read Minutes', type: 'number', value: 5 },
    { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
    { name: 'content', label: 'Content', type: 'textarea' },
  ], async (body) => {
    await api('/admin/blog', { method: 'POST', body: JSON.stringify(body) });
    loadBlog(); loadOverview();
  });
});

// ── Boot ─────────────────────────────────────────────────
if (token) showDash();