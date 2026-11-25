// 3 Full Playable 3D Maps with distinct tactical layouts, architectural sets,
// Poly Haven HDRI environments, lighting, water/ice surfaces, and supply drop pads.

export const MAP_CATALOG = [
  {
    id: 'aegis',
    name: 'AEGIS POINT',
    subtitle: 'COASTAL CITADEL · MEDITERRANEAN',
    hdri: 'quarry_01_1k',
    exposure: 0.95,
    sunPos: [-65, 62, 52],
    sunColor: 0xfff3de,
    sunIntensity: 2.85,
    hemiSky: 0xaad4ff,
    hemiGround: 0x786e5e,
    fogColor: 0xc2d5e3,
    fogDensity: 0.0016,
    waterColor: 0x0b364d,
    waterY: -11.5,
    cliffMaterial: 'cliffRock',
    trees: 'cypress',
    mountainColor: 0x5c6a76,
    spawn: { x: 0, y: 1.5, z: 18 },
  },
  {
    id: 'helios',
    name: 'HELIOS FOUNDRY',
    subtitle: 'SUNSET REFINERY · RED CANYON',
    hdri: 'venice_sunset_1k',
    exposure: 1.05,
    sunPos: [-82, 34, -48],
    sunColor: 0xffb77a,
    sunIntensity: 3.1,
    hemiSky: 0xffc694,
    hemiGround: 0x5e3c28,
    fogColor: 0xd19c77,
    fogDensity: 0.0021,
    waterColor: 0x26323e,
    waterY: -12.5,
    cliffMaterial: 'sandstone',
    trees: 'none',
    mountainColor: 0x784c36,
    spawn: { x: 0, y: 1.5, z: 20 },
  },
  {
    id: 'frostpeak',
    name: 'FROSTPEAK',
    subtitle: 'ARCTIC RESEARCH OUTPOST · GLACIER',
    hdri: 'blouberg_sunrise_2_1k',
    exposure: 0.98,
    sunPos: [72, 42, -55],
    sunColor: 0xffe8d2,
    sunIntensity: 2.65,
    hemiSky: 0xbadcff,
    hemiGround: 0x8ea4b8,
    fogColor: 0xc6dae8,
    fogDensity: 0.0019,
    waterColor: 0x0a2538,
    waterY: -10.5,
    cliffMaterial: 'glacierIce',
    trees: 'pine',
    mountainColor: 0x8fa3b4,
    spawn: { x: 0, y: 1.5, z: 18 },
  },
];

export function getMapMeta(mapId) {
  return MAP_CATALOG.find((m) => m.id === mapId) || MAP_CATALOG[0];
}

/**
 * Generates exact 1:1 physics + architectural layout for the selected map.
 */
