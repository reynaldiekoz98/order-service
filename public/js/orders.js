let users = [], products = [];
const table = dataTable($('#orders'), [
  { key: 'id', label: 'ID' },
  { key: 'user', label: 'User', render: o => esc(o.user.name), sortValue: o => o.user.name.toLowerCase() },
  { key: 'product', label: 'Product', render: o => esc(o.product.name), sortValue: o => o.product.name.toLowerCase() },
  { key: 'total', label: 'Total', render: o => money(o.product.price), sortValue: o => o.product.price },
], {
  searchText: o => `${o.id} ${o.user.name} ${o.product.name}`, empty: 'No orders yet',
  toolbar: '<button class="primary" id="add">+ New order</button>',
  afterDraw: root => $('#add', root).onclick = () => form(),
  onEdit: o => form(o),
  onDelete: async o => {
    if (!await confirmBox(`Delete order #${o.id}?`)) return;
    if (await api('DELETE', '/orders/' + o.id)) { toast('Order deleted', 'ok'); load(); }
  },
});

async function form(order) {
  if (!users.length || !products.length) return toast('Create at least one user and one product first', 'err');
  const v = await openForm(order ? `Change order #${order.id}` : 'New order', [
    { name: 'userId', label: 'User', type: 'select', value: order?.user.id, options: users.map(u => ({ value: u.id, label: u.name })) },
    { name: 'productId', label: 'Product', type: 'select', value: order?.product.id, options: products.map(p => ({ value: p.id, label: `${p.name} (${money(p.price)})` })) },
  ], {
    submit: order ? 'Save' : 'Create order',
    onChange: v => { const p = products.find(x => x.id == v.productId), u = users.find(x => x.id == v.userId); return p && u ? `${u.name} pays ${money(p.price)}` : ''; },
  });
  if (!v) return;
  const payload = { userId: +v.userId, productId: +v.productId };
  const r = order ? await api('PUT', '/orders/' + order.id, payload) : await api('POST', '/orders', payload);
  if (r) { toast(order ? 'Order updated' : `Order #${r.id} created`, 'ok'); load(); }
}

async function load() {
  const [o, u, p] = await Promise.all([api('GET', '/orders'), api('GET', '/users'), api('GET', '/products')]);
  if (u) users = u; if (p) products = p;
  if (o) table.set(o);
}
load();
