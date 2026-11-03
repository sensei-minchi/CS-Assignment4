/**
 * Client-side script for SecureBank Demo.
 */
function copyPayload(el) {
  const text = el.textContent || el.innerText;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      const original = el.style.background;
      el.style.background = '#d1fae5';
      showToast('📋 Payload copied to clipboard!');
      setTimeout(() => { el.style.background = original; }, 800);
    }).catch(() => {
      fallbackCopy(text, el);
    });
  } else {
    fallbackCopy(text, el);
  }
}

function fallbackCopy(text, el) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-999999px';
  textarea.style.top = '-999999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    if (el) {
      const original = el.style.background;
      el.style.background = '#d1fae5';
      setTimeout(() => { el.style.background = original; }, 800);
    }
    showToast('📋 Payload copied to clipboard!');
  } catch (err) {}
  document.body.removeChild(textarea);
}

function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '20px';
    toast.style.background = '#0f172a';
    toast.style.color = '#fff';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.zIndex = '999999';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function initPayloadBoxes() {
  document.querySelectorAll('.payload-box').forEach(box => {
    if (!box.dataset.hasCopyListener) {
      box.dataset.hasCopyListener = 'true';
      box.title = 'Click to copy';
      box.addEventListener('click', () => copyPayload(box));
    }
  });
}

// On hardened/secure target (:5001), ensure client-accessible cookies are cleaned up so document.cookie is empty as expected
function enforceSecureCookieState() {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('theme-secure')) {
    if (document.cookie) {
      document.cookie.split(';').forEach(c => {
        const name = c.split('=')[0].trim();
        if (name) {
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
        }
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enforceSecureCookieState();
    initPayloadBoxes();
  });
} else {
  enforceSecureCookieState();
  initPayloadBoxes();
}
