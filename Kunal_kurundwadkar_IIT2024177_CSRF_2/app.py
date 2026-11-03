"""
Cross-Site Request Forgery (CSRF) — Variant 2: POST-based Forged Action
Academic Security Lab & Defense Implementation

Course: Cyber Security (IT-30001) | Autumn Semester 2026
Institution: Indian Institute of Information Technology Allahabad (IIIT Allahabad)
Instructor: Dr. Soumyadev Maity

Implemented by:
  Name: Kunal Kurundwadkar
  Roll Number: IIT2024177
  Category: Cross-Site Request Forgery (CSRF)
  Variant: Variant 2 — POST-based Forged Action (Auto-submitting form)

FOR EDUCATIONAL & EVALUATION PURPOSES ONLY — Localhost Sandbox
"""

import os
import sqlite3
import secrets
from datetime import datetime
from flask import (
    Flask, request, render_template, session,
    redirect, url_for, jsonify, make_response
)

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

DB_PATH = os.path.join(os.path.dirname(__file__), 'csrf_lab.db')

# ---------------------------------------------------------------------------
# Database Management
# ---------------------------------------------------------------------------

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            account_type TEXT NOT NULL,
            balance INTEGER NOT NULL,
            last_updated TEXT NOT NULL
        )
    ''')
    # Seed default victim profile if empty
    c.execute("SELECT COUNT(*) FROM user_profile")
    if c.fetchone()[0] == 0:
        c.execute('''
            INSERT INTO user_profile (id, username, email, phone, account_type, balance, last_updated)
            VALUES (1, 'alex_morgan', 'victim@company.com', '+91 98765 43210', 'Primary Corporate', 12500, ?)
        ''', (datetime.now().strftime('%Y-%m-%d %H:%M:%S'),))
    
    # Audit log table to visualize incoming requests and attacks
    c.execute('''
        CREATE TABLE IF NOT EXISTS request_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            origin_header TEXT,
            referer_header TEXT,
            cookies_sent TEXT,
            csrf_token_received TEXT,
            status TEXT NOT NULL,
            payload_data TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_profile():
    conn = get_db()
    row = conn.execute("SELECT * FROM user_profile WHERE id=1").fetchone()
    conn.close()
    return dict(row) if row else None

