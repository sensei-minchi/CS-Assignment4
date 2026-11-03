/**
 * Secure search route.
 * Applies contextual HTML encoding and CSP to neutralize Reflected XSS.
 */
const express = require('express');
const router = express.Router();
const { escapeHtml } = require('../../lib/escape');
const { setSecureHeaders } = require('../../lib/headers');
const { layout } = require('../../lib/layout');
const { vectors, getExploitUrl } = require('../../../payloads');

router.get('/search', (req, res) => {
  setSecureHeaders(res);
  const rawQ = req.query.q || '';
  const safeQ = escapeHtml(rawQ); // DEFENSE: contextual HTML entity encoding

  const results = rawQ
    ? `<div class="search-result-box" style="padding:1rem;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;">
         <p style="margin-bottom:0.5rem;font-size:0.9rem;color:#065f46;">Search query safely rendered as text:</p>
         <div style="font-size:1.05rem;">Showing results for: <b>${safeQ}</b></div>
       </div>`
    : `<p style="color:var(--muted);">Enter a search query to search banking records.</p>`;

  const hostName = (req.headers.host || 'localhost:5001').split(':')[0];
  const targetOrigin = `http://${req.headers.host || 'localhost:5001'}`;
  const c2Url = `http://${hostName}:5002`;

  const exploitPoC = getExploitUrl('poc', targetOrigin, c2Url);
  const exploitA = getExploitUrl('vector_a', targetOrigin, c2Url);
  const exploitB = getExploitUrl('vector_b', targetOrigin, c2Url);
  const exploitC = getExploitUrl('vector_c', targetOrigin, c2Url);

  const body = `
<div class="card">
  <h2>🔍 Bank Account Search (Hardened)</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    This query parameter <span class="code-inline">?q=</span> is encoded via <span class="code-inline">escapeHtml()</span> before reflection.
  </p>
  <form action="/search" method="GET">
    <div class="form-group">
      <label for="q">Search Term</label>
      <input id="q" name="q" type="text" value="${safeQ}" placeholder="e.g. Payroll, Tax, or paste XSS payload..." autocomplete="off">
    </div>
    <div style="display:flex;gap:0.5rem;">
      <button type="submit" class="btn btn-primary">Search</button>
      <a href="/search?q=Statement" class="btn btn-outline">Sample Query</a>
      <a href="/" class="btn btn-outline">Back to Home</a>
    </div>
  </form>
</div>

<div class="card">
  <h2>Search Results</h2>
  ${results}
</div>

<div class="card">
  <h2>🛡️ Defense Verification</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.75rem;">
    Inject the same attack vectors into this hardened endpoint. Watch them render as harmless text:
  </p>
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
    <a href="${exploitA}" class="btn btn-primary" style="font-size:0.8rem;">
      Test Vector A (Encoding Neutralizes &lt;script&gt;)
    </a>
    <a href="${exploitB}" class="btn btn-primary" style="font-size:0.8rem;">
      Test Vector B (Encoding Neutralizes Modal HTML)
    </a>
    <a href="${exploitC}" class="btn btn-primary" style="font-size:0.8rem;">
      Test Vector C (Encoding Blocks Silent POST)
    </a>
  </div>
</div>`;

  res.send(layout('Search Results', body, { theme: 'secure' }));
});

module.exports = router;
