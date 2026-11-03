"""
SQL Injection - Variant 1: Authentication Bypass
Cyber Security (IT-30001) - Web Server Security Assignment

This app demonstrates ONE variant: SQL injection authentication bypass.

It exposes the SAME login form in two modes so the demo can show the exact
same payload succeeding (VULNERABLE) and then being blocked (SECURE):

    - VULNERABLE mode: user input is concatenated directly into the SQL string.
    - SECURE mode:     the query is parameterised (prepared statement).

Toggle the mode with the switch on the login page. No restart needed.

Run:
    pip install -r requirements.txt
    python app.py
Then open http://127.0.0.1:5000/

AUTHORISED TESTING ONLY: this is a deliberately vulnerable app. Run it locally
on your own machine. Do not deploy it on a public/shared server.
"""

import os
import sqlite3
from flask import Flask, request, render_template, redirect, url_for, session, g

app = Flask(__name__)
app.secret_key = "demo-secret-not-for-production"

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


# --------------------------------------------------------------------------
# Database setup / seeding
# --------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the users table and seed a couple of accounts."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS users")
    cur.execute(
        """
        CREATE TABLE users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role     TEXT NOT NULL
        )
        """
    )
    # Plaintext passwords here only to keep the SQLi demo focused.
    # (Password storage/hashing is a separate topic from this variant.)
    seed = [
        ("admin", "S3cureAdminP@ss", "administrator"),
        ("alice", "alicepw", "user"),
        ("bob", "bobpw", "user"),
    ]
    cur.executemany(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)", seed
    )
    conn.commit()
    conn.close()


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.route("/")
def index():
    if "user" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    # Mode comes from the toggle on the form ("vulnerable" or "secure").
    mode = request.values.get("mode", "vulnerable")
    error = None
    executed_query = None  # shown on the page so the attack is visible

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        db = get_db()

        if mode == "secure":
            # ============================================================
            # (d) MITIGATION IMPLEMENTED: Parameterised query
            # The user input is passed as bound parameters (?), never as
            # part of the SQL text, so it cannot change the query structure.
            # ============================================================
            query = "SELECT * FROM users WHERE username = ? AND password = ?"
            executed_query = f"{query}   -- params: [{username!r}, {password!r}]"
            row = db.execute(query, (username, password)).fetchone()
        else:
            # ============================================================
            # (a) VULNERABLE IMPLEMENTATION  <-- THE FLAW IS HERE
            # User input is concatenated straight into the SQL string.
            # A crafted username/password can rewrite the query's logic.
            # ============================================================
            query = (
                "SELECT * FROM users WHERE username = '"
                + username
                + "' AND password = '"
                + password
                + "'"
            )
            executed_query = query
            try:
                row = db.execute(query).fetchone()
            except sqlite3.Error as e:
                row = None
                error = f"SQL error: {e}"

        if row:
            session["user"] = row["username"]
            session["role"] = row["role"]
            session["bypassed"] = (mode != "secure") and (
                password != dict_password(db, username)
            )
            session["last_query"] = executed_query
            return redirect(url_for("dashboard"))
        elif error is None:
            error = "Invalid username or password."

    return render_template(
        "login.html", mode=mode, error=error, executed_query=executed_query
    )


def dict_password(db, username):
    """Helper: look up the real password (used only to flag a bypass in the UI)."""
    r = db.execute(
        "SELECT password FROM users WHERE username = ?", (username,)
    ).fetchone()
    return r["password"] if r else None


@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template(
        "dashboard.html",
        user=session["user"],
        role=session["role"],
        bypassed=session.get("bypassed", False),
        last_query=session.get("last_query"),
    )


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        init_db()
    # host stays on localhost; debug on so you can see tracebacks during the demo
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)
