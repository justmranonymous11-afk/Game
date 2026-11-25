import * as THREE from 'three';
import { createSanctuaryMaterials } from './textures.js';

/**
 * Builds the 3D Golden-Hour Sky-Citadel environment:
 * - Custom gradient sky dome shader (warm amber horizon -> crisp cerulean zenith)
 * - Sun disc + directional sunlight with real-time soft PCF shadows
 * - Drifting cloud sea below the floating sanctuary
 * - Procedural PBR marble/obsidian/gold/wall-run geometry matching arenaData 1:1
 * - Animated Jump Pads and rotating Golden Sky-Rings
 */
export function buildSanctuaryWorld(scene, arenaData) {
  const materials = createSanctuaryMaterials();

  // ---- ATMOSPHERIC FOG & SKY DOME ----
  scene.fog = new THREE.FogExp2(0xeadac5, 0.0052);

  const skyGeo = new THREE.SphereGeometry(280, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x1f4e78) },
      midColor: { value: new THREE.Color(0x6e9bc2) },
      horizonColor: { value: new THREE.Color(0xf6cfa0) },
      bottomColor: { value: new THREE.Color(0xdcb488) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        vec3 col;
        if (h > 0.0) {
          col = mix(horizonColor, midColor, smoothstep(0.0, 0.32, h));
          col = mix(col, topColor, smoothstep(0.28, 0.85, h));
        } else {
          col = mix(horizonColor, bottomColor, smoothstep(0.0, -0.35, h));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Luminous Golden Sun Disc in the sky
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff5d6, fog: false })
  );
  sunDisc.position.set(110, 95, -155);
  scene.add(sunDisc);

  // ---- LIGHTING (Golden Sunlight + Sky Hemisphere Fill) ----
  const hemi = new THREE.HemisphereLight(0xbbe0ff, 0xc89a64, 0.95);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.15);
  sunLight.position.set(58, 72, -64);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 210;
  const d = 62;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Warm gold bounce light at central altar
  const altarLight = new THREE.PointLight(0xf5b942, 3.2, 34);
  altarLight.position.set(0, 6.5, 0);
  scene.add(altarLight);

  // ---- SOLID ARCHITECTURAL GEOMETRY (1:1 WITH PHYSICS) ----
  for (const b of arenaData.boxes) {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = materials[b.material] || materials.marble;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.y, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Crown ornament atop the Central Solar Spire (pure visual)
  const spireHalo = new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.22, 14, 48),
    materials.gold
  );
  spireHalo.position.set(0, 23.5, 0);
  scene.add(spireHalo);

  const spireOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.7, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffe07d,
      emissive: 0xff8c2b,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      metalness: 0.5,
    })
  );
  spireOrb.position.set(0, 23.5, 0);
  scene.add(spireOrb);

  // ---- JUMP PADS ----
  const jumpPadMeshes = [];
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xf7d06b,
    emissive: 0xff9d2e,
    emissiveIntensity: 1.2,
    roughness: 0.2,
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
      new THREE.CylinderGeometry(pad.radius * 0.5, pad.radius * 0.75, 5.5, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe49e,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.set(pad.x, pad.y + 2.8, pad.z);
    scene.add(beam);
    jumpPadMeshes.push({ ring, beam, baseY: pad.y });
  }

  // ---- ROTATING GOLDEN SKY-RINGS (GRAPPLE ANCHORS) ----
  const ringMeshes = new Map();
  const ringCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfff0b5,
    emissive: 0xf5a623,
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.6,
  });
  for (const r of arenaData.skyRings) {
    const group = new THREE.Group();
    group.position.set(r.x, r.y, r.z);

    const outer = new THREE.Mesh(new THREE.TorusGeometry(r.radius, 0.24, 14, 36), materials.gold);
    outer.castShadow = true;
    group.add(outer);

    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), ringCoreMat);
    group.add(inner);

    scene.add(group);
    ringMeshes.set(r.id, { group, outer, inner });
  }

  // ---- DRIFTING GOLDEN-HOUR CLOUD SEA BELOW ----
  const clouds = [];
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xfbf2e6,
    transparent: true,
    opacity: 0.72,
  });
  const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + (i % 3) * 0.3;
    const dist = 25 + (i % 7) * 26;
    const m = new THREE.Mesh(cloudGeo, cloudMat);
    m.scale.set(16 + (i % 5) * 9, 2.2 + (i % 3) * 1.4, 14 + (i % 4) * 8);
    m.position.set(Math.cos(angle) * dist, -20 - (i % 4) * 5, Math.sin(angle) * dist);
    scene.add(m);
    clouds.push({ mesh: m, speed: 0.8 + (i % 5) * 0.35 });
  }

  return {
    materials,
    update(dt, time, highlightId) {
      spireHalo.rotation.y = time * 0.55;
      spireHalo.rotation.x = Math.sin(time * 0.4) * 0.28;
      spireOrb.rotation.y = -time * 1.1;
      spireOrb.position.y = 23.5 + Math.sin(time * 1.8) * 0.55;

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
        if (c.mesh.position.x > 190) c.mesh.position.x = -190;
      }
    },
  };
}

/**
 * Builds distinct sculpted 3D enemy meshes for Drone, Strider, Aegis Turret, and Solar Colossus Boss.
 */
export function createEnemyMesh(enemy) {
  const group = new THREE.Group();

  const obsidian = new THREE.MeshStandardMaterial({
    color: 0x1a1920,
    roughness: 0.32,
    metalness: 0.65,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe2b347,
    roughness: 0.22,
    metalness: 0.85,
  });
  const crimson = new THREE.MeshStandardMaterial({
    color: 0xff4422,
    emissive: 0xe83115,
    emissiveIntensity: 1.7,
    roughness: 0.18,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffe478,
    emissive: 0xff9f1c,
    emissiveIntensity: 1.8,
    roughness: 0.12,
    metalness: 0.4,
  });

  const parts = { group, rings: [], crystalMeshes: [], coreMat: crimson };

  if (enemy.type === 'drone') {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), crimson);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.14, 10, 24), obsidian);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 24), gold);
    ring2.rotation.x = Math.PI * 0.5;
    group.add(core, ring1, ring2);
    parts.rings.push(ring1, ring2);
  } else if (enemy.type === 'strider') {
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.2, 5), obsidian);
    hull.rotation.x = Math.PI;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.12, 8, 20), gold);
    crown.rotation.x = Math.PI * 0.5;
    crown.position.y = 0.45;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), crimson);
    eye.position.y = 0.55;
    group.add(hull, crown, eye);
    parts.rings.push(crown);
  } else if (enemy.type === 'aegis') {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 3.0, 6), obsidian);
    const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.18, 8, 6), gold);
    shieldRing.rotation.x = Math.PI * 0.5;
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), crimson);
    eye.position.y = 1.85;
    group.add(pillar, shieldRing, eye);
    parts.rings.push(shieldRing);
  } else if (enemy.type === 'colossus') {
    // Monumental Solar Colossus Titan!
    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), obsidian);
    const innerSun = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65, 1), crimson);
    const outerHalo1 = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.34, 14, 42), gold);
    const outerHalo2 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 12, 36), obsidian);
    outerHalo2.rotation.x = Math.PI * 0.5;
    group.add(core, innerSun, outerHalo1, outerHalo2);
    parts.rings.push(outerHalo1, outerHalo2);

    // Orbiting destructible Solar Crystals (placed in world space by game loop)
    for (const c of enemy.crystals) {
      const cm = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), crystalMat);
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
