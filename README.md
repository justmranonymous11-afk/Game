# SUNTHREAD

An original **Ukiyo-e Woodblock × Kintsugi** elastic-tether action-roguelite built with zero runtime dependencies.

## Core Mechanics

- **Move (`WASD` / `Arrow Keys`)**: Glide smoothly across the washi-paper sanctuary.
- **Tether (`Left Click`)**: Launch golden thread-darts into enemies, resonant Brass Bell Pylons, or Boss Resonance Nodes. Double-tagging a tethered target immediately snaps.
- **Snap-Cleave (`Space` / `Right Click` with 1–2 Tethers)**: Zip-cleave invulnerably through every tethered target in sequence, slicing enemies along the line and parrying bullets in your path.
- **Loom Seal (`Space` / `Right Click` with 3+ Tethers)**: Close a shimmering golden polygon and detonate the entire enclosed region in gold leaf — obliterating interior enemies, erasing enemy bullets, preventing Spindle Weaver splits, and triggering Boss Resonance Breaks.
- **Parry Chime (`Space` / `Right Click` with 0 Tethers)**: Emit a bronze-bell pulse that deflects nearby projectiles back as homing golden needles.

## Running Locally

Serve the repository with any static file server (ES modules require HTTP):

```bash
python3 -m http.server 8080
```

Or open the zero-dependency standalone bundle directly in any browser after building:

```bash
npm run build:standalone
# Opens dist/sunthread-standalone.html
```

## Testing

```bash
# Headless unit, mechanics, boss, relic, and 10,000-tick stress tests
npm test

# Full Playwright headless Chromium E2E & visual QA
python3 tests/e2e_verify.py
```