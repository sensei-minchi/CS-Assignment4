"""
Record a realistic screen-capture-style demo of the SQL injection auth bypass
by driving the REAL Flask app in a real Chromium browser with Playwright.

It injects a fake browser chrome bar, a moving cursor and lower-third captions
so the output looks like a narrated screen recording. Produces a .webm which the
accompanying shell step transcodes to .mp4 with ffmpeg.

Usage (the Flask app must be running on BASE_URL):
    python record.py <base_url> <output_dir>
"""
import sys, json, glob, os
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5001"
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else "."
W, H = 1280, 720

# Injected on every navigation: chrome bar, cursor, caption API.
INIT = r"""
(() => {
  function build() {
    if (document.getElementById('__chrome')) return;
    const bar = document.createElement('div'); bar.id='__chrome';
    bar.style.cssText='position:fixed;top:0;left:0;right:0;height:44px;background:#2b2b33;'
      +'display:flex;align-items:center;gap:10px;padding:0 14px;z-index:2147483000;'
      +'font-family:system-ui,Segoe UI,sans-serif;border-bottom:1px solid #1c1c22;';
    const dots='<span style="display:flex;gap:7px;margin-right:6px">'
      +'<i style="width:12px;height:12px;border-radius:50%;background:#ff5f57;display:block"></i>'
      +'<i style="width:12px;height:12px;border-radius:50%;background:#febc2e;display:block"></i>'
      +'<i style="width:12px;height:12px;border-radius:50%;background:#28c840;display:block"></i></span>';
    const host=(location.host||'127.0.0.1:5001');
    const path=location.pathname+(location.search?location.search:'');
    bar.innerHTML=dots+'<div style="flex:1;max-width:620px;background:#1b1b20;color:#c9cfda;'
      +'border-radius:8px;padding:7px 14px;font-size:13px;font-family:Consolas,monospace;'
      +'display:flex;align-items:center;gap:8px">'
      +'<span style="color:#6ee7a8">&#128274;</span>'+host+path+'</div>';
    document.body.appendChild(bar);
    document.body.style.paddingTop='56px';

    const cur=document.createElement('div'); cur.id='__cursor';
    cur.style.cssText='position:fixed;top:0;left:0;width:22px;height:22px;z-index:2147483600;'
      +'pointer-events:none;transition:transform .05s linear;'
      +"background:no-repeat center/contain url('data:image/svg+xml;utf8,"
      +"<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22>"
      +"<path d=%22M4 2 L4 20 L9 15 L12.5 22 L15 21 L11.5 14 L19 14 Z%22 "
      +"fill=%22white%22 stroke=%22black%22 stroke-width=%221.3%22/></svg>');";
    cur.style.transform='translate(640px,360px)';
    document.body.appendChild(cur);
    document.addEventListener('mousemove',e=>{
      cur.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
    });

    const cap=document.createElement('div'); cap.id='__cap';
    cap.style.cssText='position:fixed;left:50%;bottom:40px;transform:translateX(-50%) translateY(14px);'
      +'max-width:80%;background:rgba(10,13,20,.92);color:#f2f5fb;z-index:2147483500;'
      +'padding:14px 22px;border-radius:12px;font-family:system-ui,Segoe UI,sans-serif;'
      +'font-size:21px;font-weight:600;line-height:1.35;text-align:center;opacity:0;'
      +'transition:opacity .4s ease,transform .4s ease;border:1px solid rgba(255,255,255,.12);'
      +'box-shadow:0 18px 40px -20px #000;';
    document.body.appendChild(cap);
    window.__cap=(t)=>{cap.innerHTML=t;cap.style.opacity='1';cap.style.transform='translateX(-50%) translateY(0)';};
    window.__capHide=()=>{cap.style.opacity='0';cap.style.transform='translateX(-50%) translateY(14px)';};
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',build);
  else build();
})();
"""

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": W, "height": H},
            record_video_dir=OUTDIR,
            record_video_size={"width": W, "height": H},
            device_scale_factor=1,
        )
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        mx, my = [W/2], [H/2]

        def fonts():
            try: page.evaluate("document.fonts ? document.fonts.ready : true")
            except Exception: pass
        def cap(t): page.evaluate("t=>window.__cap && window.__cap(t)", t)
        def caphide(): page.evaluate("()=>window.__capHide && window.__capHide()")
        def glide(x, y, steps=30):
            page.mouse.move(x, y, steps=steps); mx[0], my[0] = x, y
        def to_center(sel, steps=30):
            box = page.locator(sel).bounding_box()
            glide(box["x"]+box["width"]/2, box["y"]+box["height"]/2, steps)
            return box
        def click(sel):
            box = to_center(sel); page.wait_for_timeout(250)
            page.mouse.click(box["x"]+box["width"]/2, box["y"]+box["height"]/2)
        def typ(sel, text, delay=140):
            page.locator(sel).click(); page.wait_for_timeout(250)
            page.locator(sel).type(text, delay=delay)

        # ---------------- PHASE 1 : exploit (vulnerable mode) --------------
        page.goto(BASE + "/login"); fonts(); page.wait_for_timeout(1500)
        cap("A normal login page &mdash; but the SQL query is built by string concatenation.")
        page.wait_for_timeout(3000)

        glide(300, 300, 25)
        cap("Instead of a username, we type a SQL <b>payload</b>&hellip;")
        page.wait_for_timeout(1800)
        typ("#username", "admin' --", 150); page.wait_for_timeout(900)
        cap("A quote closes the string, then <code>--</code> comments out the rest of the query.")
        page.wait_for_timeout(3200)

        typ("#password", "anything", 130); page.wait_for_timeout(700)
        cap("The password is just junk &mdash; it will never be checked.")
        page.wait_for_timeout(2600)

        caphide(); page.wait_for_timeout(400)
        click("button[type=submit]")
        page.wait_for_url("**/dashboard"); fonts(); page.wait_for_timeout(1400)
        cap("Logged in as <b>admin</b>. Authentication bypassed &mdash; no real password.")
        page.wait_for_timeout(2600)
        cap("Look at the query that ran: the password check was commented away.")
        page.wait_for_timeout(3800)
        caphide(); page.wait_for_timeout(600)

        # ---------------- PHASE 2 : the fix (secure mode) ------------------
        cap("Now the fix: a <b>parameterised query</b> (secure mode).")
        page.goto(BASE + "/login?mode=secure"); fonts(); page.wait_for_timeout(1500)
        page.wait_for_timeout(1400)
        cap("We run the <b>exact same</b> payload&hellip;")
        typ("#username", "admin' --", 95)
        typ("#password", "anything", 85); page.wait_for_timeout(700)
        page.wait_for_timeout(1400)
        caphide(); page.wait_for_timeout(300)
        click("button[type=submit]")
        page.wait_for_timeout(1300)
        cap("Rejected. The payload is now treated as literal text, not SQL.")
        page.wait_for_timeout(3600)
        cap("Same attack, blocked by one line of code. &#10003;")
        page.wait_for_timeout(3200)
        caphide(); page.wait_for_timeout(900)

        ctx.close()   # flush video
        browser.close()

    vids = sorted(glob.glob(os.path.join(OUTDIR, "*.webm")), key=os.path.getmtime)
    print("VIDEO:", vids[-1] if vids else "NONE")

if __name__ == "__main__":
    run()
