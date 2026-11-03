# Reflected XSS Lab & Attacker C2 Operations — Run Instructions

## 📁 Project Architecture

```
CS_PROJECT/
├── package.json               # npm scripts (start, start:vulnerable, start:secure, start:attacker, stop)
├── start_all.sh               # 1-click startup script for all 3 servers
├── stop_all.sh                # 1-click clean shutdown script
├── README.md                  # Project overview
├── RUN_INSTRUCTIONS.md        # Technical execution instructions
├── DEMO_GUIDE.md              # Live demonstration script & presentation guide
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

## 🚀 Quick Start (All Servers at Once)

Run the automated startup script:

```bash
cd /home/kunal/Downloads/CS_PROJECT
./start_all.sh
```

*(Alternatively: `npm start`)*

This starts three independent local servers simultaneously:

| Service | Port | Local URL | Role |
| :--- | :--- | :--- | :--- |
| **Vulnerable Bank Target** | `5000` | [http://127.0.0.1:5000](http://127.0.0.1:5000) | SecureBank with reflected XSS and insecure cookies |
| **Patched Bank Target** | `5001` | [http://127.0.0.1:5001](http://127.0.0.1:5001) | Hardened target with HTML encoding, HttpOnly, and strict CSP |
| **Attacker C2 Command Center** | `5002` | [http://127.0.0.1:5002](http://127.0.0.1:5002) | Real-time C2 listener, exploit launchpad, and session hijacker |

---

## 🛑 How to Stop All Servers

Press `Ctrl + C` in the terminal, or run:

```bash
./stop_all.sh
```

---

## 🎯 Individual Server Startup (Optional)

If you prefer running servers in separate terminal tabs:

- **Terminal 1 (Vulnerable Bank):**
  ```bash
  npm run start:vulnerable
  ```
- **Terminal 2 (Patched Bank):**
  ```bash
  npm run start:secure
  ```
- **Terminal 3 (Attacker C2):**
  ```bash
  npm run start:attacker
  ```

---

## 🧪 Testing the Attack Vectors

### Vector A: Session Cookie Hijacking
1. Open the **Attacker C2 Dashboard** at `http://127.0.0.1:5002`.
2. Click **"🎯 Launch (Port 5000)"** under Vector A.
3. The victim browser visits the reflected search link, executes `document.cookie`, and exfiltrates `sessionid=mock-session-12345` to `:5002/log`.
4. In the Attacker C2 Dashboard, observe the stolen cookie card appear in real time.
5. Click **"⚡ Impersonate Victim (Hijack Session)"** to access the bank as the victim!

### Vector B: In-Context Phishing Overlay
1. From the Attacker C2 Dashboard, click **"🎯 Launch Modal (Port 5000)"** under Vector B.
2. An authentic SecureBank "Session Expired" re-login modal covers the page.
3. Type credentials and submit.
4. The credentials appear live on the Attacker C2 Dashboard!

### Vector C: Silent Unauthorized Action
1. From the Attacker C2 Dashboard, click **"🎯 Launch Silent POST (Port 5000)"** under Vector C.
2. A background request silently updates the victim's email to `attacker-takeover@shadow-c2.com`.
3. Check `http://127.0.0.1:5000/settings` to verify the modified email.

---

## 🛡️ Testing the Patched Bank (:5001)

Click the **"🛡️ Test Defense (:5001)"** buttons on the Attacker C2 Dashboard:
- Injected `<script>` tags are encoded as harmless text (`&lt;script&gt;`).
- Browser DevTools Console shows CSP blocking unauthorized inline script execution.
- `document.cookie` returns empty string due to `HttpOnly`.
- Attacker C2 console receives **zero logs**.

---

## 📖 Presentation Guide

For a complete step-by-step presentation script, evaluator Q&A, and split-screen walkthrough, refer to [DEMO_GUIDE.md](file:///home/kunal/Downloads/CS_PROJECT/DEMO_GUIDE.md).
