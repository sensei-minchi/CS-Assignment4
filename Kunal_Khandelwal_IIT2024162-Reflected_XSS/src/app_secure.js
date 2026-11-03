/**
 * Reflected XSS — Patched Target Bank (Node.js + Express)
 * Listens on 0.0.0.0:5001 (accessible on localhost and across local network)
 */
const path = require('path');
const express = require('express');
const { getExploitUrl } = require('../payloads');
const { sessionMiddleware } = require('./lib/session');
const { getLanIp } = require('./lib/network');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dynamic session middleware (generates unique cryptographic token, httpOnly: true)
app.use(sessionMiddleware({ httpOnly: true, sameSite: 'Lax' }));

// Route modules
app.use('/', require('./routes/secure/auth'));
app.use('/', require('./routes/secure/search'));
app.use('/', require('./routes/secure/settings'));
app.use('/', require('./routes/secure/log'));

// Home dashboard
app.get('/', (req, res) => {
  const { layout } = require('./lib/layout');
  const { setSecureHeaders } = require('./lib/headers');
  setSecureHeaders(res);

  const session = req.session || { username: 'alice', balance: '$12,450.00', email: 'alice@securebank.local' };
  const token = req.sessionId || '';

  const hostName = (req.headers.host || 'localhost:5001').split(':')[0];
  const targetOrigin = `http://${req.headers.host || 'localhost:5001'}`;
  const c2Url = `http://${hostName}:5002`;

  const exploitPoC = getExploitUrl('poc', targetOrigin, c2Url);
  const exploitA = getExploitUrl('vector_a', targetOrigin, c2Url);
  const exploitB = getExploitUrl('vector_b', targetOrigin, c2Url);
  const exploitC = getExploitUrl('vector_c', targetOrigin, c2Url);

  const body = `
<div class="card" style="border-left: 4px solid var(--danger);">
  <h2>👋 Welcome, ${session.username} (Secured Environment)</h2>
  <p>You are authenticated into the <b>Hardened Target Application</b>. Active session token:
    <span class="code-inline" style="font-weight:700;">sessionid=${token}</span>
  </p>
  <div style="display:flex;gap:1.5rem;margin-top:0.75rem;font-size:0.9rem;">
    <div>Account: <b>ACC-8842-9104</b></div>
    <div>Checking Balance: <b style="color:#0f766e;">${session.balance}</b></div>
    <div>Recovery Email: <b>${session.email}</b></div>
  </div>
  <div class="alert" style="margin-top:1rem;margin-bottom:0;">
    <div>
      <strong>🔒 Defenses Active:</strong>
      This dynamic token is protected with <span class="code-inline">HttpOnly</span> and <span class="code-inline">SameSite=Lax</span>.
      Client-side JavaScript cannot access it via <span class="code-inline">document.cookie</span>.
    </div>
  </div>
</div>

<div class="grid grid-2">
  <div class="card">
    <h2>🔍 Hardened Search</h2>
    <p>User input is contextually HTML-entity encoded before reflection. Injected tags become inert text.</p>
    <a href="/search?q=Statement" class="btn btn-primary" style="margin-top:0.5rem;">Open Search Page</a>
  </div>

  <div class="card">
    <h2>🛡️ Content Security Policy</h2>
    <p>A strict CSP header blocks unauthorized inline script execution and restricts outbound connections.</p>
    <a href="/log/view" class="btn btn-outline" style="margin-top:0.5rem;">View Defensive Log</a>
  </div>
</div>

<div class="card">
  <h2>🧪 Attack Verification &amp; Defense Comparison</h2>
  <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1rem;">
    Launch the exact same attack vectors against this patched target to verify mitigations:
  </p>

  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;">
    <a href="${exploitA}" class="btn btn-primary">
      🛡️ Test Vector A (Blocked by Encoding &amp; HttpOnly)
    </a>
    <a href="${exploitB}" class="btn btn-primary">
      🛡️ Test Vector B (Blocked by HTML Encoding)
    </a>
    <a href="${exploitC}" class="btn btn-primary">
      🛡️ Test Vector C (Blocked by CSP &amp; Encoding)
    </a>
  </div>
</div>`;

  res.send(layout('Dashboard', body, { theme: 'secure', session: req.session, sessionId: req.sessionId }));
});

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`[PATCHED SECURE TARGET] Running at:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${lanIp}:${PORT}`);
});

module.exports = app;
