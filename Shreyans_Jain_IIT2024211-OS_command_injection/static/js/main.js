let currentMode = "vulnerable";

function setMode(mode) {
    currentMode = mode;
    
    const btnVulnerable = document.getElementById("btn-mode-vulnerable");
    const btnMitigated = document.getElementById("btn-mode-mitigated");
    const alertBox = document.getElementById("mode-alert");
    
    if (mode === "vulnerable") {
        btnVulnerable.classList.add("active");
        btnMitigated.classList.remove("active");
        alertBox.className = "mode-alert vulnerable-alert";
        alertBox.innerHTML = `<strong>Mode: Vulnerable Endpoint (/api/ping/vulnerable)</strong>
            <p>Concatenates raw user input into shell command string with <code>shell=True</code>. Metacharacters are interpreted and output is returned in-band.</p>`;
    } else {
        btnMitigated.classList.add("active");
        btnVulnerable.classList.remove("active");
        alertBox.className = "mode-alert mitigated-alert";
        alertBox.innerHTML = `<strong>Mode: Mitigated Endpoint (/api/ping/mitigated)</strong>
            <p>Mitigated with parameterised execution (argument vector, <code>shell=False</code>) + allow-list validation. Shell metacharacters are safely neutralized or blocked.</p>`;
    }
}

function applyPreset(payload) {
    const input = document.getElementById("target-input");
    input.value = payload;
    input.focus();
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (targetContent) {
        targetContent.classList.add("active");
    }
    
    // Find the button that was clicked
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(btn => {
        if (btn.getAttribute("onclick").includes(tabId)) {
            btn.classList.add("active");
        }
    });
}

async function executePing(event) {
    event.preventDefault();
    
    const targetInput = document.getElementById("target-input");
    const target = targetInput.value.trim();
    if (!target) return;
    
    const submitBtn = document.getElementById("submit-btn");
    const spinner = document.getElementById("spinner");
    const terminalContent = document.getElementById("terminal-content");
    const terminalTiming = document.getElementById("terminal-timing");
    const terminalTitle = document.getElementById("terminal-status-title");
    
    submitBtn.disabled = true;
    spinner.classList.remove("hidden");
    terminalTitle.innerText = `Executing request via ${currentMode.toUpperCase()} endpoint...`;
    terminalContent.innerText = `[+] Sending request to /api/ping/${currentMode} with target: ${target}\n[*] Waiting for in-band response...`;

    try {
        const response = await fetch(`/api/ping/${currentMode}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ target: target })
        });
        
        const data = await response.json();
        terminalTiming.innerText = `${data.execution_time_ms || 0} ms`;
        
        let outputText = "";
        outputText += `=================================================================\n`;
        outputText += `ENDPOINT: /api/ping/${data.mode}\n`;
        outputText += `STATUS:   ${data.status.toUpperCase()}\n`;
        if (data.command_executed) {
            outputText += `COMMAND:  ${data.command_executed}\n`;
        }
        outputText += `LATENCY:  ${data.execution_time_ms || 0} ms\n`;
        outputText += `=================================================================\n\n`;

        if (data.status === "blocked") {
            terminalTitle.innerText = "🛑 Input Blocked by Mitigation Filter";
            outputText += `[DEFENSE TRIGGERED - INJECTION ATTEMPT BLOCKED]\n\n`;
            outputText += `${data.error}\n\n`;
            outputText += `Evidence: The application rejected the input before passing it to any system call.`;
        } else if (data.status === "success" || data.status === "error") {
            if (data.mode === "vulnerable" && (target.includes("&") || target.includes(";") || target.includes("|"))) {
                terminalTitle.innerText = "⚠ In-Band OS Command Output Captured!";
            } else {
                terminalTitle.innerText = "✓ Execution Completed";
            }
            outputText += `--- IN-BAND COMMAND OUTPUT (stdout/stderr) ---\n\n`;
            outputText += (data.output || "No output returned.");
            if (data.error) {
                outputText += `\n[Process Note]: ${data.error}`;
            }
        } else {
            terminalTitle.innerText = "Execution Message";
            outputText += `Error / Message: ${data.error || "Unknown response"}`;
        }
        
        terminalContent.innerText = outputText;

    } catch (err) {
        terminalTitle.innerText = "Network Error";
        terminalContent.innerText = `[!] Network or server communication error: ${err.message}`;
    } finally {
        submitBtn.disabled = false;
        spinner.classList.add("hidden");
    }
}

