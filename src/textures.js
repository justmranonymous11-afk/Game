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

// Fast tileable deterministic 2D value noise for organic stone, rock, concrete & water normals
function hash2(ix, iy, seed) {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function tileableNoise(u, v, period, seed) {
  const x = u * period;
  const y = v * period;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const x0 = ((ix % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y0 = ((iy % period) + period) % period;
  const y1 = (y0 + 1) % period;

  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);

  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function tileableFbm(u, v, basePeriod, octaves, seed) {
  let val = 0;
  let amp = 0.5;
  let norm = 0;
  let p = basePeriod;
  for (let o = 0; o < octaves; o++) {
    val += tileableNoise(u, v, p, seed + o * 31) * amp;
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return val / norm;
}

/**
 * Converts a 2D grayscale height canvas into a true tangent-space RGB Normal Map
 * using a 3x3 Sobel filter so directional sunlight & sky reflections catch micro-relief!
 */
function canvasToNormalTexture(heightCanvas, strength = 2.6, repeatX = 1, repeatY = 1) {
  const size = heightCanvas.width;
  const src = heightCanvas.getContext('2d').getImageData(0, 0, size, size).data;
  const out = new Uint8Array(size * size * 4);

  const sample = (x, y) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return src[(wy * size + wx) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const inv = 1 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      out[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((dz * inv * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(out, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a tileable normal map for Three.js Water.js real-time reflective ocean.
 */
export function createWaterNormalTexture() {
  const size = 256;
  const hCanvas = makeCanvas(size);
  const ctx = hCanvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const w1 = tileableFbm(u, v, 6, 4, 701);
      const w2 = Math.sin(u * Math.PI * 8 + v * Math.PI * 4) * 0.12 + Math.cos(v * Math.PI * 10) * 0.08;
      const val = Math.max(0, Math.min(255, Math.round((w1 * 0.8 + w2 + 0.1) * 255)));
      const idx = (y * size + x) * 4;
      img.data[idx] = val;
      img.data[idx + 1] = val;
      img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvasToNormalTexture(hCanvas, 2.2, 1, 1);
}

/**
 * Generates grounded, photorealistic PBR material sets (Albedo + Sobel Normal Map + Roughness Map)
 * for Aegis Point's coastal limestone, architectural concrete, gunmetal steel, solar arrays, and basalt cliffs.
 */
export function createRealisticMaterials() {
  // ---- 1. ARCHITECTURAL WEATHERED LIMESTONE ASHLAR (Main Plaza & Courtyard) ----
  const lSize = 256;
  const lCol = makeCanvas(lSize);
  const lHgt = makeCanvas(lSize);
  const lRgh = makeCanvas(lSize);
  const lc = lCol.getContext('2d');
  const lh = lHgt.getContext('2d');
  const lr = lRgh.getContext('2d');

  const lImg = lc.createImageData(lSize, lSize);
  const lhImg = lh.createImageData(lSize, lSize);
  const lrImg = lr.createImageData(lSize, lSize);

  for (let y = 0; y < lSize; y++) {
    for (let x = 0; x < lSize; x++) {
      const u = x / lSize;
      const v = y / lSize;
      const n = tileableFbm(u, v, 8, 4, 101);
      const grain = tileableFbm(u, v, 24, 2, 202);
      const seamX = x % 64 < 2 || x % 64 > 62;
      const row = Math.floor(y / 64);
      const shiftedX = (x + (row % 2) * 32) % 64;
      const seam = y % 64 < 2 || shiftedX < 2;

      const base = seam ? 0.56 : 0.8 + (n - 0.5) * 0.16 + (grain - 0.5) * 0.08;
      const idx = (y * lSize + x) * 4;
      // Warm coastal travertine/limestone palette
      lImg.data[idx] = Math.min(255, Math.round(base * 232));
      lImg.data[idx + 1] = Math.min(255, Math.round(base * 222));
      lImg.data[idx + 2] = Math.min(255, Math.round(base * 206));
      lImg.data[idx + 3] = 255;

      const hv = seam ? 40 : Math.round((0.68 + n * 0.25 + grain * 0.07) * 255);
      lhImg.data[idx] = lhImg.data[idx + 1] = lhImg.data[idx + 2] = hv;
      lhImg.data[idx + 3] = 255;

      // Subtle polished foot-traffic sheen vs matte pores
      const rv = seam ? 235 : Math.round((0.52 + (1 - n) * 0.34) * 255);
      lrImg.data[idx] = lrImg.data[idx + 1] = lrImg.data[idx + 2] = rv;
      lrImg.data[idx + 3] = 255;
    }
  }
  lc.putImageData(lImg, 0, 0);
  lh.putImageData(lhImg, 0, 0);
  lr.putImageData(lrImg, 0, 0);

  const limestone = new THREE.MeshStandardMaterial({
    map: finalizeTexture(lCol, 4, 4, true),
    normalMap: canvasToNormalTexture(lHgt, 2.5, 4, 4),
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: finalizeTexture(lRgh, 4, 4, false),
    roughness: 0.92,
    metalness: 0.04,
  });

  // ---- 2. BOARD-FORMED COASTAL ARCHITECTURAL CONCRETE (Bunkers, Cover & Walls) ----
  const cCol = makeCanvas(256);
  const cHgt = makeCanvas(256);
  const cRgh = makeCanvas(256);
  const cc = cCol.getContext('2d');
  const ch = cHgt.getContext('2d');
  const cr = cRgh.getContext('2d');
  const cImg = cc.createImageData(256, 256);
  const chImg = ch.createImageData(256, 256);
  const crImg = cr.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = x / 256;
      const v = y / 256;
      const n = tileableFbm(u, v, 6, 4, 303);
      const streak = tileableFbm(u * 2.5, v * 0.5, 8, 3, 404);
      const joint = y % 64 < 2 || x % 128 < 2;
      // Form-tie recessed circles
      const tx = (x % 64) - 32;
      const ty = (y % 64) - 32;
      const tieHole = tx * tx + ty * ty < 12;

      let shade = 0.54 + (n - 0.5) * 0.18 - (streak > 0.65 ? 0.08 : 0);
      if (joint) shade *= 0.68;
      if (tieHole) shade *= 0.52;

      const idx = (y * 256 + x) * 4;
      cImg.data[idx] = Math.round(shade * 204);
      cImg.data[idx + 1] = Math.round(shade * 202);
      cImg.data[idx + 2] = Math.round(shade * 196);
      cImg.data[idx + 3] = 255;

      const hv = tieHole ? 24 : joint ? 65 : Math.round((0.6 + n * 0.35) * 255);
      chImg.data[idx] = chImg.data[idx + 1] = chImg.data[idx + 2] = hv;
      chImg.data[idx + 3] = 255;

      const rv = Math.round((0.72 + (1 - n) * 0.24) * 255);
      crImg.data[idx] = crImg.data[idx + 1] = crImg.data[idx + 2] = rv;
      crImg.data[idx + 3] = 255;
    }
  }
  cc.putImageData(cImg, 0, 0);
  ch.putImageData(chImg, 0, 0);
  cr.putImageData(crImg, 0, 0);

  const concrete = new THREE.MeshStandardMaterial({
    map: finalizeTexture(cCol, 2, 2, true),
    normalMap: canvasToNormalTexture(cHgt, 2.6, 2, 2),
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: finalizeTexture(cRgh, 2, 2, false),
    roughness: 0.95,
    metalness: 0.05,
  });

  // ---- 3. ANODIZED MILITARY GUNMETAL STEEL (Catwalks, Trusses & Towers) ----
  const sCol = makeCanvas(256);
  const sHgt = makeCanvas(256);
  const sc = sCol.getContext('2d');
  const sh = sHgt.getContext('2d');
  sc.fillStyle = '#2E333A';
  sc.fillRect(0, 0, 256, 256);
  sh.fillStyle = '#B8B8B8';
  sh.fillRect(0, 0, 256, 256);

  // Brushed directional steel grain
  for (let y = 0; y < 256; y += 2) {
    const a = 0.03 + hash2(y, 7, 505) * 0.06;
    sc.fillStyle = y % 4 === 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    sc.fillRect(0, y, 256, 1);
  }
  // Welded steel plates & rivets
  sc.strokeStyle = '#181B20';
  sc.lineWidth = 3;
  sc.strokeRect(2, 2, 252, 252);
  sc.strokeRect(2, 128, 252, 126);
  sh.strokeStyle = '#303030';
  sh.lineWidth = 4;
  sh.strokeRect(2, 2, 252, 252);
  sh.strokeRect(2, 128, 252, 126);

  for (let rx = 18; rx < 256; rx += 36) {
    for (const ry of [14, 114, 142, 242]) {
      sc.fillStyle = '#4B525C';
      sc.beginPath();
      sc.arc(rx, ry, 3, 0, Math.PI * 2);
      sc.fill();
      sh.fillStyle = '#FFFFFF';
      sh.beginPath();
      sh.arc(rx, ry, 3.2, 0, Math.PI * 2);
      sh.fill();
    }
  }

  const darkSteel = new THREE.MeshStandardMaterial({
    map: finalizeTexture(sCol, 2, 2, true),
    normalMap: canvasToNormalTexture(sHgt, 2.4, 2, 2),
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.38,
    metalness: 0.82,
  });

  // ---- 4. MONOCRYSTALLINE SOLAR COLLECTOR GLASS ----
  const pCol = makeCanvas(256);
  const pHgt = makeCanvas(256);
  const pc = pCol.getContext('2d');
  const ph = pHgt.getContext('2d');
  pc.fillStyle = '#0D1F38';
  pc.fillRect(0, 0, 256, 256);
  ph.fillStyle = '#C8C8C8';
  ph.fillRect(0, 0, 256, 256);

  // Silver photovoltaic grid lines
  pc.strokeStyle = 'rgba(185, 212, 240, 0.55)';
  pc.lineWidth = 1;
  for (let i = 0; i < 256; i += 16) {
    pc.beginPath();
    pc.moveTo(i, 0);
    pc.lineTo(i, 256);
    pc.stroke();
  }
  pc.strokeStyle = '#8FA6BF';
  pc.lineWidth = 3;
  ph.strokeStyle = '#383838';
  ph.lineWidth = 4;
  for (let i = 0; i < 256; i += 64) {
    pc.strokeRect(i, 0, 64, 256);
    pc.strokeRect(0, i, 256, 64);
    ph.strokeRect(i, 0, 64, 256);
    ph.strokeRect(0, i, 256, 64);
  }

  const solarGlass = new THREE.MeshStandardMaterial({
    map: finalizeTexture(pCol, 2, 2, true),
    normalMap: canvasToNormalTexture(pHgt, 1.8, 2, 2),
    roughness: 0.14,
    metalness: 0.72,
    envMapIntensity: 1.8,
  });

  // ---- 5. COASTAL BASALT CLIFF ROCK (Natural Island Base & Boulders) ----
  const rCol = makeCanvas(256);
  const rHgt = makeCanvas(256);
  const rc = rCol.getContext('2d');
  const rh = rHgt.getContext('2d');
  const rImg = rc.createImageData(256, 256);
  const rhImg = rh.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const u = x / 256;
      const v = y / 256;
      const strata = tileableFbm(u * 0.7, v * 2.2, 6, 4, 606);
      const cracks = tileableFbm(u, v, 14, 3, 707);
      const moss = strata > 0.62 && cracks > 0.52 ? (strata - 0.62) * 2.1 : 0;
      const shade = 0.34 + strata * 0.36 + (cracks - 0.5) * 0.14;
      const idx = (y * 256 + x) * 4;
      rImg.data[idx] = Math.round((shade * 145) * (1 - moss) + 74 * moss);
      rImg.data[idx + 1] = Math.round((shade * 138) * (1 - moss) + 96 * moss);
      rImg.data[idx + 2] = Math.round((shade * 126) * (1 - moss) + 64 * moss);
      rImg.data[idx + 3] = 255;

      const hv = Math.round(Math.max(0, Math.min(1, strata * 0.7 + cracks * 0.3)) * 255);
      rhImg.data[idx] = rhImg.data[idx + 1] = rhImg.data[idx + 2] = hv;
      rhImg.data[idx + 3] = 255;
    }
  }
  rc.putImageData(rImg, 0, 0);
  rh.putImageData(rhImg, 0, 0);

  const cliffRock = new THREE.MeshStandardMaterial({
    map: finalizeTexture(rCol, 3, 3, true),
    normalMap: canvasToNormalTexture(rHgt, 3.8, 3, 3),
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughness: 0.94,
    metalness: 0.04,
  });

  // ---- 6. WEATHERED INDUSTRIAL WALL-RUN BULKHEAD ----
  const wCol = makeCanvas(256);
  const wHgt = makeCanvas(256);
  const wc = wCol.getContext('2d');
  const wh = wHgt.getContext('2d');
  wc.fillStyle = '#292D33';
  wc.fillRect(0, 0, 256, 256);
  wh.fillStyle = '#A0A0A0';
  wh.fillRect(0, 0, 256, 256);

  // Worn painted amber-orange industrial grip chevrons
  wc.strokeStyle = '#D96B27';
  wc.lineWidth = 14;
  wh.strokeStyle = '#E0E0E0';
  wh.lineWidth = 14;
  for (let x = -128; x < 384; x += 56) {
    wc.beginPath();
    wc.moveTo(x, 256);
    wc.lineTo(x + 128, 128);
    wc.lineTo(x, 0);
    wc.stroke();

    wh.beginPath();
    wh.moveTo(x, 256);
    wh.lineTo(x + 128, 128);
    wh.lineTo(x, 0);
    wh.stroke();
  }
  // Weathered scuffing
  for (let i = 0; i < 450; i++) {
    wc.fillStyle = 'rgba(40,44,50,0.45)';
    wc.fillRect(hash2(i, 1, 808) * 256, hash2(i, 2, 808) * 256, 5 + hash2(i, 3, 808) * 14, 2);
  }
  wc.strokeStyle = '#535A63';
  wc.lineWidth = 8;
  wc.strokeRect(4, 4, 248, 248);

  const wallrun = new THREE.MeshStandardMaterial({
    map: finalizeTexture(wCol, 2, 1, true),
    normalMap: canvasToNormalTexture(wHgt, 2.2, 2, 1),
    roughness: 0.56,
    metalness: 0.62,
  });

  // ---- 7. BRUSHED TITANIUM GOLD / BRASS HARDWARE ----
  const brass = new THREE.MeshStandardMaterial({
    color: 0xd9a84e,
    roughness: 0.24,
    metalness: 0.88,
  });

  return { limestone, concrete, darkSteel, solarGlass, cliffRock, wallrun, brass };
}
