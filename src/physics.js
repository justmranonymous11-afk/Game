import { buildArenaData } from './arenaData.js';

export const PLAYER_CFG = {
  RADIUS: 0.65,
  HEIGHT: 1.9,
  EYE_HEIGHT: 1.62,
  GROUND_SPEED: 14.0,
  GROUND_ACCEL: 82,
  AIR_ACCEL: 26,
  GRAVITY: 29.5,
  JUMP_SPEED: 12.4,
  DOUBLE_JUMP_SPEED: 11.8,
  DASH_SPEED: 30,
  DASH_DURATION: 0.19,
  DASH_COOLDOWN: 1.1,
  WALL_RUN_GRAVITY: 5.2,
  WALL_RUN_SPEED: 19.2,
  GRAPPLE_RANGE: 56,
  GRAPPLE_SPEED: 40,
  GRAPPLE_COOLDOWN: 1.05,
  FIRE_COOLDOWN: 0.185,
  PARRY_COOLDOWN: 1.35,
  PARRY_RADIUS: 9.0,
  MAX_HP: 100,
  MAX_SHIELD: 50,
};

export const STYLE_RANKS = [
  { min: 0, label: 'D', title: 'DRIFTING', color: '#94A3B8', boost: 1.0 },
  { min: 350, label: 'C', title: 'CRESTING', color: '#E2E8F0', boost: 1.05 },
  { min: 850, label: 'B', title: 'BLAZING', color: '#F5C451', boost: 1.1 },
  { min: 1500, label: 'A', title: 'ASCENDANT', color: '#F59E0B', boost: 1.16 },
  { min: 2400, label: 'S', title: 'SOLAR', color: '#F97316', boost: 1.24 },
  { min: 3600, label: 'SS', title: 'SUPERNOVA', color: '#EF4444', boost: 1.32 },
  { min: 5200, label: 'SOLARIS', title: 'APEX SUN', color: '#FDE047', boost: 1.45 },
];

