import http.server
import os
import socketserver
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOT_DIR = Path("/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/4788d42a-3f32-4873-baf4-acea0a5d650d/scratch/shots")
SHOT_DIR.mkdir(parents=True, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        pass


def start_server():
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, port


def run_verification():
    httpd, port = start_server()
    url = f"http://127.0.0.1:{port}/index.html"
    errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()

            page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))

            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(350)

            # 1. Title screen screenshot
            assert page.locator("#title-overlay").is_visible(), "Title overlay should be visible"
            page.screenshot(path=str(SHOT_DIR / "01_title.png"))

            # 2. Click Start
            page.click("#start-btn")
            page.wait_for_timeout(500)
            assert page.locator("#title-overlay").is_hidden(), "Title overlay should hide after start"
            assert page.locator("#hud").is_visible(), "HUD should appear during play"

            # Move player briefly with real keyboard input
            page.keyboard.down("KeyD")
            page.wait_for_timeout(220)
            page.keyboard.up("KeyD")

            # Set up a crisp 3-target Loom Seal showcase on screen so we can visually inspect threads, polygon, and enemies
            page.evaluate("""() => {
                const eng = window.__SUNTHREAD__;
                eng.waveBannerTimer = 0;
                eng.enemies = [];
                eng.spawnQueue.forEach(s => s.spawned = true);
                eng._spawnEnemyGroup('mote', 3);
                eng._spawnEnemyGroup('archer', 2);
                eng._spawnEnemyGroup('beetle', 1);
                eng._spawnEnemyGroup('weaver', 1);
                // Place them clearly around the arena for visual QA
                const coords = [
                  [340, 210], [790, 215], [560, 520],
                  [560, 340], [450, 310], [675, 345], [520, 415]
                ];
                eng.enemies.forEach((e, i) => {
                  e.x = coords[i][0];
                  e.y = coords[i][1];
                  e.spawnTimer = 0;
                });
                eng.player.x = 560;
                eng.player.y = 260;
                // Attach 3 tethers to form an active Loom Seal triangle!
                eng._attachTether(eng.enemies[0], 'enemy');
                eng._attachTether(eng.enemies[1], 'enemy');
                eng._attachTether(eng.enemies[2], 'enemy');
            }""")
            page.wait_for_timeout(120)
            page.screenshot(path=str(SHOT_DIR / "02_gameplay_seal.png"))

            # 3. Trigger Loom Seal via Spacebar!
            page.keyboard.press("Space")
            page.wait_for_timeout(90)
            page.screenshot(path=str(SHOT_DIR / "03_detonation.png"))
            seals = page.evaluate("() => window.__SUNTHREAD__.sealsTriggered")
            assert seals >= 1, f"Expected sealsTriggered >= 1, got {seals}"

            # 4. Boss encounter visual QA
            page.evaluate("""() => {
                const eng = window.__SUNTHREAD__;
                eng.enemies = [];
                eng.projectiles = [];
                eng._spawnEnemyGroup('boss', 1);
                const boss = eng.enemies[0];
                boss.x = 560;
                boss.y = 290;
                boss.spawnTimer = 0;
                boss.aiTimer = 0.01;
                eng.player.x = 560;
                eng.player.y = 510;
                eng.step(0.02);
                eng._attachTether(boss.nodes[0], 'boss_node');
                eng._attachTether(boss.nodes[1], 'boss_node');
            }""")
            page.wait_for_timeout(120)
            page.screenshot(path=str(SHOT_DIR / "04_boss.png"))

            # 5. Relic Draft screen
            page.evaluate("""() => {
                const eng = window.__SUNTHREAD__;
                eng._openDraft();
            }""")
            page.wait_for_timeout(150)
            assert page.locator("#draft-overlay").is_visible(), "Draft overlay should be visible"
            page.screenshot(path=str(SHOT_DIR / "05_draft.png"))

            # Pick first relic via click
            page.locator(".relic-card").first.click()
            page.wait_for_timeout(150)
            assert page.locator("#draft-overlay").is_hidden(), "Draft overlay should close after selecting relic"

            # 6. Pause & Resume
            page.keyboard.press("Escape")
            page.wait_for_timeout(120)
            assert page.locator("#pause-overlay").is_visible(), "Pause overlay should appear on Escape"
            page.screenshot(path=str(SHOT_DIR / "06_pause.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(120)
            assert page.locator("#pause-overlay").is_hidden(), "Pause overlay should close on Escape"

            # 7. Also verify standalone bundle loads cleanly via file:// with zero errors!
            standalone_path = ROOT / "dist" / "sunthread-standalone.html"
            page2 = context.new_page()
            page2.on("console", lambda msg: errors.append(f"standalone.console.{msg.type}: {msg.text}") if msg.type == "error" else None)
            page2.on("pageerror", lambda exc: errors.append(f"standalone.pageerror: {exc}"))
            page2.goto(standalone_path.as_uri(), wait_until="load")
            page2.wait_for_timeout(250)
            page2.click("#start-btn")
            page2.wait_for_timeout(300)
            state_standalone = page2.evaluate("() => window.__SUNTHREAD__.state")
            assert state_standalone == "playing", f"Standalone bundle failed to start: {state_standalone}"

            browser.close()
    finally:
        httpd.shutdown()

    if errors:
        print("ERRORS FOUND:")
        for e in errors:
            print("  -", e)
        raise SystemExit(1)

    print("E2E verification PASSED with 0 console/page errors! Screenshots saved to:", SHOT_DIR)


if __name__ == "__main__":
    run_verification()
