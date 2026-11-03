# Web Server Security: Exploitation & Mitigation
### Course: Cyber Security (IT-30001) | Autumn Semester 2026
**Department of Information Technology, Indian Institute of Information Technology Allahabad (IIIT-A)**  
**Instructor:** Dr. Soumyadev Maity  

---

## Table 3: Ownership Declaration

| Member Name | Roll Number | Category | Variant Implemented |
| :--- | :--- | :--- | :--- |
| **Shreyans Jain** | **IIT2024211** | **OS Command Injection** | **Variant 1: In-Band (Command Output Returned)** |
| *[Member 2]* | *[Roll 2]* | *SQL Injection* | *[Variant Chosen]* |
| *[Member 3]* | *[Roll 3]* | *Cross-Site Scripting (XSS)* | *[Variant Chosen]* |
| *[Member 4]* | *[Roll 4]* | *CSRF* | *[Variant Chosen]* |

---

## Project Overview

This repository demonstrates the vulnerability lifecycle for **OS Command Injection (Variant 1: In-Band)**:
1. **Implementation** of a realistic network diagnostic utility containing an in-band command injection vulnerability.
2. **Exploitation** using an arbitrary command injection payload with full output returned directly in the HTTP response.
3. **Mitigation** implementing defense-in-depth with parameterized execution and allow-list input validation, proving that the identical payload is blocked.
4. **Documentation & Theory** analyzing the root cause and summarizing all mitigation alternatives covered in the lecture slides.

---

## Quick Start & Setup

### Prerequisites
- Python 3.10+ installed
- `pip` package manager

### 1. Installation
Clone the repository and install the minimal dependencies:
```bash
git clone <your-repo-link>
cd CS_lab_assignment_last
pip install -r requirements.txt
```

### 2. Run the Application
Start the Flask web server:
```bash
python app.py
```
Access the interactive web console at:  
👉 **`http://127.0.0.1:5000/`**

### 3. Automated Verification & Evidence Capture
With the server running in one terminal, run the automated verification script in another terminal:
```bash
python verify_exploit.py
```
This script will test both endpoints and save proof to the `evidence/` folder.

---

## Table 2 Deliverable Analysis

### (a) Vulnerable Implementation (Code Path)
* **File:** `app.py`
* **Route:** `/api/ping/vulnerable` (HTTP POST)
* **Code Path:**
```python
# app.py (Lines 57-79)
@app.route("/api/ping/vulnerable", methods=["POST"])
def ping_vulnerable():
    data = request.get_json(silent=True) or request.form
    target = data.get("target", "").strip()

    # VULNERABLE FLAW: Raw string formatting with shell=True
    raw_command = f"ping {PING_COUNT_FLAG} 1 {target}"
    
    # Executing via system shell allows shell metacharacters (&, &&, |, ;)
    output = subprocess.check_output(
        raw_command,
        shell=True,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=10
    )
    return jsonify({"status": "success", "mode": "vulnerable", "output": output})
```

---

### (b) Working Exploit
* **Target Input / Payload:**
  * **Windows:** `127.0.0.1 & whoami`
  * **Linux / macOS:** `127.0.0.1 ; whoami` or `127.0.0.1 && id`
* **HTTP Request:**
```http
POST /api/ping/vulnerable HTTP/1.1
Host: 127.0.0.1:5000
Content-Type: application/json

{
  "target": "127.0.0.1 & whoami"
}
```
* **Observed In-Band Response (Evidence):**
```text
Pinging 127.0.0.1 with 32 bytes of data:
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128

Ping statistics for 127.0.0.1:
    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),
desktop-shreyans\user
```
* **Why this is Variant 1 (In-Band):**
The standard output of the injected command (`whoami`) is captured by `subprocess.check_output` and directly returned in the JSON/HTML response to the user. No side channels or timing delays are needed.

---

### (c) Root Cause
> **Root Cause:**  
> The application concatenates unsanitized user input directly into a system command string and invokes an operating system shell interpreter (`shell=True`). The shell interprets metacharacters (such as `&`, `|`, `;`) as command delimiters rather than literal text, executing arbitrary secondary commands with the privileges of the web application.

