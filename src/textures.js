import * as THREE from 'three';

function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function finalizeTexture(canvas, repeatX = 1, repeatY = 1, isColor = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates handcrafted procedural PBR textures (albedo + bump) for
 * Fluted Alabaster Marble, Carved Obsidian, Brushed Gold, and Kinetic Wall-Run Panels.
 */
export function createSanctuaryMaterials() {
  // ---- 1. ALABASTER MARBLE WITH GOLD GROUT ----
  const mCol = makeCanvas(512);
  const mc = mCol.getContext('2d');
  mc.fillStyle = '#F3ECE1';
  mc.fillRect(0, 0, 512, 512);

  // Organic warm marble veins
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 45; i++) {
    mc.strokeStyle = i % 3 === 0 ? 'rgba(182, 166, 142, 0.22)' : 'rgba(128, 118, 106, 0.12)';
    mc.lineWidth = 1 + rand() * 3.5;
    mc.beginPath();
    let x = rand() * 512;
    let y = rand() * 512;
    mc.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (rand() - 0.35) * 90;
      y += (rand() - 0.5) * 70;
      mc.lineTo(x, y);
    }
    mc.stroke();
  }

  // Architectural stone tile grid with subtle gold inlay seams
  const mBump = makeCanvas(512);
  const mb = mBump.getContext('2d');
  mb.fillStyle = '#E0E0E0';
  mb.fillRect(0, 0, 512, 512);

  const step = 128;
  for (let gx = 0; gx < 512; gx += step) {
    mc.strokeStyle = 'rgba(196, 150, 58, 0.42)';
    mc.lineWidth = 3;
    mc.beginPath();
    mc.moveTo(gx, 0);
    mc.lineTo(gx, 512);
    mc.stroke();

    mb.strokeStyle = '#555555';
    mb.lineWidth = 4;
    mb.beginPath();
    mb.moveTo(gx, 0);
    mb.lineTo(gx, 512);
    mb.stroke();
  }
  for (let gy = 0; gy < 512; gy += step) {
    mc.strokeStyle = 'rgba(196, 150, 58, 0.42)';
    mc.lineWidth = 3;
    mc.beginPath();
    mc.moveTo(0, gy);
    mc.lineTo(512, gy);
    mc.stroke();

    mb.strokeStyle = '#555555';
    mb.lineWidth = 4;
    mb.beginPath();
    mb.moveTo(0, gy);
    mb.lineTo(512, gy);
    mb.stroke();
  }

  const marble = new THREE.MeshStandardMaterial({
    map: finalizeTexture(mCol, 3, 3, true),
    bumpMap: finalizeTexture(mBump, 3, 3, false),
    bumpScale: 0.06,
    roughness: 0.34,
    metalness: 0.08,
  });

  // ---- 2. CARVED OBSIDIAN WITH GOLD RUNES ----
  const oCol = makeCanvas(512);
  const oc = oCol.getContext('2d');
  oc.fillStyle = '#1E1D21';
  oc.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 600; i++) {
    const shade = 24 + Math.floor(rand() * 20);
    oc.fillStyle = `rgb(${shade},${shade},${shade + 4})`;
    oc.fillRect(rand() * 512, rand() * 512, 4 + rand() * 16, 4 + rand() * 16);
  }
  // Geometric inlaid brass borders
  oc.strokeStyle = '#C9963B';
  oc.lineWidth = 4;
  oc.strokeRect(18, 18, 476, 476);
  oc.strokeStyle = 'rgba(201, 150, 59, 0.45)';
  oc.lineWidth = 2;
  oc.strokeRect(42, 42, 428, 428);
  oc.beginPath();
  oc.moveTo(256, 18);
  oc.lineTo(256, 494);
  oc.moveTo(18, 256);
  oc.lineTo(494, 256);
  oc.stroke();

  const obsidian = new THREE.MeshStandardMaterial({
    map: finalizeTexture(oCol, 1, 1, true),
    bumpMap: finalizeTexture(mBump, 1, 1, false),
    bumpScale: 0.05,
    roughness: 0.32,
    metalness: 0.42,
  });

  // ---- 3. BRUSHED SANCTUARY GOLD ----
  const gCol = makeCanvas(256);
  const gc = gCol.getContext('2d');
  const gGrad = gc.createLinearGradient(0, 0, 256, 256);
  gGrad.addColorStop(0, '#E8C163');
  gGrad.addColorStop(0.5, '#C89228');
  gGrad.addColorStop(1, '#F2D078');
  gc.fillStyle = gGrad;
  gc.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    gc.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(90,55,5,0.08)';
    gc.fillRect(0, y, 256, 1);
  }

  const gold = new THREE.MeshStandardMaterial({
    map: finalizeTexture(gCol, 1, 2, true),
    roughness: 0.24,
    metalness: 0.82,
    emissive: new THREE.Color('#472D06'),
    emissiveIntensity: 0.25,
  });

  // ---- 4. KINETIC WALL-RUN CHEVRON MONOLITH ----
  const wCol = makeCanvas(512);
  const wc = wCol.getContext('2d');
  wc.fillStyle = '#242126';
  wc.fillRect(0, 0, 512, 512);

  // Diagonal luminous vermilion-gold speed chevrons so wall-runnable surfaces pop immediately!
  wc.strokeStyle = '#E84A27';
  wc.lineWidth = 18;
  for (let x = -256; x < 768; x += 92) {
    wc.beginPath();
    wc.moveTo(x, 512);
    wc.lineTo(x + 256, 256);
    wc.lineTo(x, 0);
    wc.stroke();
  }
  wc.strokeStyle = '#F5C451';
  wc.lineWidth = 6;
  wc.strokeRect(10, 10, 492, 492);

  const wallrun = new THREE.MeshStandardMaterial({
    map: finalizeTexture(wCol, 2, 1, true),
    roughness: 0.28,
    metalness: 0.38,
    emissive: new THREE.Color('#5A1A0C'),
    emissiveIntensity: 0.35,
  });

  return { marble, obsidian, gold, wallrun };
}
