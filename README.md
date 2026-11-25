# SOLARIS — 3D Kinetic Parkour & Solar-Grapple FPS

An original **3D First-Person Kinetic Parkour & Solar-Grapple Arena FPS** built with **Three.js WebGL**, procedural PBR textures, dynamic Web Audio synthesis, and a headless-testable 3D physics engine.

## Controls & Mechanics

- **`WASD` + `Space`**: Sprint, Double-Jump, and **Wall-Run** along golden-vermilion kinetic monoliths (with smooth camera roll and wall-leap boosts).
- **`Left Click`**: **Prism Lance** — kinetic hitscan rail-carbine with weakpoint & aerial critical hits.
- **`Right Click` / `E`**: **Solar Grapple** — latch onto high-altitude **Golden Sky-Rings** to soar across the floating sanctuary, or grapple directly into enemies for a high-speed **Execute Shatter** (refills Dash + restores Shield).
- **`Shift`**: **Kinetic Air-Dash** — instant directional burst with FOV warp and brief invulnerability.
- **`Q` / `F`**: **Shockwave Parry** — deflect incoming enemy plasma orbs back as lethal golden counters.
- **`P` / `Esc`**: Pause menu with Mouse Sensitivity, FOV, and Audio controls.

## Development & Testing

```bash
npm install
npm run dev      # Start Vite dev server
npm run build    # Production bundle (auto-detected by Vercel)
npm test         # Run Node.js 3D physics, combat, grapple, boss & stress tests
python3 tests/e2e_3d.py  # Run Playwright WebGL E2E & screenshot verification
```