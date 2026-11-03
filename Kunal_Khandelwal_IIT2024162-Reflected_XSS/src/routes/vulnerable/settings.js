/**
 * Vulnerable Settings Route
 * Sensitive state-changing action that operates under the victim's ambient session.
 */
const express = require('express');
const router = express.Router();
const { updateSession } = require('../../lib/session');
const { layout } = require('../../lib/layout');

router.get('/settings', (req, res) => {
  const session = req.session || { username: 'victim', email: 'victim@securebank.local', balance: '$12,450.00' };

  const body = `
<div class="card">
  <h2>Account Profile Settings</h2>
  <p style="color:var(--muted);font-size:0.9rem;margin-bottom:1rem;">
    Manage your authenticated profile. In a banking application, sensitive actions require session authentication.
  </p>
  <form method="POST" action="/settings">
    <div class="form-group">
      <label>Authenticated Username</label>
      <input type="text" value="${session.username}" disabled style="background:#f1f5f9;cursor:not-allowed;">
    </div>
    <div class="form-group">
      <label for="email">Account Recovery Email</label>
      <input id="email" name="email" type="email" value="${session.email}" required>
    </div>
    <button type="submit" class="btn btn-primary">Save Profile Changes</button>
    <a href="/" class="btn btn-outline" style="margin-left:0.5rem">Cancel</a>
  </form>
</div>

<div class="card">
  <h2>⚠️ Security Implication (CSRF via XSS)</h2>
  <p style="font-size:0.85rem;color:var(--muted);">
    This endpoint does not require re-authentication or unpredictable anti-CSRF tokens.
    A script injected via Reflected XSS can issue a background <span class="code-inline">fetch('/settings', { method: 'POST', ... })</span>
    under the victim's session authority to hijack the recovery email address.
  </p>
</div>`;

  res.send(layout('Settings', body, { theme: 'vulnerable', session: req.session, sessionId: req.sessionId }));
});

router.post('/settings', (req, res) => {
  const newEmail = req.body.email || 'victim@securebank.local';

  if (req.sessionId) {
    updateSession(req.sessionId, { email: newEmail });
  }

  if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, email: newEmail });
  }

  const body = `
<div class="card" style="border-left: 4px solid var(--p);">
  <h2>✅ Profile Settings Updated</h2>
  <p>Account recovery email changed to: <b class="code-inline">${newEmail}</b></p>
  <p style="font-size:0.85rem;color:var(--muted);margin-top:0.5rem;">
    This state change was committed dynamically under the active session.
  </p>
  <div style="margin-top:1rem;">
    <a href="/settings" class="btn btn-primary">Edit Settings</a>
    <a href="/" class="btn btn-outline" style="margin-left:0.5rem">Return to Dashboard</a>
  </div>
</div>`;

  res.send(layout('Settings Updated', body, { theme: 'vulnerable', session: req.session, sessionId: req.sessionId }));
});

module.exports = router;
