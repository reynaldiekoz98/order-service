# order-service

Part of a small microservices practice project (Node.js, no dependencies).

- Port: 3003
- Test: `npm test`
- Build: `docker build -t order-service .`
- Health: `GET /health` (includes `version`)
- Version: `GET /version`; the git SHA baked in at build time (`--build-arg GIT_SHA=<sha>`), `dev` if not set
