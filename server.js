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
const ETH_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY
const INTMAX_ENV = process.env.INTMAX_ENV || 'testnet'

// ── Trust Railway reverse proxy ───────────────────────────────────────────────
app.set('trust proxy', 1)

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
  const acceptsHtml = req.headers.accept?.includes('text/html')

  if (acceptsHtml) {
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN
      : 'https://intmax402-demo-production.up.railway.app'

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>intmax402 — HTTP 402 payment &amp; identity protocol for AI agents</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    a { color: #3fb950; text-decoration: none; }
    a:hover { text-decoration: underline; }

    .container {
      max-width: 780px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* ── Header ── */
    header {
      padding: 4rem 0 2.5rem;
      text-align: center;
    }

    header h1 {
      font-size: 2.8rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #e6edf3;
      margin-bottom: 0.6rem;
    }

    header h1 span {
      color: #3fb950;
    }

    header p.tagline {
      font-size: 1.1rem;
      color: #8b949e;
      max-width: 480px;
      margin: 0 auto 2rem;
    }

    .badge-row {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 1.1rem;
      border: 1px solid #30363d;
      border-radius: 6px;
      background: #161b22;
      color: #e6edf3;
      font-size: 0.9rem;
      font-weight: 500;
      transition: border-color 0.15s, background 0.15s;
      text-decoration: none;
    }

    .btn:hover {
      border-color: #3fb950;
      background: #1a2330;
      text-decoration: none;
    }

    /* ── Section ── */
    section {
      margin-bottom: 2.5rem;
    }

    section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #8b949e;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #21262d;
    }

    /* ── Card ── */
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
    }

    /* ── Steps ── */
    .steps { display: flex; flex-direction: column; gap: 1rem; }

    .step-label {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #3fb950;
      margin-bottom: 0.35rem;
    }

    pre {
      background: #1f2428;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.85rem;
      line-height: 1.55;
      color: #e6edf3;
    }

    pre .comment { color: #8b949e; }
    pre .cmd     { color: #79c0ff; }
    pre .url     { color: #3fb950; }

    /* ── Endpoints ── */
    .endpoint-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .endpoint {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .endpoint code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.88rem;
      background: #1f2428;
      border: 1px solid #30363d;
      border-radius: 4px;
      padding: 0.15rem 0.55rem;
      white-space: nowrap;
      color: #79c0ff;
      flex-shrink: 0;
    }

    .endpoint .method {
      font-size: 0.7rem;
      font-weight: 700;
      color: #3fb950;
      background: rgba(63,185,80,0.12);
      border: 1px solid rgba(63,185,80,0.3);
      border-radius: 4px;
      padding: 0.15rem 0.45rem;
      letter-spacing: 0.04em;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .endpoint .desc {
      font-size: 0.9rem;
      color: #8b949e;
      padding-top: 1px;
    }

    .endpoint .auth-badge {
      display: inline-block;
      font-size: 0.7rem;
      background: rgba(210,153,34,0.12);
      border: 1px solid rgba(210,153,34,0.35);
      color: #d2993a;
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
      margin-left: 0.4rem;
      vertical-align: middle;
      font-weight: 600;
    }

    /* ── Main content area grows to push footer down ── */
    main { flex: 1; padding-bottom: 2rem; }

    /* ── Footer ── */
    footer {
      text-align: center;
      padding: 1.5rem 0 2rem;
      font-size: 0.82rem;
      color: #484f58;
      border-top: 1px solid #21262d;
    }

    footer a { color: #484f58; }
    footer a:hover { color: #3fb950; }
  </style>
</head>
<body>

<main>
  <div class="container">

    <!-- Header -->
    <header>
      <h1><span>intmax</span>402</h1>
      <p class="tagline">HTTP 402 payment &amp; identity protocol for AI agents</p>
      <div class="badge-row">
        <a class="btn" href="https://github.com/zaq2989/intmax402" target="_blank" rel="noopener">
          <!-- GitHub icon -->
          <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15
              -.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
              -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0
              .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82
              2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65
              3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013
              0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </a>
        <a class="btn" href="https://www.npmjs.com/package/@tanakayuto/intmax402-express" target="_blank" rel="noopener">
          <!-- npm icon -->
          <svg height="16" width="16" viewBox="0 0 18 7" fill="currentColor" aria-hidden="true">
            <path d="M0 0h18v6H9V7H5V6H0zm1 5h2V2h1v3h1V1H1zm5-4v5h2V5h2V1zm2 1h1v2h-1zm3-1v4h2V2h1v3h1V2h1v3h1V1z"/>
          </svg>
          npm
        </a>
      </div>
    </header>

    <!-- Try it now -->
    <section>
      <h2>Try it now</h2>
      <div class="card steps">

        <div>
          <div class="step-label">Step 1 — Install the CLI</div>
          <pre><span class="comment"># Install the CLI</span>
<span class="cmd">npm install -g @tanakayuto/intmax402-cli</span></pre>
        </div>

        <div>
          <div class="step-label">Step 2 — Generate a test wallet</div>
          <pre><span class="comment"># Generate a test wallet</span>
<span class="cmd">intmax402 keygen</span></pre>
        </div>

        <div>
          <div class="step-label">Step 3 — Prove your wallet in ~10ms</div>
          <pre><span class="comment"># Prove your wallet in ~10ms</span>
<span class="cmd">intmax402 test <span class="url">${baseUrl}/api/identity</span></span></pre>
        </div>

      </div>
    </section>

    <!-- Live endpoints -->
    <section>
      <h2>Live endpoints</h2>
      <div class="card">
        <div class="endpoint-list">

          <div class="endpoint">
            <span class="method">GET</span>
            <code>/api/free</code>
            <span class="desc">No auth required</span>
          </div>

          <div class="endpoint">
            <span class="method">GET</span>
            <code>/api/identity</code>
            <span class="desc">Requires wallet proof <span class="auth-badge">401 challenge</span></span>
          </div>

          <div class="endpoint">
            <span class="method">GET</span>
            <code>/api/paid</code>
            <span class="desc">Requires INTMAX L2 payment <span class="auth-badge">402 challenge</span></span>
          </div>

        </div>
      </div>
    </section>

  </div>
</main>

<footer>
  <div class="container">
    Powered by <a href="https://intmax.io" target="_blank" rel="noopener">INTMAX ZK L2</a> &nbsp;·&nbsp; MIT License
  </div>
</footer>

</body>
</html>`)
  } else {
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
        '/api/paid': 'Requires INTMAX L2 payment (testnet, 1000 units)',
      },
    })
  }
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

// ── Payment mode (testnet) ────────────────────────────────────────────────────
if (ETH_PRIVATE_KEY) {
  app.get('/api/paid',
    intmax402({
      mode: 'payment',
      secret: SECRET,
      amount: '1000',
      environment: INTMAX_ENV,
      ethPrivateKey: ETH_PRIVATE_KEY,
    }),
    (req, res) => {
      res.json({
        message: '✅ Payment verified!',
        paidBy: req.intmax402?.address,
        txHash: req.intmax402?.txHash,
        timestamp: new Date().toISOString(),
        note: 'Your INTMAX L2 payment was verified on-chain',
      })
    }
  )
  console.log('Payment mode enabled (environment: ' + INTMAX_ENV + ')')
} else {
  app.get('/api/paid', (_req, res) => {
    res.status(503).json({
      error: 'Payment mode not configured',
      hint: 'SERVER_PRIVATE_KEY environment variable is required',
    })
  })
}

app.listen(PORT, () => {
  console.log(`intmax402 demo server running on port ${PORT}`)
})
