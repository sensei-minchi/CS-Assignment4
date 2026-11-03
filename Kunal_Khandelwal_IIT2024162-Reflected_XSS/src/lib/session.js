/**
 * Dynamic Session Management Module (No Hardcoded Tokens)
 *
 * Implements cryptographically secure session identifier generation
 * using Node.js crypto.randomBytes(16).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {}

// In-memory active sessions table: token -> sessionData
const activeSessions = new Map();

function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          activeSessions.set(k, v);
        }
      }
    }
  } catch (err) {}
}

function persistSessions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj = Object.fromEntries(activeSessions);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {}
}

// Initial load
loadSessionsFromDisk();

/**
 * Generate a fresh cryptographically secure random session token.
 * Example: '80816cac5407b4e668ceb8eab3188ff2'
 */
function generateSessionToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a new authenticated session for a user.
 */
function createSession(username = 'alice', customData = {}) {
  const token = generateSessionToken();
  const sessionData = {
    username,
    role: 'customer',
    accountNumber: 'ACC-8842-9104',
    balance: '$12,450.00',
    email: customData.email || `${username}@securebank.local`,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    ...customData
  };

  activeSessions.set(token, sessionData);
  persistSessions();
  return { token, session: sessionData };
}

/**
 * Retrieve session by token.
 */
function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  let session = activeSessions.get(token);
  if (!session) {
    loadSessionsFromDisk();
    session = activeSessions.get(token);
  }
  if (session) {
    session.lastActivity = new Date().toISOString();
    return session;
  }
  return null;
}

/**
 * Update an existing session's data (e.g. email change via /settings).
 */
function updateSession(token, updates = {}) {
  if (!token) return null;
  if (!activeSessions.has(token)) {
    loadSessionsFromDisk();
  }
  if (!activeSessions.has(token)) return null;
  const session = activeSessions.get(token);
  Object.assign(session, updates, { lastActivity: new Date().toISOString() });
  persistSessions();
  return session;
}

/**
 * Destroy a session on logout.
 */
function destroySession(token) {
  if (token) {
    activeSessions.delete(token);
    persistSessions();
  }
}

/**
 * Extract 'sessionid' value from the HTTP Request Cookie header.
 */
function getSessionIdFromReq(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)sessionid=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Express middleware to attach active session to req.session.
 * If no session exists, provides a helper to create one.
 */
function sessionMiddleware(opts = {}) {
  return (req, res, next) => {
    let token = getSessionIdFromReq(req);
    let session = getSession(token);

    // If autoCreate is true and no session exists, create a fresh unique session
    if (!session && opts.autoCreate !== false) {
      const created = createSession('alice');
      session = created.session;
      token = created.token;
    }
    req.sessionId = token;
    req.session = session;

    // Enforce configured cookie flags (httpOnly, sameSite) on EVERY response!
    // If opts.httpOnly is true (port 5001), setting this header instructs the browser
    // to apply the HttpOnly flag to 'sessionid', instantly making document.cookie empty in the browser!
    if (token) {
      res.cookie('sessionid', token, {
        httpOnly: Boolean(opts.httpOnly),
        sameSite: opts.sameSite !== undefined ? opts.sameSite : (opts.httpOnly ? 'Lax' : false),
        secure: false, // set true in HTTPS production
        path: '/'
      });
    }

    next();
  };
}

module.exports = {
  generateSessionToken,
  createSession,
  getSession,
  updateSession,
  destroySession,
  getSessionIdFromReq,
  sessionMiddleware,
  activeSessions
};
