const http = require('http');
const Router = require('./lib/router');
const { HttpError, send } = require('./lib/http');
const OrderStore = require('./store');
const registerRoutes = require('./routes');
const { serveStatic } = require('./static');

const router = new Router();
registerRoutes(router, new OrderStore());

const server = http.createServer(async (req, res) => {
  try {
    if (await router.handle(req, res)) return;
    if (serveStatic(req, res)) return;
    send(res, 404, { error: 'not found' });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'internal error' });
  }
});

module.exports = server;
