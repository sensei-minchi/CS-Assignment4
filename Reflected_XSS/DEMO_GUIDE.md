# 🎓 Reflected XSS Lab — Complete Demonstration & Evaluation Guide

This guide is structured specifically for academic cybersecurity assignments and live evaluations. It details the **website flow**, the **two-laptop attack architecture (Laptop 1 Attacker, Laptop 2 Victim)**, and the exact step-by-step narrative to present to your professor or evaluator.

---

## 🏛️ 1. Two-Laptop Attack Architecture

```
                  ┌────────────────────────────────────────┐
                  │          WEB SERVER (PORT 5000)        │
                  │         http://[SERVER-IP]:5000        │
                  │                                        │
                  │  • Banking Application ("SecureBank")  │
                  │  • Issues Dynamic Cryptographic Cookie │
                  │  • Vulnerable Reflected /search Route  │
                  └──────────────────▲─────────────────────┘
                                     │
                 HTTP GET /search?q= │ Reflected HTML
                 with Malicious JS   │ Response with Raw JS
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
┌──────────┴───────────────┐                       ┌───────────▼──────────────┐
│    LAPTOP 2 — VICTIM     │                       │   LAPTOP 1 — ATTACKER    │
│  (Legitimate Bank User)  │                       │   (C2 Operations Console)│
│                          │                       │  http://[ATTACKER-IP]:5002│
│ • Logged in as "victim"  │                       │                          │
│ • Holds dynamic session  │   Phishing / Email    │ • Crafts Malicious URL   │
│   token in browser       │◄──────────────────────┤ • Sends link to victim   │
│ • Clicks malicious link  │       Delivery        │ • Real-time C2 Listener  │
│ • Browser runs JS script │                       │ • Receives exfiltrated   │
│   under Bank Origin!     ├──────────────────────►│   cookies & credentials  │
└──────────────────────────┘   Exfiltration Beacon │ • 1-Click Session Hijack │
                               (:5002/log?data=...)└──────────────────────────┘
```

> **Note on Setup Flexibility:**
> - **2-Laptop Setup:** Run the Web Server and Attacker C2 on Laptop 1 (Attacker), and access it from Laptop 2 (Victim) over the same Wi-Fi / Local Network using the LAN IP (e.g. `192.168.x.x`).
> - **1-Laptop Setup:** Split your screen into two browser windows side-by-side (`http://localhost:5000` on the left, `http://localhost:5002` on the right).

---

## 🗺️ 2. Website Flow — Where to Go & What Each Page Does

Before showing the attack, familiarize yourself with the 4 key pages of the website:

```
[ /login ] ──► [ / (Dashboard) ] ──► [ /search ] ──► [ /settings ]
Sign In          Active Balance       Vulnerability    Sensitive Action
Dynamic Cookie   Profile Details      Unescaped ?q=    Email Modification
```

### 1. `GET /login` — Authentication & Dynamic Cookie Generation
- **What it is:** The SecureBank sign-in page.
- **What it does:** When the victim logs in (username `victim`, password `password123`), the server generates a **fresh 32-character cryptographically random token** using Node.js `crypto.randomBytes(16)`.
- **The Security Flaw:** On the vulnerable server (Port 5000), this cookie is issued **without `HttpOnly`**. Therefore, `document.cookie` is readable by client-side JavaScript.

### 2. `GET /` — Authenticated Home Dashboard
- **What it is:** The victim's banking dashboard.
- **What it does:** Displays account number (`ACC-8842-9104`), checking balance (`$12,450.00`), and recovery email.
- **Top Bar:** Clearly displays the active username, dynamic session token preview, and security status badge (`⚠️ No HttpOnly`).

### 3. `GET /search?q=` — The Reflected XSS Vulnerability
- **What it is:** A transaction/statement search feature.
- **The Security Flaw:** The server takes whatever string is passed in `?q=` and interpolates it directly into the HTML response:
  ```html
  Showing results for: <b>${q}</b>
  ```
- **The Impact:** When raw JavaScript like `<script>...</script>` is passed, the browser renders the HTML and executes the script within the origin of `SecureBank`.

