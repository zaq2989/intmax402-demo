# intmax402 Live Demo

A live demo server showcasing [intmax402](https://github.com/zaq2989/intmax402) — an HTTP 402 payment & identity protocol for AI agents, powered by INTMAX ZK L2.

## Try It Now

```bash
# Install the CLI
npm install -g @tanakayuto/intmax402-cli

# Generate a test wallet
intmax402 keygen

# Hit the free endpoint (no auth)
curl https://intmax402-demo.up.railway.app/api/free

# Hit the identity endpoint (requires wallet proof)
intmax402 test https://intmax402-demo.up.railway.app/api/identity
```

## Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /` | None | Info page with instructions |
| `GET /api/free` | None | Always works, no credentials needed |
| `GET /api/identity` | INTMAX402 identity proof | Proves wallet ownership via ZK |

## Run Locally

```bash
cp .env.example .env
# Edit .env with your secret

npm install
npm start
```

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

Set the `INTMAX402_SECRET` environment variable to a strong random string in Railway's dashboard.

## Links

- 📦 NPM: [@tanakayuto/intmax402-express](https://www.npmjs.com/package/@tanakayuto/intmax402-express)
- 🐙 GitHub: [zaq2989/intmax402](https://github.com/zaq2989/intmax402)
