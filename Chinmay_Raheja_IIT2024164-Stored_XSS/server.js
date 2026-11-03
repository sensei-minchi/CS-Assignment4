/**
 * Stored XSS Demo — "Campus Comment Wall"
 * IT-30001 Cyber Security Assignment
 *
 * Run with: npm install && npm start
 * Visit:    http://localhost:3000
 *
 * Toggle between VULNERABLE and SECURE rendering using the links in the
 * navbar (adds ?mode=vulnerable or ?mode=secure and stores it in a cookie).
 *
 * ---------------------------------------------------------------------
 * WARNING: The "vulnerable" mode in this app is intentionally insecure.
 * Run it only on localhost, only against your own instance, and only for
 * the purposes of this coursework demonstration.
 * ---------------------------------------------------------------------
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// --- "Database" -----------------------------------------------------
// In-memory store is enough for a demo; swap for SQLite/Mongo if you like.
let comments = [
  { id: 1, name: "TA-Bot", text: "Welcome to the Campus Comment Wall! Try posting something." },
];
let nextId = 2;

function resetComments() {
  comments = [
    { id: 1, name: "TA-Bot", text: "Welcome to the Campus Comment Wall! Try posting something." },
  ];
  nextId = 2;
}

// --- Fake session / login --------------------------------------------
// Gives every visitor a "session" cookie so the cookie-theft demo has
// something real to steal. In vulnerable mode the cookie is NOT HttpOnly,
// so document.cookie can read it from injected JS. In secure mode it is
// HttpOnly, which is one of the "other mitigations" you can mention.
app.use((req, res, next) => {
  const mode = req.query.mode || req.cookies.mode || "secure";
  res.cookie("mode", mode, { httpOnly: false }); // just to remember UI toggle

  if (!req.cookies.session) {
    const fakeToken = "demo-session-" + Math.random().toString(36).slice(2, 12);
    res.cookie("session", fakeToken, {
      httpOnly: mode !== "vulnerable", // VULNERABLE: readable by JS. SECURE: HttpOnly.
    });
  }
  req.appMode = mode;
  next();
});

// --- Routes ------------------------------------------------------------

app.get("/", (req, res) => {
  res.render("wall", {
    comments,
    mode: req.appMode,
    session: req.cookies.session,
  });
});

app.post("/comment", (req, res) => {
  const { name, text } = req.body;
  if (name && text) {
    comments.push({ id: nextId++, name: name.slice(0, 50), text });
  }
  // preserve current mode when redirecting
  res.redirect("/?mode=" + encodeURIComponent(req.appMode));
});

app.post("/reset", (req, res) => {
  resetComments();
  res.redirect("/?mode=" + encodeURIComponent(req.appMode));
});

app.listen(PORT, () => {
  console.log(`Stored XSS demo running at http://localhost:${PORT}`);
  console.log(`Toggle modes with ?mode=vulnerable or ?mode=secure`);
});
