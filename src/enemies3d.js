import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Instantiates real motion-captured rigged 3D GLB enemies (Soldier.glb & Xbot.glb via SkeletonUtils)
 * alongside beveled CAD/megascan mechanical war-machines (Quad-Drones, Juggernaut Walkers,
 * Hunter-Killer UAVs, and the VALKYRIE-01 Heavy Assault VTOL Gunship Boss).
 */
export function createRealisticEnemyMesh(enemy, assets) {
  const group = new THREE.Group();
  const mats = assets?.materials || {};

  const gunmetal = mats.darkSteel || new THREE.MeshStandardMaterial({ color: 0x262b33, roughness: 0.34, metalness: 0.84 });
  const carbon = mats.carbon || new THREE.MeshStandardMaterial({ color: 0x16191e, roughness: 0.32, metalness: 0.65 });
  const oliveArmor = mats.crateOlive || new THREE.MeshStandardMaterial({ color: 0x3b443e, roughness: 0.48, metalness: 0.5 });
  const brass = mats.brass || new THREE.MeshStandardMaterial({ color: 0xd4a448, roughness: 0.24, metalness: 0.88 });

  const visorRed = new THREE.MeshStandardMaterial({
    color: 0xff3b20,
    emissive: 0xff2208,
    emissiveIntensity: 2.6,
    roughness: 0.12,
  });
  const visorEmerald = new THREE.MeshStandardMaterial({
    color: 0x22e58a,
    emissive: 0x10c46c,
    emissiveIntensity: 2.5,
    roughness: 0.12,
  });
  const rotorBlurMat = new THREE.MeshBasicMaterial({
    color: 0x1a1e24,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.45,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const parts = {
    group,
    mixer: null,
    actions: {},
    activeClip: null,
    rotors: [],
    legs: [],
    coreMat: visorRed,
    shieldMat: null,
    laserLine: null,
    nacelleMeshes: [],
    searchlight: null,
  };

  // ---- 1. STRIKER TROOPER — REAL MOTION-CAPTURED RIGGED Soldier.glb! ----
  if (enemy.type === 'striker' && assets?.models?.soldier) {
    const src = assets.models.soldier;
    const model = SkeletonUtils.clone(src.scene);
    const scale = 1.95 / (src.height || 1.8);
    model.scale.setScalar(scale);
    // Soldier.glb faces -Z natively; flip Math.PI so it aims straight toward player along +Z!
    model.rotation.y = Math.PI;
    model.position.y = -1.15 - src.minY * scale;
    group.add(model);

    // Mount glowing tactical carbine & helmet beacon for crystal-clear combat silhouette
    const rifle = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.16, 1.05, 2, 0.02), carbon);
    rifle.position.set(0.32, 0.25, 0.65);
    const optic = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), visorRed);
    optic.position.set(0.32, 0.34, 1.15);
    group.add(rifle, optic);

    const mixer = new THREE.AnimationMixer(model);
    const runClip = src.animations.find((a) => a.name === 'Run') || src.animations[0];
    const idleClip = src.animations.find((a) => a.name === 'Idle') || src.animations[0];
    if (runClip) {
      parts.actions.run = mixer.clipAction(runClip);
      parts.actions.run.play();
      parts.activeClip = 'run';
    }
    if (idleClip) {
      parts.actions.idle = mixer.clipAction(idleClip);
    }
    parts.mixer = mixer;
    group.position.set(enemy.x, enemy.y, enemy.z);
    return parts;
  }

  // ---- 2. AEGIS SHIELD-COMMANDO — REAL RIGGED Xbot.glb + BALLISTIC SHIELD! ----
  if (enemy.type === 'aegis' && assets?.models?.xbot) {
    const src = assets.models.xbot;
    const model = SkeletonUtils.clone(src.scene);
    const scale = 2.15 / (src.height || 1.8);
    model.scale.setScalar(scale);
    model.position.y = -1.15 - src.minY * scale;

    // Tint Xbot into dark armored heavy commando titanium
    model.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();
        obj.material.color.multiplyScalar(0.35);
        obj.material.metalness = 0.78;
        obj.material.roughness = 0.3;
      }
    });
    group.add(model);

    // Hexagonal Ballistic Energy Shield + Heavy Right-Arm Cannon
    const shieldFrame = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.12, 6), gunmetal);
    shieldFrame.rotation.x = Math.PI * 0.5;
    shieldFrame.position.set(-0.56, 0.25, 0.85);
    const shieldPane = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.14, 6), shieldMat);
    shieldPane.rotation.x = Math.PI * 0.5;
    shieldPane.position.set(-0.56, 0.25, 0.86);
    parts.shieldMat = shieldMat;

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.15, 10), carbon);
    cannon.rotation.x = Math.PI * 0.5;
    cannon.position.set(0.62, 0.28, 0.65);
    group.add(shieldFrame, shieldPane, cannon);

    const mixer = new THREE.AnimationMixer(model);
    const walkClip = src.animations.find((a) => a.name === 'walk') || src.animations[0];
    const idleClip = src.animations.find((a) => a.name === 'idle') || src.animations[0];
    if (walkClip) {
      parts.actions.run = mixer.clipAction(walkClip);
      parts.actions.run.play();
      parts.activeClip = 'run';
    }
    if (idleClip) parts.actions.idle = mixer.clipAction(idleClip);
    parts.mixer = mixer;
    group.position.set(enemy.x, enemy.y, enemy.z);
    return parts;
  }

  // ---- 3. VIPER RECON SNIPER — REAL RIGGED Xbot.glb (EMERALD STEALTH + LASER SIGHT!) ----
  if (enemy.type === 'viper' && assets?.models?.xbot) {
    parts.coreMat = visorEmerald;
    const src = assets.models.xbot;
    const model = SkeletonUtils.clone(src.scene);
    const scale = 1.95 / (src.height || 1.8);
    model.scale.setScalar(scale);
    model.position.y = -1.15 - src.minY * scale;

    model.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material = obj.material.clone();
        obj.material.color.setHex(0x1f362d);
        obj.material.metalness = 0.72;
        obj.material.roughness = 0.34;
      }
    });
    group.add(model);

    const sniperBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 2.2, 10), carbon);
    sniperBarrel.rotation.x = Math.PI * 0.5;
    sniperBarrel.position.set(0.36, 0.42, 1.0);
    const scopeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), visorEmerald);
    scopeGlow.position.set(0.36, 0.54, 0.72);
    group.add(sniperBarrel, scopeGlow);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.92 });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false;
    laserLine.frustumCulled = false;
    parts.laserLine = laserLine;

    const mixer = new THREE.AnimationMixer(model);
    const sneak = src.animations.find((a) => a.name === 'sneak_pose') || src.animations.find((a) => a.name === 'idle');
    if (sneak) {
      parts.actions.idle = mixer.clipAction(sneak);
      parts.actions.idle.play();
      parts.activeClip = 'idle';
    }
    parts.mixer = mixer;
    group.position.set(enemy.x, enemy.y, enemy.z);
    return parts;
  }

  // ---- 4. RECON QUAD-DRONE (Beveled Carbon-Fiber Frame + 4 Spinning Ducted Rotors) ----
  if (enemy.type === 'drone') {
    const pod = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.44, 1.15, 3, 0.08), carbon);
    const opticHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.35, 16), gunmetal);
    opticHousing.rotation.x = Math.PI * 0.5;
    opticHousing.position.set(0, -0.02, 0.56);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), visorRed);
    lens.position.set(0, -0.02, 0.72);
    for (const bx of [-0.22, 0.22]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.75, 8), gunmetal);
      barrel.rotation.x = Math.PI * 0.5;
      barrel.position.set(bx, -0.3, 0.45);
      group.add(barrel);
    }
    group.add(pod, opticHousing, lens);

    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const arm = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.1, 1.15, 2, 0.02), carbon);
      arm.position.set(ax * 0.52, 0.08, az * 0.52);
      arm.rotation.y = Math.atan2(ax, az);
      group.add(arm);

      const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 10, 22), oliveArmor);
      shroud.rotation.x = Math.PI * 0.5;
      shroud.position.set(ax * 0.88, 0.14, az * 0.88);
      group.add(shroud);

      const rotor = new THREE.Group();
      rotor.position.set(ax * 0.88, 0.16, az * 0.88);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.08), carbon);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), rotorBlurMat);
      disc.rotation.x = -Math.PI * 0.5;
      rotor.add(blade, disc);
      group.add(rotor);
      parts.rotors.push(rotor);
    }
  } else if (enemy.type === 'juggernaut') {
    // Heavy Beveled Riveted Steel Siege Mech Walker!
    const hull = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.68, 1.6, 3, 0.14), gunmetal);
    hull.position.y = 0.85;
    const cockpit = new THREE.Mesh(new RoundedBoxGeometry(1.18, 0.56, 0.48, 2, 0.08), carbon);
    cockpit.position.set(0, 1.15, 0.78);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.1), visorRed);
    slit.position.set(0, 1.15, 1.02);
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.28, 14), visorRed);
    reactor.rotation.x = Math.PI * 0.5;
    reactor.position.set(0, 0.95, -0.84);

    for (const sx of [-1.28, 1.28]) {
      const pod = new THREE.Mesh(new RoundedBoxGeometry(0.68, 0.78, 1.18, 2, 0.08), oliveArmor);
      pod.position.set(sx, 1.55, 0.12);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 1.2), brass);
      trim.position.set(sx, 1.92, 0.12);
      group.add(pod, trim);
    }

    for (const lx of [-0.66, 0.66]) {
      const leg = new THREE.Group();
      leg.position.set(lx, 0.05, 0);
      const upper = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.95, 0.62, 2, 0.08), carbon);
      upper.position.set(0, -0.42, -0.1);
      upper.rotation.x = 0.25;
      const lower = new THREE.Mesh(new RoundedBoxGeometry(0.46, 1.05, 0.54, 2, 0.08), gunmetal);
      lower.position.set(0, -1.25, 0.08);
      lower.rotation.x = -0.18;
      const foot = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.24, 0.96, 2, 0.06), carbon);
      foot.position.set(0, -1.78, 0.18);
      leg.add(upper, lower, foot);
      group.add(leg);
      parts.legs.push(leg);
    }
    group.add(hull, cockpit, slit, reactor);
  } else if (enemy.type === 'seeker') {
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.46, 2.2, 8), gunmetal);
    fuselage.rotation.x = Math.PI * 0.5;
    const wingL = new THREE.Mesh(new RoundedBoxGeometry(1.75, 0.09, 0.65, 2, 0.03), oliveArmor);
    wingL.position.set(-0.75, 0, -0.18);
    wingL.rotation.y = 0.36;
    const wingR = new THREE.Mesh(new RoundedBoxGeometry(1.75, 0.09, 0.65, 2, 0.03), oliveArmor);
    wingR.position.set(0.75, 0, -0.18);
    wingR.rotation.y = -0.36;
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), visorRed);
    sensor.position.set(0, 0.05, 0.88);
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.35, 10), visorRed);
    thruster.rotation.x = Math.PI * 0.5;
    thruster.position.set(0, 0, -1.12);
    group.add(fuselage, wingL, wingR, sensor, thruster);
  } else if (enemy.type === 'gunship') {
    // BOSS — VALKYRIE-01 HEAVY ASSAULT VTOL GUNSHIP (Beveled Stealth Armor + Real Steel PBR)
    const fuselage = new THREE.Mesh(new RoundedBoxGeometry(3.4, 2.5, 9.6, 3, 0.35), gunmetal);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(2.05, 3.6, 6), gunmetal);
    nose.rotation.x = Math.PI * 0.5;
    nose.position.set(0, -0.1, 6.4);

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1624,
      roughness: 0.06,
      metalness: 0.9,
      clearcoat: 1.0,
      emissive: 0x2b1206,
      emissiveIntensity: 0.3,
    });
    const canopy = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.15, 3.2, 3, 0.22), canopyMat);
    canopy.position.set(0, 0.85, 3.4);
    canopy.rotation.x = 0.26;

    const mainWing = new THREE.Mesh(new RoundedBoxGeometry(13.4, 0.55, 2.8, 2, 0.14), oliveArmor);
    mainWing.position.set(0, 0.45, 0.4);

    const tailBoom = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.2, 5.2, 2, 0.18), gunmetal);
    tailBoom.position.set(0, 0.4, -6.8);
    for (const sx of [-1, 1]) {
      const fin = new THREE.Mesh(new RoundedBoxGeometry(0.28, 2.6, 2.2, 2, 0.06), carbon);
      fin.position.set(sx * 1.1, 1.6, -8.4);
      fin.rotation.z = sx * -0.25;
      group.add(fin);
    }

    for (const wx of [-6.4, 6.4]) {
      const shroud = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.32, 14, 36), carbon);
      shroud.rotation.x = Math.PI * 0.5;
      shroud.position.set(wx, 0.65, 0.4);
      group.add(shroud);

      const rotor = new THREE.Group();
      rotor.position.set(wx, 0.72, 0.4);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.06, 0.26), carbon);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 3.9), carbon);
      const blur = new THREE.Mesh(new THREE.CircleGeometry(1.98, 24), rotorBlurMat);
      blur.rotation.x = -Math.PI * 0.5;
      rotor.add(b1, b2, blur);
      group.add(rotor);
      parts.rotors.push(rotor);
    }

    const chinTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.4, 12), carbon);
    chinTurret.rotation.x = Math.PI * 0.5;
    chinTurret.position.set(0, -1.45, 5.4);

    const searchlight = new THREE.Mesh(
      new THREE.ConeGeometry(5.5, 22, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffdfb0,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    searchlight.position.set(0, -11.5, 6.2);
    searchlight.rotation.x = 0.24;
    parts.searchlight = searchlight;

    group.add(fuselage, nose, canopy, mainWing, tailBoom, chinTurret, searchlight);

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff6b1a,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.7,
    });
    for (const c of enemy.crystals) {
      const nacGroup = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 14), carbon);
      shell.rotation.x = Math.PI * 0.5;
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 14), coreMat);
      nacGroup.add(shell, glow);
      parts.nacelleMeshes.push({ crystal: c, mesh: nacGroup });
    }
  } else {
    // Graceful fallback if GLBs haven't finished loading yet
    const fallback = new THREE.Mesh(new RoundedBoxGeometry(0.9, 1.8, 0.6, 2, 0.1), oliveArmor);
    group.add(fallback);
  }

  group.traverse((obj) => {
    if (obj.isMesh && !obj.material.transparent) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  group.position.set(enemy.x, enemy.y, enemy.z);
  return parts;
}
