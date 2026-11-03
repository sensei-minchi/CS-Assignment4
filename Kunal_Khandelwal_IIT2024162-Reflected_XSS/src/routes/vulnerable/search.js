/**
 * Vulnerable search route.
 * Reflects `q` raw into HTML with NO contextual encoding → Reflected XSS.
 */
const express = require('express');
const router = express.Router();
const { layout } = require('../../lib/layout');
const { getExploitUrl } = require('../../../payloads');

router.get('/search', (req, res) => {
  const q = req.query.q || ''; // raw user input

  // VULNERABILITY: Raw reflection of user input without contextual encoding
  const results = q
    ? `<div class="search-result-box" style="padding:1rem;background:#fff1f2;border:1px solid #fecaca;border-radius:8px;">
         <p style="margin-bottom:0.5rem;font-size:0.9rem;color:#991b1b;">Search query reflected raw into DOM:</p>
         <div style="font-size:1.05rem;">Showing results for: <b>${q}</b></div>
       </div>`
    : `<p style="color:var(--muted);">Enter a search query to search banking records.</p>`;

  const safeInputValue = escapeAttribute(q);

  const hostName = (req.headers.host || 'localhost:5000').split(':')[0];
  const targetOrigin = `http://${req.headers.host || 'localhost:5000'}`;
  const c2Url = `http://${hostName}:5002`;

  const exploitPoC = getExploitUrl('poc', targetOrigin, c2Url);
  const exploitA = getExploitUrl('vector_a', targetOrigin, c2Url);
  const exploitB = getExploitUrl('vector_b', targetOrigin, c2Url);
  const exploitC = getExploitUrl('vector_c', targetOrigin, c2Url);

  const body = `
<div class="card">
  <h2>🔍 Bank Account Search</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    This query parameter <span class="code-inline">?q=</span> is reflected into the page without sanitization.
  </p>
  <form action="/search" method="GET">
    <div class="form-group">
      <label for="q">Search Transactions, Statements, or Payees</label>
      <input id="q" name="q" type="text" value="${safeInputValue}" placeholder="e.g. Payroll, Tax, or paste XSS payload..." autocomplete="off">
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
  <h2>🎯 Quick Injection Presets (Click to Test)</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.75rem;">
    Click any button to inject a weaponized attack vector into this search parameter:
  </p>
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
    <a href="${exploitPoC}" class="btn btn-danger" style="font-size:0.8rem;background:#0284c7;border-color:#0284c7;">
      ⚡ Inject Vector 0 (Alert PoC)
    </a>
    <a href="${exploitA}" class="btn btn-danger" style="font-size:0.8rem;">
      ⚡ Inject Vector A (Cookie Stealer)
    </a>
    <a href="${exploitB}" class="btn btn-danger" style="font-size:0.8rem;background:#7c3aed;border-color:#7c3aed;">
      ⚡ Inject Vector B (Phishing Modal)
    </a>
    <a href="${exploitC}" class="btn btn-danger" style="font-size:0.8rem;background:#b45309;border-color:#b45309;">
      ⚡ Inject Vector C (Silent Email Change)
    </a>
  </div>
</div>`;

  res.send(layout('Search Results', body, { theme: 'vulnerable', session: req.session, sessionId: req.sessionId }));
});

function escapeAttribute(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = router;