export const RELIC_CATALOG = [
  {
    id: 'twin_prism',
    name: 'Twin-Prism Barrel',
    tag: 'WEAPON',
    icon: '⫘',
    desc: 'Prism Lance fires a second tight-spread solar bolt (+45% total damage).',
    maxStacks: 2,
  },
  {
    id: 'shatter_rounds',
    name: 'Shatter Rounds',
    tag: 'EXPLOSIVE',
    icon: '✺',
    desc: 'Critical hits and kills detonate in a 3D solar blast damaging nearby hostiles.',
    maxStacks: 3,
  },
  {
    id: 'valkyrie_thrusters',
    name: 'Valkyrie Thrusters',
    tag: 'MOBILITY',
    icon: '⇶',
    desc: '+1 Extra mid-air jump, +16% speed, and 25% faster Air-Dash recharge.',
    maxStacks: 2,
  },
  {
    id: 'solar_leech',
    name: 'Solar Leech',
    tag: 'GRAPPLE',
    icon: '✦',
    desc: 'Grapple Executes restore +25 HP & +30 Shield and instantly reset Grapple cooldown.',
    maxStacks: 2,
  },
  {
    id: 'supernova_parry',
    name: 'Supernova Parry',
    tag: 'PARRY',
    icon: '✧',
    desc: '+45% Shockwave Parry radius and reflected plasma splits into 3 homing solar lances.',
    maxStacks: 2,
  },
  {
    id: 'overclock_cap',
    name: 'Overclocked Core',
    tag: 'WEAPON',
    icon: '⚡',
    desc: '+25% Prism Lance fire rate and +22% base & critical damage.',
    maxStacks: 3,
  },
  {
    id: 'aegis_plating',
    name: 'Aegis Plating',
    tag: 'SURVIVAL',
    icon: '◈',
    desc: '+35 Max Shield, +25 Max Vitality (heals immediately), and faster Shield recharge.',
    maxStacks: 2,
  },
  {
    id: 'sky_chain',
    name: 'Sky-Chain Anchor',
    tag: 'GRAPPLE',
    icon: '◎',
    desc: '+35% Grapple range. Slingshotting a Sky-Ring grants 3s of guaranteed Solar Crits.',
    maxStacks: 2,
  },
  {
    id: 'kinetic_surge',
    name: 'Kinetic Surge',
    tag: 'VELOCITY',
    icon: '➤',
    desc: 'Moving above 15 m/s amplifies all weapon and execute damage by up to +45%.',
    maxStacks: 2,
  },
  {
    id: 'tempest_dash',
    name: 'Tempest Dash',
    tag: 'MOBILITY',
    icon: '≋',
    desc: 'Air-Dashing releases a golden shockwave that blasts nearby foes and deflects orbs.',
    maxStacks: 2,
  },
  {
    id: 'starfall_core',
    name: 'Starfall Capacitor',
    tag: 'WEAPON',
    icon: '★',
    desc: 'Every 4th Prism Lance shot unleashes a piercing Solar Rail-Beam for 2.4× damage.',
    maxStacks: 2,
  },
  {
    id: 'solaris_flow',
    name: 'Solaris Flow',
    tag: 'STYLE',
    icon: '∞',
    desc: 'Style Rank decays 40% slower and grants bonus damage & fire rate at high ranks.',
    maxStacks: 2,
  },
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
    this.state = initialState; // 'title' | 'playing' | 'paused' | 'draft' | 'gameover'
    this.time = 0;
    this.hitStop = 0;

    this.player = {
      x: 0,
      y: 2.0,
      z: 14,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: 0.04,
      grounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      jumpsLeft: 2,
      wallRunSide: 0,
      wallRunNormalX: 0,
      wallRunNormalZ: 0,
      dashTimer: 0,
      dashCooldown: 0,
      fireCooldown: 0,
      grappleCooldown: 0,
      parryCooldown: 0,
      invulnTimer: 0,
      shieldRegenDelay: 0,
      skyCritTimer: 0,
      shotsFired: 0,
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
      grapple: null,
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
    this.relics = {};
    this.draftChoices = [];
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
    this.grappleHighlight = null;

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

  relicCount(id) {
    return this.relics[id] || 0;
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

  getDamageMultiplier() {
    let mult = 1 + 0.22 * this.relicCount('overclock_cap');
    const ks = this.relicCount('kinetic_surge');
    if (ks > 0) {
      const spd = Math.hypot(this.player.vx, this.player.vy, this.player.vz);
      if (spd > 15) {
        mult *= 1 + Math.min(0.45 * ks, ((spd - 15) / 20) * 0.45 * ks);
      }
    }
    if (this.relicCount('solaris_flow') > 0) {
      mult *= this.getStyleRank().boost;
    }
    return mult;
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

  // ---- RELIC DRAFTING ----

  _openDraft() {
    const available = RELIC_CATALOG.filter((r) => this.relicCount(r.id) < r.maxStacks);
    if (available.length === 0) {
      this._spawnWave(this.wave + 1);
      return;
    }
    const pool = available.slice();
    const picks = [];
    while (picks.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    this.draftChoices = picks;
    this.state = 'draft';
    this.input.firing = false;
    this._emit('state', { state: this.state });
  }

  selectRelic(relicId) {
    if (this.state !== 'draft') return false;
    const found = this.draftChoices.find((r) => r.id === relicId);
    if (!found) return false;

    this.relics[relicId] = (this.relics[relicId] || 0) + 1;
    if (relicId === 'aegis_plating') {
      this.player.maxShield += 35;
      this.player.shield = this.player.maxShield;
      this.player.maxHp += 25;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
    }

    this.draftChoices = [];
    this.state = 'playing';
    this.sound?.playJumpPad();
    this._emit('state', { state: this.state });
    this._spawnWave(this.wave + 1);
    return true;
  }

  // ---- WAVE DIRECTOR (6 ENEMY TYPES + BOSS) ----

  _spawnWave(waveNum) {
    this.wave = waveNum;
    this.waveClearTimer = 0;
    this.projectiles = [];

    const isBoss = waveNum === 4 || (waveNum > 4 && waveNum % 4 === 0);
    const scale = 1 + (waveNum - 1) * 0.14;

    if (isBoss) {
      this._spawnEnemy('colossus', 0, 14.5, -16, scale);
      this._spawnEnemy('weaver', -24, 11.5, -24, scale);
      this._spawnEnemy('weaver', 24, 11.5, -24, scale);
      this._spawnEnemy('wisp', -10, 8, -14, scale);
      this._spawnEnemy('wisp', 10, 8, -14, scale);
      this._emit('announcement', {
        title: `WAVE ${waveNum} · THE SOLAR COLOSSUS`,
        subtitle: 'Grapple the Sky-Rings and shatter its orbiting Solar Crystals!',
      });
      return;
    }

    const droneCount = 2 + Math.min(5, waveNum);
    const wispCount = waveNum >= 1 ? 2 + Math.min(4, Math.floor(waveNum * 0.8)) : 0;
    const striderCount = waveNum >= 2 ? 1 + Math.min(3, Math.floor(waveNum * 0.6)) : 0;
    const weaverCount = waveNum >= 2 ? Math.min(3, Math.floor((waveNum + 1) * 0.5)) : 0;
    const vanguardCount = waveNum >= 3 ? Math.min(3, Math.floor((waveNum - 1) * 0.6)) : 0;
    const turretCount = waveNum >= 3 ? Math.min(4, waveNum - 1) : 0;

    for (let i = 0; i < droneCount; i++) {
      const a = (i / droneCount) * Math.PI * 2 + waveNum * 0.4;
      const r = 19 + (i % 2) * 14;
      this._spawnEnemy('drone', Math.cos(a) * r, 5.5 + (i % 3) * 3.0, Math.sin(a) * r, scale);
    }

    for (let i = 0; i < wispCount; i++) {
      const a = (i / Math.max(1, wispCount)) * Math.PI * 2 + 0.9;
      this._spawnEnemy('wisp', Math.cos(a) * 16, 8.5 + (i % 2) * 3.5, Math.sin(a) * 16, scale);
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

    for (let i = 0; i < vanguardCount; i++) {
      const c = islandCoords[(i + 1) % islandCoords.length];
      this._spawnEnemy('vanguard', c[0], c[1] + 0.6, c[2], scale);
    }

    const balconyCoords = [
      [-27, 9.2, -27],
      [27, 9.2, -27],
      [-27, 9.2, 27],
      [27, 9.2, 27],
    ];
    for (let i = 0; i < turretCount; i++) {
      const c = balconyCoords[i % balconyCoords.length];
      this._spawnEnemy('aegis', c[0], c[1], c[2], scale);
    }

    for (let i = 0; i < weaverCount; i++) {
      const c = balconyCoords[(i + 2) % balconyCoords.length];
      this._spawnEnemy('weaver', c[0] * 0.88, c[1] + 3.2, c[2] * 0.88, scale);
    }

    const titles = [
      'SANCTUARY AWAKENS',
      'EMERALD SNIPERS',
      'VANGUARD SIEGE',
      'SOLAR COLOSSUS',
      'GOLDEN TEMPEST',
    ];
    this._emit('announcement', {
      title: `WAVE ${waveNum} · ${titles[(waveNum - 1) % titles.length]}`,
      subtitle:
        waveNum === 1
          ? 'LMB Prism Lance · RMB / E Solar Grapple · Shift Air-Dash · Q Parry'
          : waveNum === 2
            ? 'Watch for Emerald Solar Weaver sniper lasers — Dash or Parry!'
            : 'Clear the wave to draft a new Kintsugi Relic!',
    });
  }

  _spawnEnemy(type, x, y, z, scale = 1) {
    const specs = {
      drone: { hp: 55, radius: 1.25, speed: 7.0, score: 150, fireCd: 2.3 },
      wisp: { hp: 32, radius: 0.95, speed: 12.2, score: 120, fireCd: 2.1 },
      strider: { hp: 85, radius: 1.2, speed: 10.8, score: 220, fireCd: 1.9 },
      weaver: { hp: 72, radius: 1.35, speed: 5.5, score: 290, fireCd: 3.1 },
      vanguard: { hp: 165, radius: 1.85, speed: 8.6, score: 360, fireCd: 2.6 },
      aegis: { hp: 125, radius: 1.6, speed: 0, score: 280, fireCd: 2.0 },
      colossus: { hp: 820, radius: 3.5, speed: 4.2, score: 2400, fireCd: 1.75 },
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
      fireTimer: 1.0 + Math.random() * 1.4,
      fireCd: s.fireCd,
      telegraphTimer: 0,
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
          orbitR: 6.5,
          hp: Math.round(95 * scale),
          maxHp: Math.round(95 * scale),
          alive: true,
          x: x + Math.cos((i / 4) * Math.PI * 2) * 6.5,
          y: y + 0.6,
          z: z + Math.sin((i / 4) * Math.PI * 2) * 6.5,
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
    if (this.player.grapple) {
      this.player.grapple = null;
      this.player.vy = Math.max(this.player.vy, 11.8);
      this.player.jumpsLeft = Math.max(this.player.jumpsLeft, 1 + this.relicCount('valkyrie_thrusters'));
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

    const valk = this.relicCount('valkyrie_thrusters');
    p.vx = dx * PLAYER_CFG.DASH_SPEED * (1 + 0.12 * valk);
    p.vz = dz * PLAYER_CFG.DASH_SPEED * (1 + 0.12 * valk);
    p.vy = Math.max(p.vy, 3.4);
    p.dashTimer = PLAYER_CFG.DASH_DURATION;
    p.dashCooldown = PLAYER_CFG.DASH_COOLDOWN * Math.max(0.5, 1 - 0.25 * valk);
    p.invulnTimer = Math.max(p.invulnTimer, 0.28);
    p.fovBoost = Math.max(p.fovBoost, 13);
    p.grapple = null;

    // Tempest Dash relic shockwave!
    const tempest = this.relicCount('tempest_dash');
    if (tempest > 0) {
      const eye = this.getEyePos();
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z) <= 7.5 + tempest * 2) {
          this._damageEnemy(e, 34 * tempest * this.getDamageMultiplier(), false, 'TEMPEST DASH');
        }
      }
      for (const proj of this.projectiles) {
        if (!proj.friendly && Math.hypot(proj.x - eye.x, proj.y - eye.y, proj.z - eye.z) <= 7.5) {
          proj.friendly = true;
          proj.vx = -proj.vx * 1.6;
          proj.vy = -proj.vy * 1.6;
          proj.vz = -proj.vz * 1.6;
        }
      }
      this._emit('impact', { x: p.x, y: p.y + 1, z: p.z, color: 0xfde047, count: 16 });
    }

    this.sound?.playDash();
    this._emit('dash', { x: p.x, y: p.y, z: p.z });
    return true;
  }

  fireWeapon() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    if (p.fireCooldown > 0) return false;

    const oc = this.relicCount('overclock_cap');
    const flowRate = this.relicCount('solaris_flow') > 0 ? this.getStyleRank().boost : 1;
    p.fireCooldown = PLAYER_CFG.FIRE_COOLDOWN / ((1 + 0.25 * oc) * flowRate);
    p.recoil = 1.0;
    p.shotsFired++;

    const starfall = this.relicCount('starfall_core');
    const isStarfall = starfall > 0 && p.shotsFired % 4 === 0;
    const twin = this.relicCount('twin_prism');
    const pellets = twin > 0 ? 1 + twin : 1;

    const baseDir = this.getForwardVector();
    for (let k = 0; k < pellets; k++) {
      const spread = k === 0 ? 0 : 0.018;
      const dir = {
        x: baseDir.x + (Math.random() - 0.5) * spread,
        y: baseDir.y + (Math.random() - 0.5) * spread,
        z: baseDir.z + (Math.random() - 0.5) * spread,
      };
      const dl = Math.hypot(dir.x, dir.y, dir.z) || 1;
      dir.x /= dl;
      dir.y /= dl;
      dir.z /= dl;
      this._fireSingleRay(dir, k === 0 ? 1.0 : 0.45, isStarfall);
    }

    this.sound?.playShot();
    return true;
  }

  _fireSingleRay(dir, pelletScale, isStarfall) {
    const p = this.player;
    const eye = this.getEyePos();
    const maxDist = 120;

    let bestT = maxDist;
    let hitEnemy = null;
    let hitCrystal = null;
    let isCrit = false;

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;

      if (e.type === 'colossus') {
        for (const c of e.crystals) {
          if (!c.alive) continue;
          const t = this._raySphere(eye, dir, c.x, c.y, c.z, 1.5);
          if (t !== null && t < bestT) {
            bestT = t;
            hitEnemy = e;
            hitCrystal = c;
            isCrit = true;
          }
        }
      }

      const t = this._raySphere(eye, dir, e.x, e.y, e.z, e.radius + 0.42);
      if (t !== null && t < bestT) {
        bestT = t;
        hitEnemy = e;
        hitCrystal = null;
        const hitY = eye.y + dir.y * t;
        isCrit = hitY >= e.y + e.radius * 0.22 || !p.grounded || p.skyCritTimer > 0 || isStarfall;
      }
    }

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

    this._emit('tracer', {
      sx: eye.x + Math.cos(p.yaw) * 0.32,
      sy: eye.y - 0.16,
      sz: eye.z - Math.sin(p.yaw) * 0.32,
      ex: endX,
      ey: endY,
      ez: endZ,
      crit: (isCrit && !!hitEnemy) || isStarfall,
      superBeam: isStarfall,
    });

    if (hitEnemy) {
      const starMult = isStarfall ? 2.4 * (1 + 0.35 * (this.relicCount('starfall_core') - 1)) : 1.0;
      const baseDmg = Math.round((isCrit ? 48 : 32) * pelletScale * starMult * this.getDamageMultiplier());
      p.hitMarker = 0.22;
      p.hitMarkerCrit = isCrit;
      this.sound?.playHit(isCrit);

      if (hitCrystal) {
        hitCrystal.hp -= baseDmg;
        this._emit('damage_number', { x: endX, y: endY + 0.8, z: endZ, amount: baseDmg, crit: true });
        this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xfde047, count: 16 });
        if (hitCrystal.hp <= 0) {
          hitCrystal.alive = false;
          this._damageEnemy(hitEnemy, 165, true, 'CRYSTAL SHATTER!');
        }
      } else {
        const bonusTag = isStarfall
          ? 'STARFALL BEAM!'
          : p.wallRunSide !== 0
            ? 'WALL-RUN SHOT'
            : p.skyCritTimer > 0
              ? 'SKY-CHAIN CRIT'
              : !p.grounded
                ? 'AERIAL CRIT'
                : null;
        this._damageEnemy(hitEnemy, baseDmg, isCrit, bonusTag);
        this._emit('impact', { x: endX, y: endY, z: endZ, color: isCrit ? 0xf5c451 : 0xe84a27, count: 12 });

        // Shatter Rounds AOE splash on crit!
        const shatter = this.relicCount('shatter_rounds');
        if (shatter > 0 && isCrit) {
          this._shatterSplash(endX, endY, endZ, hitEnemy.id, 24 * shatter * this.getDamageMultiplier());
        }
      }
    } else {
      this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xf3ece1, count: 5 });
    }
  }

  _shatterSplash(x, y, z, excludeId, dmg) {
    this._emit('impact', { x, y, z, color: 0xffa726, count: 18 });
    for (const o of this.enemies) {
      if (o.id === excludeId || o.hp <= 0) continue;
      if (Math.hypot(o.x - x, o.y - y, o.z - z) <= 7.2) {
        this._damageEnemy(o, Math.round(dmg), false, null);
      }
    }
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
    p.jumpsLeft = 2 + this.relicCount('valkyrie_thrusters');
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
    const superParry = this.relicCount('supernova_parry');
    const radius = PLAYER_CFG.PARRY_RADIUS * (1 + 0.45 * superParry);
    let deflected = 0;
    const extraNeedles = [];

    for (const proj of this.projectiles) {
      if (proj.friendly) continue;
      const d = Math.hypot(proj.x - eye.x, proj.y - eye.y, proj.z - eye.z);
      if (d <= radius) {
        deflected++;
        this.parries++;
        proj.friendly = true;
        proj.life = 4.2;
        proj.damage = Math.round(100 * this.getDamageMultiplier());
        const dir = this.getForwardVector();
        const spd = 50;
        proj.vx = dir.x * spd;
        proj.vy = dir.y * spd;
        proj.vz = dir.z * spd;

        if (superParry > 0) {
          for (const side of [-0.14, 0.14]) {
            const cos = Math.cos(side);
            const sin = Math.sin(side);
            extraNeedles.push({
              id: uid(),
              x: proj.x,
              y: proj.y,
              z: proj.z,
              vx: (dir.x * cos - dir.z * sin) * spd,
              vy: dir.y * spd,
              vz: (dir.x * sin + dir.z * cos) * spd,
              radius: 0.48,
              friendly: true,
              damage: Math.round(75 * this.getDamageMultiplier()),
              life: 4.0,
            });
          }
        }
      }
    }

    if (extraNeedles.length) this.projectiles.push(...extraNeedles);

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z);
      if (d <= 7.0 + superParry * 2.5) {
        const inv = 1 / Math.max(0.1, d);
        e.vx += (e.x - p.x) * inv * 18;
        e.vz += (e.z - p.z) * inv * 18;
        this._damageEnemy(e, Math.round(36 * this.getDamageMultiplier()), false, 'SHOCKWAVE');
      }
    }

    if (deflected > 0) {
      this._addStyle(300 * deflected, `SOLAR PARRY ×${deflected}`);
      this.hitStop = 0.045;
    }

    this.sound?.playParry(deflected);
    this._emit('parry', { x: eye.x, y: eye.y, z: eye.z, deflected });
    return true;
  }

  _findBestGrappleTarget() {
    const eye = this.getEyePos();
    const fwd = this.getForwardVector();
    const maxRange = PLAYER_CFG.GRAPPLE_RANGE * (1 + 0.35 * this.relicCount('sky_chain'));
    let best = null;
    let bestScore = -Infinity;

    const consider = (kind, id, x, y, z) => {
      const dx = x - eye.x;
      const dy = y - eye.y;
      const dz = z - eye.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 3.0 || dist > maxRange) return;
      const dot = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / dist;
      if (dot < 0.72) return;
      const score = dot * 100 - dist * 0.42 + (kind === 'enemy' ? 6 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { kind, id, x, y, z, dist };
      }
    };

    for (const r of this.arena.skyRings) {
      consider('ring', r.id, r.x, r.y, r.z);
    }
    for (const e of this.enemies) {
      if (e.hp > 0) consider('enemy', e.id, e.x, e.y, e.z);
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

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    const flowDecay = 1 / (1 + 0.4 * this.relicCount('solaris_flow'));
    this.stylePoints = Math.max(0, this.stylePoints - dt * (92 + this.stylePoints * 0.055) * flowDecay);

    this._updatePlayer(dt);
    this._updateEnemies(dt);
    this._updateProjectiles(dt);

    if (this.input.firing) {
      this.fireWeapon();
    }

    this.grappleHighlight = this._findBestGrappleTarget();

    // Check wave completion -> Open Kintsugi Relic Draft!
    if (this.enemies.length === 0) {
      this.waveClearTimer += dt;
      if (this.waveClearTimer >= 1.25) {
        this.score += this.wave * 500;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.player.shield = this.player.maxShield;
        if (this.score > this.bestScore) this.bestScore = this.score;
        this._openDraft();
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
    p.skyCritTimer = Math.max(0, p.skyCritTimer - dt);
    p.recoil = Math.max(0, p.recoil - dt * 6.5);
    p.hitMarker = Math.max(0, p.hitMarker - dt);
    p.damageFlash = Math.max(0, p.damageFlash - dt * 2.8);
    p.fovBoost *= Math.exp(-6.5 * dt);

    const aegis = this.relicCount('aegis_plating');
    if (p.shieldRegenDelay > 0) {
      p.shieldRegenDelay -= dt;
    } else if (p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + (18 + aegis * 12) * dt);
    }

    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

    if (p.grapple) {
      p.grapple.timer += dt;
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

        if (dist < (p.grapple.targetKind === 'enemy' ? 3.0 : 3.4) || p.grapple.timer > 1.35) {
          if (enemyTarget) {
            const dmg = Math.round(135 * this.getDamageMultiplier());
            this._damageEnemy(enemyTarget, dmg, true, 'GRAPPLE EXECUTE!');
            this.executes++;
            p.dashCooldown = 0;
            const leech = this.relicCount('solar_leech');
            p.shield = Math.min(p.maxShield, p.shield + 22 + leech * 30);
            if (leech > 0) {
              p.hp = Math.min(p.maxHp, p.hp + 25 * leech);
              p.grappleCooldown = 0;
            }
            p.invulnTimer = Math.max(p.invulnTimer, 0.4);
            p.vy = 11.8;
            p.vx *= 0.45;
            p.vz *= 0.45;
            this.hitStop = 0.055;
            this.sound?.playExecute();
            this._emit('impact', { x: enemyTarget.x, y: enemyTarget.y, z: enemyTarget.z, color: 0xfde047, count: 28 });
          } else {
            p.vy = Math.max(p.vy, 13.0);
            p.jumpsLeft = 2 + this.relicCount('valkyrie_thrusters');
            if (this.relicCount('sky_chain') > 0) {
              p.skyCritTimer = 3.0;
            }
            this._addStyle(115, 'SKY SLINGSHOT');
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

      const speedMult = 1 + 0.16 * this.relicCount('valkyrie_thrusters');
      if (p.grounded) {
        const targetVx = wishX * PLAYER_CFG.GROUND_SPEED * speedMult;
        const targetVz = wishZ * PLAYER_CFG.GROUND_SPEED * speedMult;
        const blend = Math.min(1, PLAYER_CFG.GROUND_ACCEL * dt * 0.16);
        p.vx += (targetVx - p.vx) * blend;
        p.vz += (targetVz - p.vz) * blend;
      } else if (p.wallRunSide !== 0) {
        p.vx += wishX * 28 * dt;
        p.vz += wishZ * 28 * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        const cap = PLAYER_CFG.WALL_RUN_SPEED * speedMult;
        if (hSpd > cap) {
          p.vx = (p.vx / hSpd) * cap;
          p.vz = (p.vz / hSpd) * cap;
        }
      } else {
        p.vx += wishX * PLAYER_CFG.AIR_ACCEL * speedMult * dt;
        p.vz += wishZ * PLAYER_CFG.AIR_ACCEL * speedMult * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        if (hSpd > 38) {
          p.vx = (p.vx / hSpd) * 38;
          p.vz = (p.vz / hSpd) * 38;
        }
      }

      const grav = p.wallRunSide !== 0 ? PLAYER_CFG.WALL_RUN_GRAVITY : PLAYER_CFG.GRAVITY;
      p.vy -= grav * dt;
      if (p.wallRunSide !== 0 && p.vy < -2.0) p.vy = -2.0;
    }

    if (p.jumpBuffer > 0) {
      const maxAirJumps = 1 + this.relicCount('valkyrie_thrusters');
      if (p.wallRunSide !== 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED * 1.1;
        p.vx += p.wallRunNormalX * 14.0;
        p.vz += p.wallRunNormalZ * 14.0;
        p.wallRunSide = 0;
        p.jumpsLeft = maxAirJumps;
        p.jumpBuffer = 0;
        p.fovBoost = Math.max(p.fovBoost, 8);
        this.sound?.playDash();
        this._addStyle(85, 'WALL LEAP');
      } else if (p.grounded || p.coyoteTimer > 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpsLeft = maxAirJumps;
        p.jumpBuffer = 0;
      } else if (p.jumpsLeft > 0) {
        p.vy = PLAYER_CFG.DOUBLE_JUMP_SPEED;
        p.jumpsLeft--;
        p.jumpBuffer = 0;
        this.sound?.playDash();
      }
    }

    this._moveAndCollidePlayer(dt);

    for (const pad of this.arena.jumpPads) {
      const dx = p.x - pad.x;
      const dz = p.z - pad.z;
      if (Math.hypot(dx, dz) <= pad.radius && Math.abs(p.y - pad.y) <= 1.8) {
        p.vy = pad.boostY;
        const toCenter = Math.hypot(p.x, p.z) || 1;
        p.vx += (-p.x / toCenter) * pad.boostHoriz;
        p.vz += (-p.z / toCenter) * pad.boostHoriz;
        p.grounded = false;
        p.jumpsLeft = 2 + this.relicCount('valkyrie_thrusters');
        p.fovBoost = Math.max(p.fovBoost, 14);
        this.sound?.playJumpPad();
        this._addStyle(75, 'THERMAL LAUNCH');
      }
    }

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

    p.x += p.vx * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
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

    p.y += p.vy * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
      if (p.vy <= 0) {
        p.y = b.y + b.h * 0.5;
        p.vy = 0;
        p.grounded = true;
        p.coyoteTimer = 0.14;
        p.jumpsLeft = 2 + this.relicCount('valkyrie_thrusters');
      } else {
        p.y = b.y - b.h * 0.5 - h;
        p.vy = 0;
      }
    }

    if (!p.grounded && !p.grapple && Math.hypot(p.vx, p.vz) > 4.5) {
      const rightX = Math.cos(p.yaw);
      for (const b of this.arena.boxes) {
        if (!b.wallRun) continue;
        const minX = b.x - b.w * 0.5 - r - 0.45;
        const maxX = b.x + b.w * 0.5 + r + 0.45;
        const minY = b.y - b.h * 0.5;
        const maxY = b.y + b.h * 0.5;
        const minZ = b.z - b.d * 0.5 - r - 0.45;
        const maxZ = b.z + b.d * 0.5 + r + 0.45;
        if (p.x >= minX && p.x <= maxX && p.y + 0.8 >= minY && p.y <= maxY && p.z >= minZ && p.z <= maxZ) {
          const nx = p.x < b.x ? -1 : 1;
          p.wallRunSide = nx * rightX > 0 ? -1 : 1;
          p.wallRunNormalX = nx;
          p.wallRunNormalZ = 0;
          p.jumpsLeft = 1 + this.relicCount('valkyrie_thrusters');
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
      e.angle += dt * (e.type === 'colossus' ? 0.85 : e.type === 'wisp' ? 3.5 : 1.9);

      const dx = eye.x - e.x;
      const dy = eye.y - e.y;
      const dz = eye.z - e.z;
      const dist = Math.hypot(dx, dy, dz) || 1;

      if (e.type === 'drone') {
        const radial = dist > 17 ? 1 : -0.45;
        const strafe = Math.sin(this.time * 1.4 + e.id) * 0.85;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const desiredY = Math.max(4.5, p.y + 4.2 + Math.sin(this.time * 2 + e.id) * 1.6);
        e.vx += (tx * e.speed - e.vx) * Math.min(1, 3.5 * dt);
        e.vz += (tz * e.speed - e.vz) * Math.min(1, 3.5 * dt);
        e.vy += ((desiredY - e.y) * 2.2 - e.vy) * Math.min(1, 4 * dt);
      } else if (e.type === 'wisp') {
        // Fast weaving flanker
        const strafe = Math.cos(this.time * 3.1 + e.id * 1.7) * 1.1;
        const radial = dist > 12 ? 1.0 : -0.6;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const desiredY = Math.max(3.5, p.y + 3.2 + Math.sin(this.time * 4 + e.id) * 2.2);
        e.vx += (tx * e.speed - e.vx) * Math.min(1, 5 * dt);
        e.vz += (tz * e.speed - e.vz) * Math.min(1, 5 * dt);
        e.vy += ((desiredY - e.y) * 3.2 - e.vy) * Math.min(1, 5 * dt);
      } else if (e.type === 'strider') {
        const hDist = Math.hypot(dx, dz) || 1;
        const mult = hDist > 6.5 ? 1 : 0.25;
        e.vx += ((dx / hDist) * e.speed * mult - e.vx) * Math.min(1, 4.5 * dt);
        e.vz += ((dz / hDist) * e.speed * mult - e.vz) * Math.min(1, 4.5 * dt);
        const desiredY = Math.max(1.5, p.y + 1.2 + Math.abs(Math.sin(this.time * 3.5 + e.id)) * 1.8);
        e.vy += ((desiredY - e.y) * 3.5 - e.vy) * Math.min(1, 5 * dt);
      } else if (e.type === 'vanguard') {
        // Heavy Juggernaut advancing steadily toward player
        const hDist = Math.hypot(dx, dz) || 1;
        const chargeBoost = e.fireTimer < 0.7 ? 1.75 : 1.0;
        e.vx += ((dx / hDist) * e.speed * chargeBoost - e.vx) * Math.min(1, 3.2 * dt);
        e.vz += ((dz / hDist) * e.speed * chargeBoost - e.vz) * Math.min(1, 3.2 * dt);
        const desiredY = Math.max(2.2, p.y + 1.4);
        e.vy += ((desiredY - e.y) * 2.4 - e.vy) * Math.min(1, 3.5 * dt);
      } else if (e.type === 'weaver') {
        // High-altitude sniper hovering & tracking laser sight before firing!
        const radial = dist > 28 ? 0.6 : dist < 18 ? -0.7 : 0;
        const strafe = Math.sin(this.time * 0.9 + e.id) * 0.7;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const desiredY = Math.max(9.5, p.y + 7.5 + Math.sin(this.time * 1.5 + e.id) * 1.5);
        e.vx += (tx * e.speed - e.vx) * Math.min(1, 2.8 * dt);
        e.vz += (tz * e.speed - e.vz) * Math.min(1, 2.8 * dt);
        e.vy += ((desiredY - e.y) * 2.0 - e.vy) * Math.min(1, 3 * dt);
        e.telegraphTimer = e.fireTimer < 0.95 ? 0.95 - e.fireTimer : 0;
      } else if (e.type === 'colossus') {
        if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
          e.phase = 2;
          this._emit('announcement', {
            title: 'SOLAR COLOSSUS · OVERDRIVE',
            subtitle: 'Watch for radial plasma fans — Parry with Q!',
          });
        }
        const orbitX = Math.cos(this.time * 0.35) * 14;
        const orbitZ = Math.sin(this.time * 0.35) * 14;
        const orbitY = 14.5 + Math.sin(this.time * 0.9) * 2.4;
        e.vx += ((orbitX - e.x) * 1.2 - e.vx) * Math.min(1, 2.5 * dt);
        e.vy += ((orbitY - e.y) * 1.6 - e.vy) * Math.min(1, 2.5 * dt);
        e.vz += ((orbitZ - e.z) * 1.2 - e.vz) * Math.min(1, 2.5 * dt);

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

      e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        e.fireTimer = e.fireCd * (e.phase === 2 ? 0.72 : 1.0);
        e.telegraphTimer = 0;
        this._fireEnemyProjectile(e, eye);
      }
    }
  }

  _fireEnemyProjectile(e, eye) {
    const dx = eye.x - e.x;
    const dy = eye.y - e.y;
    const dz = eye.z - e.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const spd =
      e.type === 'weaver' ? 34 : e.type === 'aegis' ? 24 : e.type === 'colossus' ? 21 : 19;

    if (e.type === 'colossus' || e.type === 'vanguard') {
      const fan = e.type === 'vanguard' ? 3 : e.phase === 2 ? 5 : 3;
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
          radius: 0.62,
          friendly: false,
          damage: 15,
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
      radius: e.type === 'weaver' ? 0.42 : 0.5,
      friendly: false,
      damage: e.type === 'weaver' ? 20 : 13,
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
          if (Math.hypot(proj.x - e.x, proj.y - e.y, proj.z - e.z) <= e.radius + proj.radius + 0.75) {
            this._damageEnemy(e, proj.damage, true, 'PARRY RETURN!');
            this._emit('impact', { x: proj.x, y: proj.y, z: proj.z, color: 0xfde047, count: 18 });
            hit = true;
            break;
          }
        }
        if (hit) this.projectiles.splice(i, 1);
      } else {
        if (p.invulnTimer <= 0 && Math.hypot(proj.x - eye.x, proj.y - (p.y + 1.0), proj.z - eye.z) <= 1.22) {
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

    this._emit('damage_number', {
      x: e.x,
      y: e.y + e.radius + 0.4,
      z: e.z,
      amount: Math.round(amount),
      crit,
    });

    if (e.hp <= 0) {
      e.hp = 0;
      this.kills++;
      this.combo++;
      this.comboTimer = 5.0;
      const mult = 1 + Math.min(5, this.combo * 0.25);
      this.score += Math.round(e.score * mult);
      if (this.score > this.bestScore) this.bestScore = this.score;

      const shatter = this.relicCount('shatter_rounds');
      if (shatter > 0) {
        this._shatterSplash(e.x, e.y, e.z, e.id, 30 * shatter * this.getDamageMultiplier());
      }

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
    p.shieldRegenDelay = 3.0;
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
    if (label) this._emit('style', { label, pts });
  }

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
