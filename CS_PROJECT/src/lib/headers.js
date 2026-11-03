/**
 * Security headers and Content Security Policy configuration.
 */

// Strict CSP: same-origin scripts and assets, no inline execution for untrusted scripts, no external exfiltration
const CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +                      // blocks injected inline <script>
  "style-src 'self' 'unsafe-inline'; " +       // allows application stylesheets and theme custom properties
  "connect-src 'self'; " +                     // blocks fetch/XHR to attacker-controlled origins
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

/**
 * Apply defensive HTTP headers to a response.
 * @param {import('express').Response} res
 */
function setSecureHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

module.exports = { CSP, setSecureHeaders };