### 4. `POST /settings` — The State-Changing Target (CSRF via XSS)
- **What it is:** Profile management where the customer updates their recovery email.
- **The Security Flaw:** The endpoint accepts state changes using the browser's ambient session credentials without re-authenticating or validating unpredictable anti-CSRF tokens.

---

## 🎬 3. Live Demonstration Script (Step-by-Step Walkthrough)

Follow this exact flow when demonstrating to your professor or examiner:

---

### Step 1: Start the Servers
In your terminal, run:
```bash
cd /home/kunal/Downloads/CS_PROJECT
./start_all.sh
```
The terminal prints the detected LAN IP (e.g., `172.19.18.71` or `192.168.1.x`) and the URLs for Laptop 1 and Laptop 2.

---

### Step 2: Set Up the Victim on Laptop 2
1. On **Laptop 2** (or Left browser window), open the Vulnerable Bank:
   ```
   http://[SERVER-IP]:5000
   ```
2. Point out the top bar:
   - `👤 User: victim`
   - `sessionid = <32-character random hex token>` *(Notice this is a real random cryptographic token, NOT a hardcoded string!)*
   - `⚠️ No HttpOnly (JS Readable)`
   - `Balance: $12,450.00`
3. **What to say to the evaluator:**
   > *"Here on Laptop 2, our victim is logged into their online banking session. Notice that the server generated an authentic cryptographic session token, but critically failed to set the `HttpOnly` cookie flag. This means client-side JavaScript has full access to read this token via `document.cookie`."*

---

### Step 3: Show the Attacker Console on Laptop 1
1. On **Laptop 1** (or Right browser window), open the Attacker C2 Dashboard:
   ```
   http://[ATTACKER-IP]:5002
   ```
2. Point out:
   - Green indicator: `● LIVE LISTENER ACTIVE` on Port 5002.
   - Network Toolbar: Displays the Target Bank IP and Attacker C2 IP.
3. **What to say to the evaluator:**
   > *"On Laptop 1, the attacker is running an automated Command & Control console with an active listener on port 5002, waiting for incoming exfiltrated data."*

---