---

### (d) Mitigation Implemented
* **File:** `app.py`
* **Route:** `/api/ping/mitigated` (HTTP POST)
* **Defense Strategy:**
  1. **Parameterized Execution (Avoid the Shell):**  
     Uses `subprocess.run(["ping", PING_COUNT_FLAG, "1", target], shell=False)`. Passing an argument vector list directly to the operating system bypasses the shell interpreter (`cmd.exe` or `sh`), treating all characters as literal data.
  2. **Allow-List Input Validation:**  
     Validates the target against strict IPv4/IPv6 format (`ipaddress` module) or RFC-1123 hostname regular expressions.
* **Mitigated Code:**
```python
# app.py (Lines 118-142)
@app.route("/api/ping/mitigated", methods=["POST"])
def ping_mitigated():
    data = request.get_json(silent=True) or request.form
    target = data.get("target", "").strip()

    # 1. Allow-List Validation
    if not is_valid_target(target):
        return jsonify({
            "status": "blocked",
            "error": "Mitigation blocked input: Target does not match strict IP/hostname allow-list."
        }), 400

    # 2. Parameterized argument vector without shell
    command_vector = ["ping", PING_COUNT_FLAG, "1", target]
    result = subprocess.run(command_vector, shell=False, capture_output=True, text=True)
    return jsonify({"status": "success", "output": result.stdout})
```
* **Proof of Neutralization (Blocked Attempt):**  
When the exact same payload (`127.0.0.1 & whoami`) is sent to the secured endpoint:
```json
{
  "status": "blocked",
  "mode": "mitigated",
  "target": "127.0.0.1 & whoami",
  "command_executed": null,
  "output": null,
  "error": "Mitigation blocked input: Target does not match strict IP/hostname allow-list. Shell metacharacters are rejected."
}
```

---

### (e) Other Mitigations (Theory from Lecture Slides)

As discussed in the lecture materials, robust defense against OS command injection relies on multiple complementary layers:

1. **Avoid the Shell:**  
   Most command injections occur because an intermediary shell (`sh`, `bash`, `cmd.exe`) is invoked to parse a command string. Avoiding shell invocations by using native programming language runtime APIs (e.g., Python standard library network calls, sockets, or direct process execution) eliminates shell syntax evaluation entirely.

2. **Parameterised Execution with an Argument Vector:**  
   When external system binaries must be invoked, arguments should always be passed as an array or vector of discrete strings (e.g., `["ping", "-n", "1", host]`) with `shell=False`. The operating system kernel treats each vector entry strictly as literal data for that argument, preventing metacharacters like `;`, `&`, `|`, and `$` from altering command structure.

3. **Allow-List Validation:**  
   Input validation must follow a strict positive allow-list specification rather than a denylist. Validating expected formats (e.g., regex `^[a-zA-Z0-9.-]+$` or standard IP parsers) ensures that inputs containing whitespace, redirection operators, or control characters are rejected before any execution path is reached.

4. **Principle of Least Privilege:**  
   The web server process should execute under an isolated, unprivileged operating system user account (e.g., `nobody` or a dedicated low-privilege service account). It should have restricted filesystem permissions, no access to administrative tools, and no write permissions to web roots, bounding the damage if an injection vulnerability is ever discovered.

---

## Repository Structure
```
├── app.py                     # Main Flask web application (vulnerable & mitigated endpoints)
├── requirements.txt           # Python package dependencies
├── verify_exploit.py          # Automated exploit & mitigation proof generator
├── evidence/                  # Captured test evidence and outputs
│   ├── exploit_evidence.txt   # In-band command output captured
│   ├── mitigation_evidence.txt# Blocked payload evidence
│   └── summary_report.md      # Markdown report of verification
├── templates/
│   └── index.html             # Diagnostic tool web interface
├── static/
│   ├── css/style.css          # Styling for interface and terminal console
│   └── js/main.js             # Interactive client-side logic
└── README.md                  # Complete assignment documentation
```

