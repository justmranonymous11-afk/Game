import base64
import subprocess
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOT_DIR = Path("/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/4788d42a-3f32-4873-baf4-acea0a5d650d/scratch/shots_3d")
SHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(cdp, filename):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    (SHOT_DIR / filename).write_bytes(base64.b64decode(res["data"]))


def run_3d_e2e():
    proc = subprocess.Popen(
        ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", "8791", "--strictPort"],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(1.8)
    errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
            )
            context = browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
            context.add_init_script("Element.prototype.requestPointerLock = () => {};")
            page = context.new_page()
            cdp = context.new_cdp_session(page)

            page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))

            page.goto("http://127.0.0.1:8791/", wait_until="networkidle")
            page.wait_for_timeout(600)

            # 1. Live orbiting 3D Sky-Citadel Title Screen
            assert page.locator("#title-overlay").is_visible()
            snap(cdp, "01_title_3d.png")

            # 2. Enter Sanctuary -> First-Person Viewmodel + Arena Combat
            page.click("#start-btn")
            page.wait_for_timeout(450)
            assert page.locator("#fps-hud").is_visible()

            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.player.x = 0;
                eng.player.y = 0.0;
                eng.player.z = 21;
                eng.player.yaw = 0;
                eng.player.pitch = 0.14;
                eng.stylePoints = 2600;
                eng.score = 4250;
                eng.enemies = [];
                eng._spawnEnemy('drone', -4.5, 4.8, 3.5, 1);
                eng._spawnEnemy('drone', 5.2, 6.2, 2.0, 1);
                eng._spawnEnemy('strider', 2.2, 2.2, 8.0, 1);
                eng._spawnEnemy('aegis', -11, 2.8, -5, 1);
                eng.fireWeapon();
            }""")
            page.wait_for_timeout(300)
            snap(cdp, "02_fps_combat.png")

            # 3. Mid-Air Solar Grapple Flight toward a Golden Sky-Ring!
            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.player.x = 6;
                eng.player.y = 9.5;
                eng.player.z = 16;
                eng.player.yaw = -0.35;
                eng.player.pitch = 0.22;
                eng.player.vx = 14;
                eng.player.vz = -22;
                eng.player.fovBoost = 12;
                eng.player.grapple = {
                    targetKind: 'ring',
                    targetId: 'ring_inner_1_-1',
                    x: 13.5,
                    y: 19.5,
                    z: -13.5,
                    timer: 0.2,
                };
            }""")
            page.wait_for_timeout(250)
            snap(cdp, "03_grapple_flight.png")

            # 4. The Solar Colossus Boss Encounter!
            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.player.grapple = null;
                eng.player.x = 0;
                eng.player.y = 1.6;
                eng.player.z = 18;
                eng.player.yaw = 0;
                eng.player.pitch = 0.34;
                eng.player.vx = 0;
                eng.player.vz = 0;
                eng.enemies = [];
                eng._spawnEnemy('colossus', 0, 13.5, -6, 1);
                eng.step(0.02);
            }""")
            page.wait_for_timeout(300)
            snap(cdp, "04_boss_colossus.png")

            # 5. Pause Menu check
            page.keyboard.press("KeyP")
            page.wait_for_timeout(150)
            assert page.locator("#pause-overlay").is_visible()

            browser.close()
    finally:
        proc.terminate()
        proc.wait(timeout=5)

    if errors:
        print("ERRORS FOUND:")
        for e in errors:
            print("  -", e)
        raise SystemExit(1)

    print("SOLARIS 3D E2E PASSED with 0 console/page errors! Screenshots:", SHOT_DIR)


if __name__ == "__main__":
    run_3d_e2e()
