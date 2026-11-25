import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { getMapMeta } from './maps.js';

/**
 * Builds any of the 3 full photorealistic 3D maps (Aegis Point, Helios Foundry, Frostpeak)
 * using real Poly Haven 360° HDRI skyboxes, real Water.js planar reflective ocean with
 * photographic waternormals.jpg, megascan PBR textures, optical sun Lensflare, shipping
 * containers, helipads, radar domes, supply crates, and sculpted biome cliffs.
 */
export async function buildMapWorld(renderer, scene, assets, mapId, layout) {
  const meta = getMapMeta(mapId);
  const group = new THREE.Group();
  scene.add(group);

  const mats = assets.materials;

  // ---- 1. REAL POLY HAVEN 360° PHOTOGRAPHIC HDRI SKYBOX & IBL ----
  const hdri = await assets.loadHdri(meta.hdri, renderer);
  if (hdri) {
    scene.background = hdri.background;
    scene.backgroundBlurriness = 0.08;
    scene.environment = hdri.environment;
    scene.environmentIntensity = 0.85;
  } else {
    scene.background = new THREE.Color(meta.fogColor);
  }
  renderer.toneMappingExposure = meta.exposure;
  scene.fog = new THREE.FogExp2(meta.fogColor, meta.fogDensity);

  // ---- 2. CINEMATIC DIRECTIONAL SUNLIGHT + OPTICAL LENSFLARE ----
  const hemi = new THREE.HemisphereLight(meta.hemiSky, meta.hemiGround, 0.78);
  group.add(hemi);

  const sunLight = new THREE.DirectionalLight(meta.sunColor, meta.sunIntensity);
  sunLight.position.set(meta.sunPos[0], meta.sunPos[1], meta.sunPos[2]);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 15;
  sunLight.shadow.camera.far = 260;
  const d = 72;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.00045;
  group.add(sunLight);

  if (assets.textures.flare0 && assets.textures.flare3) {
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(assets.textures.flare0, 260, 0, new THREE.Color(meta.sunColor)));
    lensflare.addElement(new LensflareElement(assets.textures.flare3, 48, 0.55));
    lensflare.addElement(new LensflareElement(assets.textures.flare3, 62, 0.72));
    lensflare.addElement(new LensflareElement(assets.textures.flare3, 90, 0.92));
    sunLight.add(lensflare);
  }

  // ---- 3. REAL-TIME REFLECTIVE OCEAN (Three.js Water.js + real waternormals.jpg) ----
  let water = null;
  if (assets.textures.waterNormals) {
    const waterGeo = new THREE.PlaneGeometry(2400, 2400);
    water = new Water(waterGeo, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: assets.textures.waterNormals,
      sunDirection: sunLight.position.clone().normalize(),
      sunColor: meta.sunColor,
      waterColor: meta.waterColor,
      distortionScale: 2.8,
      fog: true,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = meta.waterY;
    group.add(water);
  }

  // ---- 4. SCULPTED BIOME CLIFFS (BASALT / SANDSTONE / GLACIER ICE) ----
  const cliffMat = mats[meta.cliffMaterial] || mats.cliffRock;
  const cliffGeo = new THREE.CylinderGeometry(32, 60, 16, 40, 5, false);
  const posAttr = cliffGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const r = Math.hypot(vx, vz);
    if (r > 1.0 && vy < 7.2) {
      const a = Math.atan2(vz, vx);
      const crag =
        Math.sin(a * 5.0 + vy * 0.4) * 4.2 +
        Math.cos(a * 11.0 - vy * 0.6) * 2.2 +
        Math.sin(a * 19.0) * 1.1;
      const sc = (r + crag) / r;
      posAttr.setX(i, vx * sc);
      posAttr.setZ(i, vz * sc);
    }
  }
  cliffGeo.computeVertexNormals();
  const centralCliff = new THREE.Mesh(cliffGeo, cliffMat);
  centralCliff.position.set(0, -10.2, 0);
  centralCliff.receiveShadow = true;
  group.add(centralCliff);

  // Distant 360-degree Coastal Mountain Range / Canyon Rim / Glacier Peaks
  const mtnGeo = new THREE.CylinderGeometry(360, 440, 115, 96, 6, true);
  const mp = mtnGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const vx = mp.getX(i);
    const vy = mp.getY(i);
    const vz = mp.getZ(i);
    const a = Math.atan2(vz, vx);
    if (vy > -45) {
      const normY = (vy + 57.5) / 115;
      const ridge =
        Math.sin(a * 4.0) * 30 +
        Math.cos(a * 9.0 + 1.2) * 19 +
        Math.sin(a * 17.0) * 9;
      mp.setY(i, -26 + normY * Math.max(14, 62 + ridge));
    }
  }
  mtnGeo.computeVertexNormals();
  const mtnMat = new THREE.MeshStandardMaterial({
    color: meta.mountainColor,
    roughness: 0.96,
    metalness: 0.02,
    side: THREE.BackSide,
  });
  const mountains = new THREE.Mesh(mtnGeo, mtnMat);
  mountains.position.y = 8;
  group.add(mountains);

  // ---- 5. ARCHITECTURAL SOLID GEOMETRY (1:1 WITH PHYSICS + BEVELED CONTAINERS) ----
  for (const b of layout.boxes) {
    const mat = mats[b.material] || mats.concrete;
    const geo = b.isContainer
      ? new RoundedBoxGeometry(b.w, b.h, b.d, 2, 0.08)
      : new THREE.BoxGeometry(b.w, b.h, b.d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Corrugated steel ribs & corner steel frames on military shipping containers!
    if (b.isContainer) {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.08, 0.14, b.d + 0.08),
        mats.darkSteel
      );
      frame.position.set(b.x, b.y + b.h * 0.5 - 0.08, b.z);
      group.add(frame);
    } else if (b.h >= 1.5 && (b.material === 'limestone' || b.material === 'concrete' || b.material === 'glacierIce') && b.w >= 9) {
      const coping = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.24, 0.22, b.d + 0.24),
        mats.darkSteel
      );
      coping.position.set(b.x, b.y + b.h * 0.5 - 0.14, b.z);
      coping.receiveShadow = true;
      group.add(coping);
    }
  }

  // ---- 6. SET DRESSING PROPS (HELIPAD, RADOME, SOLAR COLLECTOR DECKS, RADAR) ----
  const radarGroup = new THREE.Group();
  radarGroup.position.set(0, 18.8, 0);
  if (mapId !== 'frostpeak') {
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(2.7, 20, 12, 0, Math.PI * 2, 0, 0.95),
      mats.darkSteel
    );
    dish.rotation.x = Math.PI * 0.65;
    const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 2.2, 8), mats.brass);
    feedHorn.rotation.x = Math.PI * 0.35;
    feedHorn.position.set(0, 0.6, 1.3);
    radarGroup.add(dish, feedHorn);
    group.add(radarGroup);
  }

  // Painted Helipad & Polar Radome Props
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff7b1a,
    emissiveIntensity: 2.6,
    roughness: 0.2,
  });

  for (const prop of layout.props) {
    if (prop.kind === 'helipad') {
      const padCanvas = document.createElement('canvas');
      padCanvas.width = 256;
      padCanvas.height = 256;
      const pg = padCanvas.getContext('2d');
      pg.clearRect(0, 0, 256, 256);
      pg.strokeStyle = '#e5a93c';
      pg.lineWidth = 14;
      pg.beginPath();
      pg.arc(128, 128, 108, 0, Math.PI * 2);
      pg.stroke();
      pg.fillStyle = '#f2ede4';
      pg.fillRect(82, 64, 22, 128);
      pg.fillRect(152, 64, 22, 128);
      pg.fillRect(82, 117, 92, 22);
      const padTex = new THREE.CanvasTexture(padCanvas);
      padTex.colorSpace = THREE.SRGBColorSpace;
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(prop.radius * 2, prop.radius * 2),
        new THREE.MeshBasicMaterial({ map: padTex, transparent: true, depthWrite: false })
      );
      decal.rotation.x = -Math.PI * 0.5;
      decal.position.set(prop.x, prop.y, prop.z);
      group.add(decal);

      // 4 Corner Helipad Strobe Lights
      for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const light = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.16, 8), beaconMat);
        light.position.set(prop.x + bx * (prop.radius - 0.3), prop.y + 0.08, prop.z + bz * (prop.radius - 0.3));
        group.add(light);
      }
    } else if (prop.kind === 'radome') {
      const dome = new THREE.Mesh(
        new THREE.IcosahedronGeometry(prop.radius, 2),
        new THREE.MeshStandardMaterial({ color: 0xe6ecf0, roughness: 0.42, metalness: 0.12 })
      );
      dome.position.set(prop.x, prop.y, prop.z);
      dome.castShadow = true;
      group.add(dome);
    } else if (prop.kind === 'solar_deck') {
      for (const [sx, sz] of [[-8.5, -14.2], [8.5, -14.2], [-8.5, 14.2], [8.5, 14.2]]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 3.2), mats.solarGlass);
        panel.position.set(sx, 1.05, sz);
        panel.rotation.x = sz > 0 ? -0.35 : 0.35;
        panel.castShadow = true;
        group.add(panel);
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 8), mats.darkSteel);
        strut.position.set(sx, 0.5, sz);
        group.add(strut);
      }
    }
  }

  // Biome Vegetation (Mediterranean Cypress on Aegis Point, Snow-Dusted Pines on Frostpeak)
  if (meta.trees !== 'none') {
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x46362a, roughness: 0.95 });
    const f1 = new THREE.MeshStandardMaterial({
      color: meta.trees === 'pine' ? 0x264438 : 0x2d482b,
      roughness: 0.88,
    });
    const f2 = new THREE.MeshStandardMaterial({
      color: meta.trees === 'pine' ? 0xcad9e2 : 0x3a5a36,
      roughness: 0.82,
    });
    const treeCoords = [
      [-17.2, 0, -17.2], [17.2, 0, -17.2], [-17.2, 0, 17.2], [17.2, 0, 17.2],
      [-7.8, 1.2, -46.5], [7.8, 1.2, -46.5], [-46.5, 1.2, -7.8], [46.5, 1.2, 7.8],
    ];
    for (let i = 0; i < treeCoords.length; i++) {
      const [tx, ty, tz] = treeCoords[i];
      const hScale = 0.88 + (i % 3) * 0.2;
      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2 * hScale, 7), barkMat);
      trunk.position.y = 1.1 * hScale;
      trunk.castShadow = true;
      tree.add(trunk);
      for (let layer = 0; layer < 5; layer++) {
        const r = (1.12 - layer * 0.17) * hScale;
        const cluster = new THREE.Mesh(
          new THREE.DodecahedronGeometry(r, 1),
          meta.trees === 'pine' && layer >= 3 ? f2 : f1
        );
        cluster.scale.set(0.85, 1.32, 0.85);
        cluster.position.set(Math.sin(layer * 2) * 0.14, (2.0 + layer * 0.9) * hScale, Math.cos(layer * 2) * 0.14);
        cluster.castShadow = true;
        tree.add(cluster);
      }
      group.add(tree);
    }
  }

  // ---- 7. PNEUMATIC LAUNCH TURBINES ----
  const turbineFans = [];
  for (const pad of layout.jumpPads) {
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(pad.radius, pad.radius * 1.15, 0.4, 24), mats.darkSteel);
    housing.position.set(pad.x, pad.y - 0.12, pad.z);
    group.add(housing);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(pad.radius * 0.88, 0.12, 10, 28), beaconMat);
    lip.rotation.x = Math.PI * 0.5;
    lip.position.set(pad.x, pad.y + 0.08, pad.z);
    group.add(lip);

    const fan = new THREE.Group();
    fan.position.set(pad.x, pad.y + 0.03, pad.z);
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(pad.radius * 1.5, 0.05, 0.34), mats.darkSteel);
      blade.rotation.y = (b / 5) * Math.PI;
      fan.add(blade);
    }
    group.add(fan);
    turbineFans.push(fan);
  }

  // ---- 8. OVERHEAD GRAPPLE ANCHOR BEACONS ----
  const ringMeshes = new Map();
  for (const r of layout.skyRings) {
    const rg = new THREE.Group();
    rg.position.set(r.x, r.y, r.z);
    const outer = new THREE.Mesh(new THREE.TorusGeometry(r.radius, 0.22, 12, 32), mats.darkSteel);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(r.radius * 0.72, 0.09, 10, 28), mats.brass);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), beaconMat);
    rg.add(outer, inner, core);
    group.add(rg);
    ringMeshes.set(r.id, { group: rg, outer, inner, core });
  }

  // ---- 9. TACTICAL MED-STIM & ARMOR SUPPLY CRATES ----
  const supplyMeshes = new Map();
  const medGlow = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.2 });
  const armGlow = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });

  for (const sp of layout.supplyPads) {
    const sg = new THREE.Group();
    sg.position.set(sp.x, sp.y + 0.55, sp.z);
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.55, 0.62, 2, 0.06), mats.darkSteel);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.26), sp.kind === 'med' ? medGlow : armGlow);
    sg.add(box, strip);
    group.add(sg);
    supplyMeshes.set(sp.id, { group: sg, baseY: sp.y + 0.55 });
  }

  return {
    group,
    dispose() {
      scene.remove(group);
    },
    update(dt, time, highlightId, supplyStates) {
      if (water) water.material.uniforms.time.value += dt * 0.7;
      radarGroup.rotation.y = time * 0.65;
      for (const fan of turbineFans) fan.rotation.y += dt * 9.5;

      for (const [id, rm] of ringMeshes.entries()) {
        const isTarget = id === highlightId;
        rm.outer.rotation.y += dt * (isTarget ? 2.6 : 0.7);
        rm.inner.rotation.x = time * 1.1;
        rm.core.rotation.y -= dt * 2.4;
        const s = isTarget ? 1.24 : 1.0;
        rm.group.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, 10 * dt));
      }

      if (supplyStates) {
        for (const st of supplyStates) {
          const sm = supplyMeshes.get(st.id);
          if (!sm) continue;
          sm.group.visible = st.ready;
          if (st.ready) {
            sm.group.rotation.y = time * 1.6;
            sm.group.position.y = sm.baseY + Math.sin(time * 3.0) * 0.14;
          }
        }
      }
    },
  };
}
