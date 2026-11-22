const SERVICES = [['user', 'user-service'], ['product', 'product-service'], ['order', 'order-service']];

async function loadCounts() {
  const [users, products, orders] = await Promise.all([api('GET', '/users'), api('GET', '/products'), api('GET', '/orders')]);
  if (!users || !products || !orders) return;
  const tile = (href, n, label) => `<a class="card stat" href="${href}"><div class="n">${n}</div><div class="muted">${label}</div></a>`;
  const revenue = orders.reduce((s, o) => s + o.product.price, 0);
  $('#stats').innerHTML = tile('/users.html', users.length, 'Users') + tile('/products.html', products.length, 'Products') +
    tile('/orders.html', orders.length, 'Orders') + `<div class="card stat"><div class="n">${money(revenue)}</div><div class="muted">Order value</div></div>`;
  $('#recent').innerHTML = orders.slice(-5).reverse().map(o =>
    `<div>#${o.id} — ${esc(o.user.name)} bought ${esc(o.product.name)} <span class="muted">${money(o.product.price)}</span></div>`).join('') ||
    '<div class="empty">No orders yet. <a href="/orders.html">Create one</a>.</div>';
}

async function loadHealth() {
  const r = await api('GET', '/status');
  if (!r) return;
  $('#health').innerHTML = SERVICES.map(([k, name]) =>
    `<div class="card"><span class="dot ${r[k].up ? 'up' : 'down'}"></span><b>${name}</b><div class="muted">${r[k].up ? `up · ${r[k].ms} ms` : 'down'}</div></div>`).join('');
}

loadCounts(); loadHealth();
setInterval(loadHealth, 5000);
