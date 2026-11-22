const test = require('node:test'); const assert = require('node:assert');
const http = require('http');

// Fake upstream services so the order-service test is isolated
const fake = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/users') return res.end(JSON.stringify([{ id: 1, name: 'Alice' }]));
  if (req.url === '/users/1') return res.end(JSON.stringify({ id: 1, name: 'Alice' }));
  if (req.url === '/products/1') return res.end(JSON.stringify({ id: 1, name: 'Laptop', price: 1200 }));
  if (req.url === '/products/2') return res.end(JSON.stringify({ id: 2, name: 'Mouse', price: 25 }));
  res.statusCode = 404; res.end('{}');
});

test('order-service CRUD', async (t) => {
  await new Promise(r => fake.listen(0, r));
  const fakeUrl = `http://localhost:${fake.address().port}`;
  process.env.USER_SERVICE_URL = fakeUrl;
  process.env.PRODUCT_SERVICE_URL = fakeUrl;
  const server = require('./src/app');
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  t.after(() => { server.close(); fake.close(); });
  const call = (m, p, b) => fetch(base + p, { method: m, body: b && JSON.stringify(b) });

  // proxy to user-service
  assert.strictEqual((await (await call('GET', '/users')).json())[0].name, 'Alice');

  // create
  const ok = await call('POST', '/orders', { userId: 1, productId: 1 });
  assert.strictEqual(ok.status, 201);
  const order = await ok.json();
  assert.strictEqual(order.user.name, 'Alice');
  assert.strictEqual((await call('POST', '/orders', { userId: 9, productId: 1 })).status, 400);

  // read
  assert.strictEqual((await (await call('GET', `/orders/${order.id}`)).json()).product.name, 'Laptop');

  // update
  const upd = await call('PUT', `/orders/${order.id}`, { userId: 1, productId: 2 });
  assert.strictEqual((await upd.json()).product.name, 'Mouse');

  // delete
  assert.strictEqual((await call('DELETE', `/orders/${order.id}`)).status, 200);
  assert.strictEqual((await call('GET', `/orders/${order.id}`)).status, 404);
});
