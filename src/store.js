class OrderStore {
  constructor() { this.items = []; this.nextId = 1; }
  list() { return this.items; }
  get(id) { return this.items.find(o => o.id === id); }
  create({ user, product }) { const o = { id: this.nextId++, user, product }; this.items.push(o); return o; }
  update(id, { user, product }) { const o = this.get(id); if (o) { o.user = user; o.product = product; } return o; }
  remove(id) { const o = this.get(id); this.items = this.items.filter(x => x.id !== id); return o; }
}
module.exports = OrderStore;
