// HTTP clients for the other microservices
const { USER_URL, PRODUCT_URL } = require('./config');
const { HttpError } = require('./lib/http');

async function call(url) {
  try { return await fetch(url); }
  catch { throw new HttpError(502, 'upstream service unavailable'); }
}

async function fetchUser(id) {
  const r = await call(`${USER_URL}/users/${encodeURIComponent(id)}`);
  if (!r.ok) throw new HttpError(400, 'user not found');
  return r.json();
}

async function fetchProduct(id) {
  const r = await call(`${PRODUCT_URL}/products/${encodeURIComponent(id)}`);
  if (!r.ok) throw new HttpError(400, 'product not found');
  return r.json();
}

module.exports = { fetchUser, fetchProduct };
