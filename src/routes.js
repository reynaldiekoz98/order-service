const { HttpError } = require('./lib/http');
const { resolveRefs } = require('./orderService');
const { USER_URL, PRODUCT_URL } = require('./config');

module.exports = (router, store) => {
  const find = ({ params }) => {
    const order = store.get(Number(params.id));
    if (!order) throw new HttpError(404, 'order not found');
    return order;
  };

  const version = process.env.APP_VERSION || 'dev';   // git SHA baked into the image (same as the image tag)
  router.get('/health', ({ send }) => send(200, { status: 'ok', service: 'order-service', version }));
  router.get('/version', ({ send }) => send(200, { service: 'order-service', version }));

  // --- aggregated health of all three services (used by the dashboard) ---
  router.get('/status', async ({ send }) => {
    const ping = async base => {
      const t = Date.now();
      try { const r = await fetch(base + '/health'); const b = await r.json().catch(() => ({})); return { up: r.ok, ms: Date.now() - t, version: b.version || null }; }
      catch { return { up: false, ms: null }; }
    };
    const [user, product] = await Promise.all([ping(USER_URL), ping(PRODUCT_URL)]);
    send(200, { order: { up: true, ms: 0, version }, user, product });
  });

  // --- orders CRUD ---
  router.get('/orders', ({ send }) => send(200, store.list()));
  router.post('/orders', async ({ json, send }) => send(201, store.create(await resolveRefs(await json()))));
  router.get('/orders/:id', ctx => ctx.send(200, find(ctx)));
  router.put('/orders/:id', async ctx => {
    find(ctx);
    ctx.send(200, store.update(Number(ctx.params.id), await resolveRefs(await ctx.json())));
  });
  router.delete('/orders/:id', ctx => { find(ctx); ctx.send(200, store.remove(Number(ctx.params.id))); });

  // --- forward /users* and /products* so the browser only talks to this service ---
  const proxy = base => async ({ req, url, raw, res }) => {
    const hasBody = req.method !== 'GET' && req.method !== 'DELETE';
    let r;
    try { r = await fetch(base + url, { method: req.method, body: hasBody ? await raw() : undefined }); }
    catch { throw new HttpError(502, 'upstream service unavailable'); }
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(await r.text());
  };
  for (const [prefix, base] of [['/users', USER_URL], ['/products', PRODUCT_URL]]) {
    for (const method of ['GET', 'POST']) router.add(method, prefix, proxy(base));
    for (const method of ['GET', 'PUT', 'DELETE']) router.add(method, `${prefix}/:id`, proxy(base));
  }
};
