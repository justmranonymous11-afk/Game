import base64
import subprocess
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOT_DIR = Path("/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/4788d42a-3f32-4873-baf4-acea0a5d650d/scratch/shots_v3")
SHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(cdp, filename):
    res = cdp.send("Page.captureScreenshot", {"format": "png"})
    (SHOT_DIR / filename).write_bytes(base64.b64decode(res["data"]))


def run_v3_e2e():
    proc = subprocess.Popen(
        ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", "8793", "--strictPort"],
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

            page.goto("http://127.0.0.1:8793/", wait_until="networkidle")
            page.wait_for_timeout(700)

            # 1. Coastal Fortress + Physical Sky + Reflective Ocean Title Screen
            assert page.locator("#title-overlay").is_visible()
            snap(cdp, "01_title_aegis.png")

            # 2. Deploy -> First-Person MK-IV Carbine + Articulated Enemies + Radar HUD
            page.click("#start-btn", force=True)
            page.wait_for_timeout(450)
            assert page.locator("#fps-hud").is_visible()

            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.player.x = 0;
                eng.player.y = 0.0;
                eng.player.z = 21;
                eng.player.yaw = 0;
                eng.player.pitch = 0.08;
                eng.stylePoints = 2700;
                eng.score = 6420;
                eng.enemies = [];
                eng._spawnEnemy('striker', -3.6, 1.15, 11.5, 1);
                eng._spawnEnemy('aegis', 3.4, 1.15, 12.0, 1);
                eng._spawnEnemy('drone', -5.2, 5.2, 7.5, 1);
                eng._spawnEnemy('juggernaut', 6.8, 1.95, 6.0, 1);
                eng._spawnEnemy('viper', -27.5, 8.6, -27.5, 1);
                eng.enemies[4].fireTimer = 0.4;
                eng.enemies[4].telegraphTimer = 0.6;
                eng.fireWeapon();
            }""")
            page.wait_for_timeout(350)
            snap(cdp, "02_combat_carbine.png")

            # 3. Switch to Helio-9 Railgun [2] & Face VALKYRIE-01 VTOL Gunship Boss over the Ocean!
            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.selectWeapon('railgun');
                eng.player.x = 0;
                eng.player.y = 1.2;
                eng.player.z = 24;
                eng.player.yaw = 0.28;
                eng.player.pitch = 0.24;
                eng.enemies = [];
                eng._spawnEnemy('gunship', -7.5, 13.5, 0, 1);
                eng.step(0.02);
            }""")
            page.wait_for_timeout(350)
            snap(cdp, "03_valkyrie_boss_railgun.png")

            # 4. Aim Down Sights (ADS) Holographic Reflex Sight View with MK-IV Carbine
            page.evaluate("""() => {
                const eng = window.__SOLARIS__;
                eng.selectWeapon('carbine');
                eng.setAds(true);
                eng.player.x = 0;
                eng.player.y = 0;
                eng.player.z = 19;
                eng.player.yaw = 0;
                eng.player.pitch = 0.05;
                eng.enemies = [];
                eng._spawnEnemy('striker', 0, 1.15, 9.5, 1);
            }""")
            page.wait_for_timeout(450)
            snap(cdp, "04_ads_holosight.png")

            # 5. Between-Wave Tactical Armory Mod Draft!
            page.evaluate("""() => {
                window.__SOLARIS__._openDraft();
            }""")
            page.wait_for_timeout(200)
            assert page.locator("#draft-overlay").is_visible()
            snap(cdp, "05_armory_draft.png")

            browser.close()
    finally:
        proc.terminate()
        proc.wait(timeout=5)

    if errors:
        print("ERRORS FOUND:")
        for e in errors:
            print("  -", e)
        raise SystemExit(1)

    print("SOLARIS v3.0 E2E PASSED with 0 console/page errors! Shots:", SHOT_DIR)


if __name__ == "__main__":
    run_v3_e2e()
