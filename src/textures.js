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
 * Generates photorealistic procedural PBR material sets (Albedo + Bump + Roughness)
 * designed to catch real PMREM golden-hour sky reflections.
 */
export function createSanctuaryMaterials() {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // ---- 1. POLISHED CARRARA / TRAVERTINE MARBLE WITH GOLD INLAY ----
  const mCol = makeCanvas(512);
  const mc = mCol.getContext('2d');
  mc.fillStyle = '#F2ECE1';
  mc.fillRect(0, 0, 512, 512);

  const mRough = makeCanvas(512);
  const mr = mRough.getContext('2d');
  mr.fillStyle = '#484848'; // Smooth polished stone
  mr.fillRect(0, 0, 512, 512);

  const mBump = makeCanvas(512);
  const mb = mBump.getContext('2d');
  mb.fillStyle = '#E4E4E4';
  mb.fillRect(0, 0, 512, 512);

  // Fine mineral grain & subtle stone variation
  for (let i = 0; i < 900; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const s = 2 + rand() * 14;
    const shade = 228 + Math.floor(rand() * 20);
    mc.fillStyle = `rgba(${shade}, ${shade - 6}, ${shade - 14}, 0.25)`;
    mc.fillRect(x, y, s, s);
    const rv = 55 + Math.floor(rand() * 45);
    mr.fillStyle = `rgba(${rv}, ${rv}, ${rv}, 0.3)`;
    mr.fillRect(x, y, s * 1.4, s * 1.4);
  }

  // Natural flowing marble veins
  for (let i = 0; i < 65; i++) {
    mc.strokeStyle = i % 3 === 0 ? 'rgba(176, 156, 128, 0.24)' : 'rgba(110, 102, 94, 0.14)';
    mc.lineWidth = 0.8 + rand() * 3.2;
    mc.beginPath();
    let x = rand() * 512;
    let y = rand() * 512;
    mc.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += (rand() - 0.35) * 85;
      y += (rand() - 0.5) * 65;
      mc.lineTo(x, y);
    }
    mc.stroke();
  }

  // Beveled stone tiles with recessed brushed-gold grout
  const step = 128;
  for (let g = 0; g < 512; g += step) {
    mc.strokeStyle = 'rgba(205, 160, 66, 0.55)';
    mc.lineWidth = 3;
    mc.beginPath();
    mc.moveTo(g, 0);
    mc.lineTo(g, 512);
    mc.moveTo(0, g);
    mc.lineTo(512, g);
    mc.stroke();

    mb.strokeStyle = '#3A3A3A';
    mb.lineWidth = 5;
    mb.beginPath();
    mb.moveTo(g, 0);
    mb.lineTo(g, 512);
    mb.moveTo(0, g);
    mb.lineTo(512, g);
    mb.stroke();

    mr.strokeStyle = '#B0B0B0'; // Rougher grout seams
    mr.lineWidth = 5;
    mr.beginPath();
    mr.moveTo(g, 0);
    mr.lineTo(g, 512);
    mr.moveTo(0, g);
    mr.lineTo(512, g);
    mr.stroke();
  }

  const marble = new THREE.MeshStandardMaterial({
    map: finalizeTexture(mCol, 3, 3, true),
    bumpMap: finalizeTexture(mBump, 3, 3, false),
    bumpScale: 0.08,
    roughnessMap: finalizeTexture(mRough, 3, 3, false),
    roughness: 0.72,
    metalness: 0.12,
    envMapIntensity: 1.15,
  });

  // ---- 2. POLISHED VOLCANIC OBSIDIAN WITH GOLD ARCHITECTURE INLAY ----
  const oCol = makeCanvas(512);
  const oc = oCol.getContext('2d');
  oc.fillStyle = '#18181D';
  oc.fillRect(0, 0, 512, 512);

  const oRough = makeCanvas(512);
  const or = oRough.getContext('2d');
  or.fillStyle = '#383838';
  or.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 800; i++) {
    const shade = 20 + Math.floor(rand() * 18);
    oc.fillStyle = `rgba(${shade}, ${shade}, ${shade + 5}, 0.6)`;
    const x = rand() * 512;
    const y = rand() * 512;
    const w = 4 + rand() * 20;
    const h = 4 + rand() * 20;
    oc.fillRect(x, y, w, h);
    const rv = 42 + Math.floor(rand() * 48);
    or.fillStyle = `rgb(${rv},${rv},${rv})`;
    or.fillRect(x, y, w, h);
  }

  // Ornate gold geometric trim
  oc.strokeStyle = '#D9A741';
  oc.lineWidth = 5;
  oc.strokeRect(16, 16, 480, 480);
  oc.strokeStyle = 'rgba(217, 167, 65, 0.45)';
  oc.lineWidth = 2;
  oc.strokeRect(42, 42, 428, 428);
  oc.beginPath();
  oc.moveTo(256, 16);
  oc.lineTo(256, 496);
  oc.moveTo(16, 256);
  oc.lineTo(496, 256);
  oc.stroke();

  const obsidian = new THREE.MeshStandardMaterial({
    map: finalizeTexture(oCol, 1, 1, true),
    bumpMap: finalizeTexture(mBump, 1, 1, false),
    bumpScale: 0.06,
    roughnessMap: finalizeTexture(oRough, 1, 1, false),
    roughness: 0.6,
    metalness: 0.58,
    envMapIntensity: 1.4,
  });

  // ---- 3. ANISOTROPIC BRUSHED SANCTUARY GOLD ----
  const gCol = makeCanvas(256);
  const gc = gCol.getContext('2d');
  const gGrad = gc.createLinearGradient(0, 0, 256, 256);
  gGrad.addColorStop(0, '#F0CA6C');
  gGrad.addColorStop(0.5, '#C89228');
  gGrad.addColorStop(1, '#F6DA88');
  gc.fillStyle = gGrad;
  gc.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    gc.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(70,42,4,0.08)';
    gc.fillRect(0, y, 256, 1);
  }

  const gold = new THREE.MeshStandardMaterial({
    map: finalizeTexture(gCol, 1, 2, true),
    roughness: 0.2,
    metalness: 0.92,
    emissive: new THREE.Color('#3D2404'),
    emissiveIntensity: 0.2,
    envMapIntensity: 1.75,
  });

  // ---- 4. KINETIC WALL-RUN CHEVRON MONOLITH ----
  const wCol = makeCanvas(512);
  const wc = wCol.getContext('2d');
  wc.fillStyle = '#1D1B20';
  wc.fillRect(0, 0, 512, 512);

  wc.strokeStyle = '#F04E23';
  wc.lineWidth = 18;
  for (let x = -256; x < 768; x += 88) {
    wc.beginPath();
    wc.moveTo(x, 512);
    wc.lineTo(x + 256, 256);
    wc.lineTo(x, 0);
    wc.stroke();
  }
  wc.strokeStyle = '#F7C948';
  wc.lineWidth = 7;
  wc.strokeRect(10, 10, 492, 492);

  const wallrun = new THREE.MeshStandardMaterial({
    map: finalizeTexture(wCol, 2, 1, true),
    roughness: 0.26,
    metalness: 0.5,
    emissive: new THREE.Color('#6E1F0B'),
    emissiveIntensity: 0.45,
    envMapIntensity: 1.3,
  });

  return { marble, obsidian, gold, wallrun };
}

/**
 * Soft radial-gradient cloud puff texture for realistic volumetric cloud sea.
 */
export function createCloudPuffTexture() {
  const c = makeCanvas(256);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 16, 128, 128, 124);
  grad.addColorStop(0, 'rgba(255, 245, 232, 0.85)');
  grad.addColorStop(0.45, 'rgba(248, 224, 194, 0.48)');
  grad.addColorStop(0.78, 'rgba(235, 198, 160, 0.14)');
  grad.addColorStop(1, 'rgba(235, 198, 160, 0.0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
