/**
 * Secure Authentication Routes
 * Implements dynamic session tokens with defensive flags (HttpOnly + SameSite=Lax)
 */
const express = require('express');
const router = express.Router();
const { createSession, destroySession, getSessionIdFromReq } = require('../../lib/session');
const { layout } = require('../../lib/layout');

router.get('/login', (req, res) => {
  const body = `
<div class="card" style="max-width:480px;margin:2rem auto;">
  <h2>🔐 Sign In (Hardened Bank)</h2>
  <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
    Authentication sets a real dynamic session cookie protected with <b>HttpOnly</b> and <b>SameSite=Lax</b>.
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
</div>`;

  res.send(layout('Sign In', body, { theme: 'secure', showBadge: false }));
});

router.post('/login', (req, res) => {
  const username = req.body.username || 'alice';
  const { token } = createSession(username);

  // DEFENSE: httpOnly is TRUE -> JavaScript cannot access document.cookie
  res.cookie('sessionid', token, {
    httpOnly: true,
    sameSite: 'Lax',
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
