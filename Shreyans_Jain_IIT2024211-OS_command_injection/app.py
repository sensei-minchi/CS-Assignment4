import os
import re
import ipaddress
import platform
import subprocess
import time
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Determine operating system specific ping options
IS_WINDOWS = platform.system().lower() == "windows"
PING_COUNT_FLAG = "-n" if IS_WINDOWS else "-c"


# -----------------------------------------------------------------------------
# Input Validation Helper (Used by Mitigated Implementation)
# -----------------------------------------------------------------------------
def is_valid_target(target: str) -> bool:
    """
    Allow-list validation for hostnames and IP addresses.
    Rejects any string containing shell metacharacters, whitespace, or invalid syntax.
    """
    if not target or not isinstance(target, str):
        return False
    
    target = target.strip()
    
    # 1. Check if it is a valid IPv4 or IPv6 address
    try:
        ipaddress.ip_address(target)
        return True
    except ValueError:
        pass

    # 2. Check if it is a valid RFC-1123 hostname / domain name
    # Disallows spaces, &, |, ;, $, `, >, <, etc.
    hostname_regex = re.compile(
        r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$"
    )
    if hostname_regex.match(target):
        return True

    return False


# -----------------------------------------------------------------------------
# Web Routes
# -----------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", os_name=platform.system())


# =============================================================================
# (a) VULNERABLE CODE PATH (Variant 1: In-Band OS Command Injection)
#
# Flaw: The application constructs a shell command string using raw user input
# and invokes the system shell (`shell=True`).
# Metacharacters (such as '&', '&&', '|', ';') allow an attacker to terminate
# the intended command and execute arbitrary OS commands.
# Standard output and standard error are returned directly in the HTTP response (In-Band).
# =============================================================================
@app.route("/api/ping/vulnerable", methods=["POST"])
def ping_vulnerable():
    data = request.get_json(silent=True) or request.form
    target = data.get("target", "").strip()

    if not target:
        return jsonify({
            "status": "error",
            "mode": "vulnerable",
            "error": "Target parameter is required."
        }), 400

    # VULNERABILITY: Raw string concatenation with shell=True
    # The command interpreter (cmd.exe on Windows, sh/bash on Linux) executes
    # any secondary commands chained via metacharacters.
    raw_command = f"ping {PING_COUNT_FLAG} 1 {target}"
    
    start_time = time.time()
    try:
        # shell=True delegates command execution to the system shell
        output = subprocess.check_output(
            raw_command,
            shell=True,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=10
        )
        elapsed = round((time.time() - start_time) * 1000, 2)
        return jsonify({
            "status": "success",
            "mode": "vulnerable",
            "target": target,
            "command_executed": raw_command,
            "output": output,
            "execution_time_ms": elapsed
        })
    except subprocess.CalledProcessError as e:
        elapsed = round((time.time() - start_time) * 1000, 2)
        return jsonify({
            "status": "error",
            "mode": "vulnerable",
            "target": target,
            "command_executed": raw_command,
            "output": e.output,
            "error": f"Command returned exit code {e.returncode}",
            "execution_time_ms": elapsed
        }), 200
    except subprocess.TimeoutExpired:
        return jsonify({
            "status": "timeout",
            "mode": "vulnerable",
            "target": target,
            "command_executed": raw_command,
            "error": "Command timed out after 10 seconds."
        }), 408
    except Exception as ex:
        return jsonify({
            "status": "exception",
            "mode": "vulnerable",
            "target": target,
            "error": str(ex)
        }), 500


# =============================================================================
# (d) MITIGATED CODE PATH (Defense-in-Depth Mitigation)
#
# Fix 1 - Avoid the Shell & Use Parameterized Execution (Argument Vector):
#   Instead of passing a formatted string to `shell=True`, we pass a list of
#   discrete arguments (`["ping", PING_COUNT_FLAG, "1", target]`) with `shell=False`.
#   The OS kernel spawns `ping` directly without launching a shell interpreter.
#   Characters like '&', ';', '|' are treated literally as part of the host argument,
#   completely neutralizing command chaining.
#
# Fix 2 - Strict Allow-List Input Validation:
#   Before executing any process, the target is validated against strict IPv4/IPv6
#   and RFC hostname rules. Any input containing illegal characters is rejected immediately.
# =============================================================================
@app.route("/api/ping/mitigated", methods=["POST"])
def ping_mitigated():
    data = request.get_json(silent=True) or request.form
    target = data.get("target", "").strip()

    if not target:
        return jsonify({
            "status": "error",
            "mode": "mitigated",
            "error": "Target parameter is required."
        }), 400

    # MITIGATION 1: Strict Allow-List Validation
    if not is_valid_target(target):
        return jsonify({
            "status": "blocked",
            "mode": "mitigated",
            "target": target,
            "command_executed": None,
            "output": None,
            "error": "Mitigation blocked input: Target does not match strict IP/hostname allow-list. Shell metacharacters are rejected.",
            "execution_time_ms": 0
        }), 400

    # MITIGATION 2: Parameterized execution with argument vector (shell=False)
    # Passed as discrete list of strings directly to the binary
    command_vector = ["ping", PING_COUNT_FLAG, "1", target]

    start_time = time.time()
    try:
        result = subprocess.run(
            command_vector,
            shell=False,  # NO shell invoked - metacharacters cannot execute
            capture_output=True,
            text=True,
            timeout=10
        )
        elapsed = round((time.time() - start_time) * 1000, 2)
        combined_output = result.stdout + (("\n" + result.stderr) if result.stderr else "")
        return jsonify({
            "status": "success" if result.returncode == 0 else "error",
            "mode": "mitigated",
            "target": target,
            "command_executed": " ".join(command_vector),
            "output": combined_output,
            "execution_time_ms": elapsed
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            "status": "timeout",
            "mode": "mitigated",
            "target": target,
            "error": "Command timed out after 10 seconds."
        }), 408
    except Exception as ex:
        return jsonify({
            "status": "exception",
            "mode": "mitigated",
            "target": target,
            "error": str(ex)
        }), 500


if __name__ == "__main__":
    # Host on 127.0.0.1 for secure local testing
    print("[*] Starting Web Server Security Lab - OS Command Injection (Variant 1)")
    print("[*] Vulnerable endpoint: http://127.0.0.1:5000/api/ping/vulnerable")
    print("[*] Mitigated endpoint:  http://127.0.0.1:5000/api/ping/mitigated")
    print("[*] Dashboard:           http://127.0.0.1:5000/")
    app.run(host="127.0.0.1", port=5000, debug=False)

