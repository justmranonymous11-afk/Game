import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { createRealisticMaterials, createWaterNormalTexture } from './textures.js';

/**
 * Builds the photorealistic coastal cliffside fortress world (AEGIS POINT):
 * - Real Preetham Rayleigh/Mie physical Sky + PMREM skybox reflections
 * - Real-time reflective Water.js ocean with animated wave normals
 * - Sculpted basalt island cliffs + 360-degree distant alpine coastal mountains
 * - Architectural limestone/concrete fortress with solar arrays, steel railings,
 *   fluted columns, radar relay tower, Mediterranean cypress trees, and boulders
 */
export function buildSanctuaryWorld(renderer, scene, arenaData) {
  const materials = createRealisticMaterials();

  // ---- 1. PHYSICAL PREETHAM ATMOSPHERIC SKY & PMREM ENVIRONMENT ----
  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms.turbidity.value = 3.2;
  skyUniforms.rayleigh.value = 1.6;
  skyUniforms.mieCoefficient.value = 0.003;
  skyUniforms.mieDirectionalG.value = 0.78;

  // Dramatic golden-hour side-raking coastal sun (elevation 26°, azimuth -52° -> rakes across architecture!)
  const sunVec = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 26);
  const theta = THREE.MathUtils.degToRad(-52);
  sunVec.setFromSphericalCoords(1, phi, theta);
  skyUniforms.sunPosition.value.copy(sunVec);

  // Generate true physical environment reflections directly from the Preetham Sky!
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(100);
  envSky.material.uniforms.turbidity.value = 3.2;
  envSky.material.uniforms.rayleigh.value = 1.6;
  envSky.material.uniforms.mieCoefficient.value = 0.003;
  envSky.material.uniforms.mieDirectionalG.value = 0.78;
  envSky.material.uniforms.sunPosition.value.copy(sunVec);
  envScene.add(envSky);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.65;
  pmrem.dispose();

  // Crisp coastal atmospheric perspective haze (keeps distant mountains realistic without fogging foreground!)
  scene.fog = new THREE.FogExp2(0xbfd4e6, 0.0014);

  // ---- 2. REALISTIC DIRECTIONAL SUNLIGHT + SKY HEMISPHERE FILL ----
  const hemi = new THREE.HemisphereLight(0xaad4ff, 0x7c7060, 0.95);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff1d6, 3.2);
  sunLight.position.copy(sunVec).multiplyScalar(115);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 15;
  sunLight.shadow.camera.far = 250;
  const d = 68;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.00045;
  scene.add(sunLight);

  // Subtle cool sea-bounce rim light
  const oceanBounce = new THREE.DirectionalLight(0x6da6cc, 0.55);
  oceanBounce.position.set(60, 12, -55);
  scene.add(oceanBounce);

  // ---- 3. REAL-TIME REFLECTIVE OCEAN (Three.js Water.js) ----
  const waterNormals = createWaterNormalTexture();
  const waterGeo = new THREE.PlaneGeometry(2400, 2400);
  const water = new Water(waterGeo, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: sunVec.clone().normalize(),
    sunColor: 0xfff3dc,
    waterColor: 0x0c344a,
    distortionScale: 2.6,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = -11.5;
  scene.add(water);

  // ---- 4. SCULPTED BASALT ISLAND CLIFFS UNDERNEATH FORTRESS ----
  const cliffGeo = new THREE.CylinderGeometry(30, 56, 15.5, 40, 5, false);
  const posAttr = cliffGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const a = Math.atan2(vz, vx);
    const radial = Math.hypot(vx, vz);
    if (radial > 1.0 && vy < 7.0) {
      const crag =
        Math.sin(a * 5.0 + vy * 0.4) * 3.8 +
        Math.cos(a * 11.0 - vy * 0.6) * 2.1 +
        Math.sin(a * 19.0) * 1.1;
      const scale = (radial + crag) / radial;
      posAttr.setX(i, vx * scale);
      posAttr.setZ(i, vz * scale);
    }
  }
  cliffGeo.computeVertexNormals();
  const centralCliff = new THREE.Mesh(cliffGeo, materials.cliffRock);
  centralCliff.position.set(0, -10.0, 0);
  centralCliff.receiveShadow = true;
  scene.add(centralCliff);

  // Outer bastion rocky sea-stacks beneath the 4 outer platforms
  const stackGeo = new THREE.CylinderGeometry(11.5, 19.5, 16, 16, 3);
  const sp = stackGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const vx = sp.getX(i);
    const vy = sp.getY(i);
    const vz = sp.getZ(i);
    const r = Math.hypot(vx, vz);
    if (r > 1 && vy < 7.2) {
      const a = Math.atan2(vz, vx);
      const jitter = Math.sin(a * 6 + vy * 0.5) * 1.8 + Math.cos(a * 9) * 1.1;
      sp.setX(i, vx * ((r + jitter) / r));
      sp.setZ(i, vz * ((r + jitter) / r));
    }
  }
  stackGeo.computeVertexNormals();
  for (const [bx, bz] of [
    [0, -39.5],
    [0, 39.5],
    [-39.5, 0],
    [39.5, 0],
  ]) {
    const stack = new THREE.Mesh(stackGeo, materials.cliffRock);
    stack.position.set(bx, -9.8, bz);
    stack.receiveShadow = true;
    scene.add(stack);
  }

  // ---- 5. 360-DEGREE DISTANT ALPINE / MEDITERRANEAN MOUNTAIN RING ----
  const mtnGeo = new THREE.CylinderGeometry(360, 440, 105, 96, 6, true);
  const mp = mtnGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const vx = mp.getX(i);
    const vy = mp.getY(i);
    const vz = mp.getZ(i);
    const a = Math.atan2(vz, vx);
    if (vy > -45) {
      const normY = (vy + 52.5) / 105;
      const ridge =
        Math.sin(a * 4.0) * 28 +
        Math.cos(a * 9.0 + 1.2) * 18 +
        Math.sin(a * 17.0) * 9 +
        Math.cos(a * 31.0) * 4;
      mp.setY(i, -26 + normY * Math.max(12, 58 + ridge));
    }
  }
  mtnGeo.computeVertexNormals();
  const mtnMat = new THREE.MeshStandardMaterial({
    color: 0x5c6873,
    roughness: 0.96,
    metalness: 0.02,
    side: THREE.BackSide,
  });
  const mountains = new THREE.Mesh(mtnGeo, mtnMat);
  mountains.position.y = 8;
  scene.add(mountains);

  // ---- 6. SOLID ARCHITECTURAL GEOMETRY (1:1 WITH PHYSICS COLLIDERS) ----
  for (const b of arenaData.boxes) {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = materials[b.material] || materials.concrete;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Architectural cornice / brushed steel coping on elevated decks
    if (b.h >= 1.5 && (b.material === 'limestone' || b.material === 'concrete') && b.w >= 9) {
      const coping = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.24, 0.22, b.d + 0.24),
        materials.darkSteel
      );
      coping.position.set(b.x, b.y + b.h * 0.5 - 0.14, b.z);
      coping.receiveShadow = true;
      scene.add(coping);
    }
  }

  // ---- 7. ARCHITECTURAL DETAIL DRESSING (SOLAR ARRAYS, RAILINGS, RADAR TOWER, CYPRESS TREES) ----

  // A. Central Solar Relay Tower Lattice & Rotating Radar Dish
  const radarGroup = new THREE.Group();
  radarGroup.position.set(0, 18.8, 0);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 20, 12, 0, Math.PI * 2, 0, 0.95),
    materials.darkSteel
  );
  dish.rotation.x = Math.PI * 0.65;
  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 2.2, 8), materials.brass);
  feedHorn.rotation.x = Math.PI * 0.35;
  feedHorn.position.set(0, 0.6, 1.3);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff6b1a,
    emissiveIntensity: 3.0,
    roughness: 0.2,
  });
  const beaconTip = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), beaconMat);
  beaconTip.position.set(0, 2.1, 0);
  radarGroup.add(dish, feedHorn, beaconTip);
  scene.add(radarGroup);

  // Recessed glowing monocrystalline solar collector decks around the central dais
  for (const [sx, sz] of [
    [-8.5, -14.2],
    [8.5, -14.2],
    [-8.5, 14.2],
    [8.5, 14.2],
  ]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 3.2), materials.solarGlass);
    panel.position.set(sx, 1.05, sz);
    panel.rotation.x = sz > 0 ? -0.35 : 0.35;
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.14, 3.4), materials.darkSteel);
    frame.position.set(sx, 0.96, sz);
    frame.rotation.x = panel.rotation.x;
    scene.add(frame);

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 8), materials.darkSteel);
    strut.position.set(sx, 0.5, sz);
    scene.add(strut);
  }

  // Industrial Steel Bridge Safety Railings
  const railGeoLong = new THREE.BoxGeometry(0.1, 0.1, 13.8);
  const railGeoPost = new THREE.BoxGeometry(0.12, 1.15, 0.12);
  for (const side of [-4.4, 4.4]) {
    for (const bz of [-25, 25]) {
      const topBar = new THREE.Mesh(railGeoLong, materials.darkSteel);
      topBar.position.set(side, 1.1, bz);
      scene.add(topBar);
      for (let p = -6; p <= 6; p += 3) {
        const post = new THREE.Mesh(railGeoPost, materials.darkSteel);
        post.position.set(side, 0.55, bz + p);
        scene.add(post);
      }
    }
    for (const bx of [-25, 25]) {
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.1, 0.1), materials.darkSteel);
      topBar.position.set(bx, 1.1, side);
      scene.add(topBar);
      for (let p = -6; p <= 6; p += 3) {
        const post = new THREE.Mesh(railGeoPost, materials.darkSteel);
        post.position.set(bx + p, 0.55, side);
        scene.add(post);
      }
    }
  }

  // Realistic Mediterranean Cypress Trees & Cliff Boulders around the outer perimeter
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4b3b2e, roughness: 0.95 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d472c, roughness: 0.88, metalness: 0.02 });
  const foliageHiMat = new THREE.MeshStandardMaterial({ color: 0x3a5a36, roughness: 0.86, metalness: 0.02 });

  const treeCoords = [
    [-16.8, 0, -16.8],
    [16.8, 0, -16.8],
    [-16.8, 0, 16.8],
    [16.8, 0, 16.8],
    [-7.5, 1.2, -46.5],
    [7.5, 1.2, -46.5],
    [-7.5, 1.2, 46.5],
    [7.5, 1.2, 46.5],
    [-46.5, 1.2, -7.5],
    [-46.5, 1.2, 7.5],
    [46.5, 1.2, -7.5],
    [46.5, 1.2, 7.5],
  ];

  for (let i = 0; i < treeCoords.length; i++) {
    const [tx, ty, tz] = treeCoords[i];
    const hScale = 0.85 + (i % 3) * 0.22;
    const tree = new THREE.Group();
    tree.position.set(tx, ty, tz);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2 * hScale, 7), barkMat);
    trunk.position.y = 1.1 * hScale;
    trunk.castShadow = true;
    tree.add(trunk);

    // Organic multi-cluster Mediterranean cypress/pine foliage canopy
    for (let layer = 0; layer < 5; layer++) {
      const r = (1.1 - layer * 0.17) * hScale;
      const cluster = new THREE.Mesh(
        new THREE.DodecahedronGeometry(r, 1),
        layer % 2 === 0 ? foliageMat : foliageHiMat
      );
      cluster.scale.set(0.85, 1.35, 0.85);
      cluster.position.set(
        Math.sin(layer * 2.1) * 0.16,
        (2.0 + layer * 0.92) * hScale,
        Math.cos(layer * 2.1) * 0.16
      );
      cluster.rotation.set(layer * 0.4, layer * 0.9, 0);
      cluster.castShadow = true;
      cluster.receiveShadow = true;
      tree.add(cluster);
    }
    scene.add(tree);
  }

  // ---- 8. PNEUMATIC LAUNCH TURBINES (JUMP PADS) ----
  const turbineFans = [];
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: 0xff7b1a,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });

  for (const pad of arenaData.jumpPads) {
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(pad.radius, pad.radius * 1.15, 0.42, 24),
      materials.darkSteel
    );
    housing.position.set(pad.x, pad.y - 0.12, pad.z);
    housing.receiveShadow = true;
    scene.add(housing);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(pad.radius * 0.88, 0.14, 10, 28), accentMat);
    lip.rotation.x = Math.PI * 0.5;
    lip.position.set(pad.x, pad.y + 0.1, pad.z);
    scene.add(lip);

    // Spinning turbine fan blades inside housing
    const fan = new THREE.Group();
    fan.position.set(pad.x, pad.y + 0.04, pad.z);
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(pad.radius * 1.5, 0.05, 0.34), materials.darkSteel);
      blade.rotation.y = (b / 5) * Math.PI;
      fan.add(blade);
    }
    scene.add(fan);
    turbineFans.push(fan);

    const airflow = new THREE.Mesh(
      new THREE.CylinderGeometry(pad.radius * 0.5, pad.radius * 0.82, 5.5, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xdaf2ff,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    airflow.position.set(pad.x, pad.y + 2.8, pad.z);
    scene.add(airflow);
  }

  // ---- 9. OVERHEAD STEEL GRAPPLE ANCHOR BEACONS ----
  const ringMeshes = new Map();
  const anchorCoreMat = new THREE.MeshStandardMaterial({
    color: 0xffe082,
    emissive: 0xff981a,
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.6,
  });

  for (const r of arenaData.skyRings) {
    const group = new THREE.Group();
    group.position.set(r.x, r.y, r.z);

    // Heavy armored magnetic grapple ring with 4 structural clamps
    const outer = new THREE.Mesh(new THREE.TorusGeometry(r.radius, 0.22, 12, 32), materials.darkSteel);
    outer.castShadow = true;
    group.add(outer);

    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(r.radius * 0.72, 0.09, 10, 28), materials.brass);
    group.add(innerRing);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), anchorCoreMat);
    group.add(core);

    scene.add(group);
    ringMeshes.set(r.id, { group, outer, innerRing, core });
  }

  // ---- 10. SUBTLE SUNLIT COASTAL ATMOSPHERIC PARTICLES ----
  const dustCount = 160;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 95;
    dustPos[i * 3 + 1] = 1 + Math.random() * 24;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 95;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xfff0d4,
      size: 0.16,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  scene.add(dust);

  return {
    materials,
    update(dt, time, highlightId) {
      water.material.uniforms.time.value += dt * 0.7;
      radarGroup.rotation.y = time * 0.65;
      dust.rotation.y = time * 0.015;

      for (const fan of turbineFans) {
        fan.rotation.y += dt * 9.5;
      }

      for (const [id, rm] of ringMeshes.entries()) {
        const isTarget = id === highlightId;
        rm.outer.rotation.y += dt * (isTarget ? 2.6 : 0.7);
        rm.innerRing.rotation.x = time * 1.1;
        rm.core.rotation.y -= dt * 2.4;
        const s = isTarget ? 1.24 : 1.0;
        rm.group.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, 10 * dt));
      }
    },
  };
}
