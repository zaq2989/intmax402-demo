/**
 * intmax402 Live Demo Server
 *
 * ⚠️  PUBLIC DEMO — do not store sensitive data, private keys, or PII.
 *     This server is intentionally minimal and stateless.
 *     INTMAX402_SECRET is used only for signing 402 challenges; rotate freely.
 */

import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { intmax402 } from '@tanakayuto/intmax402-express'

const app = express()
const PORT = process.env.PORT || 3000
const SECRET = process.env.INTMAX402_SECRET || 'demo-secret-do-not-use-in-production'

// ── Security headers (XSS, HSTS, content-type sniffing, etc.) ────────────────
app.use(helmet())

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

// ── Reject oversized headers (> 8 KB) ────────────────────────────────────────
app.use((req, res, next) => {
  const headerSize = Object.entries(req.headers)
    .reduce((sum, [k, v]) => sum + k.length + (Array.isArray(v) ? v.join('').length : v.length), 0)
  if (headerSize > 8192) {
    return res.status(431).json({ error: 'Request Header Fields Too Large' })
  }
  next()
})

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 60,               // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 req/min per IP on /api/*
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests, please slow down.' },
})

app.use(globalLimiter)
app.use('/api', apiLimiter)

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'intmax402 Live Demo',
    description: 'HTTP 402 payment & identity protocol for AI agents — powered by INTMAX ZK L2',
    github: 'https://github.com/zaq2989/intmax402',
    npm: 'https://www.npmjs.com/package/@tanakayuto/intmax402-express',
    tryItNow: [
      '# Install CLI',
      'npm install -g @tanakayuto/intmax402-cli',
      '',
      '# Generate a test wallet',
      'intmax402 keygen',
      '',
      '# Test this demo (replace with your key)',
      `intmax402 test ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'https://intmax402-demo.up.railway.app'}/api/identity`,
    ].join('\n'),
    endpoints: {
      '/api/free': 'No auth required',
      '/api/identity': 'Requires INTMAX402 identity proof (wallet ownership)',
    },
  })
})

app.get('/api/free', (req, res) => {
  res.json({
    message: '🆓 Free endpoint — no auth needed!',
    timestamp: new Date().toISOString(),
    hint: 'Try /api/identity to see intmax402 in action',
  })
})

app.get('/api/identity',
  intmax402({ mode: 'identity', secret: SECRET }),
  (req, res) => {
    res.json({
      message: '✅ Identity verified!',
      address: req.intmax402?.address,
      timestamp: new Date().toISOString(),
      note: 'Your wallet ownership was proven cryptographically in ~10ms',
    })
  }
)

app.listen(PORT, () => {
  console.log(`intmax402 demo server running on port ${PORT}`)
})
