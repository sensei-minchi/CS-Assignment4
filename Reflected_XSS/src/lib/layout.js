/**
 * Shared HTML layout wrapper for SecureBank Demo.
 */
function layout(title, body, opts = {}) {
  const theme = opts.theme === 'secure' ? 'secure' : 'vulnerable';
  const isSecure = theme === 'secure';
  const session = opts.session || { username: 'victim', balance: '$12,450.00' };
  const sessionId = opts.sessionId || '';
  const displayToken = sessionId ? `${sessionId.slice(0, 10)}...` : '(no token)';

  const themeColors = isSecure
    ? '--p: #0f766e; --ph: #115e59; --badge-bg: #ecfdf5; --badge-color: #065f46; --badge-border: #86efac; --alert-bg: #ecfdf5; --alert-color: #065f46; --alert-border: #a7f3d0; --danger: #10b981; --muted: #64748b;'
    : '--p: #b91c1c; --ph: #991b1b; --badge-bg: #fef2f2; --badge-color: #991b1b; --badge-border: #fecaca; --alert-bg: #fff7ed; --alert-color: #9a3412; --alert-border: #fdba74; --danger: #dc2626; --muted: #64748b;';

  const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --muted: #64748b;
}

body.theme-secure {
  --p: #0f766e;
  --ph: #115e59;
  --badge-bg: #ecfdf5;
  --badge-color: #065f46;
  --badge-border: #86efac;
  --alert-bg: #ecfdf5;
  --alert-color: #065f46;
  --alert-border: #a7f3d0;
  --danger: #10b981;
  --muted: #64748b;
}

body.theme-vulnerable {
  --p: #b91c1c;
  --ph: #991b1b;
  --badge-bg: #fef2f2;
  --badge-color: #991b1b;
  --badge-border: #fecaca;
  --alert-bg: #fff7ed;
  --alert-color: #9a3412;
  --alert-border: #fdba74;
  --danger: #dc2626;
  --muted: #64748b;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f8fafc;
  color: #0f172a;
  line-height: 1.6;
  min-height: 100vh;
}

/* Header */
.app-header {
  background: linear-gradient(135deg, var(--p, #0f766e) 0%, var(--ph, #115e59) 100%);
  color: #fff;
  padding: 1.25rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon { font-size: 1.75rem; }

.brand h1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0;
}

.brand-sub {
  font-size: 0.8rem;
  opacity: 0.85;
  margin-top: 0.125rem;
}

.app-nav {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.app-nav a {
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.app-nav a:hover {
  background: rgba(255,255,255,0.18);
  color: #fff;
}

.app-nav .c2-nav-link {
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.3);
  font-weight: 700;
}

/* Session Sub-Bar */
.session-bar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.6rem 2rem;
  font-size: 0.85rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.session-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cookie-pill {
  font-family: 'SFMono-Regular', Consolas, monospace;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #0f172a;
}

.cookie-flag-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid;
}

.flag-vuln {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.flag-sec {
  background: #ecfdf5;
  color: #065f46;
  border-color: #86efac;
}

/* Container */
.container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

/* Cards */
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.02);
}

.card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--p, #0f766e);
  background: var(--p, #0f766e);
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn:hover {
  background: var(--ph, #115e59);
  border-color: var(--ph, #115e59);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--p, #0f766e);
  color: #fff;
  border-color: var(--p, #0f766e);
}

.btn-primary:hover {
  background: var(--ph, #115e59);
}

.btn-outline {
  background: transparent;
  color: var(--p, #0f766e);
  border-color: #cbd5e1;
}

.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

body.theme-vulnerable .btn-outline {
  color: var(--p, #b91c1c);
}

body.theme-vulnerable .btn-outline:hover {
  background: #fef2f2;
}

.btn-danger {
  background: var(--danger, #dc2626);
  color: #fff;
  border-color: var(--danger, #dc2626);
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Forms */
.form-group { margin-bottom: 1rem; }

.form-group label, label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.375rem;
}

.form-control, input[type="text"], input[type="password"], input[type="email"] {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #0f172a;
  background: #ffffff;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
}

.form-control:focus, input[type="text"]:focus, input[type="password"]:focus, input[type="email"]:focus {
  outline: none;
  border-color: var(--p);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}

body.theme-vulnerable .form-control:focus,
body.theme-vulnerable input[type="text"]:focus,
body.theme-vulnerable input[type="password"]:focus,
body.theme-vulnerable input[type="email"]:focus {
  border-color: #b91c1c;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.15);
}

/* Code */
.code-inline {
  background: #f1f5f9;
  color: var(--p, #0f766e);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.85em;
  border: 1px solid #e2e8f0;
}

.payload-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.85rem;
  margin: 0.5rem 0;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payload-box:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

body.theme-secure .payload-box:hover {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .grid-2 { grid-template-columns: 1fr 1fr; }
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
}

.badge-vuln {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge-secure {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #86efac;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* Footer */
.app-footer {
  margin-top: 3rem;
  padding: 2rem 0;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.8rem;
  text-align: center;
}
`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — SecureBank Demo</title>
<style>${css}</style>
</head>
<body class="theme-${theme}" style="${themeColors}">

<header class="app-header">
  <div class="header-inner">
    <div class="brand">
      <div class="brand-icon">🏦</div>
      <div>
        <h1>SecureBank Demo</h1>
        <div class="brand-sub">${isSecure ? 'Hardened & Patched Target (:5001)' : 'Intentionally Vulnerable Target (:5000)'}</div>
      </div>
    </div>
    <nav class="app-nav">
      <a href="/">🏠 Home</a>
      <a href="/search">🔍 Search</a>
      <a href="/settings">⚙️ Settings</a>
      <a href="/log/view">📋 Evidence Log</a>
    </nav>
  </div>
</header>

<div class="session-bar">
  <div class="session-bar-inner">
    <div class="session-info">
      <span>👤 User: <b>${session.username}</b></span>
      <span class="cookie-pill" title="Real dynamic cryptographic token: ${sessionId}">sessionid=${displayToken}</span>
      <span class="cookie-flag-badge ${isSecure ? 'flag-sec' : 'flag-vuln'}">
        ${isSecure ? '🛡️ HttpOnly (JS Protected)' : '⚠️ No HttpOnly (JS Readable)'}
      </span>
      <span style="color:#0f766e;font-weight:600;">Balance: ${session.balance}</span>
    </div>
    <div>
      <a href="/login" class="btn btn-outline" style="font-size:0.75rem;padding:0.25rem 0.6rem;">Sign In / Switch</a>
      <a href="/logout" class="btn btn-outline" style="font-size:0.75rem;padding:0.25rem 0.6rem;">Sign Out</a>
    </div>
  </div>
</div>

<div class="container">
${opts.showBadge !== false
  ? `<div class="status-badge ${isSecure ? 'badge-secure' : 'badge-vuln'}">
       <span class="badge-dot"></span>
       ${isSecure ? 'PATCHED &amp; SECURE (DEFENSES ACTIVE)' : 'INTENTIONALLY VULNERABLE TARGET'}
     </div>`
  : ''
}
${body}
<footer class="app-footer">
  <p>Educational Reflected XSS Testbed &bull; Academic Demonstration &bull; Bound to 0.0.0.0</p>
</footer>
</div>
<script src="/js/app.js"></script>
</body>
</html>`;
}

module.exports = { layout };
