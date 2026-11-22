const nameField = v => [{ name: 'name', label: 'Name', value: v }];
const table = dataTable($('#users'), [
  { key: 'id', label: 'ID' }, { key: 'name', label: 'Name', sortValue: u => u.name.toLowerCase() },
], {
  searchText: u => `${u.id} ${u.name}`, empty: 'No users yet',
  toolbar: '<button class="primary" id="add">+ Add user</button>',
  afterDraw: root => $('#add', root).onclick = add,
  onEdit: async u => {
    const v = await openForm('Edit user', nameField(u.name)); if (!v) return;
    if (await api('PUT', '/users/' + u.id, v)) { toast('User updated', 'ok'); load(); }
  },
  onDelete: async u => {
    if (!await confirmBox(`Delete user "${u.name}"?`)) return;
    if (await api('DELETE', '/users/' + u.id)) { toast('User deleted', 'ok'); load(); }
  },
});
async function add() {
  const v = await openForm('Add user', nameField(''), { submit: 'Add' }); if (!v) return;
  if (await api('POST', '/users', v)) { toast('User added', 'ok'); load(); }
}
async function load() { const r = await api('GET', '/users'); if (r) table.set(r); }
load();
