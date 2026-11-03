# Video Demonstration Script — CSRF Variant 2

**Student:** Kunal Kurundwadkar &bull; **Roll Number:** IIT2024177  
**Course:** IT-30001: Cyber Security &bull; Autumn Semester 2026 &bull; IIIT Allahabad  
**Topic:** Cross-Site Request Forgery (CSRF) &bull; Variant 2: POST-based Forged Action (Auto-submitting Form)  
**Target Duration:** 2 to 3 Minutes  

---

## Visual Cues & Spoken Script Table

| Time | Visual Cue / What Screen to Show | What to Say (Word-for-Word Script) | Table 2 Item |
|---|---|---|---|
| **0:00 – 0:20** | Browser at `http://127.0.0.1:5050/`. Show the Dashboard, highlighting your name badge in the top ribbon and the hero card. | *"Hello everyone. I am **Kunal Kurundwadkar**, Roll Number **IIT2024177**, from IIIT Allahabad. Today I am demonstrating **Cross-Site Request Forgery (CSRF) — Variant 2: POST-based Forged Action using an Auto-Submitting Form**, along with its cryptographic defense using the Synchronizer Token Pattern."* | **Introduction** |
| **0:20 – 0:45** | Switch to VS Code, open `app.py`. Highlight lines **154 to 186** in function `profile_vuln_update`. | *"Looking at `app.py` lines 154 to 186, our sensitive profile update endpoint `/vulnerable/update` accepts state-changing HTTP POST requests to alter the victim's primary email address. Notice that it does not verify any anti-CSRF synchronizer token, origin header, or user re-authentication. It updates the database relying solely on ambient credentials."* | **(a) Vulnerable Implementation** |
| **0:45 – 1:30** | Switch browser to `http://127.0.0.1:5050/vulnerable`. Show current email `victim@company.com`. In a new tab, open `http://127.0.0.1:5050/attacker`. Show the phishing card and spinner. Return to `/vulnerable` and refresh. | *"On the vulnerable profile management portal at `/vulnerable`, notice the victim's current authenticated email is `victim@company.com`.*<br><br>*Now, simulating a real-world phishing attack, the victim visits an external attacker website at `/attacker`. This page hosts an invisible HTML `<form>` targeting our endpoint, pre-populated with `attacker@evil.com`, which automatically submits using JavaScript upon page load.*<br><br>*When I return to the profile page and refresh, our email has been silently hijacked to `attacker@evil.com` without any user interaction or confirmation!"* | **(b) Working Exploit** |
| **1:30 – 1:50** | Point cursor to the **Table 2(c) Root Cause** card on the right-hand column of `/vulnerable`. | *"The **root cause** is that web browsers automatically attach stored session cookies to cross-origin requests by default. Because the server processes sensitive state-changing operations without demanding proof of user intent (such as an unpredictable CSRF token), it cannot distinguish a legitimate user action from an attacker's forged form."* | **(c) Root Cause** |
| **1:50 – 2:30** | Switch to VS Code at `app.py`, highlight line **199** (`secrets.token_hex(16)`) and lines **214–270** (`profile_secure_update`). Switch browser to `http://127.0.0.1:5050/secure`. Show the active token box. Click **"Simulate Forged Cross-Site Request"**. Show the green **403 Forbidden** banner. | *"To mitigate this vulnerability, we implemented the **Synchronizer Token Pattern** in `app.py`.*<br><br>*At line 199, the server generates a cryptographically random, unpredictable token using `secrets.token_hex(16)` stored in the user's session and embedded as a hidden field in the form. At line 214, the server strictly validates this token.*<br><br>*On our secured portal at `/secure`, when an external attacker submits a forged request lacking this secret token, the server immediately rejects it with **403 Forbidden**. Due to the Same-Origin Policy, the attacker's site cannot read the victim's session token."* | **(d) Mitigation Implemented** |
| **2:30 – 3:00** | Click to expand the **"Table 2(e) Other Mitigations (Theory)"** accordion at bottom-right of `/secure`. | *"Regarding lecture theory alternatives: First, **SameSite Cookie Attributes** (`SameSite=Strict` or `Lax`), which instruct browsers never to attach cookies to cross-site requests. Second, **Re-authentication for sensitive actions**, requiring password confirmation or MFA before email updates. Third, **Validating Origin and Referer HTTP headers**. And fourth, **Avoiding state-changing GET requests** to adhere strictly to idempotent HTTP semantics. Thank you!"* | **(e) Other Mitigations (Theory)** |

---

## Viva Checklist for Kunal Kurundwadkar

- **Vulnerability:** Cross-Site Request Forgery (CSRF) &bull; Variant 2: POST-based Forged Action
- **Exploit Payload:** Auto-submitting hidden `<form action="/vulnerable/update" method="POST">`
- **Mitigation Implemented:** Cryptographic Synchronizer Token Pattern (`secrets.token_hex(16)`) + token rotation
- **Primary Alternative Defenses:** `SameSite=Strict` cookies, Re-authentication / MFA for sensitive actions, Origin/Referer header verification

