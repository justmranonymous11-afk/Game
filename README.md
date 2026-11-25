# SOLARIS // AEGIS POINT

A photorealistic **3D First-Person Tactical Parkour & Roguelite FPS** built with **Three.js WebGL + Vite** featuring physical atmospheric scattering (`Sky.js`), real-time reflective ocean water (`Water.js`), procedural Sobel normal-mapped PBR architecture, 3 sculpted switchable firearms with 3D holographic ADS, 7 articulated mechanical combat enemy archetypes, a multi-phase VTOL Gunship Boss, and 12 between-wave Field Mods.

## Controls & Combat Systems

- **`WASD` + `Space`**: Sprint, Double-Jump, and **Wall-Run** along reinforced industrial steel bulkheads.
- **`Left Click`**: Fire active weapon (physical recoil, brass shell ejection, dynamic muzzle flash & impact sparks).
- **`Right Click` (Hold)**: **Aim Down Sights (ADS)** — smoothly aligns the 3D holographic reflex sight / railgun optic and tightens spread.
- **`1` / `2` / `3` or `Scroll Wheel`**: Switch instantaneously between:
  1. **MK-IV Pulse Carbine** (30-round automatic rifle with live 3D OLED ammo screen & holographic sight)
  2. **Helio-9 Railgun** (electromagnetic armor-piercer that punches straight through Aegis Ballistic Shields)
  3. **M88 Breacher Shotgun** (8-pellet tactical scattergun with animated pump-action rack)
- **`R`**: Tactical Reload.
- **`Shift`**: **Crouch-Slide** on the ground (lowers eye height & boosts momentum) or **Exo Air-Dash** in mid-air.
- **`E`**: **Tactical Grapple Hook** — zip to overhead Steel Anchor Beacons or directly into enemies for a **Kinetic Takedown**.
- **`Q` / `F`**: **Arc Shockwave Parry** — deflect incoming enemy missiles/plasma back as lethal counters.
- **`P` / `Esc`**: Tactical Menu (Mouse Sensitivity, FOV, Audio toggle).

## Development & Verification

```bash
npm install
npm run dev      # Start local dev server
npm run build    # Production bundle (auto-deployed on Vercel)
npm test         # Run Node.js 3D physics, arsenal, shield-pierce, boss & stress tests
python3 tests/e2e_3d.py  # Run Playwright WebGL E2E & visual QA
```