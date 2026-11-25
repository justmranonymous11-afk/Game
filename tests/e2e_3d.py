import base64
import subprocess
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOT_DIR = Path("/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/4788d42a-3f32-4873-baf4-acea0a5d650d/scratch/shots_v4")
SHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(cdp, filename):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    (SHOT_DIR / filename).write_bytes(base64.b64decode(res["data"]))


def run_v4_e2e():
    proc = subprocess.Popen(
        ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", "8795", "--strictPort"],
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

            page.goto("http://127.0.0.1:8795/", wait_until="domcontentloaded")
            # Wait for real HDRIs, Megascan PBR textures, and rigged Soldier.glb + Xbot.glb to finish loading
            page.locator("#loading-overlay").wait_for(state="hidden", timeout=45000)
            page.wait_for_timeout(800)

            # 1. MAP 1 (Aegis Point) Title Screen with Real Poly Haven HDRI + Water + Megascan PBR
            assert page.locator("#title-overlay").is_visible()
            snap(cdp, "01_aegis_title.png")

            # 2. Deploy -> Real Rigged Soldier.glb + Xbot.glb Aegis + Drone + Carbon/Beveled Carbine!
            page.click("#start-btn", force=True)
            page.wait_for_timeout(400)
            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.player.x = 0;
                eng.player.y = 0.0;
                eng.player.z = 20;
                eng.player.yaw = 0;
                eng.player.pitch = 0.06;
                eng.stylePoints = 2700;
                eng.score = 8450;
                eng.enemies = [];
                eng._spawnEnemy('striker', -2.6, 1.15, 11.5, 1);
                eng._spawnEnemy('aegis', 2.8, 1.15, 11.8, 1);
                eng._spawnEnemy('drone', -4.2, 4.6, 8.0, 1);
                eng._spawnEnemy('juggernaut', 6.5, 1.95, 5.5, 1);
                eng.fireWeapon();
            }""")
            page.wait_for_timeout(450)
            snap(cdp, "02_rigged_soldiers_combat.png")

            # 3. Switch live to MAP 2: HELIOS FOUNDRY (Sunset Canyon Refinery HDRI!)
            page.evaluate("""async () => {
                await window.__SWITCH_MAP__('helios');
                const eng = window.__SOLARIS__;
                eng.startRun();
                eng.selectWeapon('railgun');
                eng.player.x = 0;
                eng.player.y = 0.0;
                eng.player.z = 22;
                eng.player.yaw = 0.16;
                eng.player.pitch = 0.2;
                eng.enemies = [];
                eng._spawnEnemy('gunship', -4.5, 13.5, -2, 1);
                eng._spawnEnemy('striker', 4.5, 1.15, 11, 1);
                eng.step(0.02);
            }""")
            page.wait_for_timeout(550)
            snap(cdp, "03_helios_sunset_gunship.png")

            # 4. Switch live to MAP 3: FROSTPEAK (Arctic Glacier Outpost HDRI + 1K AmbientCG Ice!)
            page.evaluate("""async () => {
                await window.__SWITCH_MAP__('frostpeak');
                const eng = window.__SOLARIS__;
                eng.startRun();
                eng.selectWeapon('shotgun');
                eng.player.x = 0;
                eng.player.y = 0.0;
                eng.player.z = 21;
                eng.player.yaw = -0.15;
                eng.player.pitch = 0.08;
                eng.enemies = [];
                eng._spawnEnemy('viper', 4.5, 1.15, 12.5, 1);
                eng.enemies[0].fireTimer = 0.4;
                eng.enemies[0].telegraphTimer = 0.6;
                eng._spawnEnemy('striker', -3.2, 1.15, 12.0, 1);
                eng._spawnEnemy('drone', 0, 5.2, 8.5, 1);
            }""")
            page.wait_for_timeout(550)
            snap(cdp, "04_frostpeak_arctic.png")

            browser.close()
    finally:
        proc.terminate()
        proc.wait(timeout=5)

    if errors:
        print("ERRORS FOUND:")
        for e in errors:
            print("  -", e)
        raise SystemExit(1)

    print("SOLARIS v4.0 E2E PASSED with 0 console/page errors! Shots:", SHOT_DIR)


if __name__ == "__main__":
    run_v4_e2e()
