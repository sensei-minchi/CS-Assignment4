# Web Server Security: Exploitation and Mitigation
### Cyber Security (IT-30001) | Autumn Semester 2026
**Department of Information Technology, Indian Institute of Information Technology Allahabad (IIIT-A)**  
**Instructor:** Dr. Soumyadev Maity

---
## Group Ownership Declaration (Table 3)

| Member Name | Roll Number | Category | Variant Implemented | Subproject Directory |
| :--- | :--- | :--- | :--- | :--- |
| **Shreyans Jain** | **IIT2024211** | **OS Command Injection** | **Variant 1: In-Band (Command Output Returned)** | [`Shreyans_Jain_IIT2024211-OS_command_injection/`](./Shreyans_Jain_IIT2024211-OS_command_injection/) |
| **Chinmay Raheja** | **IIT2024164** | **Cross-Site Scripting (XSS)** | **Variant 1: Stored XSS** | [`Chinmay_Raheja_IIT2024164-Stored_XSS/`](./Chinmay_Raheja_IIT2024164-Stored_XSS/) |
| **Kunal Khandelwal** | **IIT2024162** | **Cross-Site Scripting (XSS)** | **Variant 2: Reflected XSS** | [`Kunal_Khandelwal_IIT2024162-Reflected_XSS/`](./Kunal_Khandelwal_IIT2024162-Reflected_XSS/) |
| **Vedant Bahekar** | **IIT2024166** | **SQL Injection** | **Variant 1: Authentication Bypass** | [`Vedant_Bahekar_IIT2024166-SQL_injection/`](./Vedant_Bahekar_IIT2024166-SQL_injection/) |
| **KUNAL V KURUNDWADKAR** | **IIT2024177** | *Cross-Site Request Forgery (CSRF)* | *[Variant Chosen]* | *TBD* |

---

## Subprojects Overview

### 1. OS Command Injection (Variant 1: In-Band)
- **Author:** Shreyans Jain (IIT2024211)
- **Path:** [`Shreyans_Jain_IIT2024211-OS_command_injection/`](./Shreyans_Jain_IIT2024211-OS_command_injection/)
- **Technology:** Python, Flask
- **Summary:** Implements a network diagnostic ping utility with both a vulnerable endpoint (`shell=True`) and a secured endpoint (`shell=False` parameterized execution + allow-list validation).
- **Details:** See [OS Command Injection README](./Shreyans_Jain_IIT2024211-OS_command_injection/README.md).

### 2. Cross-Site Scripting (Variant 1: Stored XSS)
- **Path:** [`Chinmay_Raheja_IIT2024164-Stored_XSS/`](./Chinmay_Raheja_IIT2024164-Stored_XSS/)
- **Technology:** Node.js, Express, EJS
- **Summary:** Campus Comment Wall demonstrating stored script execution and cookie exfiltration vs. safe rendering.
- **Details:** See [Stored XSS README](./Chinmay_Raheja_IIT2024164-Stored_XSS/README.md).

### 3. SQL Injection (Variant 1: Authentication Bypass)
- **Author:** Vedant Bahekar (IIT2024166)
- **Path:** [`Vedant_Bahekar_IIT2024166-SQL_injection/`](./Vedant_Bahekar_IIT2024166-SQL_injection/)
- **Technology:** Python, Flask, SQLite
- **Summary:** A login portal with a vulnerable (string-concatenated) query path and a secure (parameterized) one. Demonstrates authentication bypass using `admin' --`, then the same payload being blocked after switching to parameterized queries.
- **Details:** See [SQL Injection README](./Vedant_Bahekar_IIT2024166-SQL_injection/README.md).
