# Web Server Security: Exploitation and Mitigation
### Cyber Security (IT-30001) | Autumn Semester 2026
**Department of Information Technology, Indian Institute of Information Technology Allahabad (IIIT-A)**  
**Instructor:** Dr. Soumyadev Maity

---
## Group Ownership Declaration (Table 3)

| Member Name | Roll Number | Category | Variant Implemented | Subproject Directory |
| :--- | :--- | :--- | :--- | :--- |
| **Shreyans Jain** | **IIT2024211** | **OS Command Injection** | **Variant 1: In-Band (Command Output Returned)** | [`shreyans-jain-iit2024211-os-command-injection/`](./shreyans-jain-iit2024211-os-command-injection/) |
| **Sensei Minchi** | **IIT2024164** | **Cross-Site Scripting (XSS)** | **Variant 1: Stored XSS** | [`stored-xss-demo/`](./stored-xss-demo/) |
| **Kunal Khandelwal** | **IIT2024162** | **Cross-Site Scripting (XSS)** | **Variant 2: Reflected XSS** | [`reflected-xss-demo/`](./Reflected_XSS) |
| **Vedant Bahekar** | **IIT2024166** | **SQL Injection** | **Variant 1: Authentication Bypass** | [`Vedant_Bahekar_IIT2024166-SQL_injection/`](./Vedant_Bahekar_IIT2024166-SQL_injection/) |
| *[Member 4]* | *[Roll Number]* | *Cross-Site Request Forgery (CSRF)* | *[Variant Chosen]* | *TBD* |

---

## Subprojects Overview

### 1. OS Command Injection (Variant 1: In-Band)
- **Author:** Shreyans Jain (IIT2024211)
- **Path:** [`shreyans-jain-iit2024211-os-command-injection/`](./shreyans-jain-iit2024211-os-command-injection/)
- **Technology:** Python, Flask
- **Summary:** Implements a network diagnostic ping utility with both a vulnerable endpoint (`shell=True`) and a secured endpoint (`shell=False` parameterized execution + allow-list validation).
- **Details:** See [OS Command Injection README](./shreyans-jain-iit2024211-os-command-injection/README.md).

### 2. Cross-Site Scripting (Variant 1: Stored XSS)
- **Path:** [`stored-xss-demo/`](./stored-xss-demo/)
- **Technology:** Node.js, Express, EJS
- **Summary:** Campus Comment Wall demonstrating stored script execution and cookie exfiltration vs. safe rendering.
- **Details:** See [Stored XSS README](./stored-xss-demo/README.md).

### 3. SQL Injection (Variant 1: Authentication Bypass)
- **Author:** Vedant Bahekar (IIT2024166)
- **Path:** [`Vedant_Bahekar_IIT2024166-SQL_injection/`](./Vedant_Bahekar_IIT2024166-SQL_injection/)
- **Technology:** Python, Flask, SQLite
- **Summary:** A login portal with a vulnerable (string-concatenated) query path and a secure (parameterized) one. Demonstrates authentication bypass using `admin' --`, then the same payload being blocked after switching to parameterized queries.
- **Details:** See [SQL Injection README](./Vedant_Bahekar_IIT2024166-SQL_injection/README.md).
