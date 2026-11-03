/**
 * Reflected XSS — Vulnerable Target Bank (Node.js + Express)
 * Listens on 0.0.0.0:5000 (accessible on localhost and across local network)
 */
const path = require('path');
const express = require('express');
const { getExploitUrl, vectors } = require('../payloads');
const { sessionMiddleware } = require('./lib/session');
const { getLanIp } = require('./lib/network');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dynamic session middleware (generates unique cryptographic token, httpOnly: false)
app.use(sessionMiddleware({ httpOnly: false }));

// Route modules
app.use('/', require('./routes/vulnerable/auth'));
app.use('/', require('./routes/vulnerable/search'));
app.use('/', require('./routes/vulnerable/settings'));
app.use('/', require('./routes/vulnerable/log'));

// Home dashboard
app.get('/', (req, res) => {
  const { layout } = require('./lib/layout');
  const session = req.session || { username: 'alice', balance: '$12,450.00', email: 'alice@securebank.local' };
  const token = req.sessionId || '';

  const hostName = (req.headers.host || 'localhost:5000').split(':')[0];
  const targetOrigin = `http://${req.headers.host || 'localhost:5000'}`;
  const c2Url = `http://${hostName}:5002`;

  const exploitPoC = getExploitUrl('poc', targetOrigin, c2Url);
  const exploitA = getExploitUrl('vector_a', targetOrigin, c2Url);
  const exploitB = getExploitUrl('vector_b', targetOrigin, c2Url);
  const exploitC = getExploitUrl('vector_c', targetOrigin, c2Url);

  const body = `
<div class="card" style="border-left: 4px solid var(--danger);">
  <h2>👋 Welcome, ${session.username}</h2>
  <p>You are authenticated into <b>SecureBank Demo</b>. Your active session token is:
    <span class="code-inline" style="font-weight:700;">sessionid=${token}</span>
  </p>
  <div style="display:flex;gap:1.5rem;margin-top:0.75rem;font-size:0.9rem;">
    <div>Account: <b>ACC-8842-9104</b></div>
    <div>Checking Balance: <b style="color:#0f766e;">${session.balance}</b></div>
    <div>Recovery Email: <b>${session.email}</b></div>
  </div>
  <div class="alert" style="margin-top:1rem;margin-bottom:0;">
    <div>
      <strong>⚠️ Insecure Session Flag:</strong>
      This dynamic session token was issued <b>without the HttpOnly flag</b>.
      Any JavaScript executing in this origin can access it via <span class="code-inline">document.cookie</span>.
    </div>
  </div>
</div>

<div class="grid grid-2">
  <div class="card">
    <h2>🔍 Search Vulnerability</h2>
    <p>The <span class="code-inline">/search?q=</span> endpoint reflects query input directly into the HTML response without contextual sanitization.</p>
    <a href="/search?q=Statement" class="btn btn-primary" style="margin-top:0.5rem;">Open Search Page</a>
  </div>

  <div class="card">
    <h2>⚙️ Sensitive Action (Settings)</h2>
    <p>Profile settings endpoint. An attacker using reflected XSS can silently execute actions under your active session.</p>
    <a href="/settings" class="btn btn-primary" style="margin-top:0.5rem;">View Settings</a>
  </div>
</div>

<div class="card">
  <h2>🎯 Weaponized Attack Vectors (Live Lab)</h2>
  <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1rem;">
    Demonstrate how Reflected XSS enables browser alerts, session theft, phishing, and unauthorized account modifications:
  </p>

  <!-- Vector 0 -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
      <strong style="color:#0284c7;">Vector 0 — Classic JavaScript Alert Box (PoC)</strong>
      <span class="badge-vuln" style="padding:0.2rem 0.5rem;font-size:0.7rem;border-radius:4px;background:#f0f9ff;color:#0284c7;border-color:#bae6fd;">Arbitrary JS</span>
    </div>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;">
      Fires a classic JavaScript <span class="code-inline">alert()</span> popup to prove arbitrary script execution inside the victim's origin.
    </p>
    <div class="payload-box" title="Click to copy">${escapeHtmlText(vectors.poc.payload)}</div>
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
      <a href="${exploitPoC}" class="btn btn-danger" style="font-size:0.8rem;padding:0.4rem 0.8rem;background:#0284c7;border-color:#0284c7;">
        ⚡ Trigger Alert PoC Now
      </a>
    </div>
  </div>

  <!-- Vector A -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
      <strong style="color:#b91c1c;">Vector A — Session Cookie Theft (Exfiltration)</strong>
      <span class="badge-vuln" style="padding:0.2rem 0.5rem;font-size:0.7rem;border-radius:4px;">No HttpOnly</span>
    </div>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;">
      Dynamically reads <span class="code-inline">document.cookie</span> and exfiltrates the live token to the Attacker C2 Listener.
    </p>
    <div class="payload-box" title="Click to copy">${escapeHtmlText(vectors.vector_a.payload)}</div>
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
      <a href="${exploitA}" class="btn btn-danger" style="font-size:0.8rem;padding:0.4rem 0.8rem;">
        ⚡ Trigger Vector A Now
      </a>
    </div>
  </div>

  <!-- Vector B -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
      <strong style="color:#7c3aed;">Vector B — In-Context Phishing Overlay</strong>
      <span class="badge-vuln" style="padding:0.2rem 0.5rem;font-size:0.7rem;border-radius:4px;background:#f5f3ff;color:#7c3aed;border-color:#ddd6fe;">Origin Trust Abuse</span>
    </div>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;">
      Injects a full-screen "Session Expired" re-login modal to harvest victim credentials.
    </p>
    <div class="payload-box" title="Click to copy">${escapeHtmlText(vectors.vector_b.payload)}</div>
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
      <a href="${exploitB}" class="btn btn-danger" style="font-size:0.8rem;padding:0.4rem 0.8rem;background:#7c3aed;border-color:#7c3aed;">
        ⚡ Trigger Phishing Modal Now
      </a>
    </div>
  </div>

  <!-- Vector C -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1rem;margin-bottom:0;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
      <strong style="color:#b45309;">Vector C — Unauthorized Action (Account Takeover)</strong>
      <span class="badge-vuln" style="padding:0.2rem 0.5rem;font-size:0.7rem;border-radius:4px;background:#fffbeb;color:#b45309;border-color:#fde68a;">Silent CSRF</span>
    </div>
    <p style="font-size:0.85rem;color:var(--muted);margin-bottom:0.5rem;">
      Silently posts to <span class="code-inline">/settings</span> using the victim's session to alter the recovery email.
    </p>
    <div class="payload-box" title="Click to copy">${escapeHtmlText(vectors.vector_c.payload)}</div>
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
      <a href="${exploitC}" class="btn btn-danger" style="font-size:0.8rem;padding:0.4rem 0.8rem;background:#b45309;border-color:#b45309;">
        ⚡ Trigger Silent Action Now
      </a>
    </div>
  </div>
</div>`;

  res.send(layout('Dashboard', body, { theme: 'vulnerable', session: req.session, sessionId: req.sessionId }));
});

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`[VULNERABLE TARGET] Running at:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${lanIp}:${PORT}`);
});

module.exports = app;
