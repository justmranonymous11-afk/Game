import * as THREE from 'three';
import { createCloudPuffTexture, createSanctuaryMaterials } from './textures.js';

/**
 * Builds a photorealistic PMREM environment map from our golden-hour sky dome
 * so every metallic gold trim, marble tile, obsidian pillar, and weapon barrel
 * reflects the real sunlit sky & warm horizon!
 */
export function applyGoldenHourEnvironment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(60, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x163d66) },
      midColor: { value: new THREE.Color(0x6b9ac4) },
      horizonColor: { value: new THREE.Color(0xf8cf96) },
      bottomColor: { value: new THREE.Color(0xa67c52) },
      sunDir: { value: new THREE.Vector3(0.52, 0.44, -0.73).normalize() },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform vec3 sunDir;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0
          ? mix(mix(horizonColor, midColor, smoothstep(0.0, 0.3, h)), topColor, smoothstep(0.28, 0.85, h))
          : mix(horizonColor, bottomColor, smoothstep(0.0, -0.45, h));
        float sunAmt = max(0.0, dot(vDir, sunDir));
        col += vec3(1.0, 0.88, 0.65) * pow(sunAmt, 14.0) * 1.4;
        col += vec3(1.0, 0.96, 0.85) * pow(sunAmt, 140.0) * 3.0;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  const envRT = pmrem.fromScene(envScene, 0.03);
  scene.environment = envRT.texture;
  pmrem.dispose();
  skyGeo.dispose();
  skyMat.dispose();
}

/**
 * Builds the photorealistic Golden-Hour Sky-Citadel environment:
 * - Atmospheric scattering sky dome with optical sun glow
 * - Warm directional sunlight + soft PCF shadows + cool sky hemisphere bounce
 * - Volumetric sunlit god-ray shafts & floating golden dust motes
 * - Soft layered cloud sea below the floating islands
 * - Architectural marble/obsidian/gold geometry with glowing floor trim strips
 */
