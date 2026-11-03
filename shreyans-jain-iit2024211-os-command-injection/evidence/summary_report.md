# Web Server Security Assignment: Evidence Summary

**Course:** Cyber Security (IT-30001) | IIIT Allahabad

**Category:** OS Command Injection

**Variant:** Variant 1: In-Band (Command output returned)

**Date Generated:** 2026-11-03 21:11:29

---

## 1. Vulnerable Implementation & Exploitation (Item a & b)

- **Vulnerable Endpoint:** `/api/ping/vulnerable`
- **Injected Payload:** `127.0.0.1 & whoami`
- **Command Executed on Host:** `ping -n 1 127.0.0.1 & whoami`

### In-Band Output Received by Client:
```text

Pinging 127.0.0.1 with 32 bytes of data:
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128

Ping statistics for 127.0.0.1:
    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms
laptop-1l9sf9qu\shreyans jain

```

---

## 2. Root Cause (Item c)

> **Root Cause:** User input was formatted directly into a system command string and passed to `subprocess.check_output(..., shell=True)`. The operating system shell interpreter parsed the `&` metacharacter as a command delimiter, executing the attacker's arbitrary command (`whoami`) and returning its stdout directly in the HTTP response.

---

## 3. Mitigation Implemented (Item d)

- **Mitigated Endpoint:** `/api/ping/mitigated`
- **Same Payload Attempted:** `127.0.0.1 & whoami`
- **Result Status:** `blocked` (HTTP 400 Bad Request)
- **Blocking Reason:** `Mitigation blocked input: Target does not match strict IP/hostname allow-list. Shell metacharacters are rejected.`

---

## 4. Verdict

The vulnerability was successfully reproduced in-band, and the mitigation completely stops the attack while preserving legitimate network diagnostic functionality.
