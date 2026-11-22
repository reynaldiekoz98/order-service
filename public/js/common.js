// Shared helpers: API, toasts, nav, modal form, sortable/searchable/paged table
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toast(text, kind = '') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = text; box.append(t);
  setTimeout(() => t.remove(), 3500);
}

async function api(method, url, body) {
  try {
    const r = await fetch(url, { method, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast(data.error || 'Request failed', 'err'); return null; }
    return data;
  } catch { toast('Cannot reach server', 'err'); return null; }
}

function renderNav() {
  const pages = [['/', 'Dashboard'], ['/users.html', 'Users'], ['/products.html', 'Products'], ['/orders.html', 'Orders']];
  const here = location.pathname === '/index.html' ? '/' : location.pathname;
  const nav = document.createElement('nav');
  nav.innerHTML = '<span class="logo">Microservices</span>' +
    pages.map(([h, l]) => `<a href="${h}" class="${h === here ? 'active' : ''}">${l}</a>`).join('');
  document.body.prepend(nav);
}

// Modal form. fields: [{name,label,type,options?,value?}]. Resolves with values or null.
function openForm(title, fields, { submit = 'Save', onChange } = {}) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><h2>${esc(title)}</h2>` +
      fields.map(f => `<label for="f_${f.name}">${esc(f.label)}</label>` + (f.type === 'select'
        ? `<select id="f_${f.name}" name="${f.name}">${f.options.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(f.value) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
        : `<input id="f_${f.name}" name="${f.name}" type="${f.type || 'text'}" ${f.type === 'number' ? 'step="0.01" min="0"' : ''} value="${esc(f.value ?? '')}" required>`)).join('') +
      `<div class="preview" hidden></div><div class="row"><button value="cancel" formnovalidate>Cancel</button><button class="primary" value="ok">${esc(submit)}</button></div></form>`;
    document.body.append(d);
    const form = $('form', d), prev = $('.preview', d);
    const values = () => Object.fromEntries(new FormData(form));
    const update = () => { const t = onChange && onChange(values()); prev.hidden = !t; prev.textContent = t || ''; };
    form.addEventListener('input', update); update();
    d.addEventListener('close', () => { const ok = d.returnValue === 'ok'; const v = ok ? values() : null; d.remove(); resolve(v); });
    d.showModal();
    (d.querySelector('input,select') || {}).focus?.();
  });
}

async function confirmBox(text) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><h2>Are you sure?</h2><p>${esc(text)}</p><div class="row"><button value="cancel">Cancel</button><button class="primary danger" value="ok">Delete</button></div></form>`;
    document.body.append(d);
    d.addEventListener('close', () => { const ok = d.returnValue === 'ok'; d.remove(); resolve(ok); });
    d.showModal();
  });
}

// Table with search, click-to-sort headers and paging.
// cols: [{key,label,render?,sortValue?}]; opts: {rows(): current data, onEdit, onDelete, searchText(row), empty}
function dataTable(root, cols, opts) {
  const state = { q: '', sort: cols[0].key, desc: false, page: 0, size: 8 };
  let data = [];
  const val = (c, r) => (c.sortValue ? c.sortValue(r) : r[c.key]);
  function draw() {
    let rows = data.filter(r => opts.searchText(r).toLowerCase().includes(state.q.toLowerCase()));
    const c = cols.find(x => x.key === state.sort);
    rows.sort((a, b) => { const x = val(c, a), y = val(c, b); const r = x < y ? -1 : x > y ? 1 : 0; return state.desc ? -r : r; });
    const pages = Math.max(1, Math.ceil(rows.length / state.size));
    state.page = Math.min(state.page, pages - 1);
    const slice = rows.slice(state.page * state.size, (state.page + 1) * state.size);
    root.innerHTML = `<div class="toolbar"><input type="search" placeholder="Search…" value="${esc(state.q)}"><span class="grow"></span>${opts.toolbar || ''}</div>
      <div class="card"><table><thead><tr>${cols.map(c => `<th data-k="${c.key}" class="${state.sort === c.key ? 'sorted' + (state.desc ? ' desc' : '') : ''}">${esc(c.label)}</th>`).join('')}<th></th></tr></thead>
      <tbody>${slice.map(r => `<tr>${cols.map(c => `<td>${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}<td class="actions"><button data-edit="${r.id}">Edit</button> <button class="danger" data-del="${r.id}">Delete</button></td></tr>`).join('') || `<tr><td class="empty" colspan="${cols.length + 1}">${state.q ? 'No matches' : esc(opts.empty || 'Nothing here yet')}</td></tr>`}</tbody></table>
      <div class="pager"><span class="muted">${rows.length} item(s)</span><button data-p="-1" ${state.page === 0 ? 'disabled' : ''}>Prev</button><span>${state.page + 1} / ${pages}</span><button data-p="1" ${state.page >= pages - 1 ? 'disabled' : ''}>Next</button></div></div>`;
    const search = $('input[type=search]', root);
    search.oninput = () => { state.q = search.value; state.page = 0; const pos = search.selectionStart; draw(); const s = $('input[type=search]', root); s.focus(); s.setSelectionRange(pos, pos); };
    root.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => { state.desc = state.sort === th.dataset.k ? !state.desc : false; state.sort = th.dataset.k; draw(); });
    root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { state.page += +b.dataset.p; draw(); });
    root.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => opts.onEdit(data.find(r => r.id == b.dataset.edit)));
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => opts.onDelete(data.find(r => r.id == b.dataset.del)));
    opts.afterDraw && opts.afterDraw(root);
  }
  return { set(rows) { data = rows; draw(); } };
}
renderNav();
