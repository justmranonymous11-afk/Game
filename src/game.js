import * as THREE from 'three';
import { SoundEngine } from './audio.js';
import { createRealisticEnemyMesh } from './enemies3d.js';
import { RELIC_CATALOG, SolarisEngine } from './physics.js';
import { TacticalViewmodel } from './viewmodel.js';
import { buildSanctuaryWorld } from './world.js';

const STORAGE_KEY = 'solaris_aegis_v3_records';

function loadBestScore() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // ignore
  }
}

export function bootSolaris() {
  const container = document.getElementById('viewport-3d');
  const sound = new SoundEngine();

  // ---- NATIVE MSAA WEBGL RENDERER + CALIBRATED ACES FILMIC EXPOSURE (PREETHAM SKY) ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.52;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1200);
  scene.add(camera);

  const viewmodel = new TacticalViewmodel(camera);

  // ---- 3D VISUAL POOLS (Enemies, Projectiles, Tracers, Debris/Sparks, Brass Shells) ----
  const enemyVisuals = new Map();
  const projVisuals = new Map();
  const tracers = [];
  const particles = [];
  const shells = [];
  const dmgFloaters = [];

  const sparkGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  const debrisGeo = new THREE.BoxGeometry(0.36, 0.14, 0.28);
  const shellGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 6);
  const brassShellMat = new THREE.MeshStandardMaterial({ color: 0xe6be5a, roughness: 0.25, metalness: 0.92 });
  const redShellMat = new THREE.MeshStandardMaterial({ color: 0xcc291f, roughness: 0.45, metalness: 0.2 });

  const projGeo = new THREE.SphereGeometry(0.42, 12, 12);
  const enemyProjMat = new THREE.MeshStandardMaterial({
    color: 0xff4624,
    emissive: 0xff3b1f,
    emissiveIntensity: 3.0,
    roughness: 0.15,
  });
  const friendlyProjMat = new THREE.MeshStandardMaterial({
    color: 0xfff3a0,
    emissive: 0x38bdf8,
    emissiveIntensity: 3.2,
    roughness: 0.15,
  });

  // Braided steel/gold Grapple Cable Beam
  const grappleGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(0, 0, -1),
  ]);
  const grappleMat = new THREE.LineBasicMaterial({ color: 0xf5c451 });
  const grappleBeam = new THREE.Line(grappleGeo, grappleMat);
  grappleBeam.visible = false;
  grappleBeam.frustumCulled = false;
  scene.add(grappleBeam);

  // ---- HUD ELEMENTS ----
  const els = {
    hud: document.getElementById('fps-hud'),
    radarCanvas: document.getElementById('radar-canvas'),
    crosshair: document.getElementById('crosshair'),
    hitmarker: document.getElementById('hitmarker'),
    hitIndicator: document.getElementById('hit-indicator'),
    grappleHint: document.getElementById('grapple-hint'),
    damageVignette: document.getElementById('damage-vignette'),
    speedLines: document.getElementById('speed-lines'),
    dmgLayer: document.getElementById('damage-layer'),
    speedVal: document.getElementById('speed-val'),
    hpFill: document.getElementById('hp-fill'),
    hpText: document.getElementById('hp-text'),
    shieldFill: document.getElementById('shield-fill'),
    dashPill: document.getElementById('dash-pill'),
    grapplePill: document.getElementById('grapple-pill'),
    parryPill: document.getElementById('parry-pill'),
    waveVal: document.getElementById('wave-val'),
    enemiesVal: document.getElementById('enemies-val'),
    scoreVal: document.getElementById('score-val'),
    relicStrip: document.getElementById('relic-strip'),
    styleRank: document.getElementById('style-rank'),
    styleTitle: document.getElementById('style-title'),
    styleFeed: document.getElementById('style-feed'),
    banner: document.getElementById('wave-banner'),
    bannerTitle: document.getElementById('banner-title'),
    bannerSub: document.getElementById('banner-sub'),
    bossBar: document.getElementById('boss-hud'),
    bossFill: document.getElementById('boss-fill'),
    bossName: document.getElementById('boss-name'),
    pointerPrompt: document.getElementById('pointer-prompt'),
    weaponName: document.getElementById('weapon-name'),
    ammoBig: document.getElementById('ammo-big'),
    ammoMax: document.getElementById('ammo-max'),
    reloadBar: document.getElementById('reload-bar'),
    weaponSlots: Array.from(document.querySelectorAll('.w-slot')),

    titleOverlay: document.getElementById('title-overlay'),
    titleBest: document.getElementById('title-best'),
    diffBtns: Array.from(document.querySelectorAll('.diff-btn')),
    startBtn: document.getElementById('start-btn'),

    draftOverlay: document.getElementById('draft-overlay'),
    draftKicker: document.getElementById('draft-kicker'),
    draftCards: document.getElementById('draft-cards'),

    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    restartBtn: document.getElementById('restart-btn'),
    sensSlider: document.getElementById('sens-slider'),
    fovSlider: document.getElementById('fov-slider'),
    muteBtn: document.getElementById('mute-btn'),

    endOverlay: document.getElementById('end-overlay'),
    endKicker: document.getElementById('end-kicker'),
    endHeading: document.getElementById('end-heading'),
    endStats: document.getElementById('end-stats'),
    endlessBtn: document.getElementById('endless-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
  };

  const radarCtx = els.radarCanvas.getContext('2d');

  let sensitivity = 0.0021;
  let baseFov = 80;
  let bannerTimer = 0;
  let lastRelicKey = '';

  function addStyleFeed(text) {
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.textContent = text;
    els.styleFeed.prepend(item);
    while (els.styleFeed.children.length > 4) els.styleFeed.lastElementChild.remove();
    setTimeout(() => item.remove(), 2200);
  }

  function spawnDamageNumber(x, y, z, amount, crit) {
    const el = document.createElement('div');
    const isShield = amount === 'SHIELD';
    el.className = isShield ? 'dmg-num shield' : crit ? 'dmg-num crit' : 'dmg-num';
    el.textContent = crit && !isShield ? `${amount}!` : `${amount}`;
    els.dmgLayer.appendChild(el);
    dmgFloaters.push({
      el,
      pos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.5, y, z + (Math.random() - 0.5) * 0.5),
      life: 0.72,
      maxLife: 0.72,
    });
    while (dmgFloaters.length > 24) dmgFloaters.shift().el.remove();
  }

  function spawnParticles(x, y, z, colorHex, count = 12, isDebris = false) {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: isDebris ? 0x221004 : colorHex,
      emissiveIntensity: isDebris ? 0.35 : 2.2,
      roughness: isDebris ? 0.5 : 0.2,
      metalness: isDebris ? 0.8 : 0.1,
    });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(isDebris ? debrisGeo : sparkGeo, mat);
      m.position.set(x, y, z);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.3) * Math.PI;
      const spd = (isDebris ? 7 : 5) + Math.random() * 14;
      scene.add(m);
      particles.push({
        mesh: m,
        vx: Math.cos(theta) * Math.cos(phi) * spd,
        vy: Math.sin(phi) * spd + (isDebris ? 6 : 3),
        vz: Math.sin(theta) * Math.cos(phi) * spd,
        life: (isDebris ? 0.7 : 0.35) + Math.random() * 0.4,
        maxLife: isDebris ? 1.1 : 0.75,
      });
    }
    while (particles.length > 210) {
      scene.remove(particles.shift().mesh);
    }
  }

  function ejectBrassShell(weaponId) {
    const m = new THREE.Mesh(shellGeo, weaponId === 'shotgun' ? redShellMat : brassShellMat);
    const localStart = new THREE.Vector3(0.24, -0.18, -0.35).applyMatrix4(camera.matrixWorld);
    m.position.copy(localStart);
    const rightVec = new THREE.Vector3(1, 0.45, 0.15).applyQuaternion(camera.quaternion);
    scene.add(m);
    shells.push({
      mesh: m,
      vx: rightVec.x * (3.2 + Math.random() * 1.4) + engine.player.vx * 0.4,
      vy: rightVec.y * (3.2 + Math.random() * 1.4) + engine.player.vy * 0.4,
      vz: rightVec.z * (3.2 + Math.random() * 1.4) + engine.player.vz * 0.4,
      life: 0.9,
    });
    while (shells.length > 28) scene.remove(shells.shift().mesh);
  }

  function spawnTracer(sx, sy, sz, ex, ey, ez, colorHex, superBeam = false) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx, sy, sz),
      new THREE.Vector3(ex, ey, ez),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex || 0xffb84d,
      transparent: true,
      opacity: 0.95,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, mat, life: superBeam ? 0.24 : 0.11, maxLife: superBeam ? 0.24 : 0.11 });
  }

  // ---- ENGINE & PHOTOREALISTIC WORLD ----
  const engine = new SolarisEngine({
    sound,
    bestScore: loadBestScore(),
  });
  window.__SOLARIS__ = engine;

  const world = buildSanctuaryWorld(renderer, scene, engine.arena);

  engine.onEvent = (type, payload) => {
    if (type === 'state') {
      syncOverlays(payload.state);
    } else if (type === 'enemy_spawn') {
      const vis = createRealisticEnemyMesh(payload.enemy);
      scene.add(vis.group);
      for (const nm of vis.nacelleMeshes) scene.add(nm.mesh);
      if (vis.laserLine) scene.add(vis.laserLine);
      enemyVisuals.set(payload.enemy.id, vis);
    } else if (type === 'enemy_kill') {
      const e = payload.enemy;
      spawnParticles(e.x, e.y + 0.6, e.z, 0xff981a, e.type === 'gunship' ? 40 : 16, false);
      spawnParticles(e.x, e.y + 0.6, e.z, 0x2c323b, e.type === 'gunship' ? 28 : 12, true);
    } else if (type === 'tracer') {
      spawnTracer(payload.sx, payload.sy, payload.sz, payload.ex, payload.ey, payload.ez, payload.color, payload.superBeam);
    } else if (type === 'shell_eject') {
      ejectBrassShell(payload.weaponId);
    } else if (type === 'impact') {
      spawnParticles(payload.x, payload.y, payload.z, payload.color, payload.count, false);
    } else if (type === 'damage_number') {
      spawnDamageNumber(payload.x, payload.y, payload.z, payload.amount, payload.crit);
    } else if (type === 'parry') {
      spawnParticles(payload.x, payload.y, payload.z, 0x38bdf8, 16, false);
    } else if (type === 'style') {
      addStyleFeed(`+${payload.pts}  ${payload.label}`);
    } else if (type === 'announcement') {
      els.bannerTitle.textContent = payload.title;
      els.bannerSub.textContent = payload.subtitle;
      els.banner.classList.remove('hidden');
      bannerTimer = 3.8;
    }
  };

  function clearSceneEntities() {
    for (const vis of enemyVisuals.values()) {
      scene.remove(vis.group);
      for (const nm of vis.nacelleMeshes) scene.remove(nm.mesh);
      if (vis.laserLine) scene.remove(vis.laserLine);
    }
    enemyVisuals.clear();
    for (const m of projVisuals.values()) scene.remove(m);
    projVisuals.clear();
    for (const d of dmgFloaters) d.el.remove();
    dmgFloaters.length = 0;
  }

  function syncOverlays(state) {
    saveBestScore(engine.bestScore);
    els.titleOverlay.classList.toggle('hidden', state !== 'title');
    els.draftOverlay.classList.toggle('hidden', state !== 'draft');
    els.pauseOverlay.classList.toggle('hidden', state !== 'paused');
    els.endOverlay.classList.toggle('hidden', state !== 'gameover' && state !== 'victory');
    els.hud.classList.toggle('hidden', state !== 'playing');
    viewmodel.root.visible = state === 'playing';

    if (state !== 'playing' && document.pointerLockElement) {
      document.exitPointerLock();
    }

    if (state === 'title') {
      els.titleBest.textContent =
        engine.bestScore > 0
          ? `HIGHEST SCORE ${engine.bestScore.toLocaleString()} · OPERATION SOLARIS`
          : 'TACTICAL FIRST-PERSON PARKOUR & ROGUELITE FPS';
    }

    if (state === 'draft') {
      els.draftKicker.textContent = `WAVE ${engine.wave} CLEARED — DEPLOY FIELD MODIFICATION`;
      els.draftCards.innerHTML = '';
      engine.draftChoices.forEach((r, idx) => {
        const stacks = engine.relicCount(r.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'relic-card';
        btn.innerHTML = `
          <div class="relic-top">
            <span class="relic-tag">${r.tag}</span>
            <kbd>${idx + 1}</kbd>
          </div>
          <div class="relic-icon">${r.icon}</div>
          <h3 class="relic-name">${r.name}${stacks > 0 ? ` · MK ${stacks + 1}` : ''}</h3>
          <p class="relic-desc">${r.desc}</p>
        `;
        btn.addEventListener('click', () => {
          sound.unlock();
          engine.selectRelic(r.id);
          requestLock();
        });
        els.draftCards.appendChild(btn);
      });
    }

    if (state === 'gameover' || state === 'victory') {
      const won = state === 'victory';
      els.endKicker.textContent = won ? 'VALKYRIE DREADNOUGHT DESTROYED' : 'OPERATOR DOWN';
      els.endHeading.textContent = won ? 'MISSION COMPLETE' : 'DEPLOYMENT ENDED';
      els.endlessBtn.classList.toggle('hidden', !won);
      els.endStats.innerHTML = `
        <div class="stat"><span class="k">SCORE</span><span class="v">${engine.score.toLocaleString()}</span></div>
        <div class="stat"><span class="k">WAVE</span><span class="v">${engine.wave}</span></div>
        <div class="stat"><span class="k">ELIMINATED</span><span class="v">${engine.kills}</span></div>
        <div class="stat"><span class="k">CRIT KILLS</span><span class="v">${engine.headshots}</span></div>
        <div class="stat"><span class="k">TAKEDOWNS</span><span class="v">${engine.executes}</span></div>
        <div class="stat"><span class="k">TOP SPEED</span><span class="v">${Math.round(engine.maxSpeedReached)} m/s</span></div>
      `;
    }
  }

  // ---- TACTICAL ROTATING MINIMAP / RADAR ----
  function renderRadar() {
    const ctx = radarCtx;
    const size = 124;
    const half = size * 0.5;
    const scale = 1.08;
    const p = engine.player;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(14, 18, 24, 0.74)';
    ctx.fillRect(0, 0, size, size);

    // Subtle radar range rings
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1;
    for (const r of [22, 42]) {
      ctx.beginPath();
      ctx.arc(half, half, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Player view cone (always pointing UP on rotating radar)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.arc(half, half, half, -Math.PI * 0.5 - 0.52, -Math.PI * 0.5 + 0.52);
    ctx.closePath();
    ctx.fill();

    // Rotate world markers around player yaw
    const cos = Math.cos(p.yaw);
    const sin = Math.sin(p.yaw);

    // Central Spire marker
    const spDx = -p.x;
    const spDz = -p.z;
    const spRx = (spDx * cos - spDz * sin) * scale;
    const spRz = (spDx * sin + spDz * cos) * scale;
    ctx.fillStyle = 'rgba(226, 179, 71, 0.45)';
    ctx.fillRect(half + spRx - 3, half + spRz - 3, 6, 6);

    // Enemy pings
    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x - p.x;
      const dz = e.z - p.z;
      let rx = (dx * cos - dz * sin) * scale;
      let rz = (dx * sin + dz * cos) * scale;
      const dist = Math.hypot(rx, rz);
      if (dist > half - 7) {
        rx = (rx / dist) * (half - 7);
        rz = (rz / dist) * (half - 7);
      }

      if (e.type === 'gunship') {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(half + rx, half + rz, 5.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = e.type === 'viper' ? '#22e58a' : e.type === 'juggernaut' ? '#f97316' : '#ff3b20';
        ctx.beginPath();
        ctx.arc(half + rx, half + rz, e.type === 'juggernaut' ? 3.8 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Center player chevron
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(half, half - 4.5);
    ctx.lineTo(half + 3.5, half + 3.5);
    ctx.lineTo(half, half + 1.5);
    ctx.lineTo(half - 3.5, half + 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Outer metallic compass bezel
    ctx.strokeStyle = 'rgba(226, 179, 71, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(half, half, half - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- FPS INPUTS ----
  let isDraggingLook = false;

  function requestLock() {
    if (renderer.domElement.requestPointerLock) {
      try {
        renderer.domElement.requestPointerLock();
      } catch {
        // Fallback drag look
      }
    }
  }

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === renderer.domElement;
    els.pointerPrompt.classList.toggle('hidden', locked || engine.state !== 'playing');
  });

  window.addEventListener('mousemove', (ev) => {
    if (engine.state !== 'playing') return;
    if (document.pointerLockElement === renderer.domElement || isDraggingLook) {
      const adsScale = engine.player.ads ? 0.52 : 1.0;
      engine.player.yaw -= ev.movementX * sensitivity * adsScale;
      engine.player.pitch = Math.max(
        -Math.PI * 0.46,
        Math.min(Math.PI * 0.46, engine.player.pitch - ev.movementY * sensitivity * adsScale)
      );
    }
  });

  renderer.domElement.addEventListener('mousedown', (ev) => {
    sound.unlock();
    if (engine.state !== 'playing') return;
    if (document.pointerLockElement !== renderer.domElement) {
      requestLock();
      isDraggingLook = true;
    }
    if (ev.button === 0) {
      engine.input.firing = true;
      engine.fireWeapon();
    } else if (ev.button === 2) {
      engine.setAds(true);
    }
  });

  window.addEventListener('mouseup', (ev) => {
    if (ev.button === 0) engine.input.firing = false;
    if (ev.button === 2) engine.setAds(false);
    isDraggingLook = false;
  });

  window.addEventListener('wheel', (ev) => {
    if (engine.state === 'playing') {
      engine.cycleWeapon(ev.deltaY > 0 ? 1 : -1);
    }
  }, { passive: true });

  renderer.domElement.addEventListener('contextmenu', (ev) => ev.preventDefault());

  window.addEventListener('keydown', (ev) => {
    const c = ev.code;
    if (c === 'KeyW' || c === 'ArrowUp') engine.input.forward = true;
    if (c === 'KeyS' || c === 'ArrowDown') engine.input.backward = true;
    if (c === 'KeyA' || c === 'ArrowLeft') engine.input.left = true;
    if (c === 'KeyD' || c === 'ArrowRight') engine.input.right = true;

    if (c === 'Space') {
      ev.preventDefault();
      sound.unlock();
      if (engine.state === 'playing') engine.pressJump();
    }
    if (c === 'ShiftLeft' || c === 'ShiftRight') {
      if (engine.state === 'playing') engine.triggerDashOrSlide();
    }
    if (c === 'KeyE') {
      if (engine.state === 'playing') engine.triggerGrapple();
    }
    if (c === 'KeyR') {
      if (engine.state === 'playing') engine.startReload();
    }
    if (c === 'KeyQ' || c === 'KeyF') {
      if (engine.state === 'playing') engine.triggerParry();
    }
    if (c === 'KeyP' || (c === 'Escape' && engine.state === 'playing')) {
      engine.togglePause();
    }

    if (engine.state === 'playing') {
      if (c === 'Digit1') engine.selectWeapon('carbine');
      if (c === 'Digit2') engine.selectWeapon('railgun');
      if (c === 'Digit3') engine.selectWeapon('shotgun');
    } else if (engine.state === 'draft') {
      if (c === 'Digit1' && engine.draftChoices[0]) { engine.selectRelic(engine.draftChoices[0].id); requestLock(); }
      if (c === 'Digit2' && engine.draftChoices[1]) { engine.selectRelic(engine.draftChoices[1].id); requestLock(); }
      if (c === 'Digit3' && engine.draftChoices[2]) { engine.selectRelic(engine.draftChoices[2].id); requestLock(); }
    }
  });

  window.addEventListener('keyup', (ev) => {
    const c = ev.code;
    if (c === 'KeyW' || c === 'ArrowUp') engine.input.forward = false;
    if (c === 'KeyS' || c === 'ArrowDown') engine.input.backward = false;
    if (c === 'KeyA' || c === 'ArrowLeft') engine.input.left = false;
    if (c === 'KeyD' || c === 'ArrowRight') engine.input.right = false;
  });

  // Difficulty Selector
  els.diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      els.diffBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      engine.setDifficulty(btn.dataset.diff);
    });
  });

  els.startBtn.addEventListener('click', () => {
    sound.unlock();
    clearSceneEntities();
    engine.startRun();
    requestLock();
  });

  els.resumeBtn.addEventListener('click', () => {
    engine.togglePause();
    requestLock();
  });

  els.restartBtn.addEventListener('click', () => {
    sound.unlock();
    clearSceneEntities();
    engine.startRun();
    requestLock();
  });

  els.endlessBtn.addEventListener('click', () => {
    sound.unlock();
    engine.continueEndless();
  });

  els.playAgainBtn.addEventListener('click', () => {
    sound.unlock();
    clearSceneEntities();
    engine.startRun();
    requestLock();
  });

  els.sensSlider.addEventListener('input', () => {
    sensitivity = Number(els.sensSlider.value) * 0.00052;
  });

  els.fovSlider.addEventListener('input', () => {
    baseFov = Number(els.fovSlider.value);
  });

  els.muteBtn.addEventListener('click', () => {
    const muted = sound.toggleMute();
    els.muteBtn.textContent = muted ? 'AUDIO: OFF' : 'AUDIO: ON';
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---- MAIN RENDER & SYNC LOOP ----
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const projVec = new THREE.Vector3();
  let lastNow = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    engine.step(dt);

    // 1. Camera placement (Cinematic Coastal Orbit on Title, Tactical FPS in Play)
    if (engine.state === 'title') {
      const a = engine.time * 0.11 + 0.55;
      camera.position.set(Math.cos(a) * 44, 15.5 + Math.sin(a * 1.4) * 2.2, Math.sin(a) * 44);
      camera.lookAt(0, 5.5, 0);
      if (camera.fov !== 65) {
        camera.fov = 65;
        camera.updateProjectionMatrix();
      }
    } else {
      const eye = engine.getEyePos();
      camera.position.set(eye.x, eye.y, eye.z);
      euler.set(engine.player.pitch, engine.player.yaw, engine.player.cameraRoll, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      const w = engine.getActiveWeapon();
      const speed = Math.hypot(engine.player.vx, engine.player.vz);
      const targetFov = engine.player.ads
        ? w.adsFov
        : baseFov + engine.player.fovBoost + Math.max(0, speed - 13) * 0.38;
      camera.fov += (targetFov - camera.fov) * Math.min(1, 13 * dt);
      camera.updateProjectionMatrix();

      viewmodel.update(dt, engine);
    }

    // 2. World Update (Reflective Ocean, Radar, Turbines, Anchors)
    const highlightId = engine.grappleHighlight?.kind === 'ring' ? engine.grappleHighlight.id : null;
    world.update(dt, engine.time, highlightId);

    // 3. Sync Articulated 3D Enemies
    const aliveIds = new Set();
    const eyePos = engine.getEyePos();
    let activeBoss = null;

    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      aliveIds.add(e.id);
      if (e.type === 'gunship') activeBoss = e;

      let vis = enemyVisuals.get(e.id);
      if (!vis) {
        vis = createRealisticEnemyMesh(e);
        scene.add(vis.group);
        for (const nm of vis.nacelleMeshes) scene.add(nm.mesh);
        if (vis.laserLine) scene.add(vis.laserLine);
        enemyVisuals.set(e.id, vis);
      }

      vis.group.position.set(e.x, e.y, e.z);
      vis.group.rotation.y = e.angle;

      // Dynamic banking tilt for quad-drones, seekers, and VTOL gunship
      if (e.type === 'drone' || e.type === 'seeker' || e.type === 'gunship') {
        vis.group.rotation.z = -e.vx * (e.type === 'gunship' ? 0.015 : 0.025);
        vis.group.rotation.x = e.vz * (e.type === 'gunship' ? 0.01 : 0.018);
      }

      for (const rotor of vis.rotors) {
        rotor.rotation.y += dt * 26;
      }

      if (vis.legs.length === 2) {
        const swing = Math.sin(e.stridePhase) * (e.type === 'juggernaut' ? 0.35 : 0.52);
        vis.legs[0].rotation.x = swing;
        vis.legs[1].rotation.x = -swing;
      }

      if (vis.coreMat) {
        vis.coreMat.emissiveIntensity = e.hitFlash > 0.1 ? 5.5 : 2.5;
      }
      if (vis.shieldMat) {
        vis.shieldMat.opacity = 0.4 + e.shieldFlash * 0.45;
        vis.shieldMat.emissiveIntensity = 0.7 + e.shieldFlash * 2.5;
      }

      if (vis.laserLine) {
        const showLaser = e.telegraphTimer > 0 && engine.state === 'playing';
        vis.laserLine.visible = showLaser;
        if (showLaser) {
          const lp = vis.laserLine.geometry.attributes.position;
          lp.setXYZ(0, e.x, e.y + 0.9, e.z);
          lp.setXYZ(1, eyePos.x, eyePos.y - 0.12, eyePos.z);
          lp.needsUpdate = true;
        }
      }

      for (const nm of vis.nacelleMeshes) {
        nm.mesh.visible = nm.crystal.alive;
        if (nm.crystal.alive) {
          nm.mesh.position.set(nm.crystal.x, nm.crystal.y, nm.crystal.z);
          nm.mesh.rotation.y = e.angle;
        }
      }
    }

    for (const [id, vis] of enemyVisuals.entries()) {
      if (!aliveIds.has(id)) {
        scene.remove(vis.group);
        for (const nm of vis.nacelleMeshes) scene.remove(nm.mesh);
        if (vis.laserLine) scene.remove(vis.laserLine);
        enemyVisuals.delete(id);
      }
    }

    // 4. Projectiles
    const aliveProj = new Set();
    for (const proj of engine.projectiles) {
      aliveProj.add(proj.id);
      let mesh = projVisuals.get(proj.id);
      if (!mesh) {
        mesh = new THREE.Mesh(projGeo, proj.friendly ? friendlyProjMat : enemyProjMat);
        scene.add(mesh);
        projVisuals.set(proj.id, mesh);
      }
      mesh.material = proj.friendly ? friendlyProjMat : enemyProjMat;
      mesh.position.set(proj.x, proj.y, proj.z);
    }
    for (const [id, mesh] of projVisuals.entries()) {
      if (!aliveProj.has(id)) {
        scene.remove(mesh);
        projVisuals.delete(id);
      }
    }

    // 5. Grapple Cable
    if (engine.player.grapple) {
      const g = engine.player.grapple;
      const start = new THREE.Vector3(-0.24, -0.22, -0.45).applyMatrix4(camera.matrixWorld);
      const posAttr = grappleBeam.geometry.attributes.position;
      posAttr.setXYZ(0, start.x, start.y, start.z);
      posAttr.setXYZ(1, g.x, g.y, g.z);
      posAttr.needsUpdate = true;
      grappleBeam.visible = true;
    } else {
      grappleBeam.visible = false;
    }

    // 6. Tracers, Sparks/Debris, Brass Shell Casings & 3D Floating Damage Numbers
    for (let i = tracers.length - 1; i >= 0; i--) {
      const tr = tracers[i];
      tr.life -= dt;
      tr.mat.opacity = Math.max(0, tr.life / tr.maxLife);
      if (tr.life <= 0) {
        scene.remove(tr.line);
        tr.line.geometry.dispose();
        tr.mat.dispose();
        tracers.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.vy -= 18 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += dt * 8;
      pt.mesh.rotation.y += dt * 6;
      pt.mesh.scale.setScalar(Math.max(0.01, pt.life / pt.maxLife));
      if (pt.life <= 0) {
        scene.remove(pt.mesh);
        particles.splice(i, 1);
      }
    }

    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.life -= dt;
      s.vy -= 16 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.rotation.x += dt * 22;
      s.mesh.rotation.z += dt * 16;
      if (s.life <= 0) {
        scene.remove(s.mesh);
        shells.splice(i, 1);
      }
    }

    for (let i = dmgFloaters.length - 1; i >= 0; i--) {
      const df = dmgFloaters[i];
      df.life -= dt;
      df.pos.y += 2.1 * dt;
      if (df.life <= 0) {
        df.el.remove();
        dmgFloaters.splice(i, 1);
        continue;
      }
      projVec.copy(df.pos).project(camera);
      if (projVec.z > 1) {
        df.el.style.opacity = '0';
      } else {
        const sx = (projVec.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
        df.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        df.el.style.opacity = String(Math.min(1, (df.life / df.maxLife) * 1.6));
      }
    }

    // 7. Update Tactical HUD & Radar
    if (engine.state === 'playing') {
      const p = engine.player;
      const w = engine.getActiveWeapon();
      const speed = Math.round(Math.hypot(p.vx, p.vz));

      renderRadar();

      els.speedVal.textContent = `${speed} m/s`;
      els.speedLines.style.opacity = String(Math.max(0, Math.min(0.5, (speed - 19) / 18)));
      els.hpFill.style.width = `${(p.hp / p.maxHp) * 100}%`;
      els.hpText.textContent = `${Math.ceil(p.hp)}`;
      els.shieldFill.style.width = `${(p.shield / p.maxShield) * 100}%`;

      els.dashPill.classList.toggle('ready', p.dashCooldown <= 0);
      els.grapplePill.classList.toggle('ready', p.grappleCooldown <= 0);
      els.parryPill.classList.toggle('ready', p.parryCooldown <= 0);

      els.waveVal.textContent = `WAVE ${engine.wave}${engine.endless ? ' ∞' : ' / 8'}`;
      els.enemiesVal.textContent = `${engine.enemies.length} HOSTILES`;
      els.scoreVal.textContent = engine.score.toLocaleString();

      // Weapon Dock & Ammo
      els.weaponName.textContent = w.name;
      els.ammoBig.textContent = p.reloadTimer > 0 ? 'RLD' : String(w.ammo).padStart(2, '0');
      els.ammoMax.textContent = `/ ${w.maxAmmo}`;
      els.reloadBar.style.width =
        p.reloadTimer > 0
          ? `${Math.max(0, 1 - p.reloadTimer / w.reloadTime) * 100}%`
          : `${(w.ammo / w.maxAmmo) * 100}%`;
      els.weaponSlots.forEach((slot) => {
        slot.classList.toggle('active', slot.dataset.weapon === w.id);
      });

      const relicEntries = Object.entries(engine.relics);
      const rKey = relicEntries.map(([id, n]) => `${id}:${n}`).join(',');
      if (rKey !== lastRelicKey) {
        lastRelicKey = rKey;
        els.relicStrip.innerHTML = relicEntries
          .map(([id, count]) => {
            const def = RELIC_CATALOG.find((r) => r.id === id);
            return `<span class="relic-chip" title="${def?.name || id}">${def?.icon || '✦'}${count > 1 ? `<sub>${count}</sub>` : ''}</span>`;
          })
          .join('');
      }

      const rank = engine.getStyleRank();
      els.styleRank.textContent = rank.label;
      els.styleRank.style.color = rank.color;
      els.styleTitle.textContent = rank.title;

      // Crosshair hides subtly when ADS on Carbine (3D holographic sight takes over!)
      els.crosshair.classList.toggle('ads-hide', p.ads && w.id === 'carbine');
      els.hitmarker.classList.toggle('active', p.hitMarker > 0);
      els.hitmarker.classList.toggle('crit', p.hitMarkerCrit);
      els.damageVignette.style.opacity = String(p.damageFlash * 0.68);
      els.hitIndicator.style.opacity = String(p.damageFlash);
      els.hitIndicator.style.transform = `translate(-50%, -50%) rotate(${p.damageDirAngle}rad)`;

      if (engine.grappleHighlight) {
        els.grappleHint.textContent =
          engine.grappleHighlight.kind === 'enemy' ? '[E] GRAPPLE TAKEDOWN' : '[E] GRAPPLE ANCHOR';
        els.grappleHint.classList.remove('hidden');
        els.crosshair.classList.add('locked');
      } else {
        els.grappleHint.classList.add('hidden');
        els.crosshair.classList.remove('locked');
      }

      if (activeBoss) {
        els.bossBar.classList.remove('hidden');
        els.bossName.textContent = `VALKYRIE-01 GUNSHIP · PHASE ${activeBoss.phase === 2 ? 'II' : 'I'}`;
        els.bossFill.style.width = `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%`;
      } else {
        els.bossBar.classList.add('hidden');
      }

      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) els.banner.classList.add('hidden');
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  syncOverlays(engine.state);
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSolaris);
  } else {
    bootSolaris();
  }
}
