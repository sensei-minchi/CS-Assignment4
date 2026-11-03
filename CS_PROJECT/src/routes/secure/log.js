/**
 * Secure logging endpoints.
 * Demonstrates that in the patched application, exfiltration channels remain blocked.
 */
const express = require('express');
const router = express.Router();
const store = require('../../lib/store');
const { setSecureHeaders } = require('../../lib/headers');
const { layout } = require('../../lib/layout');

router.get('/log', (req, res) => {
  setSecureHeaders(res);
  const data = req.query.data || '';
  if (data) {
    store.push(data, { source: 'Port-5001-Patched' });
  }
  res.status(200).send('Logged');
});

router.get('/log/view', (req, res) => {
  setSecureHeaders(res);

  const body = `
<div class="card">
  <h2>🛡️ Defensive Evidence Verification</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    On the hardened application (Port 5001), defensive controls prevent exfiltrations from executing:
  </p>
  <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:1.25rem;margin-bottom:1rem;">
    <h3 style="color:#065f46;font-size:0.95rem;margin-bottom:0.5rem;">✅ Why No Data is Exfiltrated Here:</h3>
    <ul style="padding-left:1.25rem;font-size:0.85rem;color:#065f46;line-height:1.6;">
      <li><b>Contextual HTML Entity Encoding:</b> Injected &lt;script&gt; tags are transformed into &amp;lt;script&amp;gt; inert text and never executed.</li>
      <li><b>HttpOnly Cookie Flag:</b> Even if arbitrary script executed, <span class="code-inline">document.cookie</span> returns an empty string.</li>
      <li><b>Content Security Policy (CSP):</b> <span class="code-inline">script-src 'self'</span> prevents inline execution, and <span class="code-inline">connect-src 'self'</span> prevents outbound fetch() exfiltration to attacker origins.</li>
    </ul>
  </div>
  <div style="display:flex;gap:0.5rem;">
    <a href="/" class="btn btn-primary">Back to Home</a>
    <a href="http://127.0.0.1:5002" target="_blank" class="btn btn-outline">
      💀 Check Attacker C2 Dashboard
    </a>
  </div>
</div>`;

  res.send(layout('Defensive Evidence', body, { theme: 'secure' }));
});

module.exports = router;
