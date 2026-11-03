/**
 * Vulnerable logging endpoints.
 * /log       — exfiltration receiver (?data=... or POST body)
 * /log/view  — evidence viewer for the lab
 * /log/clear — resets stored logs
 */
const express = require('express');
const router = express.Router();
const store = require('../../lib/store');
const { layout } = require('../../lib/layout');

// Allow cross-origin exfiltration requests
router.use('/log', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

router.all('/log', (req, res) => {
  const data = req.query.data || req.body?.data || (typeof req.body === 'string' ? req.body : '') || '';
  const clientMeta = {
    ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Browser',
    origin: req.headers.origin || req.headers.referer || 'http://127.0.0.1:5000',
    method: req.method,
    source: 'Port-5000-Receiver'
  };

  const record = store.push(data, clientMeta);
  res.status(200).send(`EXFILTRATION_RECEIVED:${record.id}`);
});

router.get('/log/view', (req, res) => {
  const records = store.all();

  const rows = records.length
    ? records.map(r => {
        let badgeColor = '#065f46;background:#ecfdf5;border-color:#86efac;';
        if (r.category === 'SESSION_COOKIE') badgeColor = '#991b1b;background:#fef2f2;border-color:#fecaca;';
        if (r.category === 'CREDENTIALS') badgeColor = '#6b21a8;background:#faf5ff;border-color:#e9d5ff;';
        if (r.category === 'UNAUTHORIZED_ACTION') badgeColor = '#92400e;background:#fffbeb;border-color:#fde68a;';

        let detailsStr = '';
        if (r.details) {
          detailsStr = `<div style="font-size:0.75rem;color:#64748b;margin-top:0.25rem;">Details: <code>${escapeHtml(JSON.stringify(r.details))}</code></div>`;
        }

        return `
<div class="log-row" style="margin-bottom:0.75rem;border-left:4px solid var(--p);">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
    <span style="font-size:0.7rem;font-weight:700;padding:0.15rem 0.4rem;border-radius:4px;border:1px solid;${badgeColor}">
      ${r.category}
    </span>
    <span style="font-size:0.75rem;color:var(--muted);">${r.formattedTime || r.at}</span>
  </div>
  <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(r.summary)}</div>
  <div style="font-size:0.8rem;color:var(--muted);word-break:break-all;margin-top:0.25rem;">
    Raw: <code>${escapeHtml(r.data)}</code>
  </div>
  ${detailsStr}
</div>`;
      }).join('')
    : '<div class="empty">📡 No exfiltrated data captured yet. Trigger Vector A, B, or C to see evidence appear here.</div>';

  const body = `
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
    <h2>📜 Captured Exfiltration Evidence</h2>
    <div style="display:flex;gap:0.5rem;">
      <a href="/log/clear" class="btn btn-outline" style="font-size:0.75rem;padding:0.35rem 0.75rem;">Clear Store</a>
      <a href="http://127.0.0.1:5002" target="_blank" class="btn btn-danger" style="font-size:0.75rem;padding:0.35rem 0.75rem;">
        💀 Open Attacker C2 Dashboard
      </a>
    </div>
  </div>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    Evidence captured from victim browsers via reflected XSS exfiltration beacons:
  </p>
  <div id="evidence-container">
    ${rows}
  </div>
</div>

<div class="card">
  <a href="/" class="btn btn-primary">Back to Home</a>
  <a href="/search" class="btn btn-outline" style="margin-left:0.5rem">Go to Search</a>
</div>

<script>
  // Auto-refresh log view every 2.5 seconds to capture live exfiltrations
  setTimeout(function() {
    window.location.reload();
  }, 2500);
</script>`;

  res.send(layout('Attacker Log', body, { theme: 'vulnerable' }));
});

router.get('/log/clear', (req, res) => {
  store.clear();
  res.redirect(302, '/log/view');
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
