/**
 * Contextual HTML output encoding.
 *
 * Neutralizes reflected user input by converting characters that have special
 * meaning in HTML body / text-node context into their entity equivalents.
 *
 * @param {string} unsafe - Raw user-supplied input
 * @returns {string} - HTML-safe string
 */
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { escapeHtml };
