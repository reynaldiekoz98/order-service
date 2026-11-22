// Business logic: resolve user + product by calling the other services
const { fetchUser, fetchProduct } = require('./clients');

async function resolveRefs(input) {
  const [user, product] = await Promise.all([fetchUser(input.userId), fetchProduct(input.productId)]);
  return { user, product };
}
module.exports = { resolveRefs };