### Step 4: Demonstrate Vector A — Session Cookie Theft & Account Hijacking
1. On **Laptop 1 (Attacker)**, find **Vector A — Dynamic Session Cookie Theft**.
2. Click **"📋 Copy Malicious Link"** (or click "Launch" if testing on 1 machine).
3. **The Attack Delivery:** Send this link to Laptop 2 (via chat, email, or paste it into Laptop 2's browser).
4. On **Laptop 2 (Victim)**, the victim opens the link:
   - The vulnerable server reflects the script in the response HTML.
   - The victim's browser executes the script in the context of the bank.
   - The script reads the victim's **real dynamic cookie** and transmits it to Laptop 1's listener.
5. Look at **Laptop 1 (Attacker Console)**:
   - An alert pops up instantly: `🚨 EXFILTRATION ARRIVED: SESSION_COOKIE`.
   - A red card appears showing the victim's **real session token**, their username (`victim`), and account balance (`$12,450.00`).
6. Click the action button on Laptop 1:
   👉 **`⚡ Impersonate Victim (Hijack Session on Laptop 1)`**
7. A new browser tab opens on Laptop 1, injecting the stolen cookie.
8. **Result:** The attacker is now logged into the victim's bank account on Laptop 1 without ever knowing their password!

---

### Step 5: Demonstrate Vector B — In-Context Phishing Overlay
1. On **Laptop 1 (Attacker)**, click **"📋 Copy Malicious Link"** under **Vector B**.
2. Deliver the link to **Laptop 2 (Victim)** and open it.
3. In the victim's browser, a modal dialog covers the screen:
   - It looks authentic: `🏦 SecureBank Security Check — ⚠️ Session Expired`.
   - Point to the browser address bar: It **still shows the legitimate bank URL** (`http://[SERVER-IP]:5000/search?q=...`), defeating traditional domain checking!
4. Type demo credentials in the modal (e.g. username `victim`, password `BankMaster2026!`) and click **"Verify & Continue"**.
5. The modal displays `✅ Identity Verified` and dismisses cleanly.
6. Look at **Laptop 1 (Attacker Console)**:
   - A purple card appears instantly:
     - `Username: victim`
     - `Password: BankMaster2026!`
   - Plaintext credentials have been captured live!

---

### Step 6: Demonstrate Vector C — Silent Unauthorized Action (CSRF via XSS)
1. On **Laptop 2 (Victim)**, visit `http://[SERVER-IP]:5000/settings` to show that the current email is `victim@securebank.local`.
2. On **Laptop 1 (Attacker)**, copy the **Vector C** link and deliver it to Laptop 2.
3. On **Laptop 2 (Victim)**, open the link:
   - In the background, the injected script executes a silent `fetch()` POST to `/settings` with `email=attacker-takeover@shadow-c2.com`.
   - The browser automatically attaches the victim's session cookie.
   - A red toast banner appears: `🚨 [XSS Attack Executed] Account recovery email hijacked`.
4. Return to `http://[SERVER-IP]:5000/settings` on Laptop 2 and refresh:
   - The email is now permanently changed to `attacker-takeover@shadow-c2.com`!
5. On Laptop 1, the attacker console displays the `UNAUTHORIZED_ACTION` confirmation beacon.

---

### Step 7: Demonstrate Defensive Hardening on Port 5001
1. On Laptop 1, click **"🛡️ Test Vector A (:5001)"** or visit:
   ```
   http://[SERVER-IP]:5001
   ```
2. Point out the defensive status bar:
   - `🛡️ HttpOnly (JS Protected)`
   - `PATCHED & SECURE (DEFENSES ACTIVE)`
3. Open browser DevTools (`F12`) → **Console tab**:
   - The search results render the payload safely as harmless plain text: `Showing results for: <script>...`.
   - DevTools shows the CSP error: `Refused to execute inline script because it violates Content Security Policy: "script-src 'self'"`.
   - In DevTools Console, type `document.cookie`: It returns `""` because the cookie has `HttpOnly`.
4. Check Laptop 1's Attacker Console:
   - **Zero logs received.** The feed remains completely blank.
5. **Conclude to the evaluator:**
   > *"This proves the necessity of Defense-in-Depth: Contextual HTML entity encoding neutralizes the script tags, HttpOnly protects the session cookie even if script execution occurs, and Content Security Policy restricts unauthorized script sources and exfiltration beacons."*

---

## 💡 4. Evaluator Q&A Preparation

**Q1: How does your implementation avoid hardcoding cookies?**
> *"We built a dynamic session management module using Node.js `crypto.randomBytes(16)`. Every login generates a unique 128-bit cryptographic hexadecimal token stored in the server's session table. When the XSS payload executes, it reads whatever live token currently resides in the victim's browser cookie store and exfiltrates that dynamic value."*

**Q2: Why does the attacker need to send a link to the victim in Reflected XSS?**
> *"Unlike Stored XSS, where the payload resides in the database, Reflected XSS requires the payload to be passed within the victim's request (e.g. in the query string). The server immediately reflects this unescaped payload back into the response HTML. Therefore, social engineering (tricking the victim into clicking the link) is an inherent requirement of Reflected XSS."*

**Q3: Can an attacker execute attacks if `HttpOnly` is enabled?**
> *"Yes. As demonstrated in Vector B (Phishing Overlay) and Vector C (Silent Action Execution), `HttpOnly` only prevents JavaScript from reading `document.cookie`. It does not prevent an attacker from manipulating the DOM to phish credentials or issuing background same-origin requests using the browser's ambient credentials. Full mitigation requires output encoding and CSP."*

**Q4: How did you configure the servers for multi-laptop demonstrations?**
> *"All Express instances bind to `0.0.0.0` rather than `127.0.0.1`. This allows Laptop 2 (Victim) and Laptop 1 (Attacker) to communicate over the local Wi-Fi / LAN using their assigned IP addresses. We also enabled Cross-Origin Resource Sharing (CORS) on the C2 listener so beacon requests are accepted across different network endpoints."*
