// Pure 3D arena geometry & interactive anchors shared between physics and Three.js rendering.
// Every box is defined as { x, y, z, w, h, d, material, wallRun?: boolean } where (x, y, z) is its center.

export function buildArenaData() {
  const boxes = [];
  const jumpPads = [];
  const skyRings = [];

  // 1. Central Solar Sanctuary Deck (y top = 0)
  boxes.push({ x: 0, y: -1.5, z: 0, w: 34, h: 3, d: 34, material: 'marble' });
  // Raised central altar dais (y top = 1.6)
  boxes.push({ x: 0, y: 0.8, z: 0, w: 12, h: 1.6, d: 12, material: 'obsidian' });
  // Central Solar Spire monument (tall architectural centerpiece)
  boxes.push({ x: 0, y: 11.5, z: 0, w: 3.4, h: 20, d: 3.4, material: 'gold' });

  // 4 stepped stairs up to the central dais
  const stairDirs = [
    [0, -7.2, 5.2, 0.8, 2.4],
    [0, 7.2, 5.2, 0.8, 2.4],
    [-7.2, 0, 2.4, 0.8, 5.2],
    [7.2, 0, 2.4, 0.8, 5.2],
  ];
  for (const [sx, sz, sw, sh, sd] of stairDirs) {
    boxes.push({ x: sx, y: 0.4, z: sz, w: sw, h: sh, d: sd, material: 'marble' });
  }

  // 2. Four Radial Marble Bridges & Outer Elevated Monolith Islands
  const cardinals = [
    { dx: 0, dz: -1 },
    { dx: 0, dz: 1 },
    { dx: -1, dz: 0 },
    { dx: 1, dz: 0 },
  ];

  for (const { dx, dz } of cardinals) {
    const isZ = dz !== 0;
    // Bridge spanning from center deck (17) to outer island (30)
    boxes.push({
      x: dx * 23.5,
      y: -1.0,
      z: dz * 23.5,
      w: isZ ? 8.5 : 14,
      h: 2.0,
      d: isZ ? 14 : 8.5,
      material: 'marble',
    });

    // Outer Monolith Island (slightly elevated, y top = 1.2)
    boxes.push({
      x: dx * 38,
      y: -0.3,
      z: dz * 38,
      w: 18,
      h: 3.0,
      d: 18,
      material: 'marble',
    });

    // Stepped lip between bridge and outer island
    boxes.push({
      x: dx * 29.5,
      y: 0.3,
      z: dz * 29.5,
      w: isZ ? 8.5 : 2.2,
      h: 0.6,
      d: isZ ? 2.2 : 8.5,
      material: 'gold',
    });

    // Twin Colonnade Pillars framing each outer island
    const px1 = dx * 43 + (isZ ? -6.5 : 0);
    const pz1 = dz * 43 + (isZ ? 0 : -6.5);
    const px2 = dx * 43 + (isZ ? 6.5 : 0);
    const pz2 = dz * 43 + (isZ ? 0 : 6.5);
    boxes.push({ x: px1, y: 7.2, z: pz1, w: 2.2, h: 12, d: 2.2, material: 'obsidian' });
    boxes.push({ x: px2, y: 7.2, z: pz2, w: 2.2, h: 12, d: 2.2, material: 'obsidian' });
    // Arch lintel atop twin pillars
    boxes.push({
      x: dx * 43,
      y: 13.8,
      z: dz * 43,
      w: isZ ? 16 : 2.8,
      h: 1.6,
      d: isZ ? 2.8 : 16,
      material: 'gold',
    });

    // Jump Pad near the edge of each outer island launching toward the sky!
    jumpPads.push({
      x: dx * 33,
      y: 1.35,
      z: dz * 33,
      radius: 2.2,
      boostY: 22.5,
      boostHoriz: 8.0,
    });
  }

  // 3. Four Diagonal High-Altitude Sanctuary Platforms + Kinetic Wall-Run Monoliths!
  const diagonals = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (const [sx, sz] of diagonals) {
    // High-altitude sniper/parkour balcony (y top = 7.5)
    boxes.push({
      x: sx * 27,
      y: 6.5,
      z: sz * 27,
      w: 11,
      h: 2.0,
      d: 11,
      material: 'obsidian',
    });

    // Kinetic Wall-Run Monolith (facing inner arena so you can wall-run between bridges & balconies!)
    boxes.push({
      x: sx * 19,
      y: 4.5,
      z: sz * 19,
      w: 1.6,
      h: 8.5,
      d: 13.5,
      material: 'wallrun',
      wallRun: true,
    });

    // Low cover plinth on the central deck
    boxes.push({
      x: sx * 12.5,
      y: 1.1,
      z: sz * 12.5,
      w: 3.0,
      h: 2.2,
      d: 3.0,
      material: 'marble',
    });

    // High-altitude Golden Sky-Rings for soaring Solar Grapple flight!
    skyRings.push({
      id: `ring_outer_${sx}_${sz}`,
      x: sx * 24,
      y: 15.5,
      z: sz * 24,
      radius: 2.6,
    });

    // Mid-ring closer to the central spire
    skyRings.push({
      id: `ring_inner_${sx}_${sz}`,
      x: sx * 13.5,
      y: 19.5,
      z: sz * 13.5,
      radius: 2.3,
    });
  }

  return { boxes, jumpPads, skyRings };
}
