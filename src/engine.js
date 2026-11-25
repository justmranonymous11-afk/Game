import { ARENA, ENEMY_TYPES, PALETTE, PLAYER_BASE, RELICS, WAVE_TABLE } from './constants.js';
import {
  createDart,
  createEnemy,
  createMire,
  createPlayer,
  createProjectile,
  createPylon,
  genId,
  resetEntityIds,
} from './entities.js';
import {
  angleBetween,
  clamp,
  createRng,
  dist,
  distSq,
  normalize,
  orderPolygonPoints,
  pointInPolygon,
  polygonArea,
  polygonCentroid,
  segmentIntersectsCircle,
} from './math.js';

const MAX_PARTICLES = 260;
const MAX_DECALS = 95;
const MAX_FLOATERS = 42;

export class GameEngine {
  constructor(opts = {}) {
    this.audio = opts.audio || null;
    this.rng = opts.seed !== undefined ? createRng(opts.seed) : Math.random;
    this.onStateChange = opts.onStateChange || null;
    this.bestScore = opts.bestScore || 0;
    this.bestWave = opts.bestWave || 0;
    this.reset('title');
  }

  reset(initialState = 'title') {
    resetEntityIds();
    this.state = initialState; // 'title' | 'playing' | 'paused' | 'draft' | 'victory' | 'gameover'
    this.time = 0;
    this.hitStop = 0;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.zoomPunch = 0;

    this.player = createPlayer();
    this.pylons = [];
    this.enemies = [];
    this.darts = [];
    this.tethers = []; // { id, targetId, targetKind, pluckAmp, pluckPhase, burnTick }
    this.projectiles = [];
    this.mires = [];
    this.particles = [];
    this.decals = [];
    this.floaters = [];
    this.sealFlashes = []; // Visual + echo seal detonations
    this.slashRibbons = []; // Gold-vermilion cleave trails
    this.shockwaves = []; // Expanding rings

    // Progression & stats
    this.wave = 1;
    this.endless = false;
    this.waveBannerTimer = 0;
    this.waveTitle = '';
    this.waveSubtitle = '';
    this.spawnQueue = [];
    this.waveElapsed = 0;
    this.waveClearDelay = 0;
    this.healedThisWave = false;

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.sealsTriggered = 0;
    this.parriesLanded = 0;
    this.bestSealKills = 0;

    this.relics = {}; // id -> stack count
    this.draftChoices = [];

    // Input state
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      mouseX: ARENA.WIDTH * 0.5,
      mouseY: ARENA.HEIGHT * 0.5,
      firing: false,
    };

