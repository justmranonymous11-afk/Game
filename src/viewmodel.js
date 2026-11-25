import * as THREE from 'three';

/**
 * Realistic 3D First-Person Tactical Weapon System & Articulated Armored Hands:
 * - 3 Distinct multi-part sculpted weapons (MK-IV Pulse Carbine, Helio-9 Railgun, M88 Breacher Shotgun)
 * - Live 3D OLED ammo counter CanvasTexture mounted on the weapon receiver
 * - True 3D Holographic Reflex Sight that aligns dead-center during Right-Click ADS
 * - Animated reload mag-drop, shotgun pump rack, recoil kick, sprint/slide tilt, and starburst muzzle flash
 */
export class TacticalViewmodel {
  constructor(camera) {
    this.root = new THREE.Group();
    camera.add(this.root);

    this.weaponPivot = new THREE.Group();
    this.root.add(this.weaponPivot);

    // Shared realistic weapon materials catching Preetham PMREM reflections
    const gunmetal = new THREE.MeshStandardMaterial({
      color: 0x262b32,
      roughness: 0.34,
      metalness: 0.86,
    });
    const darkPolymer = new THREE.MeshStandardMaterial({
      color: 0x16191e,
      roughness: 0.62,
      metalness: 0.18,
    });
    const titanium = new THREE.MeshStandardMaterial({
      color: 0x6a737d,
      roughness: 0.28,
      metalness: 0.9,
    });
    const copperCoil = new THREE.MeshStandardMaterial({
      color: 0xc87a3b,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x522105,
      emissiveIntensity: 0.5,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1e2228,
      roughness: 0.72,
      metalness: 0.12,
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x383e42,
      roughness: 0.86,
      metalness: 0.05,
    });
    const holoGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.1,
    });
    const holoDotMat = new THREE.MeshBasicMaterial({
      color: 0xff4624,
      transparent: true,
      opacity: 0.95,
    });

    // Dynamic 3D OLED Ammo Counter screen
    this.oledCanvas = document.createElement('canvas');
    this.oledCanvas.width = 128;
    this.oledCanvas.height = 64;
    this.oledTex = new THREE.CanvasTexture(this.oledCanvas);
    this.oledTex.colorSpace = THREE.SRGBColorSpace;
    this.oledMat = new THREE.MeshBasicMaterial({ map: this.oledTex });
    this._lastAmmoStr = '';

    // ---- ARTICULATED ARMORED HANDS & FOREARMS ----
    this.armsGroup = new THREE.Group();
    this.weaponPivot.add(this.armsGroup);

    // Right Forearm & Armored Glove gripping pistol grip
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.054, 0.36, 10), sleeveMat);
    rForearm.rotation.x = Math.PI * 0.44;
    rForearm.rotation.z = -0.18;
    rForearm.position.set(0.055, -0.14, 0.28);
    const rGauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.075, 0.12), gloveMat);
    rGauntlet.position.set(0.015, -0.095, 0.09);
    const rArmorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.02, 0.08), gunmetal);
    rArmorPlate.position.set(0.015, -0.055, 0.09);
    this.armsGroup.add(rForearm, rGauntlet, rArmorPlate);

    // Left Forearm & Support Glove cradling weapon forend
    this.leftArm = new THREE.Group();
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.052, 0.4, 10), sleeveMat);
    lForearm.rotation.x = Math.PI * 0.46;
    lForearm.rotation.z = 0.56;
    lForearm.position.set(-0.18, -0.15, 0.04);
    const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.072, 0.115), gloveMat);
    lGlove.position.set(-0.025, -0.075, -0.18);
    const lKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.022, 0.07), gunmetal);
    lKnuckle.position.set(-0.025, -0.11, -0.18);
    this.leftArm.add(lForearm, lGlove, lKnuckle);
    this.armsGroup.add(this.leftArm);

    // ---- WEAPON 1: MK-IV PULSE CARBINE ----
    this.carbine = new THREE.Group();
    const cRecv = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.1, 0.42), gunmetal);
    const cUpper = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.04, 0.46), titanium);
    cUpper.position.set(0, 0.056, -0.02);
    const cHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.078, 0.28), darkPolymer);
    cHandguard.position.set(0, 0.005, -0.32);
    const cBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.34, 10), gunmetal);
    cBarrel.rotation.x = Math.PI * 0.5;
    cBarrel.position.set(0, 0.018, -0.52);
    const cBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.075, 8), darkPolymer);
    cBrake.rotation.x = Math.PI * 0.5;
    cBrake.position.set(0, 0.018, -0.69);
    const cGrip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.13, 0.065), darkPolymer);
    cGrip.position.set(0, -0.095, 0.08);
    cGrip.rotation.x = 0.28;

    this.carbineMag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.17, 0.076), darkPolymer);
    this.carbineMag.position.set(0, -0.12, -0.09);
    this.carbineMag.rotation.x = -0.16;

    // 3D Holographic Reflex Sight on Picatinny rail
    const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.024, 0.11), darkPolymer);
    opticBase.position.set(0, 0.088, 0.02);
    const opticHoodL = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.064, 0.095), gunmetal);
    opticHoodL.position.set(-0.028, 0.124, 0.02);
    const opticHoodR = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.064, 0.095), gunmetal);
    opticHoodR.position.set(0.028, 0.124, 0.02);
    const opticHoodT = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.009, 0.095), gunmetal);
    opticHoodT.position.set(0, 0.156, 0.02);
    const opticGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.048, 0.052), holoGlassMat);
    opticGlass.position.set(0, 0.124, 0.02);
    const holoDot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 10), holoDotMat);
    holoDot.position.set(0, 0.124, 0.022);
    const holoRing = new THREE.Mesh(new THREE.RingGeometry(0.011, 0.013, 20), holoDotMat);
    holoRing.position.set(0, 0.124, 0.022);

    // Live 3D OLED Ammo Counter angled toward player's eye
    const oledScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.054, 0.027), this.oledMat);
    oledScreen.position.set(0, 0.064, 0.214);
    oledScreen.rotation.x = -0.25;

    this.carbine.add(
      cRecv, cUpper, cHandguard, cBarrel, cBrake, cGrip, this.carbineMag,
      opticBase, opticHoodL, opticHoodR, opticHoodT, opticGlass, holoDot, holoRing, oledScreen
    );
    this.weaponPivot.add(this.carbine);

    // ---- WEAPON 2: HELIO-9 ELECTROMAGNETIC RAILGUN ----
    this.railgun = new THREE.Group();
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.115, 0.44), gunmetal);
    const rRailTop = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.032, 0.68), titanium);
    rRailTop.position.set(0, 0.046, -0.34);
    const rRailBot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.032, 0.68), titanium);
    rRailBot.position.set(0, -0.028, -0.34);
    this.railGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.6,
      roughness: 0.15,
    });
    const rCore = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.026, 0.62), this.railGlowMat);
    rCore.position.set(0, 0.009, -0.34);
    for (let i = 0; i < 4; i++) {
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.088, 0.036), copperCoil);
      coil.position.set(0, 0.009, -0.18 - i * 0.13);
      this.railgun.add(coil);
    }
    const rScope = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 14), darkPolymer);
    rScope.rotation.x = Math.PI * 0.5;
    rScope.position.set(0, 0.115, -0.04);
    const rScopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.045, 0.14), gunmetal);
    rScopeMount.position.set(0, 0.078, -0.04);
    const rGrip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.13, 0.068), darkPolymer);
    rGrip.position.set(0, -0.1, 0.08);
    rGrip.rotation.x = 0.25;
    const rOled = new THREE.Mesh(new THREE.PlaneGeometry(0.054, 0.027), this.oledMat);
    rOled.position.set(0, 0.065, 0.224);
    rOled.rotation.x = -0.25;
    this.railgun.add(rBody, rRailTop, rRailBot, rCore, rScope, rScopeMount, rGrip, rOled);
    this.railgun.visible = false;
    this.weaponPivot.add(this.railgun);

    // ---- WEAPON 3: M88 BREACHER TACTICAL SHOTGUN ----
    this.shotgun = new THREE.Group();
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.105, 0.36), gunmetal);
    const sTopBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.54, 12), titanium);
    sTopBarrel.rotation.x = Math.PI * 0.5;
    sTopBarrel.position.set(0, 0.036, -0.38);
    const sBotTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 10), darkPolymer);
    sBotTube.rotation.x = Math.PI * 0.5;
    sBotTube.position.set(0, -0.016, -0.35);
    this.shotgunPump = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.068, 0.18), darkPolymer);
    this.shotgunPump.position.set(0, -0.018, -0.3);
    const sSight = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16), titanium);
    sSight.position.set(0, 0.085, 0.04);
    const sGrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.068), darkPolymer);
    sGrip.position.set(0, -0.1, 0.08);
    sGrip.rotation.x = 0.28;
    const sOled = new THREE.Mesh(new THREE.PlaneGeometry(0.054, 0.027), this.oledMat);
    sOled.position.set(0, 0.062, 0.184);
    sOled.rotation.x = -0.25;
    this.shotgun.add(sBody, sTopBarrel, sBotTube, this.shotgunPump, sSight, sGrip, sOled);
    this.shotgun.visible = false;
    this.weaponPivot.add(this.shotgun);

    // ---- MULTI-LAYERED MUZZLE FLASH & LIGHT ----
    const flashGeo = new THREE.PlaneGeometry(0.28, 0.28);
    const flashCanvas = document.createElement('canvas');
    flashCanvas.width = 128;
    flashCanvas.height = 128;
    const fg = flashCanvas.getContext('2d');
    const grad = fg.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,235,1)');
    grad.addColorStop(0.3, 'rgba(255,195,85,0.9)');
    grad.addColorStop(0.7, 'rgba(255,105,25,0.35)');
    grad.addColorStop(1, 'rgba(255,80,10,0)');
    fg.fillStyle = grad;
    fg.fillRect(0, 0, 128, 128);
    const flashTex = new THREE.CanvasTexture(flashCanvas);
    const flashMat = new THREE.MeshBasicMaterial({
      map: flashTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.position.set(0, 0.02, -0.76);
    this.muzzleFlash.visible = false;
    this.weaponPivot.add(this.muzzleFlash);

    this.muzzleLight = new THREE.PointLight(0xffb44c, 0, 10);
    this.muzzleLight.position.set(0, 0.04, -0.78);
    this.weaponPivot.add(this.muzzleLight);

    this.bobPhase = 0;
    this.adsLerp = 0;
    this.swapAnim = 0;
    this.lastWeaponId = 'carbine';
  }

  _updateOled(ammo, maxAmmo, reloading) {
    const key = `${ammo}/${maxAmmo}/${reloading}`;
    if (key === this._lastAmmoStr) return;
    this._lastAmmoStr = key;

    const g = this.oledCanvas.getContext('2d');
    g.fillStyle = '#091017';
    g.fillRect(0, 0, 128, 64);
    g.strokeStyle = reloading ? '#ff4624' : '#38bdf8';
    g.lineWidth = 4;
    g.strokeRect(3, 3, 122, 58);

    g.font = 'bold 34px monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (reloading) {
      g.fillStyle = '#ff6b35';
      g.font = 'bold 22px monospace';
      g.fillText('RELOAD', 64, 34);
    } else {
      g.fillStyle = ammo <= Math.ceil(maxAmmo * 0.25) ? '#ff4624' : '#7dd3fc';
      g.fillText(String(ammo).padStart(2, '0'), 64, 34);
    }
    this.oledTex.needsUpdate = true;
  }

  update(dt, engine) {
    const p = engine.player;
    const w = engine.getActiveWeapon();

    if (w.id !== this.lastWeaponId) {
      this.lastWeaponId = w.id;
      this.swapAnim = 1.0;
    }
    this.swapAnim = Math.max(0, this.swapAnim - dt * 5.2);

    this.carbine.visible = w.id === 'carbine';
    this.railgun.visible = w.id === 'railgun';
    this.shotgun.visible = w.id === 'shotgun';

    this._updateOled(w.ammo, w.maxAmmo, p.reloadTimer > 0);

    // Smooth ADS alignment (centers holographic sight right in front of the eye!)
    const targetAds = p.ads && p.reloadTimer <= 0 ? 1 : 0;
    this.adsLerp += (targetAds - this.adsLerp) * Math.min(1, 18 * dt);

    const hSpeed = Math.hypot(p.vx, p.vz);
    if (p.grounded && hSpeed > 1.2 && p.slideTimer <= 0) {
      this.bobPhase += dt * Math.min(14, hSpeed * 0.85);
    } else {
      this.bobPhase += dt * 1.4;
    }

    const bobScale = (1 - this.adsLerp * 0.82) * (p.grounded ? 1 : 0.28);
    const bobX = Math.cos(this.bobPhase) * 0.011 * bobScale;
    const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.014 * bobScale;

    // Hip-fire vs ADS position
    const hipX = 0.23;
    const hipY = -0.22;
    const hipZ = -0.46;

    const adsX = 0.0;
    const adsY = w.id === 'carbine' ? -0.124 : w.id === 'railgun' ? -0.115 : -0.09;
    const adsZ = -0.34;

    const px = hipX + (adsX - hipX) * this.adsLerp + bobX;
    const py =
      hipY +
      (adsY - hipY) * this.adsLerp -
      bobY -
      this.swapAnim * 0.22 -
      (p.reloadTimer > 0 ? Math.sin(p.reloadTimer * 4) * 0.07 + 0.06 : 0);
    const pz = hipZ + (adsZ - hipZ) * this.adsLerp + p.recoil * (w.id === 'carbine' ? 0.055 : 0.11);

    this.weaponPivot.position.set(px, py, pz);

    const slideTilt = p.slideTimer > 0 ? -0.34 : 0;
    const reloadTilt = p.reloadTimer > 0 ? 0.48 : 0;
    const recoilPitch = p.recoil * (w.id === 'carbine' ? 0.075 : 0.18);
    this.weaponPivot.rotation.set(
      recoilPitch - this.swapAnim * 0.45,
      -bobX * 0.7,
      -p.cameraRoll * 0.45 + slideTilt + reloadTilt
    );

    // Reload mag drop animation on Carbine
    this.carbineMag.position.y = p.reloadTimer > 0 ? -0.12 - Math.sin(Math.min(1, p.reloadTimer) * Math.PI) * 0.14 : -0.12;

    // Shotgun pump-action rack after shot
    if (w.id === 'shotgun') {
      const pumpBack = p.recoil > 0.2 && p.recoil < 0.78 ? Math.sin(((p.recoil - 0.2) / 0.58) * Math.PI) * 0.08 : 0;
      this.shotgunPump.position.z = -0.3 + pumpBack;
      this.leftArm.position.z = pumpBack;
    } else {
      this.leftArm.position.z = 0;
    }

    // Muzzle flash & dynamic muzzle light
    const flashOn = p.recoil > 0.72;
    this.muzzleFlash.visible = flashOn;
    if (flashOn) {
      this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      const s = w.id === 'shotgun' ? 1.55 : w.id === 'railgun' ? 1.35 : 0.95;
      this.muzzleFlash.scale.setScalar(s);
    }
    this.muzzleLight.intensity = flashOn ? (w.id === 'railgun' ? 8.5 : 6.0) : 0;
    this.muzzleLight.color.setHex(w.id === 'railgun' ? 0x38bdf8 : 0xffb44c);
  }
}
