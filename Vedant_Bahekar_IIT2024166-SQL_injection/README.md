# SQL Injection — Variant 1: Authentication Bypass

**Course:** Cyber Security (IT-30001), Autumn 2026 — IIIT Allahabad
**Assignment:** Web Server Security — Exploitation and Mitigation
**Category:** SQL injection · **Variant:** Authentication bypass

A small Flask + SQLite login app that demonstrates a SQL-injection
**authentication bypass**, and the same payload being **blocked** after the fix.
The login form runs in two switchable modes — **VULNERABLE** (string-concatenated
SQL) and **SECURE** (parameterised query) — so the exact same payload can be
shown succeeding and then failing, as required by Table 2(d).

> ⚠️ **Authorised testing only.** This app is deliberately vulnerable. Run it
> locally on your own machine. Do not deploy it on a public or shared server.

---

## Run it

```bash
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000/>. The database (`users.db`) is created and seeded
automatically on first run. To reset it, delete `users.db` and restart.

**Seeded accounts** (the attacker does NOT know these):

| Username | Password          | Role          |
|----------|-------------------|---------------|
| admin    | `S3cureAdminP@ss` | administrator |
| alice    | `alicepw`         | user          |
| bob      | `bobpw`           | user          |

---

## Table 2 — What the variant includes

### (a) Vulnerable implementation
File `app.py`, in the `login()` route, VULNERABLE branch. User input is
concatenated directly into the SQL text:

```python
query = (
    "SELECT * FROM users WHERE username = '"
    + username
    + "' AND password = '"
    + password
    + "'"
)
row = db.execute(query).fetchone()
```

### (b) Working exploit
In **VULNERABLE** mode, submit either payload:

**Payload A — comment out the password check:**
```
Username: admin' --
Password: (anything)
```
The query becomes:
```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '...'
```
Everything after `--` is a SQL comment, so the password check is removed. You are
logged in as **admin** without knowing the password.

**Payload B — always-true condition:**
```
Username: ' OR '1'='1
Password: ' OR '1'='1
```
The query becomes:
```sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '' OR '1'='1'
```
`'1'='1'` is always true, so the first row (admin) is returned and you are logged in.

The page prints the exact SQL it ran and the dashboard shows a
"AUTHENTICATION BYPASSED" banner — good evidence for the video.

### (c) Root cause
Untrusted user input is concatenated into the SQL string, so the input can change
the **structure** of the query (add a comment or an always-true `OR`) instead of
being treated purely as data. The database cannot tell the injected SQL apart from
the developer's intended query.

### (d) Mitigation implemented — parameterised query
Click **"Switch to SECURE mode"** and re-run the same payloads — login fails with
*"Invalid username or password."* The SECURE branch uses bound parameters:

```python
query = "SELECT * FROM users WHERE username = ? AND password = ?"
row = db.execute(query, (username, password)).fetchone()
```

The `?` placeholders send the input to the database as **data**, never as SQL text,
so `admin' --` is looked up as a literal username and simply does not exist.
Capture a screenshot of the blocked attempt in SECURE mode for the report.

### (e) Other mitigations (theory)
Beyond parameterised queries, the SQL-injection defences from the lecture slides are:

- **Input validation with allow-lists** — accept only inputs that match an expected
  pattern (e.g. a username of letters/digits only), rejecting metacharacters like
  `'`, `--`, `;` before the value ever reaches the query. It works by shrinking the
  input space so injection strings never pass.
- **Least-privilege database accounts** — the app connects with an account that has
  only the rights it needs (e.g. `SELECT` on `users`, no `DROP`/admin). It does not
  stop injection but limits the damage an injection can do.
- **Safe error handling** — return generic error messages and log details server-side,
  so the database never leaks table/column names or SQL fragments that help an
  attacker craft payloads (blind-SQLi and UNION attacks rely on such feedback).

Parameterised queries are the primary, most reliable fix; the others are
defence-in-depth layered on top.

---

## Table 3 — Ownership declaration

| Member name | Roll number | Category      | Variant implemented   |
|-------------|-------------|---------------|-----------------------|
| _TODO_      | _TODO_      | SQL injection | Authentication bypass |

> Fill in your name and roll number. If this repo covers the whole group's four
> variants, add the other members' rows here too.

---

## Project layout
```
sqli-auth-bypass/
├── app.py                  # Flask app; vulnerable + secure login branches
├── requirements.txt
├── templates/
│   ├── login.html          # login form + mode toggle + live SQL display
│   └── dashboard.html      # protected area; flags a bypass
└── users.db                # auto-created SQLite DB (git-ignored)
```
