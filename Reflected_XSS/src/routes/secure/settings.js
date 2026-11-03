/**
 * Secure settings route.
 * Mock state-changing endpoint with encoded output and CSP headers.
 */
const express = require('express');
const router = express.Router();
const { escapeHtml } = require('../../lib/escape');
const { setSecureHeaders } = require('../../lib/headers');
const { layout } = require('../../lib/layout');

router.get('/settings', (req, res) => {
  setSecureHeaders(res);
  const body = `
<div class="card">
  <h2>Account Settings</h2>
  <p>Update your email address. This endpoint requires the session cookie.</p>
  <form method="POST" action="/settings">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" value="victim@example.com" required>
    <button type="submit" class="btn">Update Email</button>
  </form>
</div>`;
  res.send(layout('Settings', body, { theme: 'secure' }));
});

router.post('/settings', (req, res) => {
  setSecureHeaders(res);
  const newEmail = escapeHtml(req.body.email || '(none)');
  const body = `
<div class="card">
  <h2>Settings Updated</h2>
  <p>Email changed to <b>${newEmail}</b> (MOCK).</p>
  <p>This change was made under the authenticated session.</p>
  <a href="/settings" class="btn btn-outline">Edit again</a>
  <a href="/" class="btn" style="margin-left:0.5rem">Home</a>
</div>`;
  res.send(layout('Settings Updated', body, { theme: 'secure' }));
});

module.exports = router;
