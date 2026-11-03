# Cross-Site Request Forgery (CSRF) — Variant 2 Defense Lab

**Academic Assignment: Web Server Security (IT-30001)**  
**Department of Information Technology &bull; Indian Institute of Information Technology Allahabad**  
**Course Instructor:** Dr. Soumyadev Maity  
**Author / Ownership:** **Kunal Kurundwadkar (IIT2024177)**

---

## 1. Table 3: Individual Ownership Declaration

| Member Name | Roll Number | Vulnerability Category | Variant Implemented | Endpoints |
|---|---|---|---|---|
| **Kunal Kurundwadkar** | **IIT2024177** | **Cross-Site Request Forgery (CSRF)** | **Variant 2 — POST-based Forged Action (Auto-submitting form)** | `/vulnerable` &bull; `/secure` &bull; `/attacker` |

---

## 2. Table 2: Evaluation & Viva Defense Checklist

| Requirement | Description & Implementation Details |
|---|---|
| **(a) Vulnerable Implementation** | In `app.py` lines 154–186, the endpoint `/vulnerable/update` processes state-changing HTTP `POST` requests to modify the victim's primary account email address without validating any anti-CSRF token or inspecting request headers. |
| **(b) Working Exploit** | An external attacker webpage (`/attacker`) hosts an invisible HTML `<form>` targeting `http://127.0.0.1:5050/vulnerable/update` with `email=attacker@evil.com`. When the victim views the page, JavaScript automatically executes `document.getElementById('csrfForm').submit()`, hijacking the victim's profile email silently. |
| **(c) Root Cause** | The server processes sensitive state-changing operations relying solely on ambient browser credentials (session cookies) without demanding proof of user intent. Standard browser specifications automatically attach cookies to cross-origin POST requests by default. |
| **(d) Mitigation Implemented** | **Anti-CSRF Synchronizer Token Pattern**: In `app.py` lines 191–270 (`/secure` and `/secure/update`), the server generates a cryptographically random, unpredictable token via `secrets.token_hex(16)` bound to the session. Forms embed this token in a hidden input. Incoming POST requests lacking a matching token are rejected with **403 Forbidden**. |
| **(e) Other Mitigations (Theory)** | **1. SameSite Cookie Attributes** (`SameSite=Strict` or `Lax`) instruct browsers not to send cookies on third-party requests.<br>**2. Re-Authentication for Sensitive Actions** prompts for the user's password or MFA before modifying email or funds.<br>**3. Origin & Referer Header Validation** verifies request headers match the application domain.<br>**4. Idempotent HTTP Methods** ensure state-changing actions cannot be triggered via simple GET requests. |

---

## 3. How to Run the Application

### Prerequisites
- Python 3.8+
- Flask (`pip3 install flask`)

### Quick Start
```bash
# 1. Navigate to the subproject directory
cd Kunal_kurundwadkar_IIT2024177_CSRF_2

# 2. Install dependencies (if needed)
pip3 install -r requirements.txt

# 3. Run the application
python3 app.py
```

### Accessing the Web Application
Open your browser and navigate to:  
👉 **http://127.0.0.1:5050/**

The SQLite database (`csrf_lab.db`) is automatically initialized on the first run with a default victim profile (`alex_morgan`, email: `victim@company.com`).

---

## 4. Application Architecture & Endpoints

| URL Route | Method | Description |
|---|---|---|
| `/` | `GET` | **Master Security Dashboard**: Overview of CSRF mechanics, victim profile status, and live HTTP request inspector. |
| `/vulnerable` | `GET` | **Vulnerable Profile Portal**: User account management lacking anti-CSRF synchronizer tokens. |
| `/vulnerable/update` | `POST` | Vulnerable handler: processes email changes relying solely on ambient session cookies. |
| `/secure` | `GET` | **Secured Profile Portal**: Generates session-bound unpredictable CSRF synchronizer token. |
| `/secure/update` | `POST` | Secured handler: validates incoming token; rejects forged requests with **403 Forbidden**. |
| `/attacker` | `GET` | **Attacker Phishing Simulation**: Hosts the auto-submitting hidden POST form. |
| `/reset` | `POST` | Restores victim email to `victim@company.com` and clears request logs. |

---

## 5. Live Demonstration Guide for Viva & Video

1. **Verify Baseline State:** Open `http://127.0.0.1:5050/vulnerable` and note the primary email is `victim@company.com`.
2. **Execute Exploit:** In a separate tab, open `http://127.0.0.1:5050/attacker`. The attacker script auto-submits the hidden form after 1.2s.
3. **Verify Attack:** Return to `/vulnerable` and refresh. The account email is now hijacked to `attacker@evil.com`.
4. **Demonstrate Mitigation:** Navigate to `http://127.0.0.1:5050/secure`. Click **"Simulate Forged Cross-Site Request"**.
5. **Verify Defense:** The server immediately returns **403 Forbidden — CSRF token invalid or missing**. The attack is successfully blocked!

---

*Authored by Kunal Kurundwadkar (IIT2024177) &bull; IIIT Allahabad*

