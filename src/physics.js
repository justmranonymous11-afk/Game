import { buildArenaData } from './arenaData.js';

export const PLAYER_CFG = {
  RADIUS: 0.65,
  HEIGHT: 1.9,
  EYE_HEIGHT: 1.62,
  GROUND_SPEED: 13.5,
  GROUND_ACCEL: 78,
  AIR_ACCEL: 24,
  GRAVITY: 30,
  JUMP_SPEED: 12.2,
  DOUBLE_JUMP_SPEED: 11.6,
  DASH_SPEED: 29,
  DASH_DURATION: 0.19,
  DASH_COOLDOWN: 1.15,
  WALL_RUN_GRAVITY: 5.5,
  WALL_RUN_SPEED: 18.5,
  GRAPPLE_RANGE: 54,
  GRAPPLE_SPEED: 38,
  GRAPPLE_COOLDOWN: 1.1,
  FIRE_COOLDOWN: 0.19,
  PARRY_COOLDOWN: 1.4,
  PARRY_RADIUS: 8.5,
  MAX_HP: 100,
  MAX_SHIELD: 50,
};

export const STYLE_RANKS = [
  { min: 0, label: 'D', title: 'DRIFTING', color: '#94A3B8' },
  { min: 350, label: 'C', title: 'CRESTING', color: '#E2E8F0' },
  { min: 850, label: 'B', title: 'BLAZING', color: '#F5C451' },
  { min: 1500, label: 'A', title: 'ASCENDANT', color: '#F59E0B' },
  { min: 2400, label: 'S', title: 'SOLAR', color: '#F97316' },
  { min: 3600, label: 'SS', title: 'SUPERNOVA', color: '#EF4444' },
  { min: 5200, label: 'SOLARIS', title: 'APEX SUN', color: '#FDE047' },
];

