// Shared 1:1 tactical geometry for AEGIS POINT — a coastal cliffside limestone & steel
// solar fortress rising out of the ocean. Every collider box matches rendered 3D architecture.

export function buildArenaData() {
  const boxes = [];
  const jumpPads = [];
  const grappleAnchors = [];

  // 1. Main Coastal Fortress Courtyard Deck (y top = 0)
  boxes.push({ x: 0, y: -2.0, z: 0, w: 38, h: 4.0, d: 38, material: 'limestone' });

  // Central Recessed Solar Collector Pedestal (y top = 1.2)
  boxes.push({ x: 0, y: 0.6, z: 0, w: 12, h: 1.2, d: 12, material: 'concrete' });
  // Central Relay Spire Core (tall steel & concrete beacon tower)
  boxes.push({ x: 0, y: 9.6, z: 0, w: 3.2, h: 16.8, d: 3.2, material: 'darkSteel' });

  // 4 wide limestone approach steps up to central relay pedestal
  const steps = [
    [0, -7.2, 6.4, 0.6, 2.4],
    [0, 7.2, 6.4, 0.6, 2.4],
    [-7.2, 0, 2.4, 0.6, 6.4],
    [7.2, 0, 2.4, 0.6, 6.4],
  ];
  for (const [sx, sz, sw, sh, sd] of steps) {
    boxes.push({ x: sx, y: 0.3, z: sz, w: sw, h: sh, d: sd, material: 'limestone' });
  }

  // Tactical Concrete Jersey Barriers & Military Cover Crates on Courtyard (clear central lanes!)
  const covers = [
    [-11.5, 0.7, -9.5, 3.8, 1.4, 1.0, 'concrete'],
    [11.5, 0.7, -9.5, 3.8, 1.4, 1.0, 'concrete'],
    [-11.5, 0.7, 9.5, 3.8, 1.4, 1.0, 'concrete'],
    [11.5, 0.7, 9.5, 3.8, 1.4, 1.0, 'concrete'],
    [-14.5, 0.9, -4.5, 1.8, 1.8, 3.2, 'darkSteel'],
    [14.5, 0.9, 4.5, 1.8, 1.8, 3.2, 'darkSteel'],
    [-5.5, 0.9, -14.5, 3.2, 1.8, 1.8, 'darkSteel'],
    [5.5, 0.9, 14.5, 3.2, 1.8, 1.8, 'darkSteel'],
  ];
  for (const [cx, cy, cz, cw, ch, cd, mat] of covers) {
    boxes.push({ x: cx, y: cy, z: cz, w: cw, h: ch, d: cd, material: mat });
  }

  // 2. Four Cardinal Steel Bridges & Outer Cliffside Bastions
  const cardinals = [
    { dx: 0, dz: -1 },
    { dx: 0, dz: 1 },
    { dx: -1, dz: 0 },
    { dx: 1, dz: 0 },
  ];

  for (const { dx, dz } of cardinals) {
    const isZ = dz !== 0;

    // Industrial Steel & Limestone Bridge Deck
    boxes.push({
      x: dx * 25,
      y: -1.0,
      z: dz * 25,
      w: isZ ? 9.2 : 14,
      h: 2.0,
      d: isZ ? 14 : 9.2,
      material: 'concrete',
    });

    // Outer Fortress Bastion Platform (y top = 1.2)
    boxes.push({
      x: dx * 39.5,
      y: -0.9,
      z: dz * 39.5,
      w: 17.5,
      h: 4.2,
      d: 17.5,
      material: 'limestone',
    });

    // Step-up ramp lip onto outer bastion
    boxes.push({
      x: dx * 30.8,
      y: 0.3,
      z: dz * 30.8,
      w: isZ ? 9.2 : 2.2,
      h: 0.6,
      d: isZ ? 2.2 : 9.2,
      material: 'darkSteel',
    });

    // Reinforced Concrete Battlement Parapet & Twin Lookout Columns
    const px1 = dx * 45 + (isZ ? -6.5 : 0);
    const pz1 = dz * 45 + (isZ ? 0 : -6.5);
    const px2 = dx * 45 + (isZ ? 6.5 : 0);
    const pz2 = dz * 45 + (isZ ? 0 : 6.5);
    boxes.push({ x: px1, y: 6.2, z: pz1, w: 2.2, h: 10.0, d: 2.2, material: 'concrete' });
    boxes.push({ x: px2, y: 6.2, z: pz2, w: 2.2, h: 10.0, d: 2.2, material: 'concrete' });
    // Overhead steel gantry lintel
    boxes.push({
      x: dx * 45,
      y: 11.8,
      z: dz * 45,
      w: isZ ? 15.8 : 2.6,
      h: 1.4,
      d: isZ ? 2.6 : 15.8,
      material: 'darkSteel',
    });

    // Low concrete bunker wall for cover on outer bastion
    boxes.push({
      x: dx * 41.5,
      y: 2.0,
      z: dz * 41.5,
      w: isZ ? 6.2 : 1.1,
      h: 1.6,
      d: isZ ? 1.1 : 6.2,
      material: 'concrete',
    });

    // Pneumatic Thermal Launch Turbine
    jumpPads.push({
      x: dx * 34,
      y: 1.35,
      z: dz * 34,
      radius: 2.3,
      boostY: 22.8,
      boostHoriz: 8.5,
    });
  }

  // 3. Four Diagonal Sniper Watchtowers, Reinforced Wall-Run Bulkheads & Overhead Grapple Anchors
  const diagonals = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (const [sx, sz] of diagonals) {
    // Elevated Watchtower Deck (y top = 7.4)
    boxes.push({
      x: sx * 27.5,
      y: 6.4,
      z: sz * 27.5,
      w: 11.5,
      h: 2.0,
      d: 11.5,
      material: 'concrete',
    });
    // Support column underneath watchtower reaching down to the sea cliff
    boxes.push({
      x: sx * 27.5,
      y: -1.8,
      z: sz * 27.5,
      w: 5.5,
      h: 14.5,
      d: 5.5,
      material: 'cliffRock',
    });

    // Industrial Steel Wall-Run Bulkhead bridging courtyard & watchtowers
    boxes.push({
      x: sx * 20,
      y: 4.4,
      z: sz * 20,
      w: 1.5,
      h: 7.8,
      d: 13.5,
      material: 'wallrun',
      wallRun: true,
    });

    // High-altitude Steel Grapple Anchor Beacons
    grappleAnchors.push({
      id: `anchor_outer_${sx}_${sz}`,
      x: sx * 24,
      y: 15.2,
      z: sz * 24,
      radius: 2.3,
    });
    grappleAnchors.push({
      id: `anchor_inner_${sx}_${sz}`,
      x: sx * 13.5,
      y: 18.8,
      z: sz * 13.5,
      radius: 2.0,
    });
  }

  return { boxes, jumpPads, skyRings: grappleAnchors };
}
