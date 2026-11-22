const PORT = process.env.PORT || 3003;
require('./src/app').listen(PORT, () => console.log(`order-service on ${PORT}`));