export function buildMapLayout(mapId = 'aegis') {
  const boxes = [];
  const jumpPads = [];
  const skyRings = [];
  const supplyPads = [];
  const props = []; // Non-collider or detailed set dressing markers (shipping containers, helipads, radar domes, solar arrays)

  if (mapId === 'helios') {
    // ---- MAP 2: HELIOS FOUNDRY (Asymmetric Industrial Sunset Canyon Refinery) ----
    // Huge central concrete refinery tarmac
    boxes.push({ x: 0, y: -2.0, z: 0, w: 42, h: 4.0, d: 44, material: 'concrete' });
    // Central Smelter Reactor Silo (tall industrial core)
    boxes.push({ x: 0, y: 8.5, z: -2, w: 5.5, h: 17.0, d: 5.5, material: 'darkSteel' });
    boxes.push({ x: 0, y: 0.8, z: -2, w: 12, h: 1.6, d: 12, material: 'concrete' });

    // Elevated Twin Industrial Catwalk Bridges spanning East-West & North-South
    boxes.push({ x: -24, y: 3.5, z: 0, w: 10, h: 1.5, d: 34, material: 'darkSteel' });
    boxes.push({ x: 24, y: 3.5, z: 0, w: 10, h: 1.5, d: 34, material: 'darkSteel' });
    // Steps up to East & West Catwalk Terraces
    for (const sx of [-18.5, 18.5]) {
      boxes.push({ x: sx, y: 0.7, z: 10, w: 2.2, h: 1.4, d: 6.5, material: 'concrete' });
      boxes.push({ x: sx, y: 1.6, z: 6, w: 2.2, h: 3.2, d: 5.0, material: 'concrete' });
    }
    // North Helipad & Foundry Command Overlook (y top = 6.2)
    boxes.push({ x: 0, y: 5.2, z: -30, w: 24, h: 2.0, d: 16, material: 'concrete' });
    boxes.push({ x: 0, y: 2.0, z: -21, w: 9, h: 1.2, d: 6, material: 'darkSteel' });
    // South Freight Loading Dock
    boxes.push({ x: 0, y: -1.0, z: 32, w: 22, h: 3.5, d: 16, material: 'sandstone' });

    // Shipping Containers as realistic urban tactical cover!
    const containers = [
      [-11, 1.45, 9, 2.8, 2.9, 6.8, 'crateRust'],
      [11, 1.45, 9, 2.8, 2.9, 6.8, 'crateOlive'],
      [-12, 1.45, -11, 6.8, 2.9, 2.8, 'crateOlive'],
      [12, 1.45, -11, 6.8, 2.9, 2.8, 'crateRust'],
      [-24, 5.65, -8, 2.8, 2.9, 6.8, 'crateRust'],
      [24, 5.65, 8, 2.8, 2.9, 6.8, 'crateOlive'],
    ];
    for (const [cx, cy, cz, cw, ch, cd, mat] of containers) {
      boxes.push({ x: cx, y: cy, z: cz, w: cw, h: ch, d: cd, material: mat, isContainer: true });
    }

    // 4 Reinforced Industrial Wall-Run Bulkheads
    for (const [wx, wy, wz] of [
      [-17, 6.2, -16],
      [17, 6.2, -16],
      [-17, 6.2, 14],
      [17, 6.2, 14],
    ]) {
      boxes.push({ x: wx, y: wy, z: wz, w: 1.5, h: 7.5, d: 14, material: 'wallrun', wallRun: true });
    }

    // Launch Turbines & Grapple Anchors
    jumpPads.push(
      { x: -15, y: 0.15, z: 2, radius: 2.3, boostY: 22, boostHoriz: 6 },
      { x: 15, y: 0.15, z: 2, radius: 2.3, boostY: 22, boostHoriz: 6 },
      { x: 0, y: 0.85, z: 29, radius: 2.3, boostY: 23, boostHoriz: 8 },
      { x: 0, y: 6.35, z: -26, radius: 2.3, boostY: 21, boostHoriz: 9 }
    );
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      skyRings.push(
        { id: `h_outer_${sx}_${sz}`, x: sx * 22, y: 15.8, z: sz * 20, radius: 2.3 },
        { id: `h_inner_${sx}_${sz}`, x: sx * 12, y: 19.2, z: sz * 12, radius: 2.0 }
      );
    }
    supplyPads.push(
      { id: 'sup_w', x: -24, y: 4.3, z: 0, kind: 'med' },
      { id: 'sup_e', x: 24, y: 4.3, z: 0, kind: 'armor' },
      { id: 'sup_n', x: 0, y: 6.25, z: -32, kind: 'med' }
    );
    props.push({ kind: 'helipad', x: 0, y: 6.24, z: -31, radius: 5.5 });
    return { boxes, jumpPads, skyRings, supplyPads, props };
  }

  if (mapId === 'frostpeak') {
    // ---- MAP 3: FROSTPEAK (Arctic Glacier Research Outpost) ----
    // Frozen Glacier Ice Courtyard + Dark Steel Research Pads
    boxes.push({ x: 0, y: -2.0, z: 0, w: 40, h: 4.0, d: 40, material: 'glacierIce' });
    // Central Steel Command Bunker Platform (y top = 1.4)
    boxes.push({ x: 0, y: 0.7, z: 0, w: 14, h: 1.4, d: 14, material: 'darkSteel' });
    // Tall Polar Radome Communications Tower
    boxes.push({ x: 0, y: 9.0, z: 0, w: 3.8, h: 16.0, d: 3.8, material: 'concrete' });

    // Steps around bunker
    for (const [sx, sz, sw, sd] of [[0, -8.2, 6.5, 2.4], [0, 8.2, 6.5, 2.4], [-8.2, 0, 2.4, 6.5], [8.2, 0, 2.4, 6.5]]) {
      boxes.push({ x: sx, y: 0.35, z: sz, w: sw, h: 0.7, d: sd, material: 'darkSteel' });
    }

    // 4 Radial Heated Steel Research Bridges & Elevated Glacier Outpost Shelves
    for (const { dx, dz } of [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }]) {
      const isZ = dz !== 0;
      boxes.push({
        x: dx * 26, y: -0.9, z: dz * 26,
        w: isZ ? 9.5 : 14, h: 2.0, d: isZ ? 14 : 9.5,
        material: 'darkSteel',
      });
      boxes.push({
        x: dx * 40, y: -0.6, z: dz * 40,
        w: 18, h: 4.2, d: 18,
        material: 'glacierIce',
      });
      boxes.push({
        x: dx * 31.2, y: 0.35, z: dz * 31.2,
        w: isZ ? 9.5 : 2.2, h: 0.7, d: isZ ? 2.2 : 9.5,
        material: 'concrete',
      });
      // Insulated research shelter container on each glacier island
      boxes.push({
        x: dx * 43, y: 2.9, z: dz * 43,
        w: isZ ? 8.2 : 3.2, h: 3.0, d: isZ ? 3.2 : 8.2,
        material: 'crateOlive',
        isContainer: true,
      });
      jumpPads.push({ x: dx * 34.5, y: 1.65, z: dz * 34.5, radius: 2.3, boostY: 23, boostHoriz: 8.5 });
    }

    // Diagonal Glacial Overlook Towers & Wall-Run Bulkheads
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      boxes.push({ x: sx * 27, y: 6.8, z: sz * 27, w: 12, h: 2.2, d: 12, material: 'darkSteel' });
      boxes.push({ x: sx * 27, y: -1.8, z: sz * 27, w: 6.2, h: 15.0, d: 6.2, material: 'glacierIce' });
      boxes.push({ x: sx * 20, y: 4.6, z: sz * 20, w: 1.5, h: 7.8, d: 13.5, material: 'wallrun', wallRun: true });
      // Cover shipping crates on courtyard corners
      boxes.push({ x: sx * 12, y: 1.15, z: sz * 11, w: 3.4, h: 2.3, d: 2.2, material: 'crateRust', isContainer: true });
      skyRings.push(
        { id: `f_outer_${sx}_${sz}`, x: sx * 24, y: 15.5, z: sz * 24, radius: 2.3 },
        { id: `f_inner_${sx}_${sz}`, x: sx * 13.5, y: 19.0, z: sz * 13.5, radius: 2.0 }
      );
    }

    supplyPads.push(
      { id: 'sup_n', x: 0, y: 1.6, z: -38, kind: 'med' },
      { id: 'sup_e', x: 38, y: 1.6, z: 0, kind: 'armor' },
      { id: 'sup_w', x: -38, y: 1.6, z: 0, kind: 'med' }
    );
    props.push({ kind: 'radome', x: 0, y: 18.2, z: 0, radius: 3.2 });
    props.push({ kind: 'helipad', x: 0, y: 1.56, z: 39, radius: 5.2 });
    return { boxes, jumpPads, skyRings, supplyPads, props };
  }

  // ---- MAP 1 (DEFAULT): AEGIS POINT (Mediterranean Coastal Fortress Citadel) ----
  boxes.push({ x: 0, y: -2.0, z: 0, w: 38, h: 4.0, d: 38, material: 'limestone' });
  boxes.push({ x: 0, y: 0.6, z: 0, w: 12, h: 1.2, d: 12, material: 'concrete' });
  boxes.push({ x: 0, y: 9.6, z: 0, w: 3.2, h: 16.8, d: 3.2, material: 'darkSteel' });

  for (const [sx, sz, sw, sh, sd] of [
    [0, -7.2, 6.4, 0.6, 2.4],
    [0, 7.2, 6.4, 0.6, 2.4],
    [-7.2, 0, 2.4, 0.6, 6.4],
    [7.2, 0, 2.4, 0.6, 6.4],
  ]) {
    boxes.push({ x: sx, y: 0.3, z: sz, w: sw, h: sh, d: sd, material: 'limestone' });
  }

  // Realistic Concrete Jersey Barriers & Military Shipping Containers on Courtyard (clear central axis!)
  const covers = [
    [-11.5, 0.7, -9.5, 3.8, 1.4, 1.0, 'concrete', false],
    [11.5, 0.7, -9.5, 3.8, 1.4, 1.0, 'concrete', false],
    [-11.5, 0.7, 9.5, 3.8, 1.4, 1.0, 'concrete', false],
    [11.5, 0.7, 9.5, 3.8, 1.4, 1.0, 'concrete', false],
    [-14.5, 1.35, -4.5, 2.4, 2.7, 5.2, 'crateOlive', true],
    [14.5, 1.35, 4.5, 2.4, 2.7, 5.2, 'crateRust', true],
    [-6.2, 0.9, -14.5, 3.4, 1.8, 1.8, 'darkSteel', false],
    [6.2, 0.9, 14.5, 3.4, 1.8, 1.8, 'darkSteel', false],
  ];
  for (const [cx, cy, cz, cw, ch, cd, mat, isContainer] of covers) {
    boxes.push({ x: cx, y: cy, z: cz, w: cw, h: ch, d: cd, material: mat, isContainer });
  }

  for (const { dx, dz } of [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }]) {
    const isZ = dz !== 0;
    boxes.push({ x: dx * 25, y: -1.0, z: dz * 25, w: isZ ? 9.2 : 14, h: 2.0, d: isZ ? 14 : 9.2, material: 'concrete' });
    boxes.push({ x: dx * 39.5, y: -0.9, z: dz * 39.5, w: 17.5, h: 4.2, d: 17.5, material: 'limestone' });
    boxes.push({ x: dx * 30.8, y: 0.3, z: dz * 30.8, w: isZ ? 9.2 : 2.2, h: 0.6, d: isZ ? 2.2 : 9.2, material: 'darkSteel' });

    const px1 = dx * 45 + (isZ ? -6.5 : 0);
    const pz1 = dz * 45 + (isZ ? 0 : -6.5);
    const px2 = dx * 45 + (isZ ? 6.5 : 0);
    const pz2 = dz * 45 + (isZ ? 0 : 6.5);
    boxes.push({ x: px1, y: 6.2, z: pz1, w: 2.2, h: 10.0, d: 2.2, material: 'concrete' });
    boxes.push({ x: px2, y: 6.2, z: pz2, w: 2.2, h: 10.0, d: 2.2, material: 'concrete' });
    boxes.push({ x: dx * 45, y: 11.8, z: dz * 45, w: isZ ? 15.8 : 2.6, h: 1.4, d: isZ ? 2.6 : 15.8, material: 'darkSteel' });
    boxes.push({ x: dx * 41.5, y: 2.0, z: dz * 41.5, w: isZ ? 6.2 : 1.1, h: 1.6, d: isZ ? 1.1 : 6.2, material: 'concrete' });

    jumpPads.push({ x: dx * 34, y: 1.35, z: dz * 34, radius: 2.3, boostY: 22.8, boostHoriz: 8.5 });
  }

  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    boxes.push({ x: sx * 27.5, y: 6.4, z: sz * 27.5, w: 11.5, h: 2.0, d: 11.5, material: 'concrete' });
    boxes.push({ x: sx * 27.5, y: -1.8, z: sz * 27.5, w: 5.5, h: 14.5, d: 5.5, material: 'cliffRock' });
    boxes.push({ x: sx * 20, y: 4.4, z: sz * 20, w: 1.5, h: 7.8, d: 13.5, material: 'wallrun', wallRun: true });
    skyRings.push(
      { id: `anchor_outer_${sx}_${sz}`, x: sx * 24, y: 15.2, z: sz * 24, radius: 2.3 },
      { id: `anchor_inner_${sx}_${sz}`, x: sx * 13.5, y: 18.8, z: sz * 13.5, radius: 2.0 }
    );
  }

  supplyPads.push(
    { id: 'sup_n', x: 0, y: 1.35, z: -38.5, kind: 'med' },
    { id: 'sup_e', x: 38.5, y: 1.35, z: 0, kind: 'armor' },
    { id: 'sup_w', x: -38.5, y: 1.35, z: 0, kind: 'med' }
  );
  props.push({ kind: 'helipad', x: 0, y: 1.24, z: 38.5, radius: 5.2 });
  props.push({ kind: 'solar_deck' });

  return { boxes, jumpPads, skyRings, supplyPads, props };
}
