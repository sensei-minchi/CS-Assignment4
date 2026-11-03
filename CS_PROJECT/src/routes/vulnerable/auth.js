/**
 * Vulnerable Authentication Routes
 * Implements real dynamic session token generation (No hardcoded values)
 */
const express = require('express');
const router = express.Router();
const { createSession, destroySession, getSessionIdFromReq } = require('../../lib/session');
const { layout } = require('../../lib/layout');

router.get('/login', (req, res) => {
  const body = `
<div class="card" style="max-width:480px;margin:2rem auto;">
  <h2>🔐 Sign In to SecureBank</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    Authentication sets a real dynamic session cookie. In this vulnerable target, the cookie is issued <b>without HttpOnly</b>.
  </p>
  <form method="POST" action="/login">
    <div class="form-group">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" value="alice" required>
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" value="password123" required>
    </div>
    <div style="margin-top:1rem;">
      <button type="submit" class="btn btn-primary" style="width:100%;">Sign In</button>
    </div>
  </form>
  <div style="margin-top:1rem;background:#f8fafc;padding:0.75rem;border-radius:6px;border:1px solid #e2e8f0;font-size:0.8rem;color:var(--muted);">
    💡 <b>Lab Note:</b> Clicking Sign In generates a fresh cryptographically random session token.
  </div>
</div>`;

  res.send(layout('Sign In', body, { theme: 'vulnerable', showBadge: false }));
});

router.post('/login', (req, res) => {
  const username = req.body.username || 'alice';
  // Create a real dynamic cryptographic session
  const { token } = createSession(username);

  // VULNERABLE: httpOnly is FALSE -> JavaScript can read document.cookie
  res.cookie('sessionid', token, {
    httpOnly: false,
    sameSite: false,
    secure: false,
    path: '/'
  });

  res.redirect(302, '/');
});

router.get('/logout', (req, res) => {
  const token = getSessionIdFromReq(req);
  destroySession(token);
  res.clearCookie('sessionid', { path: '/' });
  res.redirect(302, '/login');
});

module.exports = router;
