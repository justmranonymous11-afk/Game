import * as THREE from 'three';

/**
 * Creates articulated, realistic multi-part 3D military/sci-fi mechanical combat enemies:
 * - drone: Quadcopter Recon Drone (4 shrouded spinning rotors, optical turret, dynamic tilt)
 * - striker: Bipedal Combat Automa (helmet visor, articulated striding legs, aiming rifle)
 * - aegis: Heavy Riot Shield-Trooper (broad armor + translucent glowing hexagonal ballistic shield)
 * - viper: Long-Range Recon Sniper Droid (sniper barrel, rangefinder mast, crimson laser designator)
 * - juggernaut: Massive Armored Siege Walker (hydraulic legs, twin 3-tube rocket pods, rear reactor core)
 * - seeker: Swept-Wing Hunter-Killer UAV
 * - gunship: BOSS — VALKYRIE-01 Heavy Assault VTOL Gunship (twin spinning tilt-rotors, cockpit, chin cannon, 4 destructible engine nacelles)
 */
export function createRealisticEnemyMesh(enemy) {
  const group = new THREE.Group();

  const gunmetal = new THREE.MeshStandardMaterial({
    color: 0x262b33,
    roughness: 0.34,
    metalness: 0.84,
  });
  const oliveArmor = new THREE.MeshStandardMaterial({
    color: 0x3b4248,
    roughness: 0.46,
    metalness: 0.58,
  });
  const darkCarbon = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    roughness: 0.3,
    metalness: 0.72,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xd4a448,
    roughness: 0.24,
    metalness: 0.88,
  });
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
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.44,
    roughness: 0.08,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const parts = {
    group,
    rotors: [],
    legs: [],
    coreMat: visorRed,
    shieldMat: null,
    laserLine: null,
    nacelleMeshes: [],
    searchlight: null,
  };

  if (enemy.type === 'drone') {
    // Central camera & avionics pod
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.44, 1.12), gunmetal);
    const opticHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.35, 14), darkCarbon);
    opticHousing.rotation.x = Math.PI * 0.5;
    opticHousing.position.set(0, -0.02, 0.56);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), visorRed);
    lens.position.set(0, -0.02, 0.72);
    // Underslung twin autocannon barrels
    for (const bx of [-0.22, 0.22]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.75, 8), darkCarbon);
      barrel.rotation.x = Math.PI * 0.5;
      barrel.position.set(bx, -0.32, 0.45);
      group.add(barrel);
    }
    group.add(pod, opticHousing, lens);

    // 4 Diagonal arms + ducted rotor shrouds + spinning blades
    for (const [ax, az] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 1.15), darkCarbon);
      arm.position.set(ax * 0.52, 0.08, az * 0.52);
      arm.rotation.y = Math.atan2(ax, az);
      group.add(arm);

      const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 18), oliveArmor);
      shroud.rotation.x = Math.PI * 0.5;
      shroud.position.set(ax * 0.88, 0.14, az * 0.88);
      group.add(shroud);

      const rotor = new THREE.Group();
      rotor.position.set(ax * 0.88, 0.16, az * 0.88);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.08), darkCarbon);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 14), rotorBlurMat);
      disc.rotation.x = -Math.PI * 0.5;
      rotor.add(blade, disc);
      group.add(rotor);
      parts.rotors.push(rotor);
    }
  } else if (enemy.type === 'striker') {
    // Articulated Bipedal Tactical Combat Droid
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.92, 0.56), oliveArmor);
    torso.position.y = 0.25;
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 0.64), gunmetal);
    chestPlate.position.y = 0.34;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.48), gunmetal);
    head.position.set(0, 0.96, 0.02);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.12), visorRed);
    visor.position.set(0, 0.98, 0.24);
    const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.46), gunmetal);
    pauldronL.position.set(-0.58, 0.52, 0);
    const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.46), gunmetal);
    pauldronR.position.set(0.58, 0.52, 0);

    // Right arm & tactical rifle
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.72), darkCarbon);
    armR.position.set(0.54, 0.28, 0.32);
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 1.05), darkCarbon);
    rifle.position.set(0.52, 0.28, 0.78);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8), brass);
    muzzle.rotation.x = Math.PI * 0.5;
    muzzle.position.set(0.52, 0.3, 1.32);

    // Left arm supporting rifle
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.66), darkCarbon);
    armL.position.set(-0.46, 0.22, 0.26);
    armL.rotation.y = 0.32;

    // Articulated striding legs
    for (const lx of [-0.26, 0.26]) {
      const leg = new THREE.Group();
      leg.position.set(lx, -0.18, 0);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.56, 0.3), darkCarbon);
      thigh.position.y = -0.26;
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.58, 0.32), gunmetal);
      shin.position.set(0, -0.78, -0.04);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.46), darkCarbon);
      foot.position.set(0, -1.08, 0.08);
      leg.add(thigh, shin, foot);
      group.add(leg);
      parts.legs.push(leg);
    }

    group.add(torso, chestPlate, head, visor, pauldronL, pauldronR, armR, armL, rifle, muzzle);
  } else if (enemy.type === 'aegis') {
    // Heavy Armored Ballistic Shield Trooper
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.15, 0.76), gunmetal);
    torso.position.y = 0.32;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.56), darkCarbon);
    head.position.y = 1.12;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.12), visorRed);
    visor.position.set(0, 1.12, 0.28);

    // Right arm heavy plasma repeater
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.25, 10), darkCarbon);
    cannon.rotation.x = Math.PI * 0.5;
    cannon.position.set(0.76, 0.32, 0.65);

    // Left arm Hexagonal Ballistic Energy Shield!
    const shieldFrame = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.12, 6), gunmetal);
    shieldFrame.rotation.x = Math.PI * 0.5;
    shieldFrame.position.set(-0.62, 0.32, 0.88);
    const shieldPane = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.14, 6), shieldMat);
    shieldPane.rotation.x = Math.PI * 0.5;
    shieldPane.position.set(-0.62, 0.32, 0.89);
    parts.shieldMat = shieldMat;

    for (const lx of [-0.36, 0.36]) {
      const leg = new THREE.Group();
      leg.position.set(lx, -0.25, 0);
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.15, 0.44), oliveArmor);
      pillar.position.y = -0.58;
      leg.add(pillar);
      group.add(leg);
      parts.legs.push(leg);
    }

    group.add(torso, head, visor, cannon, shieldFrame, shieldPane);
  } else if (enemy.type === 'viper') {
    // Elevated Recon Sniper Construct with volumetric Laser Sight!
    parts.coreMat = visorEmerald;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.96, 0.48), darkCarbon);
    body.position.y = 0.2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.54), gunmetal);
    head.position.set(0, 0.92, 0.08);
    const optic = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12), visorEmerald);
    optic.rotation.x = Math.PI * 0.5;
    optic.position.set(0.08, 0.94, 0.36);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.1, 6), brass);
    antenna.position.set(-0.24, 1.38, -0.12);

    const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), darkCarbon);
    longBarrel.rotation.x = Math.PI * 0.5;
    longBarrel.position.set(0.42, 0.45, 1.05);

    const tripod1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.15, 0.22), oliveArmor);
    tripod1.position.set(-0.24, -0.7, 0);
    const tripod2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.15, 0.22), oliveArmor);
    tripod2.position.set(0.24, -0.7, 0);

    group.add(body, head, optic, antenna, longBarrel, tripod1, tripod2);

    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
    ]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.9 });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false;
    laserLine.frustumCulled = false;
    parts.laserLine = laserLine;
  } else if (enemy.type === 'juggernaut') {
    // Massive 3.4m Armored Heavy Siege Mech Walker!
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.65, 1.55), gunmetal);
    hull.position.y = 0.85;
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.45), darkCarbon);
    cockpit.position.set(0, 1.15, 0.78);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.1), visorRed);
    slit.position.set(0, 1.15, 1.02);

    // Glowing Rear Reactor Vent (Crit Weakpoint!)
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.26, 12), visorRed);
    reactor.rotation.x = Math.PI * 0.5;
    reactor.position.set(0, 0.95, -0.84);

    // Twin Shoulder-Mounted 3-Tube Rocket Pods
    for (const sx of [-1.25, 1.25]) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 1.15), oliveArmor);
      pod.position.set(sx, 1.55, 0.12);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 1.2), brass);
      trim.position.set(sx, 1.92, 0.12);
      group.add(pod, trim);
    }

    // Heavy Hydraulic Walker Legs
    for (const lx of [-0.66, 0.66]) {
      const leg = new THREE.Group();
      leg.position.set(lx, 0.05, 0);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.95, 0.62), darkCarbon);
      upper.position.set(0, -0.42, -0.1);
      upper.rotation.x = 0.25;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.05, 0.54), gunmetal);
      lower.position.set(0, -1.25, 0.08);
      lower.rotation.x = -0.18;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.24, 0.95), darkCarbon);
      foot.position.set(0, -1.78, 0.18);
      leg.add(upper, lower, foot);
      group.add(leg);
      parts.legs.push(leg);
    }

    group.add(hull, cockpit, slit, reactor);
  } else if (enemy.type === 'seeker') {
    // Sleek Swept-Wing Hunter-Killer Combat UAV
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.46, 2.2, 6), gunmetal);
    fuselage.rotation.x = Math.PI * 0.5;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.65), oliveArmor);
    wingL.position.set(-0.75, 0, -0.18);
    wingL.rotation.y = 0.36;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.65), oliveArmor);
    wingR.position.set(0.75, 0, -0.18);
    wingR.rotation.y = -0.36;
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), visorRed);
    sensor.position.set(0, 0.05, 0.88);
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.35, 10), visorRed);
    thruster.rotation.x = Math.PI * 0.5;
    thruster.position.set(0, 0, -1.12);
    group.add(fuselage, wingL, wingR, sensor, thruster);
  } else if (enemy.type === 'gunship') {
    // BOSS — "VALKYRIE-01" HEAVY ASSAULT VTOL GUNSHIP (14m Wingspan!)
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.5, 9.6), gunmetal);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(2.1, 3.6, 4), gunmetal);
    nose.rotation.x = Math.PI * 0.5;
    nose.rotation.y = Math.PI * 0.25;
    nose.position.set(0, -0.1, 6.4);

    // Armored tinted cockpit canopy
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b2a,
      roughness: 0.08,
      metalness: 0.92,
      emissive: 0x3b1808,
      emissiveIntensity: 0.35,
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 3.2), canopyMat);
    canopy.position.set(0, 0.85, 3.4);
    canopy.rotation.x = 0.26;

    // Swept armored stub wings
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.55, 2.8), oliveArmor);
    mainWing.position.set(0, 0.45, 0.4);

    // Tail boom & twin angled stealth vertical stabilizers
    const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 5.2), gunmetal);
    tailBoom.position.set(0, 0.4, -6.8);
    for (const sx of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.6, 2.2), darkCarbon);
      fin.position.set(sx * 1.1, 1.6, -8.4);
      fin.rotation.z = sx * -0.25;
      group.add(fin);
    }

    // Twin Massive Wingtip Ducted Tilt-Rotors
    for (const wx of [-6.4, 6.4]) {
      const shroud = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.32, 12, 32), darkCarbon);
      shroud.rotation.x = Math.PI * 0.5;
      shroud.position.set(wx, 0.65, 0.4);
      group.add(shroud);

      const rotor = new THREE.Group();
      rotor.position.set(wx, 0.72, 0.4);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.06, 0.26), darkCarbon);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 3.9), darkCarbon);
      const blur = new THREE.Mesh(new THREE.CircleGeometry(1.98, 22), rotorBlurMat);
      blur.rotation.x = -Math.PI * 0.5;
      rotor.add(b1, b2, blur);
      group.add(rotor);
      parts.rotors.push(rotor);
    }

    // Chin-mounted Gatling Autocannon
    const chinTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.4, 10), darkCarbon);
    chinTurret.rotation.x = Math.PI * 0.5;
    chinTurret.position.set(0, -1.45, 5.4);

    // Sweeping Volumetric Tactical Searchlight Cone
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

    // 4 Destructible Glowing Armored Turbine/Reactor Cores (world-space tracked!)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff6b1a,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.7,
    });
    for (const c of enemy.crystals) {
      const nacGroup = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 12), darkCarbon);
      shell.rotation.x = Math.PI * 0.5;
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 14), coreMat);
      nacGroup.add(shell, glow);
      parts.nacelleMeshes.push({ crystal: c, mesh: nacGroup });
    }
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
