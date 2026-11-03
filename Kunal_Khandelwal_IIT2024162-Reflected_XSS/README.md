# Reflected XSS Lab & Attacker C2 Operations — Node.js + Express

Academic cybersecurity demonstration project showcasing weaponized Reflected XSS attack vectors, a dedicated Attacker Command & Control (C2) console, and multi-layered defense-in-depth controls.

> ⚠️ **Educational Lab Only:** All servers bind strictly to `127.0.0.1`. Never expose the vulnerable server externally.

---

## 🏛️ Architecture Overview

The lab contains three independent applications:

1. **Vulnerable Target Bank (`http://127.0.0.1:5000`)**:
   - Insecure search parameter reflecting raw user input.
   - Session cookie issued without `HttpOnly` or `SameSite`.
   - Lacks Content Security Policy (CSP).

2. **Patched Target Bank (`http://127.0.0.1:5001`)**:
   - Contextual HTML entity output encoding via `escapeHtml()`.
   - `HttpOnly` and `SameSite=Lax` cookie flags.
   - Strict Content Security Policy (`script-src 'self'`, `connect-src 'self'`).

3. **Attacker C2 Command Console (`http://127.0.0.1:5002`)**:
   - Real-time exfiltration listener and Server-Sent Events (SSE) live feed.
   - Weaponized exploit launchpad for 1-click attack simulation.
   - Stolen session replayer & victim impersonation demonstrator.

---

## 📂 Folder Structure

```
CS_PROJECT/
├── package.json               # Dependencies & npm scripts
├── start_all.sh               # 1-click startup script for all 3 servers
├── stop_all.sh                # 1-click clean shutdown script
├── README.md                  # Project overview
├── RUN_INSTRUCTIONS.md        # Technical execution instructions
├── DEMO_GUIDE.md              # Complete presentation script & evaluators guide
├── data/
│   └── exfiltration_log.json  # Persistent evidence store (JSON backup)
├── payloads/
│   ├── index.js               # Central payloads registry & URL generator
│   ├── vector_a_session_hijacking.js     # Cookie stealer & C2 exfiltrator
│   ├── vector_b_phishing_overlay.js      # In-context phishing modal
│   └── vector_c_unauthorized_action.js   # Silent background state changer (CSRF)
└── src/
    ├── server_runner.js       # Master concurrent multi-server orchestrator
    ├── app_vulnerable.js      # Vulnerable Bank Target (Port 5000)
    ├── app_secure.js          # Patched Bank Target (Port 5001)
    ├── app_attacker.js        # Attacker C2 Dashboard & Listener (Port 5002)
    ├── lib/
    │   ├── escape.js          # Contextual HTML output encoding
    │   ├── headers.js         # CSP & HTTP security headers
    │   ├── layout.js          # Shared layout wrapper with session status bar
    │   └── store.js           # Real-time SSE evidence store & parser
    ├── routes/
    │   ├── vulnerable/        # Vulnerable target routes (auth, search, settings, log)
    │   └── secure/            # Hardened target routes (auth, search, settings, log)
    └── public/
        ├── css/style.css
        └── js/app.js
```

---

## ⚡ Quick Start

```bash
cd /home/kunal/Downloads/CS_PROJECT
./start_all.sh
```

*(Or run `npm start`)*

Open your browser in split-screen mode:
- **Left:** [http://127.0.0.1:5000](http://127.0.0.1:5000) *(Victim Target)*
- **Right:** [http://127.0.0.1:5002](http://127.0.0.1:5002) *(Attacker C2 Console)*

To stop all servers:
```bash
./stop_all.sh
```

---

## 🎯 Impact Vectors Demonstrated

| Vector | Payload File | Attack Mechanism & Impact |
| :--- | :--- | :--- |
| **A — Session Hijacking** | `payloads/vector_a_session_hijacking.js` | Steals `document.cookie` (no `HttpOnly`), transmits to C2 listener, enables 1-click victim impersonation. |
| **B — In-Context Phishing** | `payloads/vector_b_phishing_overlay.js` | Injects an authentic "Session Expired" re-login modal inside the bank origin; harvests credentials live. |
| **C — Unauthorized Action** | `payloads/vector_c_unauthorized_action.js` | Silently POSTs to `/settings` using the victim's session to alter the account recovery email address (Account Takeover). |

---

## 📖 Demonstration Walkthrough & Script

For an in-depth, step-by-step presentation script, evaluator Q&A, and technical breakdown, read **[DEMO_GUIDE.md](file:///home/kunal/Downloads/CS_PROJECT/DEMO_GUIDE.md)**.
