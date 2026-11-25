import * as THREE from 'three';
import { SoundEngine } from './audio.js';
import { PLAYER_CFG, SolarisEngine } from './physics.js';
import { Viewmodel } from './viewmodel.js';
import { buildSanctuaryWorld, createEnemyMesh } from './world.js';

const STORAGE_KEY = 'solaris_3d_records_v1';

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

  // ---- THREE.JS RENDERER & SCENE ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(82, window.innerWidth / window.innerHeight, 0.1, 420);
  scene.add(camera);

  const viewmodel = new Viewmodel(camera);

  // ---- VISUAL POOLS (Enemies, Projectiles, Tracers, Particles, Grapple Beam) ----
  const enemyVisuals = new Map();
  const projVisuals = new Map();
  const tracers = [];
  const particles = [];

  const particleGeo = new THREE.OctahedronGeometry(0.18, 0);
  const enemyOrbGeo = new THREE.SphereGeometry(0.48, 12, 12);
  const enemyOrbMat = new THREE.MeshBasicMaterial({ color: 0xff3b1f });
  const friendlyOrbMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

  // Live 3D Golden Grapple Tether Beam
  const grappleBeamGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(0, 0, -1),
  ]);
  const grappleBeamMat = new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 2 });
  const grappleBeam = new THREE.Line(grappleBeamGeo, grappleBeamMat);
  grappleBeam.visible = false;
  grappleBeam.frustumCulled = false;
  scene.add(grappleBeam);

  // ---- HUD ELEMENTS ----
  const els = {
    hud: document.getElementById('fps-hud'),
    crosshair: document.getElementById('crosshair'),
    hitmarker: document.getElementById('hitmarker'),
    grappleHint: document.getElementById('grapple-hint'),
    damageVignette: document.getElementById('damage-vignette'),
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

    titleOverlay: document.getElementById('title-overlay'),
    titleBest: document.getElementById('title-best'),
    startBtn: document.getElementById('start-btn'),

    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    restartBtn: document.getElementById('restart-btn'),
    sensSlider: document.getElementById('sens-slider'),
    fovSlider: document.getElementById('fov-slider'),
    muteBtn: document.getElementById('mute-btn'),

    endOverlay: document.getElementById('end-overlay'),
    endStats: document.getElementById('end-stats'),
    playAgainBtn: document.getElementById('play-again-btn'),
  };

  let sensitivity = 0.0022;
  let baseFov = 82;
  let bannerTimer = 0;

  function addStyleFeed(text) {
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.textContent = text;
    els.styleFeed.prepend(item);
    while (els.styleFeed.children.length > 4) {
      els.styleFeed.lastElementChild.remove();
    }
    setTimeout(() => item.remove(), 2200);
  }

  function spawnParticles(x, y, z, colorHex, count = 12) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(particleGeo, mat);
      m.position.set(x, y, z);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.35) * Math.PI;
      const spd = 5 + Math.random() * 14;
      scene.add(m);
      particles.push({
        mesh: m,
        vx: Math.cos(theta) * Math.cos(phi) * spd,
        vy: Math.sin(phi) * spd + 3,
        vz: Math.sin(theta) * Math.cos(phi) * spd,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
    while (particles.length > 180) {
      const old = particles.shift();
      scene.remove(old.mesh);
    }
  }

  function spawnTracer(sx, sy, sz, ex, ey, ez, crit) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx, sy, sz),
      new THREE.Vector3(ex, ey, ez),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: crit ? 0xfde047 : 0xff7b29,
      transparent: true,
      opacity: 0.95,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, mat, life: 0.11, maxLife: 0.11 });
  }

  // ---- ENGINE & WORLD ----
  const engine = new SolarisEngine({
    sound,
    bestScore: loadBestScore(),
  });
  window.__SOLARIS__ = engine;

  const world = buildSanctuaryWorld(scene, engine.arena);

  engine.onEvent = (type, payload) => {
    if (type === 'state') {
      syncOverlays(payload.state);
    } else if (type === 'enemy_spawn') {
      const vis = createEnemyMesh(payload.enemy);
      scene.add(vis.group);
      for (const cm of vis.crystalMeshes) scene.add(cm.mesh);
      enemyVisuals.set(payload.enemy.id, vis);
    } else if (type === 'enemy_kill') {
      spawnParticles(payload.enemy.x, payload.enemy.y, payload.enemy.z, 0xfde047, payload.enemy.type === 'colossus' ? 48 : 22);
    } else if (type === 'tracer') {
      spawnTracer(payload.sx, payload.sy, payload.sz, payload.ex, payload.ey, payload.ez, payload.crit);
    } else if (type === 'impact') {
      spawnParticles(payload.x, payload.y, payload.z, payload.color, payload.count);
    } else if (type === 'parry') {
      viewmodel.triggerParryAnim();
      spawnParticles(payload.x, payload.y, payload.z, 0xfde047, 16);
    } else if (type === 'style') {
      addStyleFeed(`+${payload.pts}  ${payload.label}`);
    } else if (type === 'announcement') {
      els.bannerTitle.textContent = payload.title;
      els.bannerSub.textContent = payload.subtitle;
      els.banner.classList.remove('hidden');
      bannerTimer = 3.6;
    }
  };

  function clearSceneEntities() {
    for (const vis of enemyVisuals.values()) {
      scene.remove(vis.group);
      for (const cm of vis.crystalMeshes) scene.remove(cm.mesh);
    }
    enemyVisuals.clear();
    for (const m of projVisuals.values()) scene.remove(m);
    projVisuals.clear();
  }

  function syncOverlays(state) {
    saveBestScore(engine.bestScore);
    els.titleOverlay.classList.toggle('hidden', state !== 'title');
    els.pauseOverlay.classList.toggle('hidden', state !== 'paused');
    els.endOverlay.classList.toggle('hidden', state !== 'gameover' && state !== 'victory');
    els.hud.classList.toggle('hidden', state !== 'playing');
    viewmodel.root.visible = state === 'playing';

    if (state === 'title') {
      els.titleBest.textContent =
        engine.bestScore > 0
          ? `HIGHEST SCORE ${engine.bestScore.toLocaleString()} · 3D KINETIC ARENA FPS`
          : 'FIRST-PERSON KINETIC PARKOUR & SOLAR-GRAPPLE FPS';
    }

    if (state === 'gameover') {
      if (document.pointerLockElement) document.exitPointerLock();
      els.endStats.innerHTML = `
        <div class="stat"><span class="k">SCORE</span><span class="v">${engine.score.toLocaleString()}</span></div>
        <div class="stat"><span class="k">WAVE</span><span class="v">${engine.wave}</span></div>
        <div class="stat"><span class="k">ELIMINATED</span><span class="v">${engine.kills}</span></div>
        <div class="stat"><span class="k">EXECUTES</span><span class="v">${engine.executes}</span></div>
        <div class="stat"><span class="k">PARRIES</span><span class="v">${engine.parries}</span></div>
        <div class="stat"><span class="k">TOP SPEED</span><span class="v">${Math.round(engine.maxSpeedReached)} m/s</span></div>
      `;
    }
  }

  // ---- FPS CONTROLS (POINTER LOCK + DRAG FALLBACK) ----
  let isDraggingLook = false;

  function requestLock() {
    if (renderer.domElement.requestPointerLock) {
      try {
        renderer.domElement.requestPointerLock();
      } catch {
        // Fallback drag look still works seamlessly
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
      engine.player.yaw -= ev.movementX * sensitivity;
      engine.player.pitch = Math.max(
        -Math.PI * 0.46,
        Math.min(Math.PI * 0.46, engine.player.pitch - ev.movementY * sensitivity)
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
      engine.triggerGrapple();
    }
  });

  window.addEventListener('mouseup', (ev) => {
    if (ev.button === 0) engine.input.firing = false;
    isDraggingLook = false;
  });

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
      if (engine.state === 'playing') engine.triggerDash();
    }
    if (c === 'KeyE') {
      if (engine.state === 'playing') engine.triggerGrapple();
    }
    if (c === 'KeyQ' || c === 'KeyF') {
      if (engine.state === 'playing') engine.triggerParry();
    }
    if (c === 'KeyP' || (c === 'Escape' && engine.state === 'playing')) {
      engine.togglePause();
      if (engine.state === 'paused' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  });

  window.addEventListener('keyup', (ev) => {
    const c = ev.code;
    if (c === 'KeyW' || c === 'ArrowUp') engine.input.forward = false;
    if (c === 'KeyS' || c === 'ArrowDown') engine.input.backward = false;
    if (c === 'KeyA' || c === 'ArrowLeft') engine.input.left = false;
    if (c === 'KeyD' || c === 'ArrowRight') engine.input.right = false;
  });

  // UI Buttons
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

  els.playAgainBtn.addEventListener('click', () => {
    sound.unlock();
    clearSceneEntities();
    engine.startRun();
    requestLock();
  });

  els.sensSlider.addEventListener('input', () => {
    sensitivity = Number(els.sensSlider.value) * 0.00055;
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
  let lastNow = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    engine.step(dt);

    // 1. Camera placement: cinematic orbit on Title Screen, crisp FPS during Play!
    if (engine.state === 'title') {
      const a = engine.time * 0.14;
      camera.position.set(Math.cos(a) * 34, 17 + Math.sin(a * 1.5) * 2.5, Math.sin(a) * 34);
      camera.lookAt(0, 7, 0);
      if (camera.fov !== 72) {
        camera.fov = 72;
        camera.updateProjectionMatrix();
      }
    } else {
      const eye = engine.getEyePos();
      camera.position.set(eye.x, eye.y, eye.z);
      euler.set(engine.player.pitch + engine.player.recoil * 0.03, engine.player.yaw, engine.player.cameraRoll, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      const speed = Math.hypot(engine.player.vx, engine.player.vz);
      const targetFov = baseFov + engine.player.fovBoost + Math.max(0, speed - 13) * 0.42;
      camera.fov += (targetFov - camera.fov) * Math.min(1, 10 * dt);
      camera.updateProjectionMatrix();

      viewmodel.update(dt, engine);
    }

    // 2. Update World Animations
    const highlightId = engine.grappleHighlight?.kind === 'ring' ? engine.grappleHighlight.id : null;
    world.update(dt, engine.time, highlightId);

    // 3. Sync 3D Enemy Meshes
    const aliveIds = new Set();
    let activeBoss = null;
    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      aliveIds.add(e.id);
      if (e.type === 'colossus') activeBoss = e;

      let vis = enemyVisuals.get(e.id);
      if (!vis) {
        vis = createEnemyMesh(e);
        scene.add(vis.group);
        for (const cm of vis.crystalMeshes) scene.add(cm.mesh);
        enemyVisuals.set(e.id, vis);
      }

      vis.group.position.set(e.x, e.y, e.z);
      vis.group.rotation.y = e.angle;
      for (let i = 0; i < vis.rings.length; i++) {
        vis.rings[i].rotation.x += dt * (2.0 + i * 1.2);
        vis.rings[i].rotation.y -= dt * (1.5 + i * 0.8);
      }
      vis.coreMat.emissiveIntensity = e.hitFlash > 0.1 ? 4.5 : 1.7;

      for (const cm of vis.crystalMeshes) {
        cm.mesh.visible = cm.crystal.alive;
        if (cm.crystal.alive) {
          cm.mesh.position.set(cm.crystal.x, cm.crystal.y, cm.crystal.z);
          cm.mesh.rotation.y += dt * 3.0;
          cm.mesh.rotation.x += dt * 1.5;
        }
      }
    }
    for (const [id, vis] of enemyVisuals.entries()) {
      if (!aliveIds.has(id)) {
        scene.remove(vis.group);
        for (const cm of vis.crystalMeshes) scene.remove(cm.mesh);
        enemyVisuals.delete(id);
      }
    }

    // 4. Sync 3D Projectiles
    const aliveProj = new Set();
    for (const proj of engine.projectiles) {
      aliveProj.add(proj.id);
      let mesh = projVisuals.get(proj.id);
      if (!mesh) {
        mesh = new THREE.Mesh(enemyOrbGeo, proj.friendly ? friendlyOrbMat : enemyOrbMat);
        scene.add(mesh);
        projVisuals.set(proj.id, mesh);
      }
      mesh.material = proj.friendly ? friendlyOrbMat : enemyOrbMat;
      mesh.position.set(proj.x, proj.y, proj.z);
    }
    for (const [id, mesh] of projVisuals.entries()) {
      if (!aliveProj.has(id)) {
        scene.remove(mesh);
        projVisuals.delete(id);
      }
    }

    // 5. Update Live Grapple Tether Beam
    if (engine.player.grapple) {
      const g = engine.player.grapple;
      const start = new THREE.Vector3(-0.32, -0.24, -0.58).applyMatrix4(camera.matrixWorld);
      const posAttr = grappleBeam.geometry.attributes.position;
      posAttr.setXYZ(0, start.x, start.y, start.z);
      posAttr.setXYZ(1, g.x, g.y, g.z);
      posAttr.needsUpdate = true;
      grappleBeam.visible = true;
    } else {
      grappleBeam.visible = false;
    }

    // 6. Update Tracers & Particles
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
      pt.mesh.rotation.x += dt * 7;
      pt.mesh.rotation.y += dt * 5;
      const s = Math.max(0.01, pt.life / pt.maxLife);
      pt.mesh.scale.setScalar(s);
      if (pt.life <= 0) {
        scene.remove(pt.mesh);
        particles.splice(i, 1);
      }
    }

    // 7. Update HUD
    if (engine.state === 'playing') {
      const p = engine.player;
      const speed = Math.round(Math.hypot(p.vx, p.vz));
      els.speedVal.textContent = `${speed} m/s`;
      els.hpFill.style.width = `${(p.hp / p.maxHp) * 100}%`;
      els.hpText.textContent = `${Math.ceil(p.hp)}`;
      els.shieldFill.style.width = `${(p.shield / p.maxShield) * 100}%`;

      els.dashPill.classList.toggle('ready', p.dashCooldown <= 0);
      els.grapplePill.classList.toggle('ready', p.grappleCooldown <= 0);
      els.parryPill.classList.toggle('ready', p.parryCooldown <= 0);

      els.waveVal.textContent = `WAVE ${engine.wave}`;
      els.enemiesVal.textContent = `${engine.enemies.length} HOSTILES`;
      els.scoreVal.textContent = engine.score.toLocaleString();

      const rank = engine.getStyleRank();
      els.styleRank.textContent = rank.label;
      els.styleRank.style.color = rank.color;
      els.styleTitle.textContent = rank.title;

      els.hitmarker.classList.toggle('active', p.hitMarker > 0);
      els.hitmarker.classList.toggle('crit', p.hitMarkerCrit);
      els.damageVignette.style.opacity = String(p.damageFlash * 0.72);

      if (engine.grappleHighlight) {
        els.grappleHint.textContent =
          engine.grappleHighlight.kind === 'enemy'
            ? 'RMB / E · GRAPPLE EXECUTE'
            : 'RMB / E · SKY-RING GRAPPLE';
        els.grappleHint.classList.remove('hidden');
        els.crosshair.classList.add('locked');
      } else {
        els.grappleHint.classList.add('hidden');
        els.crosshair.classList.remove('locked');
      }

      if (activeBoss) {
        els.bossBar.classList.remove('hidden');
        els.bossName.textContent = `THE SOLAR COLOSSUS · PHASE ${activeBoss.phase === 2 ? 'II' : 'I'}`;
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
