import * as THREE from 'three';

/**
 * Sculpted 3D First-Person Viewmodel attached to the camera:
 * - Right hand: The Prism Lance (porcelain, obsidian & brushed-gold kinetic rail-carbine with spinning solar rings)
 * - Left hand: The Solar Grapple Gauntlet (floating brass rings that flare when grappling or parrying)
 */
export class Viewmodel {
  constructor(camera) {
    this.root = new THREE.Group();
    camera.add(this.root);

    const porcelain = new THREE.MeshStandardMaterial({
      color: 0xf7f2e8,
      roughness: 0.25,
      metalness: 0.1,
    });
    const obsidian = new THREE.MeshStandardMaterial({
      color: 0x1b1a1f,
      roughness: 0.35,
      metalness: 0.55,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xe2b347,
      roughness: 0.22,
      metalness: 0.88,
      emissive: 0x422804,
      emissiveIntensity: 0.3,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd25a,
      emissive: 0xff7b29,
      emissiveIntensity: 1.8,
      roughness: 0.15,
    });

    // ---- RIGHT HAND: PRISM LANCE ----
    this.lance = new THREE.Group();
    this.lance.position.set(0.32, -0.26, -0.58);
    this.root.add(this.lance);

    // Main sculpted chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.56), porcelain);
    this.lance.add(body);

    // Twin obsidian upper/lower rails
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.72), obsidian);
    topRail.position.set(0, 0.068, -0.1);
    this.lance.add(topRail);

    const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.03, 0.64), obsidian);
    botRail.position.set(0, -0.065, -0.06);
    this.lance.add(botRail);

    // Brushed gold side fins
    const finGeo = new THREE.BoxGeometry(0.018, 0.07, 0.42);
    const finL = new THREE.Mesh(finGeo, gold);
    finL.position.set(-0.064, 0.005, -0.04);
    const finR = new THREE.Mesh(finGeo, gold);
    finR.position.set(0.064, 0.005, -0.04);
    this.lance.add(finL, finR);

    // Glowing floating solar prism core
    this.prismCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), coreMat);
    this.prismCore.position.set(0, 0.01, -0.34);
    this.lance.add(this.prismCore);

    // Rotating golden muzzle accelerator ring
    this.muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 10, 24), gold);
    this.muzzleRing.position.set(0, 0.01, -0.38);
    this.lance.add(this.muzzleRing);

    // Dynamic muzzle flash light
    this.muzzleLight = new THREE.PointLight(0xffb443, 0, 8);
    this.muzzleLight.position.set(0, 0.02, -0.55);
    this.lance.add(this.muzzleLight);

    // ---- LEFT HAND: SOLAR GRAPPLE GAUNTLET ----
    this.gauntlet = new THREE.Group();
    this.gauntlet.position.set(-0.38, -0.31, -0.52);
    this.root.add(this.gauntlet);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.22, 8), obsidian);
    cuff.rotation.x = Math.PI * 0.44;
    this.gauntlet.add(cuff);

    this.grappleRingA = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.011, 10, 24), gold);
    this.grappleRingA.position.set(0, 0.02, -0.14);
    this.gauntlet.add(this.grappleRingA);

    this.grappleRingB = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.009, 10, 24), coreMat);
    this.grappleRingB.position.set(0, 0.02, -0.16);
    this.gauntlet.add(this.grappleRingB);

    this.bobPhase = 0;
    this.parryKick = 0;
  }

  triggerParryAnim() {
    this.parryKick = 1.0;
  }

  update(dt, engine) {
    const p = engine.player;
    const horizSpeed = Math.hypot(p.vx, p.vz);

    if (p.grounded && horizSpeed > 1.2) {
      this.bobPhase += dt * Math.min(14, horizSpeed * 0.85);
    } else {
      this.bobPhase += dt * 1.4;
    }

    const bobX = Math.cos(this.bobPhase) * (p.grounded ? 0.014 : 0.004);
    const bobY = Math.abs(Math.sin(this.bobPhase)) * (p.grounded ? 0.018 : 0.005);

    // Prism Lance recoil & kinetic sway
    const recoilZ = p.recoil * 0.11;
    const recoilPitch = p.recoil * 0.16;
    this.lance.position.set(0.32 + bobX, -0.26 - bobY, -0.58 + recoilZ);
    this.lance.rotation.set(recoilPitch, -bobX * 0.8, -p.cameraRoll * 0.45);

    this.prismCore.rotation.y += dt * (2.5 + p.recoil * 14);
    this.prismCore.rotation.x += dt * 1.6;
    this.muzzleRing.rotation.z -= dt * (2.2 + p.recoil * 12);
    this.muzzleLight.intensity = p.recoil > 0.55 ? (p.recoil - 0.55) * 9 : 0;

    // Solar Grapple Gauntlet animation
    this.parryKick = Math.max(0, this.parryKick - dt * 4.2);
    const isGrappling = !!p.grapple;
    const targetGX = isGrappling ? -0.26 : -0.38;
    const targetGY = isGrappling ? -0.22 : -0.31;
    const targetGZ = isGrappling ? -0.68 : -0.52 - this.parryKick * 0.18;

    this.gauntlet.position.x += (targetGX - bobX * 0.7 - this.gauntlet.position.x) * Math.min(1, 14 * dt);
    this.gauntlet.position.y += (targetGY - bobY * 0.7 - this.gauntlet.position.y) * Math.min(1, 14 * dt);
    this.gauntlet.position.z += (targetGZ - this.gauntlet.position.z) * Math.min(1, 16 * dt);

    const ringSpin = isGrappling ? 12 : engine.grappleHighlight ? 5.5 : 1.5;
    this.grappleRingA.rotation.z += dt * ringSpin;
    this.grappleRingB.rotation.z -= dt * ringSpin * 1.3;
    const ringScale = isGrappling ? 1.25 : engine.grappleHighlight ? 1.12 : 1.0;
    this.grappleRingA.scale.setScalar(ringScale);
  }
}
