const fields = (n = '', p = '') => [{ name: 'name', label: 'Name', value: n }, { name: 'price', label: 'Price', type: 'number', value: p }];
const body = v => ({ name: v.name, price: parseFloat(v.price) });
const table = dataTable($('#products'), [
  { key: 'id', label: 'ID' }, { key: 'name', label: 'Name', sortValue: p => p.name.toLowerCase() },
  { key: 'price', label: 'Price', render: p => money(p.price) },
], {
  searchText: p => `${p.id} ${p.name} ${p.price}`, empty: 'No products yet',
  toolbar: '<button class="primary" id="add">+ Add product</button>',
  afterDraw: root => $('#add', root).onclick = add,
  onEdit: async p => {
    const v = await openForm('Edit product', fields(p.name, p.price)); if (!v) return;
    if (await api('PUT', '/products/' + p.id, body(v))) { toast('Product updated', 'ok'); load(); }
  },
  onDelete: async p => {
    if (!await confirmBox(`Delete product "${p.name}"?`)) return;
    if (await api('DELETE', '/products/' + p.id)) { toast('Product deleted', 'ok'); load(); }
  },
});
async function add() {
  const v = await openForm('Add product', fields(), { submit: 'Add' }); if (!v) return;
  if (await api('POST', '/products', body(v))) { toast('Product added', 'ok'); load(); }
}
async function load() { const r = await api('GET', '/products'); if (r) table.set(r); }
load();