export function buildSanctuaryWorld(scene, arenaData) {
  const materials = createSanctuaryMaterials();

  // ---- ATMOSPHERIC FOG & SCATTERING SKY DOME ----
  scene.fog = new THREE.FogExp2(0xe6d2b8, 0.0046);

  const sunDir = new THREE.Vector3(0.52, 0.44, -0.73).normalize();
  const skyGeo = new THREE.SphereGeometry(290, 36, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x133861) },
      midColor: { value: new THREE.Color(0x6394be) },
      horizonColor: { value: new THREE.Color(0xf7cc92) },
      bottomColor: { value: new THREE.Color(0xd2a87b) },
      sunDir: { value: sunDir },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform vec3 sunDir;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0
          ? mix(mix(horizonColor, midColor, smoothstep(0.0, 0.28, h)), topColor, smoothstep(0.24, 0.85, h))
          : mix(horizonColor, bottomColor, smoothstep(0.0, -0.35, h));
        float s = max(0.0, dot(vDir, sunDir));
        col += vec3(1.0, 0.82, 0.52) * pow(s, 10.0) * 0.55;
        col += vec3(1.0, 0.96, 0.86) * pow(s, 220.0) * 2.2;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // ---- CINEMATIC LIGHTING ----
  const hemi = new THREE.HemisphereLight(0xaad4ff, 0xc79258, 0.85);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff0d4, 2.4);
  sunLight.position.copy(sunDir).multiplyScalar(95);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 220;
  const d = 64;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // Subtle rim backlight from opposite horizon for realistic 3D form separation
  const rimLight = new THREE.DirectionalLight(0x7ab4e8, 0.65);
  rimLight.position.set(-55, 28, 60);
  scene.add(rimLight);

  const altarLight = new THREE.PointLight(0xffb845, 3.8, 38);
  altarLight.position.set(0, 6.5, 0);
  scene.add(altarLight);

  // ---- SOLID ARCHITECTURAL GEOMETRY (1:1 WITH PHYSICS) ----
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffd268,
    emissive: 0xff9b26,
    emissiveIntensity: 1.1,
    roughness: 0.25,
    metalness: 0.8,
  });

  for (const b of arenaData.boxes) {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = materials[b.material] || materials.marble;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Subtle golden edge molding on marble decks & obsidian platforms for realistic depth
    if (b.h >= 1.5 && (b.material === 'marble' || b.material === 'obsidian') && b.w >= 8) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.12, 0.14, b.d + 0.12),
        materials.gold
      );
      trim.position.set(b.x, b.y + b.h * 0.5 - 0.12, b.z);
      scene.add(trim);
    }
  }

  // Luminous golden floor guide strips along the 4 bridges
  for (const [bx, bz, bw, bd] of [
    [0, -23.5, 0.22, 13.5],
    [0, 23.5, 0.22, 13.5],
    [-23.5, 0, 13.5, 0.22],
    [23.5, 0, 13.5, 0.22],
  ]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.04, bd), trimMat);
    strip.position.set(bx, 0.02, bz);
    scene.add(strip);
  }

  // Crown ornament atop the Central Solar Spire
  const spireHalo = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.24, 16, 56), materials.gold);
  spireHalo.position.set(0, 23.8, 0);
  scene.add(spireHalo);

  const spireHaloInner = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.12, 12, 48), trimMat);
  spireHaloInner.position.set(0, 23.8, 0);
  scene.add(spireHaloInner);

  const spireOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.75, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfff0b3,
      emissive: 0xff9b26,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.4,
    })
  );
  spireOrb.position.set(0, 23.8, 0);
  scene.add(spireOrb);

  // ---- VOLUMETRIC GOD-RAY SUN SHAFTS ----
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xffe4b0,
    transparent: true,
    opacity: 0.026,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const [rx, rz] of [
    [-10, -8],
    [12, 6],
    [-16, 14],
    [8, -22],
  ]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 7.5, 52, 12, 1, true), rayMat);
    shaft.position.set(rx, 20, rz);
    shaft.rotation.z = -0.34;
    shaft.rotation.x = 0.24;
    scene.add(shaft);
  }

  // ---- FLOATING GOLDEN DUST MOTES IN SUNLIGHT ----
  const moteCount = 240;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 90;
    motePositions[i * 3 + 1] = 1 + Math.random() * 26;
    motePositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xffe394,
    size: 0.24,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dustMotes = new THREE.Points(moteGeo, moteMat);
  scene.add(dustMotes);

  // ---- JUMP PADS ----
  const jumpPadMeshes = [];
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xffe082,
    emissive: 0xff9d2e,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.7,
  });
  for (const pad of arenaData.jumpPads) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(pad.radius, pad.radius * 1.15, 0.35, 24), materials.obsidian);
    base.position.set(pad.x, pad.y - 0.1, pad.z);
    base.receiveShadow = true;
    scene.add(base);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(pad.radius * 0.75, 0.14, 12, 32), padMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(pad.x, pad.y + 0.12, pad.z);
    scene.add(ring);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(pad.radius * 0.45, pad.radius * 0.78, 6.2, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe49e,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    beam.position.set(pad.x, pad.y + 3.1, pad.z);
    scene.add(beam);
    jumpPadMeshes.push({ ring, beam, baseY: pad.y });
  }

  // ---- ROTATING GOLDEN SKY-RINGS (GRAPPLE ANCHORS) ----
  const ringMeshes = new Map();
  const ringCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfff5cc,
    emissive: 0xffa726,
    emissiveIntensity: 2.0,
    roughness: 0.12,
    metalness: 0.6,
  });
  for (const r of arenaData.skyRings) {
    const group = new THREE.Group();
    group.position.set(r.x, r.y, r.z);

    const outer = new THREE.Mesh(new THREE.TorusGeometry(r.radius, 0.24, 16, 40), materials.gold);
    outer.castShadow = true;
    group.add(outer);

    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), ringCoreMat);
    group.add(inner);

    scene.add(group);
    ringMeshes.set(r.id, { group, outer, inner });
  }

  // ---- VOLUMETRIC SOFT CLOUD SEA BELOW ----
  const cloudTex = createCloudPuffTexture();
  const clouds = [];
  const cloudPlaneGeo = new THREE.PlaneGeometry(1, 1);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 65; i++) {
    const angle = (i / 65) * Math.PI * 2 + (i % 5) * 0.25;
    const dist = 16 + (i % 9) * 20;
    const m = new THREE.Mesh(cloudPlaneGeo, cloudMat);
    m.rotation.x = -Math.PI * 0.5;
    const scale = 28 + (i % 6) * 14;
    m.scale.set(scale, scale, 1);
    m.position.set(Math.cos(angle) * dist, -17 - (i % 5) * 3.8, Math.sin(angle) * dist);
    scene.add(m);
    clouds.push({ mesh: m, speed: 0.9 + (i % 4) * 0.4 });
  }

  return {
    materials,
    update(dt, time, highlightId) {
      spireHalo.rotation.y = time * 0.5;
      spireHalo.rotation.x = Math.sin(time * 0.35) * 0.28;
      spireHaloInner.rotation.y = -time * 0.85;
      spireHaloInner.rotation.z = Math.cos(time * 0.5) * 0.4;
      spireOrb.rotation.y = -time * 1.1;
      spireOrb.position.y = 23.8 + Math.sin(time * 1.8) * 0.55;

      dustMotes.rotation.y = time * 0.02;

      for (const jp of jumpPadMeshes) {
        jp.ring.position.y = jp.baseY + 0.16 + Math.sin(time * 4.5) * 0.12;
        jp.beam.rotation.y += dt * 1.4;
      }

      for (const [id, rm] of ringMeshes.entries()) {
        const isTarget = id === highlightId;
        rm.outer.rotation.y += dt * (isTarget ? 3.2 : 0.9);
        rm.outer.rotation.x = Math.sin(time * 1.1) * 0.3;
        rm.inner.rotation.y -= dt * 2.2;
        const targetScale = isTarget ? 1.24 : 1.0;
        rm.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(1, 10 * dt));
      }

      for (const c of clouds) {
        c.mesh.position.x += c.speed * dt;
        if (c.mesh.position.x > 195) c.mesh.position.x = -195;
      }
    },
  };
}