let nextId = 1;
function uid() {
  return nextId++;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export class SolarisEngine {
  constructor(opts = {}) {
    this.sound = opts.sound || null;
    this.onEvent = opts.onEvent || null;
    this.arena = buildArenaData();
    this.bestScore = opts.bestScore || 0;
    this.reset('title');
  }

  reset(initialState = 'title') {
    nextId = 1;
    this.state = initialState; // 'title' | 'playing' | 'paused' | 'victory' | 'gameover'
    this.time = 0;
    this.hitStop = 0;

    this.player = {
      x: 0,
      y: 2.0,
      z: 14,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0, // 0 looks toward -Z (central spire!)
      pitch: 0.04,
      grounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      jumpsLeft: 2,
      wallRunSide: 0, // -1 left, 0 none, +1 right
      wallRunNormalX: 0,
      wallRunNormalZ: 0,
      dashTimer: 0,
      dashCooldown: 0,
      fireCooldown: 0,
      grappleCooldown: 0,
      parryCooldown: 0,
      invulnTimer: 0,
      shieldRegenDelay: 0,
      hp: PLAYER_CFG.MAX_HP,
      maxHp: PLAYER_CFG.MAX_HP,
      shield: PLAYER_CFG.MAX_SHIELD,
      maxShield: PLAYER_CFG.MAX_SHIELD,
      recoil: 0,
      cameraRoll: 0,
      fovBoost: 0,
      hitMarker: 0,
      hitMarkerCrit: false,
      damageFlash: 0,
      // Active grapple state
      grapple: null, // { targetKind: 'ring'|'enemy', targetId, x, y, z, timer }
    };

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      firing: false,
    };

    this.enemies = [];
    this.projectiles = [];
    this.wave = 1;
    this.waveClearTimer = 0;
    this.score = 0;
    this.stylePoints = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kills = 0;
    this.executes = 0;
    this.parries = 0;
    this.maxSpeedReached = 0;
    this.grappleHighlight = null; // Best valid grapple target currently in crosshair cone

    if (initialState === 'playing') {
      this._spawnWave(1);
    }
    this._emit('state', { state: this.state });
  }

  startRun() {
    this.reset('playing');
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._emit('state', { state: this.state });
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this._emit('state', { state: this.state });
    }
  }

  _emit(type, payload = {}) {
    if (this.onEvent) this.onEvent(type, payload);
  }

  getStyleRank() {
    let rank = STYLE_RANKS[0];
    for (const r of STYLE_RANKS) {
      if (this.stylePoints >= r.min) rank = r;
    }
    return rank;
  }

  getForwardVector() {
    const cp = Math.cos(this.player.pitch);
    return {
      x: -Math.sin(this.player.yaw) * cp,
      y: Math.sin(this.player.pitch),
      z: -Math.cos(this.player.yaw) * cp,
    };
  }

  getEyePos() {
    return {
      x: this.player.x,
      y: this.player.y + PLAYER_CFG.EYE_HEIGHT,
      z: this.player.z,
    };
  }

  // ---- WAVE DIRECTOR ----

  _spawnWave(waveNum) {
    this.wave = waveNum;
    this.waveClearTimer = 0;
    this.projectiles = [];

    const isBoss = waveNum === 4 || (waveNum > 4 && waveNum % 4 === 0);
    const scale = 1 + (waveNum - 1) * 0.14;

    if (isBoss) {
      this._spawnEnemy('colossus', 0, 14.5, -16, scale);
      this._spawnEnemy('drone', -18, 9, -18, scale);
      this._spawnEnemy('drone', 18, 9, -18, scale);
      this._emit('announcement', {
        title: `WAVE ${waveNum} · THE SOLAR COLOSSUS`,
        subtitle: 'Grapple the Sky-Rings and shatter its orbiting Solar Crystals!',
      });
      return;
    }

    const droneCount = 3 + waveNum;
    const striderCount = waveNum >= 2 ? 1 + Math.floor(waveNum * 0.7) : 0;
    const turretCount = waveNum >= 3 ? Math.min(4, waveNum - 1) : 0;

    for (let i = 0; i < droneCount; i++) {
      const a = (i / droneCount) * Math.PI * 2 + waveNum * 0.4;
      const r = 20 + (i % 2) * 14;
      this._spawnEnemy('drone', Math.cos(a) * r, 5.5 + (i % 3) * 3.2, Math.sin(a) * r, scale);
    }

    const islandCoords = [
      [0, 2.2, -37],
      [0, 2.2, 37],
      [-37, 2.2, 0],
      [37, 2.2, 0],
    ];
    for (let i = 0; i < striderCount; i++) {
      const c = islandCoords[i % islandCoords.length];
      this._spawnEnemy('strider', c[0] + (i - 1) * 2.5, c[1], c[2], scale);
    }

    const balconyCoords = [
      [-27, 8.8, -27],
      [27, 8.8, -27],
      [-27, 8.8, 27],
      [27, 8.8, 27],
    ];
    for (let i = 0; i < turretCount; i++) {
      const c = balconyCoords[i % balconyCoords.length];
      this._spawnEnemy('aegis', c[0], c[1], c[2], scale);
    }

    const titles = [
      'SANCTUARY AWAKENS',
      'KINETIC ASCENT',
      'OBSIDIAN VANGUARD',
    ];
    this._emit('announcement', {
      title: `WAVE ${waveNum} · ${titles[(waveNum - 1) % titles.length] || 'SOLAR CRUCIBLE'}`,
      subtitle:
        waveNum === 1
          ? 'LMB Prism Lance · RMB / E Solar Grapple · Shift Air-Dash · Q Parry'
          : 'Grapple enemies for Execute Shatters to refill Dash & Shield!',
    });
  }

  _spawnEnemy(type, x, y, z, scale = 1) {
    const specs = {
      drone: { hp: 55, radius: 1.25, speed: 6.8, score: 150, fireCd: 2.3 },
      strider: { hp: 85, radius: 1.15, speed: 10.5, score: 220, fireCd: 1.9 },
      aegis: { hp: 120, radius: 1.55, speed: 0, score: 280, fireCd: 2.0 },
      colossus: { hp: 780, radius: 3.4, speed: 4.0, score: 2200, fireCd: 1.7 },
    };
    const s = specs[type];
    const hp = Math.round(s.hp * scale);
    const enemy = {
      id: uid(),
      type,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      hp,
      maxHp: hp,
      radius: s.radius,
      speed: s.speed,
      score: s.score,
      fireTimer: 0.9 + Math.random() * 1.4,
      fireCd: s.fireCd,
      hitFlash: 0,
      phase: 1,
      angle: Math.random() * Math.PI * 2,
      crystals: [],
    };

    if (type === 'colossus') {
      for (let i = 0; i < 4; i++) {
        enemy.crystals.push({
          id: uid(),
          angle: (i / 4) * Math.PI * 2,
          orbitR: 6.4,
          hp: Math.round(90 * scale),
          maxHp: Math.round(90 * scale),
          alive: true,
          x: x + Math.cos((i / 4) * Math.PI * 2) * 6.4,
          y: y + 0.6,
          z: z + Math.sin((i / 4) * Math.PI * 2) * 6.4,
        });
      }
    }

    this.enemies.push(enemy);
    this._emit('enemy_spawn', { enemy });
    return enemy;
  }

  // ---- PLAYER ACTIONS ----

  pressJump() {
    if (this.state !== 'playing') return;
    this.player.jumpBuffer = 0.14;
    // Cancel active grapple with a soaring momentum boost!
    if (this.player.grapple) {
      this.player.grapple = null;
      this.player.vy = Math.max(this.player.vy, 11.5);
      this.player.jumpsLeft = Math.max(this.player.jumpsLeft, 1);
      this.sound?.playDash();
    }
  }

  triggerDash() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.dashCooldown > 0) return false;

    const fwdX = -Math.sin(p.yaw);
    const fwdZ = -Math.cos(p.yaw);
    const rightX = Math.cos(p.yaw);
    const rightZ = -Math.sin(p.yaw);

    let dx = 0;
    let dz = 0;
    if (this.input.forward) { dx += fwdX; dz += fwdZ; }
    if (this.input.backward) { dx -= fwdX; dz -= fwdZ; }
    if (this.input.right) { dx += rightX; dz += rightZ; }
    if (this.input.left) { dx -= rightX; dz -= rightZ; }
    const len = Math.hypot(dx, dz);
    if (len < 0.01) {
      dx = fwdX;
      dz = fwdZ;
    } else {
      dx /= len;
      dz /= len;
    }

    p.vx = dx * PLAYER_CFG.DASH_SPEED;
    p.vz = dz * PLAYER_CFG.DASH_SPEED;
    p.vy = Math.max(p.vy, 3.2);
    p.dashTimer = PLAYER_CFG.DASH_DURATION;
    p.dashCooldown = PLAYER_CFG.DASH_COOLDOWN;
    p.invulnTimer = Math.max(p.invulnTimer, 0.25);
    p.fovBoost = Math.max(p.fovBoost, 13);
    p.grapple = null;

    this.sound?.playDash();
    this._emit('dash', { x: p.x, y: p.y, z: p.z });
    return true;
  }

  fireWeapon() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.fireCooldown > 0) return false;

    p.fireCooldown = PLAYER_CFG.FIRE_COOLDOWN;
    p.recoil = 1.0;

    const eye = this.getEyePos();
    const dir = this.getForwardVector();
    const maxDist = 115;

    let bestT = maxDist;
    let hitEnemy = null;
    let hitCrystal = null;
    let isCrit = false;

    // 1. Check ray vs boss crystals & enemies (generous aim-assist sphere radius)
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;

      if (e.type === 'colossus') {
        for (const c of e.crystals) {
          if (!c.alive) continue;
          const t = this._raySphere(eye, dir, c.x, c.y, c.z, 1.45);
          if (t !== null && t < bestT) {
            bestT = t;
            hitEnemy = e;
            hitCrystal = c;
            isCrit = true;
          }
        }
      }

      const t = this._raySphere(eye, dir, e.x, e.y, e.z, e.radius + 0.35);
      if (t !== null && t < bestT) {
        bestT = t;
        hitEnemy = e;
        hitCrystal = null;
        // Upper core / headshot crit check
        const hitY = eye.y + dir.y * t;
        isCrit = hitY >= e.y + e.radius * 0.25 || !p.grounded;
      }
    }

    // 2. Check ray vs arena boxes so shots stop cleanly on marble walls
    for (const b of this.arena.boxes) {
      const t = this._rayBox(eye, dir, b);
      if (t !== null && t < bestT) {
        bestT = t;
        hitEnemy = null;
        hitCrystal = null;
      }
    }

    const endX = eye.x + dir.x * bestT;
    const endY = eye.y + dir.y * bestT;
    const endZ = eye.z + dir.z * bestT;

    this.sound?.playShot();
    this._emit('tracer', {
      sx: eye.x + Math.cos(p.yaw) * 0.32,
      sy: eye.y - 0.16,
      sz: eye.z - Math.sin(p.yaw) * 0.32,
      ex: endX,
      ey: endY,
      ez: endZ,
      crit: isCrit && !!hitEnemy,
    });

    if (hitEnemy) {
      const baseDmg = isCrit ? 46 : 30;
      p.hitMarker = 0.22;
      p.hitMarkerCrit = isCrit;
      this.sound?.playHit(isCrit);

      if (hitCrystal) {
        hitCrystal.hp -= baseDmg;
        this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xfde047, count: 16 });
        if (hitCrystal.hp <= 0) {
          hitCrystal.alive = false;
          this._damageEnemy(hitEnemy, 150, true, 'CRYSTAL SHATTER!');
        }
      } else {
        const bonusTag = p.wallRunSide !== 0 ? 'WALL-RUN SHOT' : !p.grounded ? 'AERIAL CRIT' : null;
        this._damageEnemy(hitEnemy, baseDmg, isCrit, bonusTag);
        this._emit('impact', { x: endX, y: endY, z: endZ, color: isCrit ? 0xf5c451 : 0xe84a27, count: 12 });
      }
    } else {
      this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xf3ece1, count: 6 });
    }

    return true;
  }

  triggerGrapple() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.grapple) {
      p.grapple = null;
      return true;
    }
    if (p.grappleCooldown > 0) return false;

    const target = this._findBestGrappleTarget();
    if (!target) return false;

    p.grapple = {
      targetKind: target.kind,
      targetId: target.id,
      x: target.x,
      y: target.y,
      z: target.z,
      timer: 0,
    };
    p.grappleCooldown = PLAYER_CFG.GRAPPLE_COOLDOWN;
    p.grounded = false;
    p.jumpsLeft = 2;
    p.fovBoost = Math.max(p.fovBoost, 16);

    this.sound?.playGrapple();
    this._emit('grapple_start', { target });
    return true;
  }

  triggerParry() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.parryCooldown > 0) return false;

    p.parryCooldown = PLAYER_CFG.PARRY_COOLDOWN;
    const eye = this.getEyePos();
    let deflected = 0;

    for (const proj of this.projectiles) {
      if (proj.friendly) continue;
      const d = Math.hypot(proj.x - eye.x, proj.y - eye.y, proj.z - eye.z);
      if (d <= PLAYER_CFG.PARRY_RADIUS) {
        deflected++;
        this.parries++;
        proj.friendly = true;
        proj.life = 4.0;
        proj.damage = 95;
        // Reflect straight along player crosshair (or toward nearest enemy)
        const dir = this.getForwardVector();
        const spd = 48;
        proj.vx = dir.x * spd;
        proj.vy = dir.y * spd;
        proj.vz = dir.z * spd;
      }
    }

    // Also blast back close enemies
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z);
      if (d <= 6.5) {
        const inv = 1 / Math.max(0.1, d);
        e.vx += (e.x - p.x) * inv * 18;
        e.vz += (e.z - p.z) * inv * 18;
        this._damageEnemy(e, 32, false, 'SHOCKWAVE');
      }
    }

    if (deflected > 0) {
      this._addStyle(280 * deflected, `SOLAR PARRY ×${deflected}`);
      this.hitStop = 0.045;
    }

    this.sound?.playParry(deflected);
    this._emit('parry', { x: eye.x, y: eye.y, z: eye.z, deflected });
    return true;
  }

  _findBestGrappleTarget() {
    const eye = this.getEyePos();
    const fwd = this.getForwardVector();
    let best = null;
    let bestScore = -Infinity;

    const consider = (kind, id, x, y, z) => {
      const dx = x - eye.x;
      const dy = y - eye.y;
      const dz = z - eye.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 3.2 || dist > PLAYER_CFG.GRAPPLE_RANGE) return;
      const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
      if (dot < 0.72) return; // Generous ~44° targeting cone
      const score = dot * 100 - dist * 0.45 + (kind === 'enemy' ? 6 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { kind, id, x, y, z, dist };
      }
    };

    for (const r of this.arena.skyRings) {
      consider('ring', r.id, r.x, r.y, r.z);
    }
    for (const e of this.enemies) {
      if (e.hp > 0) {
        consider('enemy', e.id, e.x, e.y, e.z);
      }
    }
    return best;
  }

  // ---- MAIN SIMULATION STEP ----

  step(rawDt) {
    const dt = clamp(rawDt, 0, 0.05);
    if (this.state !== 'playing') {
      if (this.state === 'title') this.time += dt;
      return;
    }

    this.time += dt;
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return;
    }

    // Style & combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.stylePoints = Math.max(0, this.stylePoints - dt * (95 + this.stylePoints * 0.06));

    this._updatePlayer(dt);
    this._updateEnemies(dt);
    this._updateProjectiles(dt);

    if (this.input.firing) {
      this.fireWeapon();
    }

    this.grappleHighlight = this._findBestGrappleTarget();

    // Check wave completion
    if (this.enemies.length === 0) {
      this.waveClearTimer += dt;
      if (this.waveClearTimer >= 1.5) {
        this.score += this.wave * 500;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
        this.player.shield = this.player.maxShield;
        if (this.score > this.bestScore) this.bestScore = this.score;
        this._spawnWave(this.wave + 1);
      }
    }
  }

  _updatePlayer(dt) {
    const p = this.player;
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    p.grappleCooldown = Math.max(0, p.grappleCooldown - dt);
    p.parryCooldown = Math.max(0, p.parryCooldown - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.recoil = Math.max(0, p.recoil - dt * 6.5);
    p.hitMarker = Math.max(0, p.hitMarker - dt);
    p.damageFlash = Math.max(0, p.damageFlash - dt * 2.8);
    p.fovBoost *= Math.exp(-6.5 * dt);

    // Shield passive regeneration after 3.2s out of danger
    if (p.shieldRegenDelay > 0) {
      p.shieldRegenDelay -= dt;
    } else if (p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + 16 * dt);
    }

    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

    // 1. Active Solar Grapple pull
    if (p.grapple) {
      p.grapple.timer += dt;
      // Track live enemy position if grappling an enemy
      let enemyTarget = null;
      if (p.grapple.targetKind === 'enemy') {
        enemyTarget = this.enemies.find((e) => e.id === p.grapple.targetId && e.hp > 0);
        if (!enemyTarget) {
          p.grapple = null;
        } else {
          p.grapple.x = enemyTarget.x;
          p.grapple.y = enemyTarget.y;
          p.grapple.z = enemyTarget.z;
        }
      }

      if (p.grapple) {
        const dx = p.grapple.x - p.x;
        const dy = p.grapple.y - (p.y + 1.0);
        const dz = p.grapple.z - p.z;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < (p.grapple.targetKind === 'enemy' ? 2.8 : 3.2) || p.grapple.timer > 1.35) {
          if (enemyTarget) {
            // EXECUTE SHATTER!
            this._damageEnemy(enemyTarget, 125, true, 'GRAPPLE EXECUTE!');
            this.executes++;
            p.dashCooldown = 0;
            p.shield = Math.min(p.maxShield, p.shield + 20);
            p.invulnTimer = Math.max(p.invulnTimer, 0.35);
            p.vy = 11.5;
            p.vx *= 0.45;
            p.vz *= 0.45;
            this.hitStop = 0.055;
            this.sound?.playExecute();
            this._emit('impact', { x: enemyTarget.x, y: enemyTarget.y, z: enemyTarget.z, color: 0xfde047, count: 28 });
          } else {
            // Sky-Ring slingshot launch!
            p.vy = Math.max(p.vy, 12.8);
            p.jumpsLeft = 2;
            this._addStyle(110, 'SKY SLINGSHOT');
          }
          p.grapple = null;
        } else {
          const inv = 1 / dist;
          p.vx = dx * inv * PLAYER_CFG.GRAPPLE_SPEED;
          p.vy = dy * inv * PLAYER_CFG.GRAPPLE_SPEED + 2.5;
          p.vz = dz * inv * PLAYER_CFG.GRAPPLE_SPEED;
        }
      }
    } else if (p.dashTimer > 0) {
      p.dashTimer -= dt;
    } else {
      // 2. Standard Kinetic FPS movement + air strafing
      const fwdX = -Math.sin(p.yaw);
      const fwdZ = -Math.cos(p.yaw);
      const rightX = Math.cos(p.yaw);
      const rightZ = -Math.sin(p.yaw);

      let wishX = 0;
      let wishZ = 0;
      if (this.input.forward) { wishX += fwdX; wishZ += fwdZ; }
      if (this.input.backward) { wishX -= fwdX; wishZ -= fwdZ; }
      if (this.input.right) { wishX += rightX; wishZ += rightZ; }
      if (this.input.left) { wishX -= rightX; wishZ -= rightZ; }

      const wLen = Math.hypot(wishX, wishZ);
      if (wLen > 0.001) {
        wishX /= wLen;
        wishZ /= wLen;
      }

      if (p.grounded) {
        const targetVx = wishX * PLAYER_CFG.GROUND_SPEED;
        const targetVz = wishZ * PLAYER_CFG.GROUND_SPEED;
        const blend = Math.min(1, PLAYER_CFG.GROUND_ACCEL * dt * 0.16);
        p.vx += (targetVx - p.vx) * blend;
        p.vz += (targetVz - p.vz) * blend;
      } else if (p.wallRunSide !== 0) {
        // Wall-run boost along the wall tangent
        p.vx += wishX * 26 * dt;
        p.vz += wishZ * 26 * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        if (hSpd > PLAYER_CFG.WALL_RUN_SPEED) {
          p.vx = (p.vx / hSpd) * PLAYER_CFG.WALL_RUN_SPEED;
          p.vz = (p.vz / hSpd) * PLAYER_CFG.WALL_RUN_SPEED;
        }
      } else {
        // Crisp Quake/Titanfall air control that preserves grapple/dash momentum
        p.vx += wishX * PLAYER_CFG.AIR_ACCEL * dt;
        p.vz += wishZ * PLAYER_CFG.AIR_ACCEL * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        if (hSpd > 34) {
          p.vx = (p.vx / hSpd) * 34;
          p.vz = (p.vz / hSpd) * 34;
        }
      }

      // Gravity (reduced dramatically while wall-running)
      const grav = p.wallRunSide !== 0 ? PLAYER_CFG.WALL_RUN_GRAVITY : PLAYER_CFG.GRAVITY;
      p.vy -= grav * dt;
      if (p.wallRunSide !== 0 && p.vy < -2.2) p.vy = -2.2;
    }

    // 3. Jump Execution (Coyote + Double Jump + Wall-Jump)
    if (p.jumpBuffer > 0) {
      if (p.wallRunSide !== 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED * 1.08;
        p.vx += p.wallRunNormalX * 13.5;
        p.vz += p.wallRunNormalZ * 13.5;
        p.wallRunSide = 0;
        p.jumpsLeft = 1;
        p.jumpBuffer = 0;
        p.fovBoost = Math.max(p.fovBoost, 8);
        this.sound?.playDash();
        this._addStyle(80, 'WALL LEAP');
      } else if (p.grounded || p.coyoteTimer > 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpsLeft = 1;
        p.jumpBuffer = 0;
      } else if (p.jumpsLeft > 0) {
        p.vy = PLAYER_CFG.DOUBLE_JUMP_SPEED;
        p.jumpsLeft--;
        p.jumpBuffer = 0;
        this.sound?.playDash();
      }
    }

    // 4. Integrate & Resolve 3D AABB Collisions
    this._moveAndCollidePlayer(dt);

    // 5. Check Wind Jump Pads
    for (const pad of this.arena.jumpPads) {
      const dx = p.x - pad.x;
      const dz = p.z - pad.z;
      if (Math.hypot(dx, dz) <= pad.radius && Math.abs(p.y - pad.y) <= 1.8) {
        p.vy = pad.boostY;
        const toCenter = Math.hypot(p.x, p.z) || 1;
        p.vx += (-p.x / toCenter) * pad.boostHoriz;
        p.vz += (-p.z / toCenter) * pad.boostHoriz;
        p.grounded = false;
        p.jumpsLeft = 2;
        p.fovBoost = Math.max(p.fovBoost, 14);
        this.sound?.playJumpPad();
        this._addStyle(75, 'THERMAL LAUNCH');
      }
    }

    // 6. Safety Void Rescue (Falling into the golden cloud sea updrafts you back up!)
    if (p.y < -18) {
      p.x = 0;
      p.y = 14;
      p.z = 12;
      p.vx = 0;
      p.vy = 6;
      p.vz = 0;
      p.grapple = null;
      this.sound?.playJumpPad();
    }

    // Smooth camera roll for strafing & wall-running
    const strafeRoll = (this.input.left ? 1 : 0) * 0.025 + (this.input.right ? -1 : 0) * 0.025;
    const targetRoll = p.wallRunSide !== 0 ? p.wallRunSide * 0.22 : strafeRoll;
    p.cameraRoll += (targetRoll - p.cameraRoll) * Math.min(1, 11 * dt);

    const speed = Math.hypot(p.vx, p.vy, p.vz);
    if (speed > this.maxSpeedReached) this.maxSpeedReached = speed;
    this.sound?.updateWind(speed);
  }

  _moveAndCollidePlayer(dt) {
    const p = this.player;
    const r = PLAYER_CFG.RADIUS;
    const h = PLAYER_CFG.HEIGHT;

    p.grounded = false;
    p.wallRunSide = 0;

    // Move X
    p.x += p.vx * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
      // Allow smooth step-up on stairs (<= 0.95m)
      const boxTop = b.y + b.h * 0.5;
      if (boxTop - p.y <= 0.95 && boxTop - p.y > 0) {
        p.y = boxTop;
        p.grounded = true;
        continue;
      }
      if (p.vx > 0) p.x = b.x - b.w * 0.5 - r;
      else if (p.vx < 0) p.x = b.x + b.w * 0.5 + r;
      p.vx = 0;
    }

    // Move Z
    p.z += p.vz * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
      const boxTop = b.y + b.h * 0.5;
      if (boxTop - p.y <= 0.95 && boxTop - p.y > 0) {
        p.y = boxTop;
        p.grounded = true;
        continue;
      }
      if (p.vz > 0) p.z = b.z - b.d * 0.5 - r;
      else if (p.vz < 0) p.z = b.z + b.d * 0.5 + r;
      p.vz = 0;
    }

    // Move Y
    p.y += p.vy * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
      if (p.vy <= 0) {
        p.y = b.y + b.h * 0.5;
        p.vy = 0;
        p.grounded = true;
        p.coyoteTimer = 0.14;
        p.jumpsLeft = 2;
      } else {
        p.y = b.y - b.h * 0.5 - h;
        p.vy = 0;
      }
    }

    // Detect Wall-Running on kinetic monoliths when airborne & moving
    if (!p.grounded && !p.grapple && Math.hypot(p.vx, p.vz) > 4.5) {
      const rightX = Math.cos(p.yaw);
      const rightZ = -Math.sin(p.yaw);
      for (const b of this.arena.boxes) {
        if (!b.wallRun) continue;
        // Check horizontal proximity to wall-run monolith
        const minX = b.x - b.w * 0.5 - r - 0.45;
        const maxX = b.x + b.w * 0.5 + r + 0.45;
        const minY = b.y - b.h * 0.5;
        const maxY = b.y + b.h * 0.5;
        const minZ = b.z - b.d * 0.5 - r - 0.45;
        const maxZ = b.z + b.d * 0.5 + r + 0.45;
        if (p.x >= minX && p.x <= maxX && p.y + 0.8 >= minY && p.y <= maxY && p.z >= minZ && p.z <= maxZ) {
          const nx = p.x < b.x ? -1 : 1;
          const dotRight = nx * rightX;
          p.wallRunSide = dotRight > 0 ? -1 : 1;
          p.wallRunNormalX = nx;
          p.wallRunNormalZ = 0;
          p.jumpsLeft = 1;
          break;
        }
      }
    }
  }

  _overlapsBox(px, py, pz, r, h, b) {
    return (
      px + r > b.x - b.w * 0.5 &&
      px - r < b.x + b.w * 0.5 &&
      py + h > b.y - b.h * 0.5 &&
      py < b.y + b.h * 0.5 &&
      pz + r > b.z - b.d * 0.5 &&
      pz - r < b.z + b.d * 0.5
    );
  }

  // ---- ENEMIES & PROJECTILES ----

  _updateEnemies(dt) {
    const p = this.player;
    const eye = this.getEyePos();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
      e.angle += dt * (e.type === 'colossus' ? 0.85 : 1.9);

      const dx = eye.x - e.x;
      const dy = eye.y - e.y;
      const dz = eye.z - e.z;
      const dist = Math.hypot(dx, dy, dz) || 1;

      if (e.type === 'drone') {
        const targetDist = 17;
        const radial = dist > targetDist ? 1 : -0.45;
        const strafe = Math.sin(this.time * 1.4 + e.id) * 0.85;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const desiredY = Math.max(4.5, p.y + 4.2 + Math.sin(this.time * 2 + e.id) * 1.6);
        e.vx += (tx * e.speed - e.vx) * Math.min(1, 3.5 * dt);
        e.vz += (tz * e.speed - e.vz) * Math.min(1, 3.5 * dt);
        e.vy += ((desiredY - e.y) * 2.2 - e.vy) * Math.min(1, 4 * dt);
      } else if (e.type === 'strider') {
        const hDist = Math.hypot(dx, dz) || 1;
        const mult = hDist > 7 ? 1 : 0.2;
        e.vx += ((dx / hDist) * e.speed * mult - e.vx) * Math.min(1, 4.5 * dt);
        e.vz += ((dz / hDist) * e.speed * mult - e.vz) * Math.min(1, 4.5 * dt);
        const desiredY = Math.max(1.5, p.y + 1.2 + Math.abs(Math.sin(this.time * 3.5 + e.id)) * 1.8);
        e.vy += ((desiredY - e.y) * 3.5 - e.vy) * Math.min(1, 5 * dt);
      } else if (e.type === 'colossus') {
        if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
          e.phase = 2;
          this._emit('announcement', {
            title: 'SOLAR COLOSSUS · OVERDRIVE',
            subtitle: 'Watch for radial plasma rings — Parry with Q!',
          });
        }
        const orbitX = Math.cos(this.time * 0.35) * 14;
        const orbitZ = Math.sin(this.time * 0.35) * 14;
        const orbitY = 14.5 + Math.sin(this.time * 0.9) * 2.4;
        e.vx += ((orbitX - e.x) * 1.2 - e.vx) * Math.min(1, 2.5 * dt);
        e.vy += ((orbitY - e.y) * 1.6 - e.vy) * Math.min(1, 2.5 * dt);
        e.vz += ((orbitZ - e.z) * 1.2 - e.vz) * Math.min(1, 2.5 * dt);

        // Update orbiting weakpoint crystals
        for (const c of e.crystals) {
          c.angle += dt * (e.phase === 2 ? 1.55 : 0.9);
          c.x = e.x + Math.cos(c.angle) * c.orbitR;
          c.y = e.y + Math.sin(c.angle * 2) * 1.4;
          c.z = e.z + Math.sin(c.angle) * c.orbitR;
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;

      // Enemy firing
      e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        e.fireTimer = e.fireCd * (e.phase === 2 ? 0.72 : 1.0);
        this._fireEnemyProjectile(e, eye);
      }
    }
  }

  _fireEnemyProjectile(e, eye) {
    const dx = eye.x - e.x;
    const dy = eye.y - e.y;
    const dz = eye.z - e.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const spd = e.type === 'aegis' ? 24 : e.type === 'colossus' ? 21 : 18.5;

    if (e.type === 'colossus') {
      const fan = e.phase === 2 ? 5 : 3;
      const baseYaw = Math.atan2(dx, dz);
      for (let k = 0; k < fan; k++) {
        const offset = (k - (fan - 1) / 2) * 0.2;
        const a = baseYaw + offset;
        this.projectiles.push({
          id: uid(),
          x: e.x,
          y: e.y,
          z: e.z,
          vx: Math.sin(a) * spd,
          vy: (dy / len) * spd,
          vz: Math.cos(a) * spd,
          radius: 0.65,
          friendly: false,
          damage: 16,
          life: 5.5,
        });
      }
      return;
    }

    this.projectiles.push({
      id: uid(),
      x: e.x,
      y: e.y,
      z: e.z,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      vz: (dz / len) * spd,
      radius: 0.5,
      friendly: false,
      damage: 14,
      life: 5.0,
    });
  }

  _updateProjectiles(dt) {
    const eye = this.getEyePos();
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.friendly) {
        let hit = false;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(proj.x - e.x, proj.y - e.y, proj.z - e.z) <= e.radius + proj.radius + 0.7) {
            this._damageEnemy(e, proj.damage, true, 'PARRY RETURN!');
            this._emit('impact', { x: proj.x, y: proj.y, z: proj.z, color: 0xfde047, count: 18 });
            hit = true;
            break;
          }
        }
        if (hit) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Player hit check
        if (p.invulnTimer <= 0 && Math.hypot(proj.x - eye.x, proj.y - (p.y + 1.0), proj.z - eye.z) <= 1.25) {
          this._damagePlayer(proj.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  _damageEnemy(e, amount, crit = false, styleTag = null) {
    if (e.hp <= 0) return;
    e.hp -= amount;
    e.hitFlash = 1.0;

    if (e.hp <= 0) {
      e.hp = 0;
      this.kills++;
      this.combo++;
      this.comboTimer = 5.0;
      const mult = 1 + Math.min(5, this.combo * 0.25);
      this.score += Math.round(e.score * mult);
      if (this.score > this.bestScore) this.bestScore = this.score;

      this._addStyle(crit ? 260 : 170, styleTag || (crit ? 'CRITICAL SHATTER' : 'ELIMINATED'));
      this.sound?.playKill(this.combo);
      this._emit('enemy_kill', { enemy: e, crit, styleTag });
    } else if (styleTag) {
      this._addStyle(120, styleTag);
    }
  }

  _damagePlayer(amount) {
    const p = this.player;
    if (p.invulnTimer > 0) return;
    p.invulnTimer = 0.45;
    p.shieldRegenDelay = 3.2;
    p.damageFlash = 1.0;

    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, amount);
      p.shield -= absorbed;
      const rem = amount - absorbed;
      if (rem > 0) p.hp = Math.max(0, p.hp - rem);
    } else {
      p.hp = Math.max(0, p.hp - amount);
    }

    this.stylePoints = Math.max(0, this.stylePoints - 350);
    this.sound?.playPlayerDamage();

    if (p.hp <= 0) {
      this.state = 'gameover';
      this._emit('state', { state: this.state });
    }
  }

  _addStyle(pts, label) {
    this.stylePoints += pts;
    if (label) {
      this._emit('style', { label, pts });
    }
  }

  // ---- RAY INTERSECTION HELPERS ----

  _raySphere(orig, dir, cx, cy, cz, r) {
    const ocx = orig.x - cx;
    const ocy = orig.y - cy;
    const ocz = orig.z - cz;
    const b = ocx * dir.x + ocy * dir.y + ocz * dir.z;
    const c = ocx * ocx + ocy * ocy + ocz * ocz - r * r;
    const disc = b * b - c;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    return t > 0 ? t : null;
  }

  _rayBox(orig, dir, b) {
    const minX = b.x - b.w * 0.5;
    const maxX = b.x + b.w * 0.5;
    const minY = b.y - b.h * 0.5;
    const maxY = b.y + b.h * 0.5;
    const minZ = b.z - b.d * 0.5;
    const maxZ = b.z + b.d * 0.5;

    let tmin = -Infinity;
    let tmax = Infinity;

    const axes = [
      [orig.x, dir.x, minX, maxX],
      [orig.y, dir.y, minY, maxY],
      [orig.z, dir.z, minZ, maxZ],
    ];
    for (const [o, d, lo, hi] of axes) {
      if (Math.abs(d) < 1e-8) {
        if (o < lo || o > hi) return null;
      } else {
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin > 0 ? tmin : null;
  }
}