    this._setupPylons();
    if (initialState === 'playing') {
      this._startWave(1);
    }
    this._emitState();
  }

  startRun() {
    this.reset('playing');
  }

  continueEndless() {
    if (this.state !== 'victory') return;
    this.endless = true;
    this.state = 'playing';
    this._openDraft();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._emitState();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this._emitState();
    }
  }

  relicCount(id) {
    return this.relics[id] || 0;
  }

  getMaxTethers() {
    return PLAYER_BASE.MAX_TETHERS + this.relicCount('extra_spool');
  }

  getTetherRange() {
    return PLAYER_BASE.TETHER_RANGE * (1 + 0.25 * this.relicCount('gilded_thread'));
  }

  getComboMultiplier() {
    return 1 + Math.min(8, Math.floor(this.combo / 2) * 0.5);
  }

  getHarmonicDamageBoost() {
    const stacks = this.relicCount('harmonic_flow');
    if (!stacks) return 1;
    return 1 + Math.min(12, this.combo) * 0.06 * stacks;
  }

  _emitState() {
    if (this.onStateChange) this.onStateChange(this.state);
  }

  _setupPylons() {
    const extra = this.relicCount('resonant_bell');
    const cx = ARENA.WIDTH * 0.5;
    const cy = ARENA.HEIGHT * 0.5;
    this.pylons = [
      createPylon(cx - 265, cy),
      createPylon(cx + 265, cy),
    ];
    if (extra >= 1) {
      this.pylons.push(createPylon(cx, cy - 185));
    }
    if (extra >= 2) {
      this.pylons.push(createPylon(cx, cy + 185));
    }
  }

  _startWave(waveNum) {
    this.wave = waveNum;
    this.waveElapsed = 0;
    this.waveClearDelay = 0;
    this.healedThisWave = false;
    this.tethers = [];
    this.darts = [];
    this.projectiles = [];
    this.mires = [];
    this._setupPylons();

    // Gently fade old ink decals between waves so the parchment stays crisp
    this.decals = this.decals.slice(-24);

    if (waveNum <= WAVE_TABLE.length) {
      const def = WAVE_TABLE[waveNum - 1];
      this.waveTitle = `WAVE ${waveNum} · ${def.title.toUpperCase()}`;
      this.waveSubtitle = def.subtitle;
      this.spawnQueue = def.spawns.map((s) => ({ ...s, spawned: false }));
    } else {
      const tier = waveNum - WAVE_TABLE.length;
      const isBoss = waveNum % 5 === 0;
      this.waveTitle = isBoss
        ? `WAVE ${waveNum} · ETERNAL CARILLON`
        : `WAVE ${waveNum} · ENDLESS WEAVE ${tier}`;
      this.waveSubtitle = isBoss
        ? 'An Ascended Carillon rings through the parchment sanctuary.'
        : 'Survive the escalating tide and chain massive Loom Seals.';
      if (isBoss) {
        this.spawnQueue = [
          { type: 'boss', count: 1, delay: 0.5, spawned: false },
          { type: 'archer', count: 2 + Math.min(3, Math.floor(tier / 2)), delay: 3.5, spawned: false },
          { type: 'mote', count: 5 + Math.min(6, tier), delay: 6.0, spawned: false },
        ];
      } else {
        this.spawnQueue = [
          { type: 'mote', count: 8 + Math.min(10, tier * 2), delay: 0.25, spawned: false },
          { type: 'archer', count: 3 + Math.min(4, Math.floor(tier * 0.7)), delay: 1.8, spawned: false },
          { type: 'beetle', count: 2 + Math.min(4, Math.floor(tier * 0.6)), delay: 3.8, spawned: false },
          { type: 'weaver', count: 2 + Math.min(4, Math.floor(tier * 0.6)), delay: 5.5, spawned: false },
        ];
      }
    }

    this.waveBannerTimer = 3.2;
    this._emitState();
  }

  _spawnEnemyGroup(type, count) {
    const waveScale = 1 + (this.wave - 1) * 0.085;
    for (let i = 0; i < count; i++) {
      let x;
      let y;
      if (type === 'boss') {
        x = ARENA.WIDTH * 0.5;
        y = ARENA.PADDING + 120;
      } else {
        // Spawn along perimeter away from player
        let attempts = 0;
        do {
          const edge = Math.floor(this.rng() * 4);
          const pad = ARENA.PADDING + 26;
          if (edge === 0) {
            x = pad + this.rng() * (ARENA.WIDTH - pad * 2);
            y = pad;
          } else if (edge === 1) {
            x = pad + this.rng() * (ARENA.WIDTH - pad * 2);
            y = ARENA.HEIGHT - pad;
          } else if (edge === 2) {
            x = pad;
            y = pad + this.rng() * (ARENA.HEIGHT - pad * 2);
          } else {
            x = ARENA.WIDTH - pad;
            y = pad + this.rng() * (ARENA.HEIGHT - pad * 2);
          }
          attempts++;
        } while (dist(x, y, this.player.x, this.player.y) < 190 && attempts < 10);
      }

      const enemy = createEnemy(type, x, y, waveScale, this.rng);
      this.enemies.push(enemy);
      this._spawnBurst(x, y, PALETTE.ink, 7, 90);
    }
  }

  // ---- PLAYER ACTIONS ----

  fireTether(targetX, targetY) {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.tetherCooldown > 0 || p.cleaving) return false;

    const dir = normalize(targetX - p.x, targetY - p.y);
    if (dir.len < 1e-4) return false;

    p.aimAngle = Math.atan2(dir.y, dir.x);
    p.tetherCooldown = PLAYER_BASE.TETHER_COOLDOWN;

    const speed = PLAYER_BASE.TETHER_SHOT_SPEED;
    const pierce = this.relicCount('gilded_thread') > 0 ? 1 : 0;
    this.darts.push(
      createDart(
        p.x + dir.x * (p.radius + 4),
        p.y + dir.y * (p.radius + 4),
        dir.x * speed,
        dir.y * speed,
        this.getTetherRange(),
        pierce
      )
    );

    this.audio?.playThrow();
    return true;
  }

  triggerSnap() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.cleaving) return false;

    // Prune dead tether references first
    this._pruneTethers();

    if (this.tethers.length === 0) {
      return this._triggerParry();
    }

    if (this.tethers.length >= 3) {
      return this._triggerLoomSeal();
    }

    return this._triggerChainCleave();
  }

  _triggerParry() {
    const p = this.player;
    if (p.parryCooldown > 0) return false;

    const cdScale = 1 - 0.18 * this.relicCount('phantom_ribbon');
    p.parryCooldown = PLAYER_BASE.PARRY_COOLDOWN * Math.max(0.55, cdScale);
    p.parryTimer = PLAYER_BASE.PARRY_DURATION;
    p.parryFlash = 1.0;

    this.shockwaves.push({
      x: p.x,
      y: p.y,
      radius: 16,
      maxRadius: PLAYER_BASE.PARRY_RADIUS,
      life: 0.24,
      maxLife: 0.24,
      color: PALETTE.goldBright,
      width: 4,
    });

    const deflected = this._parryProjectilesInRadius(p.x, p.y, PLAYER_BASE.PARRY_RADIUS);
    // Gentle knockback on adjacent enemies
    for (const e of this.enemies) {
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < PLAYER_BASE.PARRY_RADIUS + e.radius) {
        const n = normalize(e.x - p.x, e.y - p.y);
        const push = 240 / Math.max(1, e.mass);
        e.vx += n.x * push;
        e.vy += n.y * push;
      }
    }

    this.audio?.playParry(deflected);
    return true;
  }

  _parryProjectilesInRadius(cx, cy, radius) {
    let deflected = 0;
    const shatterStacks = this.relicCount('shatter_chime');
    const newNeedles = [];

    for (const proj of this.projectiles) {
      if (proj.friendly) continue;
      if (dist(cx, cy, proj.x, proj.y) <= radius + proj.radius) {
        deflected++;
        this.parriesLanded++;
        this._addCombo(1);
        this.score += Math.round(60 * this.getComboMultiplier());

        const count = shatterStacks > 0 ? 1 + shatterStacks * 2 : 1;
        const baseAngle = angleBetween(cx, cy, proj.x, proj.y);
        proj.friendly = true;
        proj.homing = true;
        proj.damage = 52 * this.getHarmonicDamageBoost();
        proj.life = 3.2;
        proj.color = PALETTE.goldBright;
        const spd = 620;
        proj.vx = Math.cos(baseAngle) * spd;
        proj.vy = Math.sin(baseAngle) * spd;

        for (let k = 1; k < count; k++) {
          const offset = ((k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2)) * 0.24;
          const a = baseAngle + offset;
          newNeedles.push(
            createProjectile(proj.x, proj.y, Math.cos(a) * spd, Math.sin(a) * spd, true, {
              damage: 38 * this.getHarmonicDamageBoost(),
              homing: true,
              color: PALETTE.goldBright,
              radius: 6,
            })
          );
        }

        this._spawnBurst(proj.x, proj.y, PALETTE.goldBright, 10, 210);
      }
    }

    if (newNeedles.length) {
      this.projectiles.push(...newNeedles);
    }

    if (deflected > 0) {
      this.hitStop = Math.max(this.hitStop, 0.048);
      this.shake = Math.max(this.shake, 7);
      this._addFloater(cx, cy - 26, deflected > 1 ? `PARRY ×${deflected}!` : 'PARRY!', PALETTE.gold, 17);
    }
    return deflected;
  }

  _triggerChainCleave() {
    const p = this.player;
    const targets = [];
    for (const t of this.tethers) {
      const entity = this._resolveTetherTarget(t);
      if (entity) targets.push({ entity, kind: t.targetKind });
    }
    this.tethers = [];
    if (!targets.length) return false;

    p.cleaving = true;
    p.cleaveQueue = targets;
    p.cleaveTarget = targets.shift();
    p.cleaveChainIndex = 0;
    p.cleaveTrail = [{ x: p.x, y: p.y }];
    p.invulnTimer = Math.max(p.invulnTimer, 0.4);
    this.audio?.playCleave(0);
    return true;
  }

  _triggerLoomSeal() {
    const p = this.player;
    const anchored = [];
    for (const t of this.tethers) {
      const entity = this._resolveTetherTarget(t);
      if (entity) anchored.push({ x: entity.x, y: entity.y, entity, kind: t.targetKind });
    }
    this.tethers = [];
    if (anchored.length < 3) return false;

    const poly = orderPolygonPoints(anchored);
    const centroid = polygonCentroid(poly);
    const vertexCount = poly.length;
    const area = polygonArea(poly);

    // Detonate immediately
    const sealKills = this._detonateSealPolygon(poly, vertexCount, 1.0, false);

    // Schedule Echo Seal if player has relic
    const echoStacks = this.relicCount('echo_seal');
    if (echoStacks > 0) {
      this.sealFlashes.push({
        poly: poly.map((pt) => ({ x: pt.x, y: pt.y })),
        life: 0.55,
        maxLife: 0.55,
        echoTimer: 0.45,
        echoMult: 0.55 * echoStacks,
        vertexCount,
        isEcho: false,
      });
    } else {
      this.sealFlashes.push({
        poly: poly.map((pt) => ({ x: pt.x, y: pt.y })),
        life: 0.48,
        maxLife: 0.48,
        echoTimer: -1,
        vertexCount,
        isEcho: false,
      });
    }

    // Ring any tethered pylons
    for (const a of anchored) {
      if (a.kind === 'pylon') {
        this._ringPylon(a.entity, true);
      }
    }

    // Snap-glide player toward the centroid safely with invulnerability
    const prevX = p.x;
    const prevY = p.y;
    const safeX = clamp(centroid.x, ARENA.PADDING + p.radius, ARENA.WIDTH - ARENA.PADDING - p.radius);
    const safeY = clamp(centroid.y, ARENA.PADDING + p.radius, ARENA.HEIGHT - ARENA.PADDING - p.radius);
    this.slashRibbons.push({
      points: [
        { x: prevX, y: prevY },
        { x: safeX, y: safeY },
      ],
      life: 0.34,
      maxLife: 0.34,
      width: 11,
      color: PALETTE.goldBright,
    });
    p.x = safeX;
    p.y = safeY;
    p.vx *= 0.25;
    p.vy *= 0.25;
    p.invulnTimer = Math.max(
      p.invulnTimer,
      PLAYER_BASE.INVULN_AFTER_CLEAVE + 0.24 + 0.18 * this.relicCount('phantom_ribbon')
    );

    // Kintsugi Mend heal check
    if (this.relicCount('kintsugi_mend') > 0 && !this.healedThisWave && sealKills >= 3 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.healedThisWave = true;
      this._addFloater(p.x, p.y - 34, '+1 VITALITY', PALETTE.celadon, 16);
    }

    this.sealsTriggered++;
    this.bestSealKills = Math.max(this.bestSealKills, sealKills);
    this.hitStop = Math.max(this.hitStop, 0.072);
    this.shake = Math.max(this.shake, 13);
    this.zoomPunch = Math.max(this.zoomPunch, 0.032);
    this.audio?.playLoomSeal(vertexCount);

    const label =
      vertexCount >= 5
        ? 'GRAND LOOM SEAL!'
        : vertexCount === 4
          ? 'QUAD LOOM SEAL!'
          : 'LOOM SEAL!';
    const areaBonus = Math.min(400, Math.round(area * 0.004));
    this.score += Math.round((180 + areaBonus) * this.getComboMultiplier());
    this._addFloater(centroid.x, centroid.y - 16, label, PALETTE.gold, 20);

    return true;
  }

  _detonateSealPolygon(poly, vertexCount, mult = 1.0, isEcho = false) {
    const damage =
      PLAYER_BASE.SEAL_BASE_DAMAGE *
      (1 + (vertexCount - 3) * 0.32) *
      mult *
      this.getHarmonicDamageBoost();

    const sealedBossIds = new Set();
    let kills = 0;

    // Damage all enemies inside or on the border of the polygon
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      let hit = pointInPolygon(e.x, e.y, poly, e.radius + 14);
      // Also check if any boss resonance nodes were part of this seal
      if (!hit && e.type === 'boss') {
        for (const node of e.nodes) {
          if (pointInPolygon(node.x, node.y, poly, node.radius + 14)) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        const isBoss = e.type === 'boss';
        const finalDmg = isBoss ? damage * 1.15 : damage;
        const died = this._damageEnemy(e, finalDmg, {
          fromSeal: true,
          ignoreArmor: true,
        });
        if (isBoss && !sealedBossIds.has(e.id)) {
          sealedBossIds.add(e.id);
          e.stunTimer = Math.max(e.stunTimer, 0.9);
          this._addFloater(e.x, e.y - 54, 'RESONANCE BREAK!', PALETTE.vermilion, 18);
        }
        if (died) kills++;
      }
    }

    // Erase all enemy projectiles inside the polygon
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.friendly && pointInPolygon(proj.x, proj.y, poly, proj.radius + 16)) {
        this._spawnBurst(proj.x, proj.y, PALETTE.goldBright, 5, 110);
        this.projectiles.splice(i, 1);
      }
    }

    // Visual gold-leaf burst along polygon edges
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      this._spawnBurst(a.x, a.y, PALETTE.goldBright, isEcho ? 6 : 10, 220);
      this._spawnBurst(mx, my, PALETTE.vermilion, 4, 140);
    }

    if (isEcho) {
      const c = polygonCentroid(poly);
      this.audio?.playLoomSeal(3);
      this._addFloater(c.x, c.y, 'ECHO SEAL', PALETTE.gold, 15);
    }

    return kills;
  }

  _ringPylon(pylon, fromSeal = false) {
    pylon.ringTimer = 0.65;
    const bonus = this.relicCount('resonant_bell');
    const radius = 125 + bonus * 45 + (fromSeal ? 35 : 0);
    const dmg = (36 + bonus * 28) * this.getHarmonicDamageBoost();

    this.shockwaves.push({
      x: pylon.x,
      y: pylon.y,
      radius: 18,
      maxRadius: radius,
      life: 0.34,
      maxLife: 0.34,
      color: PALETTE.gold,
      width: 5,
    });

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (dist(pylon.x, pylon.y, e.x, e.y) <= radius + e.radius) {
        this._damageEnemy(e, dmg, { ignoreArmor: true });
        const n = normalize(e.x - pylon.x, e.y - pylon.y);
        e.vx += (n.x * 260) / Math.max(1, e.mass);
        e.vy += (n.y * 260) / Math.max(1, e.mass);
      }
    }
    this._parryProjectilesInRadius(pylon.x, pylon.y, radius * 0.85);
  }

  // ---- RELIC DRAFTING ----

  _openDraft() {
    const available = RELICS.filter((r) => this.relicCount(r.id) < r.maxStacks);
    if (available.length === 0) {
      this._startWave(this.wave + 1);
      return;
    }
    const pool = available.slice();
    const choices = [];
    while (choices.length < 3 && pool.length > 0) {
      const idx = Math.floor(this.rng() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }
    this.draftChoices = choices;
    this.state = 'draft';
    this.audio?.playWaveClear();
    this._emitState();
  }

  selectRelic(relicId) {
    if (this.state !== 'draft') return false;
    const choice = this.draftChoices.find((c) => c.id === relicId);
    if (!choice) return false;

    this.relics[relicId] = (this.relics[relicId] || 0) + 1;
    if (relicId === 'kintsugi_mend') {
      this.player.maxHp += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
    }

    this.draftChoices = [];
    this.audio?.playRelicPick();
    this.state = 'playing';
    this._startWave(this.wave + 1);
    return true;
  }

  // ---- MAIN SIMULATION STEP ----

  step(rawDt) {
    const dt = clamp(rawDt, 0, 0.05);
    if (this.state !== 'playing') {
      // Gentle ambient animation on title screen
      if (this.state === 'title') {
        this.time += dt;
        this.player.haloAngle += dt * 0.9;
      }
      return;
    }

    this.time += dt;

    // Hit-stop freeze frames for crisp impact feel
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      this._updateCamera(dt);
      return;
    }

    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer = Math.max(0, this.waveBannerTimer - dt);
    }

    // Combo decay
    if (this.combo > 0) {
      const decayRate = 1 / (1 + 0.4 * this.relicCount('harmonic_flow'));
      this.comboTimer -= dt * decayRate;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    this._updateWaveSpawner(dt);
    this._updatePlayer(dt);
    this._updateDarts(dt);
    this._updateTethers(dt);
    this._updateEnemies(dt);
    this._updateProjectiles(dt);
    this._updateMires(dt);
    this._updateEffects(dt);
    this._updateCamera(dt);

    // Check wave completion
    const allSpawned = this.spawnQueue.every((s) => s.spawned);
    if (allSpawned && this.enemies.length === 0) {
      this.waveClearDelay += dt;
      if (this.waveClearDelay >= 0.9) {
        this._onWaveComplete();
      }
    }
  }

  _onWaveComplete() {
    this.score += Math.round(250 * this.wave);
    this._updateRecords();

    if (this.wave === 10 && !this.endless) {
      this.state = 'victory';
      this.audio?.playWaveClear();
      this._emitState();
      return;
    }

    this._openDraft();
  }

  _updateRecords() {
    if (this.score > this.bestScore) this.bestScore = this.score;
    if (this.wave > this.bestWave) this.bestWave = this.wave;
  }

  _updateWaveSpawner(dt) {
    this.waveElapsed += dt;
    for (const entry of this.spawnQueue) {
      if (!entry.spawned && this.waveElapsed >= entry.delay) {
        entry.spawned = true;
        this._spawnEnemyGroup(entry.type, entry.count);
      }
    }
  }

  _updatePlayer(dt) {
    const p = this.player;
    p.haloAngle += dt * (this.tethers.length >= 3 ? 4.4 : 1.6);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.tetherCooldown > 0) p.tetherCooldown = Math.max(0, p.tetherCooldown - dt);
    if (p.parryCooldown > 0) p.parryCooldown = Math.max(0, p.parryCooldown - dt);
    if (p.parryTimer > 0) p.parryTimer = Math.max(0, p.parryTimer - dt);
    if (p.parryFlash > 0) p.parryFlash = Math.max(0, p.parryFlash - dt * 3.5);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt * 4.5);

    p.aimAngle = angleBetween(p.x, p.y, this.input.mouseX, this.input.mouseY);

    if (p.cleaving) {
      this._updatePlayerCleave(dt);
    } else {
      let mx = 0;
      let my = 0;
      if (this.input.up) my -= 1;
      if (this.input.down) my += 1;
      if (this.input.left) mx -= 1;
      if (this.input.right) mx += 1;

      const speedMult = 1 + 0.16 * this.relicCount('phantom_ribbon');
      // Mire slow check
      let inMire = false;
      for (const m of this.mires) {
        if (dist(p.x, p.y, m.x, m.y) < m.radius) {
          inMire = true;
          break;
        }
      }
      const mireMult = inMire ? 0.62 : 1.0;

      if (mx !== 0 || my !== 0) {
        const n = normalize(mx, my);
        p.vx += n.x * PLAYER_BASE.ACCEL * speedMult * mireMult * dt;
        p.vy += n.y * PLAYER_BASE.ACCEL * speedMult * mireMult * dt;
        p.facingAngle = Math.atan2(n.y, n.x);
      }

      const dragFactor = Math.exp(-PLAYER_BASE.DRAG * dt);
      p.vx *= dragFactor;
      p.vy *= dragFactor;

      const maxSpd = PLAYER_BASE.MAX_SPEED * speedMult * mireMult;
      const curSpd = Math.hypot(p.vx, p.vy);
      if (curSpd > maxSpd) {
        p.vx = (p.vx / curSpd) * maxSpd;
        p.vy = (p.vy / curSpd) * maxSpd;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    p.x = clamp(p.x, ARENA.PADDING + p.radius, ARENA.WIDTH - ARENA.PADDING - p.radius);
    p.y = clamp(p.y, ARENA.PADDING + p.radius, ARENA.HEIGHT - ARENA.PADDING - p.radius);

    // Update Verlet scarf ribbon
    p.scarf[0].x = p.x;
    p.scarf[0].y = p.y;
    const segLen = 5.5;
    for (let i = 1; i < p.scarf.length; i++) {
      const prev = p.scarf[i - 1];
      const curr = p.scarf[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const d = Math.hypot(dx, dy);
      if (d > segLen) {
        curr.x = prev.x + (dx / d) * segLen;
        curr.y = prev.y + (dy / d) * segLen;
      }
    }
  }

  _updatePlayerCleave(dt) {
    const p = this.player;
    const target = p.cleaveTarget;
    if (!target) {
      this._finishCleave();
      return;
    }

    const tx = target.entity.x;
    const ty = target.entity.y;
    const prevX = p.x;
    const prevY = p.y;

    const tempest = this.relicCount('tempest_reel');
    const cleaveSpeed = PLAYER_BASE.CLEAVE_SPEED * (1 + 0.16 * tempest);
    const cleaveRadius = PLAYER_BASE.CLEAVE_RADIUS * (1 + 0.28 * tempest);
    const cleaveDmg =
      PLAYER_BASE.CLEAVE_DAMAGE *
      (1 + 0.3 * tempest) *
      (1 + p.cleaveChainIndex * 0.22) *
      this.getHarmonicDamageBoost();

    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    const stepDist = cleaveSpeed * dt;

    if (d <= stepDist + 14) {
      p.x = tx;
      p.y = ty;
    } else {
      p.x += (dx / d) * stepDist;
      p.y += (dy / d) * stepDist;
    }

    p.cleaveTrail.push({ x: p.x, y: p.y });

    // Cleave any enemies intersecting the dash segment
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (segmentIntersectsCircle(prevX, prevY, p.x, p.y, e.x, e.y, e.radius + cleaveRadius * 0.65)) {
        // Only hit each enemy once per cleave leg
        if (!target._hitSet) target._hitSet = new Set();
        if (!target._hitSet.has(e.id)) {
          target._hitSet.add(e.id);
          this._damageEnemy(e, cleaveDmg, { ignoreArmor: true });
          const n = normalize(p.x - prevX, p.y - prevY);
          e.vx += (n.x * 240) / Math.max(1, e.mass);
          e.vy += (n.y * 240) / Math.max(1, e.mass);
        }
      }
    }

    // Deflect bullets along the cleave path!
    this._parryProjectilesInRadius(p.x, p.y, cleaveRadius * 0.9);

    if (d <= stepDist + 14) {
      // Arrived at target
      if (target.kind === 'pylon') {
        this._ringPylon(target.entity, false);
      } else if (target.kind === 'boss_node') {
        const boss = this.enemies.find((e) => e.id === target.entity.parentId);
        if (boss) this._damageEnemy(boss, cleaveDmg * 1.1, { ignoreArmor: true });
      }
      this.hitStop = Math.max(this.hitStop, 0.036);
      this.shake = Math.max(this.shake, 7);
      this._spawnBurst(p.x, p.y, PALETTE.goldBright, 12, 240);

      if (p.cleaveQueue.length > 0) {
        p.cleaveChainIndex++;
        p.cleaveTarget = p.cleaveQueue.shift();
        this.audio?.playCleave(p.cleaveChainIndex);
      } else {
        // Carry a crisp exit momentum
        const exitDir = normalize(p.x - prevX, p.y - prevY);
        p.vx = exitDir.x * 260;
        p.vy = exitDir.y * 260;
        this._finishCleave();
      }
    }
  }

  _finishCleave() {
    const p = this.player;
    if (p.cleaveTrail.length >= 2) {
      this.slashRibbons.push({
        points: p.cleaveTrail.slice(),
        life: 0.3,
        maxLife: 0.3,
        width: 9,
        color: PALETTE.vermilion,
      });
    }
    p.cleaving = false;
    p.cleaveTarget = null;
    p.cleaveQueue = [];
    p.cleaveTrail = [];
    p.invulnTimer = Math.max(
      p.invulnTimer,
      PLAYER_BASE.INVULN_AFTER_CLEAVE + 0.18 * this.relicCount('phantom_ribbon')
    );

    const sunburst = this.relicCount('sunburst_cleave');
    if (sunburst > 0) {
      const r = 115 + sunburst * 35;
      this.shockwaves.push({
        x: p.x,
        y: p.y,
        radius: 14,
        maxRadius: r,
        life: 0.28,
        maxLife: 0.28,
        color: PALETTE.goldBright,
        width: 4,
      });
      for (const e of this.enemies) {
        if (e.hp > 0 && dist(p.x, p.y, e.x, e.y) <= r + e.radius) {
          this._damageEnemy(e, 34 * sunburst * this.getHarmonicDamageBoost(), { ignoreArmor: true });
        }
      }
      this._parryProjectilesInRadius(p.x, p.y, r);
    }
  }

  _updateDarts(dt) {
    for (let i = this.darts.length - 1; i >= 0; i--) {
      const d = this.darts[i];
      const prevX = d.x;
      const prevY = d.y;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.trail.push({ x: d.x, y: d.y });
      if (d.trail.length > 6) d.trail.shift();

      const traveled = dist(d.startX, d.startY, d.x, d.y);
      if (
        traveled > d.maxRange ||
        d.x < ARENA.PADDING ||
        d.x > ARENA.WIDTH - ARENA.PADDING ||
        d.y < ARENA.PADDING ||
        d.y > ARENA.HEIGHT - ARENA.PADDING
      ) {
        this._spawnBurst(d.x, d.y, PALETTE.gold, 4, 80);
        this.darts.splice(i, 1);
        continue;
      }

      // Check collision against enemies, boss nodes, and pylons
      let hitTarget = null;
      let hitKind = null;

      for (const e of this.enemies) {
        if (e.hp <= 0 || d.hitIds.has(e.id)) continue;
        // Check boss resonance nodes first so players can weave seals around the boss!
        if (e.type === 'boss') {
          for (const node of e.nodes) {
            if (d.hitIds.has(node.id)) continue;
            if (segmentIntersectsCircle(prevX, prevY, d.x, d.y, node.x, node.y, node.radius + 14)) {
              hitTarget = node;
              hitKind = 'boss_node';
              break;
            }
          }
          if (hitTarget) break;
        }

        if (segmentIntersectsCircle(prevX, prevY, d.x, d.y, e.x, e.y, e.radius + 14)) {
          hitTarget = e;
          hitKind = 'enemy';
          break;
        }
      }

      if (!hitTarget) {
        for (const py of this.pylons) {
          if (d.hitIds.has(py.id)) continue;
          if (segmentIntersectsCircle(prevX, prevY, d.x, d.y, py.x, py.y, py.radius + 14)) {
            hitTarget = py;
            hitKind = 'pylon';
            break;
          }
        }
      }

      if (hitTarget) {
        d.hitIds.add(hitTarget.id);
        const alreadyTethered = this.tethers.some((t) => t.targetId === hitTarget.id);
        if (alreadyTethered) {
          // Double-tagging an already tethered target snaps immediately!
          this.darts.splice(i, 1);
          this.triggerSnap();
          continue;
        }

        this._attachTether(hitTarget, hitKind);
        if (hitKind === 'enemy') {
          // Light tag damage + micro hit flash
          this._damageEnemy(hitTarget, 8, { fromTag: true });
        }

        if (d.pierceLeft > 0) {
          d.pierceLeft--;
        } else {
          this.darts.splice(i, 1);
        }
      }
    }
  }

  _attachTether(entity, kind) {
    const maxT = this.getMaxTethers();
    if (this.tethers.length >= maxT) {
      this.tethers.shift();
    }
    this.tethers.push({
      id: genId(),
      targetId: entity.id,
      targetKind: kind,
      pluckAmp: 1.0,
      pluckPhase: 0,
      burnTick: 0,
    });
    this._spawnBurst(entity.x, entity.y, PALETTE.goldBright, 8, 150);
    this.audio?.playTetherLatch(this.tethers.length);
  }

  _resolveTetherTarget(tether) {
    if (tether.targetKind === 'enemy') {
      return this.enemies.find((e) => e.id === tether.targetId && e.hp > 0) || null;
    }
    if (tether.targetKind === 'pylon') {
      return this.pylons.find((py) => py.id === tether.targetId) || null;
    }
    if (tether.targetKind === 'boss_node') {
      for (const e of this.enemies) {
        if (e.type === 'boss' && e.hp > 0) {
          const n = e.nodes.find((nd) => nd.id === tether.targetId);
          if (n) return n;
        }
      }
    }
    return null;
  }

  _pruneTethers() {
    for (let i = this.tethers.length - 1; i >= 0; i--) {
      if (!this._resolveTetherTarget(this.tethers[i])) {
        this.tethers.splice(i, 1);
      }
    }
  }

  _updateTethers(dt) {
    this._pruneTethers();
    const resolved = [];
    for (const t of this.tethers) {
      t.pluckAmp = Math.max(0, t.pluckAmp - dt * 2.8);
      t.pluckPhase += dt * 44;
      const entity = this._resolveTetherTarget(t);
      if (entity) resolved.push({ tether: t, entity });
    }

    // Taut Pull relic: gently pull tethered enemies toward their shared centroid
    const pullStacks = this.relicCount('taut_pull');
    if (pullStacks > 0 && resolved.length >= 2) {
      let cx = 0;
      let cy = 0;
      for (const r of resolved) {
        cx += r.entity.x;
        cy += r.entity.y;
      }
      cx /= resolved.length;
      cy /= resolved.length;
      for (const r of resolved) {
        if (r.tether.targetKind === 'enemy' && r.entity.type !== 'boss') {
          const n = normalize(cx - r.entity.x, cy - r.entity.y);
          r.entity.vx += n.x * 165 * pullStacks * dt;
          r.entity.vy += n.y * 165 * pullStacks * dt;
        }
      }
    }

    // Cinnabar Silk relic: taut threads burn any enemy touching them
    const burnStacks = this.relicCount('cinnabar_silk');
    if (burnStacks > 0 && resolved.length > 0) {
      const segments = [];
      for (const r of resolved) {
        segments.push([this.player.x, this.player.y, r.entity.x, r.entity.y]);
      }
      if (resolved.length >= 3) {
        const poly = orderPolygonPoints(resolved.map((r) => ({ x: r.entity.x, y: r.entity.y })));
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i];
          const b = poly[(i + 1) % poly.length];
          segments.push([a.x, a.y, b.x, b.y]);
        }
      }
      const burnDps = 28 * burnStacks;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        for (const [ax, ay, bx, by] of segments) {
          if (segmentIntersectsCircle(ax, ay, bx, by, e.x, e.y, e.radius + 5)) {
            e.burnTimer += dt;
            if (e.burnTimer >= 0.22) {
              e.burnTimer = 0;
              this._damageEnemy(e, burnDps * 0.22, { fromTag: true, ignoreArmor: true });
              this._spawnBurst(e.x, e.y, PALETTE.vermilion, 3, 70);
            }
            break;
          }
        }
      }
    }
  }

  _updateEnemies(dt) {
    const p = this.player;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
      if (e.spawnTimer > 0) {
        e.spawnTimer = Math.max(0, e.spawnTimer - dt);
        continue;
      }
      if (e.stunTimer > 0) {
        e.stunTimer = Math.max(0, e.stunTimer - dt);
        e.vx *= Math.exp(-6 * dt);
        e.vy *= Math.exp(-6 * dt);
      } else {
        this._runEnemyAI(e, dt);
      }

      // Soft separation between non-boss enemies
      for (let j = i - 1; j >= 0; j--) {
        const o = this.enemies[j];
        if (o.hp <= 0 || o.spawnTimer > 0) continue;
        const minDist = e.radius + o.radius + 4;
        const dSq = distSq(e.x, e.y, o.x, o.y);
        if (dSq > 0.01 && dSq < minDist * minDist) {
          const d = Math.sqrt(dSq);
          const push = (minDist - d) * 3.8 * dt;
          const nx = (e.x - o.x) / d;
          const ny = (e.y - o.y) / d;
          if (e.type !== 'boss') {
            e.x += nx * push;
            e.y += ny * push;
          }
          if (o.type !== 'boss') {
            o.x -= nx * push;
            o.y -= ny * push;
          }
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, ARENA.PADDING + e.radius, ARENA.WIDTH - ARENA.PADDING - e.radius);
      e.y = clamp(e.y, ARENA.PADDING + e.radius, ARENA.HEIGHT - ARENA.PADDING - e.radius);

      // Update boss orbiting resonance nodes
      if (e.type === 'boss') {
        const orbitSpeed = e.phase === 2 ? 1.55 : 0.95;
        for (const node of e.nodes) {
          node.angle += orbitSpeed * dt;
          node.x = e.x + Math.cos(node.angle) * node.orbitRadius;
          node.y = e.y + Math.sin(node.angle) * node.orbitRadius;
        }
      }

      // Contact damage check with player
      if (!p.cleaving && p.invulnTimer <= 0) {
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < p.radius + e.radius - 3) {
          this._damagePlayer(1, e.x, e.y);
        }
      }
    }
  }

  _runEnemyAI(e, dt) {
    const p = this.player;
    const toP = normalize(p.x - e.x, p.y - e.y);
    const dToP = toP.len;

    if (e.type === 'mote') {
      e.angle = Math.atan2(toP.y, toP.x);
      e.vx += (toP.x * e.speed - e.vx) * Math.min(1, 5.5 * dt);
      e.vy += (toP.y * e.speed - e.vy) * Math.min(1, 5.5 * dt);
      return;
    }

    if (e.type === 'archer') {
      const spec = ENEMY_TYPES.archer;
      e.angle = Math.atan2(toP.y, toP.x);

      if (e.aiState === 'telegraph') {
        e.vx *= Math.exp(-8 * dt);
        e.vy *= Math.exp(-8 * dt);
        e.aiTimer -= dt;
        e.telegraphProgress = 1 - Math.max(0, e.aiTimer / spec.telegraphTime);
        if (e.aiTimer <= 0) {
          // Fire parryable cinnabar orb
          const a = e.telegraphAngle;
          this.projectiles.push(
            createProjectile(
              e.x + Math.cos(a) * (e.radius + 6),
              e.y + Math.sin(a) * (e.radius + 6),
              Math.cos(a) * spec.projectileSpeed,
              Math.sin(a) * spec.projectileSpeed,
              false
            )
          );
          e.aiState = 'idle';
          e.aiTimer = spec.fireCooldown * (0.85 + this.rng() * 0.3);
          e.telegraphProgress = 0;
        }
        return;
      }

      // Strafe to preferred range
      let moveX = 0;
      let moveY = 0;
      if (dToP > spec.preferredDist + 35) {
        moveX = toP.x;
        moveY = toP.y;
      } else if (dToP < spec.preferredDist - 55) {
        moveX = -toP.x;
        moveY = -toP.y;
      } else {
        // Gentle orbital strafe
        moveX = -toP.y * 0.65;
        moveY = toP.x * 0.65;
      }
      e.vx += (moveX * e.speed - e.vx) * Math.min(1, 4.5 * dt);
      e.vy += (moveY * e.speed - e.vy) * Math.min(1, 4.5 * dt);

      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiState = 'telegraph';
        e.aiTimer = spec.telegraphTime;
        e.telegraphAngle = e.angle;
        e.telegraphProgress = 0;
      }
      return;
    }

    if (e.type === 'beetle') {
      const spec = ENEMY_TYPES.beetle;
      if (e.aiState === 'telegraph') {
        e.vx *= Math.exp(-9 * dt);
        e.vy *= Math.exp(-9 * dt);
        e.aiTimer -= dt;
        e.telegraphProgress = 1 - Math.max(0, e.aiTimer / spec.telegraphTime);
        if (e.aiTimer <= 0) {
          e.aiState = 'charge';
          e.aiTimer = spec.chargeDuration;
          e.chargeVx = Math.cos(e.telegraphAngle) * spec.chargeSpeed;
          e.chargeVy = Math.sin(e.telegraphAngle) * spec.chargeSpeed;
          e.vx = e.chargeVx;
          e.vy = e.chargeVy;
          e.telegraphProgress = 0;
        }
        return;
      }

      if (e.aiState === 'charge') {
        e.vx = e.chargeVx;
        e.vy = e.chargeVy;
        e.aiTimer -= dt;
        if (e.aiTimer <= 0) {
          e.aiState = 'idle';
          e.aiTimer = spec.chargeCooldown;
        }
        return;
      }

      e.angle = Math.atan2(toP.y, toP.x);
      e.vx += (toP.x * e.speed - e.vx) * Math.min(1, 3.8 * dt);
      e.vy += (toP.y * e.speed - e.vy) * Math.min(1, 3.8 * dt);
      e.aiTimer -= dt;
      if (e.aiTimer <= 0 && dToP < 360) {
        e.aiState = 'telegraph';
        e.aiTimer = spec.telegraphTime;
        e.telegraphAngle = e.angle;
      }
      return;
    }

    if (e.type === 'weaver') {
      const spec = ENEMY_TYPES.weaver;
      e.angle += dt * 1.8;
      // Orbit around player at medium distance
      const desiredX = toP.x * (dToP > 220 ? 0.8 : -0.3) - toP.y * 0.85;
      const desiredY = toP.y * (dToP > 220 ? 0.8 : -0.3) + toP.x * 0.85;
      const n = normalize(desiredX, desiredY);
      e.vx += (n.x * e.speed - e.vx) * Math.min(1, 4.2 * dt);
      e.vy += (n.y * e.speed - e.vy) * Math.min(1, 4.2 * dt);

      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiTimer = spec.mireCooldown;
        this.mires.push(createMire(e.x, e.y));
        this._spawnBurst(e.x, e.y, PALETTE.celadon, 8, 95);
      }
      return;
    }

    if (e.type === 'boss') {
      // Phase transition at 55% HP
      if (e.phase === 1 && e.hp <= e.maxHp * 0.55) {
        e.phase = 2;
        this.shake = Math.max(this.shake, 14);
        this.hitStop = Math.max(this.hitStop, 0.06);
        this._addFloater(e.x, e.y - 60, 'PHASE II · RESONANT WRATH', PALETTE.vermilion, 19);
        this.audio?.playLoomSeal(4);
      }

      // Majestic drift toward center-offset orbit
      const targetX = ARENA.WIDTH * 0.5 + Math.cos(this.time * 0.55) * 190;
      const targetY = ARENA.HEIGHT * 0.45 + Math.sin(this.time * 0.72) * 115;
      const drift = normalize(targetX - e.x, targetY - e.y);
      const spd = e.phase === 2 ? e.speed * 1.35 : e.speed;
      e.vx += (drift.x * spd - e.vx) * Math.min(1, 2.4 * dt);
      e.vy += (drift.y * spd - e.vy) * Math.min(1, 2.4 * dt);
      e.angle += dt * (e.phase === 2 ? 1.4 : 0.7);

      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        const pattern = e.bossAttackIndex % 3;
        e.bossAttackIndex++;
        if (pattern === 0) {
          // Radial Cinnabar Chime Ring (parryable!)
          const count = e.phase === 2 ? 12 : 8;
          const baseA = angleBetween(e.x, e.y, p.x, p.y);
          for (let k = 0; k < count; k++) {
            const a = baseA + (k / count) * Math.PI * 2;
            this.projectiles.push(
              createProjectile(
                e.x + Math.cos(a) * (e.radius + 8),
                e.y + Math.sin(a) * (e.radius + 8),
                Math.cos(a) * 235,
                Math.sin(a) * 235,
                false
              )
            );
          }
          this.shockwaves.push({
            x: e.x,
            y: e.y,
            radius: e.radius,
            maxRadius: 150,
            life: 0.35,
            maxLife: 0.35,
            color: PALETTE.vermilion,
            width: 3,
          });
          e.aiTimer = e.phase === 2 ? 1.85 : 2.35;
        } else if (pattern === 1) {
          // Aimed 3-way or 5-way chime fan
          const fan = e.phase === 2 ? 5 : 3;
          const aim = angleBetween(e.x, e.y, p.x, p.y);
          for (let k = 0; k < fan; k++) {
            const offset = (k - (fan - 1) / 2) * 0.22;
            const a = aim + offset;
            this.projectiles.push(
              createProjectile(
                e.x + Math.cos(a) * (e.radius + 8),
                e.y + Math.sin(a) * (e.radius + 8),
                Math.cos(a) * 285,
                Math.sin(a) * 285,
                false
              )
            );
          }
          e.aiTimer = e.phase === 2 ? 1.55 : 2.05;
        } else {
          // Summon 2 Ash Motes (capped so arena never overflows)
          if (this.enemies.length < 7) {
            this._spawnEnemyGroup('mote', e.phase === 2 ? 3 : 2);
          }
          e.aiTimer = e.phase === 2 ? 2.1 : 2.6;
        }
      }
    }
  }

  _damageEnemy(enemy, amount, opts = {}) {
    if (enemy.hp <= 0) return false;
    let dmg = amount;

    // Iron Beetle resists light frontal tags while charging
    if (enemy.type === 'beetle' && enemy.aiState === 'charge' && !opts.ignoreArmor) {
      dmg *= 0.25;
    }

    enemy.hp -= dmg;
    enemy.hitFlash = 1.0;

    if (!opts.fromTag) {
      this._addFloater(
        enemy.x + (this.rng() - 0.5) * 14,
        enemy.y - enemy.radius - 6,
        `${Math.round(dmg)}`,
        opts.fromSeal ? PALETTE.gold : PALETTE.vermilion,
        opts.fromSeal ? 16 : 13
      );
    }

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      this._onEnemyKilled(enemy, opts);
      return true;
    }
    return false;
  }

  _onEnemyKilled(enemy, opts = {}) {
    this.kills++;
    this._addCombo(opts.fromSeal ? 2 : 1);
    const pts = Math.round(enemy.score * this.getComboMultiplier() * (opts.fromSeal ? 1.5 : 1));
    this.score += pts;
    this._updateRecords();

    // Ink splatter decal on parchment floor
    this.decals.push({
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius * (1.1 + this.rng() * 0.55),
      color: opts.fromSeal ? PALETTE.goldLeaf : PALETTE.inkFaint,
      seed: this.rng() * 100,
    });
    if (this.decals.length > MAX_DECALS) this.decals.shift();

    this._spawnBurst(
      enemy.x,
      enemy.y,
      opts.fromSeal ? PALETTE.goldBright : enemy.type === 'weaver' ? PALETTE.celadon : PALETTE.ink,
      enemy.type === 'boss' ? 42 : 14,
      enemy.type === 'boss' ? 320 : 190
    );

    this.audio?.playEnemyKill(this.combo);

    // Spindle Weaver splits into 2 Ash Motes UNLESS obliterated inside a Loom Seal!
    if (enemy.type === 'weaver' && !opts.fromSeal) {
      for (let k = -1; k <= 1; k += 2) {
        const m = createEnemy('mote', enemy.x + k * 18, enemy.y, 0.85, this.rng);
        m.spawnTimer = 0.2;
        m.vx = k * 150;
        this.enemies.push(m);
      }
      this._addFloater(enemy.x, enemy.y - 24, 'SPLIT!', PALETTE.celadon, 13);
    }
  }

  _damagePlayer(amount, srcX, srcY) {
    const p = this.player;
    if (p.invulnTimer > 0 || p.cleaving) return;

    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = PLAYER_BASE.INVULN_AFTER_HIT;
    p.hitFlash = 1.0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hitStop = 0.065;
    this.shake = 14;

    const n = normalize(p.x - srcX, p.y - srcY);
    p.vx = n.x * 320;
    p.vy = n.y * 320;

    this._spawnBurst(p.x, p.y, PALETTE.vermilion, 18, 220);
    this.audio?.playPlayerHit();

    if (p.hp <= 0) {
      this._updateRecords();
      this.state = 'gameover';
      this._emitState();
    }
  }

  _addCombo(amount) {
    this.combo += amount;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.comboTimer = PLAYER_BASE.COMBO_DURATION;
  }

  _updateProjectiles(dt) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;

      if (proj.friendly && proj.homing && this.enemies.length > 0) {
        // Steer smoothly toward nearest alive enemy
        let best = null;
        let bestD = Infinity;
        for (const e of this.enemies) {
          if (e.hp <= 0 || proj.hitIds.has(e.id)) continue;
          const d = distSq(proj.x, proj.y, e.x, e.y);
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
        if (best) {
          const desired = normalize(best.x - proj.x, best.y - proj.y);
          const spd = Math.hypot(proj.vx, proj.vy) || 560;
          proj.vx += (desired.x * spd - proj.vx) * Math.min(1, 9 * dt);
          proj.vy += (desired.y * spd - proj.vy) * Math.min(1, 9 * dt);
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      const outOfBounds =
        proj.x < ARENA.PADDING ||
        proj.x > ARENA.WIDTH - ARENA.PADDING ||
        proj.y < ARENA.PADDING ||
        proj.y > ARENA.HEIGHT - ARENA.PADDING;

      if (proj.life <= 0 || outOfBounds) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.friendly) {
        let consumed = false;
        for (const e of this.enemies) {
          if (e.hp <= 0 || proj.hitIds.has(e.id)) continue;
          if (dist(proj.x, proj.y, e.x, e.y) <= proj.radius + e.radius) {
            proj.hitIds.add(e.id);
            this._damageEnemy(e, proj.damage, { ignoreArmor: true });
            this._spawnBurst(proj.x, proj.y, PALETTE.goldBright, 7, 150);
            if (proj.pierce > 0) {
              proj.pierce--;
            } else {
              consumed = true;
              break;
            }
          }
        }
        if (consumed) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Active parry window check
        if (p.parryTimer > 0 && dist(p.x, p.y, proj.x, proj.y) <= PLAYER_BASE.PARRY_RADIUS + proj.radius) {
          this._parryProjectilesInRadius(p.x, p.y, PLAYER_BASE.PARRY_RADIUS);
          continue;
        }

        // Player hit check
        if (!p.cleaving && p.invulnTimer <= 0 && dist(p.x, p.y, proj.x, proj.y) <= p.radius + proj.radius - 2) {
          this._damagePlayer(1, proj.x, proj.y);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  _updateMires(dt) {
    for (let i = this.mires.length - 1; i >= 0; i--) {
      this.mires[i].life -= dt;
      if (this.mires[i].life <= 0) {
        this.mires.splice(i, 1);
      }
    }
  }

  _updateEffects(dt) {
    for (const py of this.pylons) {
      if (py.ringTimer > 0) py.ringTimer = Math.max(0, py.ringTimer - dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.exp(-4.5 * dt);
      pt.vy *= Math.exp(-4.5 * dt);
    }

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y -= 36 * dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }

    for (let i = this.slashRibbons.length - 1; i >= 0; i--) {
      this.slashRibbons[i].life -= dt;
      if (this.slashRibbons[i].life <= 0) this.slashRibbons.splice(i, 1);
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const t = 1 - Math.max(0, sw.life / sw.maxLife);
      sw.radius = sw.maxRadius * (1 - Math.pow(1 - t, 3));
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    for (let i = this.sealFlashes.length - 1; i >= 0; i--) {
      const sf = this.sealFlashes[i];
      sf.life -= dt;
      if (sf.echoTimer > 0) {
        sf.echoTimer -= dt;
        if (sf.echoTimer <= 0) {
          sf.echoTimer = -1;
          this._detonateSealPolygon(sf.poly, sf.vertexCount, sf.echoMult, true);
          this.sealFlashes.push({
            poly: sf.poly,
            life: 0.36,
            maxLife: 0.36,
            echoTimer: -1,
            vertexCount: sf.vertexCount,
            isEcho: true,
          });
        }
      }
      if (sf.life <= 0) this.sealFlashes.splice(i, 1);
    }
  }

  _updateCamera(dt) {
    if (this.shake > 0.05) {
      this.shake *= Math.exp(-16 * dt);
      this.shakeX = (this.rng() * 2 - 1) * this.shake;
      this.shakeY = (this.rng() * 2 - 1) * this.shake;
    } else {
      this.shake = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
    this.zoomPunch *= Math.exp(-10 * dt);
  }

  _spawnBurst(x, y, color, count, maxSpeed) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2;
      const spd = maxSpeed * (0.25 + this.rng() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 2.2 + this.rng() * 3.8,
        life: 0.28 + this.rng() * 0.32,
        maxLife: 0.6,
        color,
      });
    }
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  _addFloater(x, y, text, color, size = 14) {
    this.floaters.push({
      x,
      y,
      text,
      color,
      size,
      life: 0.85,
      maxLife: 0.85,
    });
    if (this.floaters.length > MAX_FLOATERS) this.floaters.shift();
  }

  /**
   * Returns resolved tether vertices and optional ordered Loom polygon for rendering.
   */
  getTetherGeometry() {
    const resolved = [];
    for (const t of this.tethers) {
      const entity = this._resolveTetherTarget(t);
      if (entity) {
        resolved.push({
          x: entity.x,
          y: entity.y,
          pluckAmp: t.pluckAmp,
          pluckPhase: t.pluckPhase,
          kind: t.targetKind,
          radius: entity.radius || 14,
        });
      }
    }
    const polygon = resolved.length >= 3 ? orderPolygonPoints(resolved) : null;
    return { resolved, polygon };
  }
}
