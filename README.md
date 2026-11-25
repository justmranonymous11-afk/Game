# SOLARIS // AEGIS POINT (v4.0)

A photorealistic **3D First-Person Tactical Parkour & Roguelite FPS** built with **Three.js WebGL + Vite** featuring **3 full playable 3D maps**, **Poly Haven 360° photographic HDRI skyboxes**, **real-time reflective ocean water (`Water.js`)**, **megascan-grade PBR Albedo + Sobel Normal + Roughness sets**, **skeletally rigged motion-captured GLB combatants (`Soldier.glb` & `Xbot.glb`)**, **3 chamfered carbon-fiber firearms + Frag Grenades**, a **Valkyrie-01 VTOL Gunship Boss**, **Med-Stim & Armor Supply Crates**, and **12 between-wave Tactical Field Mods**.

## 3 Operation Theaters (Live 3D Map Selector)

1. **AEGIS POINT** — Mediterranean Coastal Citadel (`quarry_01_1k.hdr`, travertine limestone plaza, board-formed concrete bunkers, basalt sea-cliffs, real reflective ocean, solar arrays, cypress trees & helipad).
2. **HELIOS FOUNDRY** — Sunset Canyon Refinery (`venice_sunset_1k.hdr`, stratified ochre sandstone canyon, twin industrial steel catwalks, central smelter tower, shipping container cover & elevated helipad).
3. **FROSTPEAK** — Arctic Glacier Research Outpost (`blouberg_sunrise_2_1k.hdr`, 1K AmbientCG Glacier Ice PBR surfaces, geodesic polar communications radome, heated steel bridges, snow-dusted pines & arctic waters).

## Controls & Tactical Kit

- **`WASD` + `Space`**: Sprint, Double-Jump, and **Wall-Run** along reinforced industrial steel bulkheads.
- **`Left Click`**: Fire active firearm (brass shell ejection, dynamic muzzle light, 3D sparks & damage numbers).
- **`Right Click` (Hold)**: **Aim Down Sights (ADS)** — aligns the 3D holographic reflex optic / railgun sniper scope and tightens spread.
- **`1` / `2` / `3` or `Scroll Wheel`**: Switch instantaneously between **MK-IV Pulse Carbine**, **Helio-9 Railgun** (pierces Aegis shields), and **M88 Breacher Shotgun** (animated pump rack).
- **`G`**: Throw physics-simulated bouncing **Frag Grenade** with shockwave blast & shrapnel.
- **`R`**: Tactical Reload.
- **`Shift`**: **Crouch-Slide** (on ground) or **Exo Air-Dash** (in mid-air).
- **`E`**: **Tactical Grapple Hook** (anchor pylons & enemy Kinetic Takedowns).
- **`Q` / `F`**: **Arc Shockwave Parry** (deflects enemy missiles & plasma).
- **`P` / `Esc`**: Tactical Menu (Mouse Sensitivity, FOV, Audio, Map Switch).

## Development & Verification

```bash
npm install
npm run dev      # Start local Vite dev server
npm run build    # Production bundle (auto-deployed to Vercel)
npm test         # Run Node.js physics, arsenal, 3-map, grenade, supply & stress tests
python3 tests/e2e_3d.py  # Run Playwright WebGL E2E across all 3 maps & rigged GLBs
```