def update_email(new_email):
    conn = get_db()
    conn.execute(
        "UPDATE user_profile SET email=?, last_updated=? WHERE id=1",
        (new_email, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    conn.commit()
    conn.close()

def log_request(endpoint, method, origin, referer, cookies, token, status, payload):
    conn = get_db()
    conn.execute('''
        INSERT INTO request_logs 
        (timestamp, endpoint, method, origin_header, referer_header, cookies_sent, csrf_token_received, status, payload_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().strftime('%H:%M:%S'),
        endpoint,
        method,
        origin or 'None (Browser Default)',
        referer or 'None',
        'session=PRESENT' if cookies else 'None',
        token or 'None',
        status,
        payload
    ))
    conn.commit()
    conn.close()

# ---------------------------------------------------------------------------
# Session Setup Middleware
# ---------------------------------------------------------------------------

@app.before_request
def setup_session():
    # Simulate an established, authenticated victim session
    if 'authenticated_user' not in session:
        session['authenticated_user'] = 'alex_morgan'
        session['user_id'] = 1

# ---------------------------------------------------------------------------
# Routes: Dashboard & Overview
# ---------------------------------------------------------------------------

@app.route('/')
def dashboard():
    profile = get_profile()
    conn = get_db()
    logs = conn.execute("SELECT * FROM request_logs ORDER BY id DESC LIMIT 6").fetchall()
    conn.close()
    return render_template('dashboard.html', profile=profile, logs=[dict(l) for l in logs])

# ---------------------------------------------------------------------------
# (a) VULNERABLE IMPLEMENTATION: Missing Anti-CSRF Token
# ---------------------------------------------------------------------------

@app.route('/vulnerable', methods=['GET'])
def profile_vuln():
    """
    Renders the vulnerable profile management view.
    Notice: Form contains NO CSRF synchronizer token.
    """
    profile = get_profile()
    updated = session.pop('vuln_updated', False)
    return render_template('vulnerable.html', profile=profile, updated=updated)


@app.route('/vulnerable/update', methods=['POST'])
def profile_vuln_update():
    """
    ❌ TABLE 2(a) VULNERABLE CODE PATH & ROOT CAUSE:
    
    1. Endpoint accepts state-changing POST requests.
    2. Does NOT verify any CSRF token.
    3. The browser automatically attaches session cookies with cross-origin requests.
    4. Server processes request blindly, trusting ambient credentials.
    """
    new_email = request.form.get('email', '').strip()
    origin = request.headers.get('Origin', '')
    referer = request.headers.get('Referer', '')

    if new_email:
        # Perform the state change without proof of intent
        update_email(new_email)
        session['vuln_updated'] = True

        # Log the event for the live inspector
        log_request(
            endpoint='/vulnerable/update',
            method='POST',
            origin=origin,
            referer=referer,
            cookies=request.cookies.get('session'),
            token=None,
            status='200 OK (ATTACK PROCESSED)' if 'attacker' in referer.lower() or 'evil' in new_email else '200 OK (UPDATED)',
            payload=f'email={new_email}'
        )

    return redirect(url_for('profile_vuln'))

# ---------------------------------------------------------------------------
# (d) MITIGATED IMPLEMENTATION: Anti-CSRF Synchronizer Token Pattern
# ---------------------------------------------------------------------------

@app.route('/secure', methods=['GET'])
def profile_secure():
    """
    Renders the secured profile management view.
    Generates an unpredictable, cryptographically random CSRF token tied to session.
    """
    # Generate session-bound anti-CSRF token if not already present
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(16)

    profile = get_profile()
    updated = session.pop('secure_updated', False)
    
    resp = make_response(render_template(
        'secure.html',
        profile=profile,
        csrf_token=session['csrf_token'],
        updated=updated
    ))
    # Additional Defense: SameSite cookie attribute
    return resp


@app.route('/secure/update', methods=['POST'])
def profile_secure_update():
    """
    ✅ TABLE 2(d) SECURED CODE PATH & DEFENSE VERIFICATION:
    
    1. Extracts the hidden 'csrf_token' from the incoming form payload.
    2. Validates it against the secret token stored in the server-side session.
    3. Cross-origin forged requests cannot access the session token (Same-Origin Policy).
    4. Mismatched or absent tokens are rejected with 403 Forbidden.
    """
    submitted_token = request.form.get('csrf_token', '')
    server_token = session.get('csrf_token', '')
    origin = request.headers.get('Origin', '')
    referer = request.headers.get('Referer', '')
    new_email = request.form.get('email', '').strip()

    # Cryptographic Synchronizer Token Verification
    if not submitted_token or submitted_token != server_token:
        # Log the blocked attack attempt
        log_request(
            endpoint='/secure/update',
            method='POST',
            origin=origin,
            referer=referer,
            cookies=request.cookies.get('session'),
            token=submitted_token or 'MISSING',
            status='403 FORBIDDEN (BLOCKED)',
            payload=f'email={new_email}'
        )
        profile = get_profile()
        return render_template(
            'secure.html',
            profile=profile,
            csrf_token=server_token,
            updated=False,
            error="403 Forbidden — CSRF token invalid or missing. Cross-origin request rejected!"
        ), 403

    # Token valid: safe to execute state change
    if new_email:
        update_email(new_email)
        # Token rotation after state-changing operation (Defense in Depth)
        session['csrf_token'] = secrets.token_hex(16)
        session['secure_updated'] = True

        log_request(
            endpoint='/secure/update',
            method='POST',
            origin=origin,
            referer=referer,
            cookies=request.cookies.get('session'),
            token='VALID MATCH',
            status='200 OK (TOKEN VERIFIED)',
            payload=f'email={new_email}'
        )

    return redirect(url_for('profile_secure'))

# ---------------------------------------------------------------------------
# (b) WORKING EXPLOIT: External Malicious Attacker Webpage
# ---------------------------------------------------------------------------

@app.route('/attacker')
def attacker_site():
    """
    Simulates an external attacker-controlled domain (e.g. www.evil-phishing.com).
    Contains an invisible auto-submitting form targeting the victim's endpoint.
    """
    return render_template('attacker.html')

# ---------------------------------------------------------------------------
# Utility & Lab Reset
# ---------------------------------------------------------------------------

@app.route('/reset', methods=['POST'])
def reset_lab():
    """Reset the demo victim profile back to factory state."""
    update_email('victim@company.com')
    conn = get_db()
    conn.execute("DELETE FROM request_logs")
    conn.commit()
    conn.close()
    session.pop('csrf_token', None)
    return redirect(url_for('dashboard'))

# ---------------------------------------------------------------------------
# Server Startup
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    with app.app_context():
        init_db()
    port = int(os.environ.get('PORT', 5050))
    print(f"\n========================================================")
    print(f"🛡️  CSRF Variant 2 Lab — Kunal Kurundwadkar (IIT2024177)")
    print(f"📍 Server running on: http://127.0.0.1:{port}")
    print(f"========================================================\n")
    app.run(debug=True, port=port)