/**
 * Builds distinct sculpted 3D enemy meshes for all 6 archetypes + Solar Colossus Boss.
 */
export function createEnemyMesh(enemy) {
  const group = new THREE.Group();

  const obsidian = new THREE.MeshStandardMaterial({
    color: 0x191920,
    roughness: 0.26,
    metalness: 0.72,
    envMapIntensity: 1.5,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe6b94c,
    roughness: 0.18,
    metalness: 0.9,
    envMapIntensity: 1.7,
  });
  const crimson = new THREE.MeshStandardMaterial({
    color: 0xff4624,
    emissive: 0xff3014,
    emissiveIntensity: 2.1,
    roughness: 0.15,
  });
  const jade = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 2.0,
    roughness: 0.15,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffe882,
    emissive: 0xffa61c,
    emissiveIntensity: 2.3,
    roughness: 0.1,
    metalness: 0.45,
  });

  const parts = { group, rings: [], crystalMeshes: [], coreMat: crimson, laserLine: null };

  if (enemy.type === 'drone') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), crimson);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.14, 12, 28), obsidian);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.08, 10, 28), gold);
    ring2.rotation.x = Math.PI * 0.5;
    group.add(core, ring1, ring2);
    parts.rings.push(ring1, ring2);
  } else if (enemy.type === 'strider') {
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.3, 5), obsidian);
    hull.rotation.x = Math.PI;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.12, 10, 24), gold);
    crown.rotation.x = Math.PI * 0.5;
    crown.position.y = 0.45;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), crimson);
    eye.position.y = 0.58;
    group.add(hull, crown, eye);
    parts.rings.push(crown);
  } else if (enemy.type === 'aegis') {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 1.08, 3.1, 6), obsidian);
    const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.2, 10, 6), gold);
    shieldRing.rotation.x = Math.PI * 0.5;
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.64, 0), crimson);
    eye.position.y = 1.9;
    group.add(pillar, shieldRing, eye);
    parts.rings.push(shieldRing);
  } else if (enemy.type === 'weaver') {
    // Sleek emerald-and-gold sniper construct with laser sight!
    parts.coreMat = jade;
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.82, 0), obsidian);
    body.scale.set(0.7, 1.5, 0.7);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.55), gold);
    wingL.position.set(-1.1, 0.15, 0);
    wingL.rotation.z = 0.28;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.55), gold);
    wingR.position.set(1.1, 0.15, 0);
    wingR.rotation.z = -0.28;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), jade);
    group.add(body, wingL, wingR, eye);
    parts.rings.push(body);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.85 });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false;
    laserLine.frustumCulled = false;
    parts.laserLine = laserLine;
  } else if (enemy.type === 'vanguard') {
    // Heavy armored obsidian & crimson Juggernaut charger!
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.2, 2.1), obsidian);
    const crest = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.24, 10, 8), gold);
    crest.rotation.x = Math.PI * 0.5;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), crimson);
    core.position.y = 0.4;
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6), gold);
    hornL.position.set(-0.95, 1.1, 0.5);
    hornL.rotation.x = 0.4;
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6), gold);
    hornR.position.set(0.95, 1.1, 0.5);
    hornR.rotation.x = 0.4;
    group.add(torso, crest, core, hornL, hornR);
    parts.rings.push(crest);
  } else if (enemy.type === 'wisp') {
    // Fast crystalline ambusher
    parts.coreMat = crystalMat;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), crystalMat);
    shard.scale.set(0.75, 1.45, 0.75);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.06, 8, 20), obsidian);
    group.add(shard, halo);
    parts.rings.push(halo);
  } else if (enemy.type === 'colossus') {
    // Monumental Solar Colossus Titan!
    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(2.7, 0), obsidian);
    const innerSun = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 1), crimson);
    const outerHalo1 = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.36, 16, 48), gold);
    const outerHalo2 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.24, 14, 42), obsidian);
    outerHalo2.rotation.x = Math.PI * 0.5;
    group.add(core, innerSun, outerHalo1, outerHalo2);
    parts.rings.push(outerHalo1, outerHalo2);

    for (const c of enemy.crystals) {
      const cm = new THREE.Mesh(new THREE.OctahedronGeometry(1.08, 0), crystalMat);
      cm.castShadow = true;
      parts.crystalMeshes.push({ crystal: c, mesh: cm });
    }
  }

  group.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = true;
  });
  group.position.set(enemy.x, enemy.y, enemy.z);
  return parts;
}
