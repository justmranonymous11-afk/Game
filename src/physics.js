import { buildArenaData } from './arenaData.js';

export const PLAYER_CFG = {
  RADIUS: 0.65,
  HEIGHT: 1.9,
  EYE_HEIGHT: 1.62,
  SLIDE_EYE_HEIGHT: 0.96,
  GROUND_SPEED: 13.8,
  GROUND_ACCEL: 84,
  AIR_ACCEL: 27,
  GRAVITY: 29.5,
  JUMP_SPEED: 12.2,
  DOUBLE_JUMP_SPEED: 11.6,
  DASH_SPEED: 29.5,
  DASH_DURATION: 0.19,
  DASH_COOLDOWN: 1.1,
  SLIDE_SPEED: 22.5,
  SLIDE_DURATION: 0.52,
  WALL_RUN_GRAVITY: 5.2,
  WALL_RUN_SPEED: 19.0,
  GRAPPLE_RANGE: 58,
  GRAPPLE_SPEED: 42,
  GRAPPLE_COOLDOWN: 1.05,
  PARRY_COOLDOWN: 1.35,
  PARRY_RADIUS: 9.2,
  MAX_HP: 100,
  MAX_SHIELD: 60,
};

export const WEAPON_SPECS = {
  carbine: {
    id: 'carbine',
    name: 'MK-IV PULSE CARBINE',
    short: 'CARBINE',
    key: '1',
    magSize: 30,
    fireCd: 0.115,
    reloadTime: 1.05,
    damage: 25,
    critMult: 1.75,
    pellets: 1,
    hipSpread: 0.014,
    adsSpread: 0.002,
    adsFov: 64,
    pierceShield: false,
    tracerColor: 0xffb84d,
  },
  railgun: {
    id: 'railgun',
    name: 'HELIO-9 RAILGUN',
    short: 'RAILGUN',
    key: '2',
    magSize: 5,
    fireCd: 0.72,
    reloadTime: 1.35,
    damage: 102,
    critMult: 1.85,
    pellets: 1,
    hipSpread: 0.012,
    adsSpread: 0.0005,
    adsFov: 44,
    pierceShield: true,
    tracerColor: 0x38bdf8,
  },
  shotgun: {
    id: 'shotgun',
    name: 'M88 BREACHER',
    short: 'SHOTGUN',
    key: '3',
    magSize: 8,
    fireCd: 0.62,
    reloadTime: 1.25,
    damage: 17,
    critMult: 1.5,
    pellets: 8,
    hipSpread: 0.068,
    adsSpread: 0.042,
    adsFov: 70,
    pierceShield: false,
    tracerColor: 0xff7b29,
  },
};

export const DIFFICULTIES = {
  tactical: { label: 'TACTICAL', enemyHp: 0.85, enemyDmg: 0.78, scoreMult: 1.0 },
  veteran: { label: 'VETERAN', enemyHp: 1.0, enemyDmg: 1.0, scoreMult: 1.25 },
  apex: { label: 'APEX', enemyHp: 1.28, enemyDmg: 1.32, scoreMult: 1.6 },
};

export const STYLE_RANKS = [
  { min: 0, label: 'D', title: 'ENGAGED', color: '#94A3B8', boost: 1.0 },
  { min: 350, label: 'C', title: 'TACTICAL', color: '#E2E8F0', boost: 1.06 },
  { min: 850, label: 'B', title: 'LETHAL', color: '#F5C451', boost: 1.12 },
  { min: 1500, label: 'A', title: 'VANGUARD', color: '#F59E0B', boost: 1.18 },
  { min: 2400, label: 'S', title: 'VALKYRIE', color: '#F97316', boost: 1.26 },
  { min: 3600, label: 'SS', title: 'APEX', color: '#EF4444', boost: 1.35 },
  { min: 5200, label: 'SOLARIS', title: 'LEGEND', color: '#FDE047', boost: 1.48 },
];

export const RELIC_CATALOG = [
  {
    id: 'tungsten_rounds',
    name: 'Tungsten Penetrators',
    tag: 'BALLISTICS',
    icon: '➤',
    desc: '+28% weapon damage across all 3 firearms. All weapons punch through Aegis Ballistic Shields.',
    maxStacks: 3,
  },
  {
    id: 'frag_shells',
    name: 'Fragmentation Shells',
    tag: 'EXPLOSIVE',
    icon: '✺',
    desc: 'Critical hits and eliminations trigger a 3D shrapnel blast damaging nearby hostiles.',
    maxStacks: 3,
  },
  {
    id: 'cryo_coils',
    name: 'Cryo-Rail Coils',
    tag: 'HANDLING',
    icon: '⚡',
    desc: '+22% fire rate and +35% faster tactical reloads across Carbine, Railgun, and Shotgun.',
    maxStacks: 3,
  },
  {
    id: 'extended_mag',
    name: 'Twin-Core Magazines',
    tag: 'AMMUNITION',
    icon: '⫘',
    desc: '+50% magazine capacity on all weapons. Air-Dashing or Sliding automatically reloads your active weapon.',
    maxStacks: 2,
  },
  {
    id: 'exo_boosters',
    name: 'Exo-Slide Boosters',
    tag: 'MOBILITY',
    icon: '⇶',
    desc: '+1 Extra mid-air jump, +15% sprint/slide velocity, and 25% faster Dash recharge.',
    maxStacks: 2,
  },
  {
    id: 'vampire_nanites',
    name: 'Siphon Nanites',
    tag: 'SURVIVAL',
    icon: '✚',
    desc: 'Every elimination restores +8 Health & +12 Armor. Grapple Takedowns restore +28 Health.',
    maxStacks: 2,
  },
  {
    id: 'reactive_armor',
    name: 'Reactive Plating',
    tag: 'ARMOR',
    icon: '◈',
    desc: '+40 Max Armor, +25 Max Health (heals immediately), and 50% faster Armor recharge.',
    maxStacks: 2,
  },
  {
    id: 'grapple_exec',
    name: 'Grapple Executioner',
    tag: 'GRAPPLE',
    icon: '◎',
    desc: '+40% Grapple range. Executing a hostile instantly resets Grapple & Dash cooldowns.',
    maxStacks: 2,
  },
  {
    id: 'supernova_deflect',
    name: 'Arc Deflector',
    tag: 'PARRY',
    icon: '✧',
    desc: '+45% Shockwave Parry radius and deflected missiles fracture into 3 homing counters.',
    maxStacks: 2,
  },
  {
    id: 'arc_chain',
    name: 'Arc Chain Rounds',
    tag: 'TECH',
    icon: '★',
    desc: 'Every 3rd landed shot arcs high-voltage lightning to a nearby hostile for 55% bonus damage.',
    maxStacks: 2,
  },
  {
    id: 'kinetic_surge',
    name: 'Kinetic Momentum',
    tag: 'VELOCITY',
    icon: '≋',
    desc: 'Sliding, Wall-Running, or moving above 15 m/s boosts all weapon damage by up to +45%.',
    maxStacks: 2,
  },
  {
    id: 'overdrive_flow',
    name: 'Apex Overdrive',
    tag: 'STYLE',
    icon: '∞',
    desc: 'Style Rank decays 40% slower and amplifies damage and fire rate at higher ranks.',
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
    this.difficulty = opts.difficulty || 'veteran';
    this.reset('title');
  }

  setDifficulty(diff) {
    if (DIFFICULTIES[diff]) this.difficulty = diff;
  }

  reset(initialState = 'title') {
    nextId = 1;
    this.state = initialState; // 'title' | 'playing' | 'paused' | 'draft' | 'victory' | 'gameover'
    this.time = 0;
    this.hitStop = 0;
    this.endless = false;

    this.weapons = {
      carbine: { ...WEAPON_SPECS.carbine, ammo: WEAPON_SPECS.carbine.magSize, maxAmmo: WEAPON_SPECS.carbine.magSize },
      railgun: { ...WEAPON_SPECS.railgun, ammo: WEAPON_SPECS.railgun.magSize, maxAmmo: WEAPON_SPECS.railgun.magSize },
      shotgun: { ...WEAPON_SPECS.shotgun, ammo: WEAPON_SPECS.shotgun.magSize, maxAmmo: WEAPON_SPECS.shotgun.magSize },
    };
    this.weaponOrder = ['carbine', 'railgun', 'shotgun'];
    this.activeWeaponId = 'carbine';

    this.player = {
      x: 0,
      y: 2.0,
      z: 16.5,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: 0.04,
      eyeHeight: PLAYER_CFG.EYE_HEIGHT,
      grounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      jumpsLeft: 2,
      wallRunSide: 0,
      wallRunNormalX: 0,
      wallRunNormalZ: 0,
      dashTimer: 0,
      dashCooldown: 0,
      slideTimer: 0,
      fireCooldown: 0,
      reloadTimer: 0,
      grappleCooldown: 0,
      parryCooldown: 0,
      invulnTimer: 0,
      shieldRegenDelay: 0,
      footstepTimer: 0,
      hitsLanded: 0,
      ads: false,
      hp: PLAYER_CFG.MAX_HP,
      maxHp: PLAYER_CFG.MAX_HP,
      shield: PLAYER_CFG.MAX_SHIELD,
      maxShield: PLAYER_CFG.MAX_SHIELD,
      recoil: 0,
      cameraRoll: 0,
      fovBoost: 0,
      hitMarker: 0,
      hitMarkerCrit: false,
      hitMarkerKill: false,
      damageFlash: 0,
      damageDirAngle: 0,
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
    this.headshots = 0;
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

  continueEndless() {
    if (this.state !== 'victory') return;
    this.endless = true;
    this._openDraft();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.input.firing = false;
      this.player.ads = false;
      this._emit('state', { state: this.state });
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this._emit('state', { state: this.state });
    }
  }

  relicCount(id) {
    return this.relics[id] || 0;
  }

  getActiveWeapon() {
    return this.weapons[this.activeWeaponId];
  }

  selectWeapon(id) {
    if (!this.weapons[id] || id === this.activeWeaponId) return false;
    this.activeWeaponId = id;
    this.player.reloadTimer = 0;
    this.player.fireCooldown = Math.max(this.player.fireCooldown, 0.16);
    this._emit('weapon_change', { weapon: this.weapons[id] });
    return true;
  }

  cycleWeapon(delta) {
    const idx = this.weaponOrder.indexOf(this.activeWeaponId);
    const nextIdx = (idx + (delta > 0 ? 1 : -1) + this.weaponOrder.length) % this.weaponOrder.length;
    return this.selectWeapon(this.weaponOrder[nextIdx]);
  }

  startReload() {
    if (this.state !== 'playing') return false;
    const w = this.getActiveWeapon();
    if (this.player.reloadTimer > 0 || w.ammo >= w.maxAmmo) return false;
    const cryo = this.relicCount('cryo_coils');
    this.player.reloadTimer = w.reloadTime / (1 + 0.35 * cryo);
    this.player.ads = false;
    this.sound?.playReload();
    return true;
  }

  setAds(active) {
    if (this.state !== 'playing') {
      this.player.ads = false;
      return;
    }
    this.player.ads = !!active && this.player.reloadTimer <= 0;
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
    let mult = 1 + 0.28 * this.relicCount('tungsten_rounds');
    const ks = this.relicCount('kinetic_surge');
    if (ks > 0) {
      const spd = Math.hypot(this.player.vx, this.player.vy, this.player.vz);
      if (spd > 15 || this.player.slideTimer > 0 || this.player.wallRunSide !== 0) {
        mult *= 1 + Math.min(0.45 * ks, Math.max(0.22, ((spd - 14) / 18) * 0.45 * ks));
      }
    }
    if (this.relicCount('overdrive_flow') > 0) {
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
      y: this.player.y + this.player.eyeHeight,
      z: this.player.z,
    };
  }

  // ---- RELIC DRAFT PROGRESSION ----

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
    this.player.ads = false;
    this._emit('state', { state: this.state });
  }

  selectRelic(relicId) {
    if (this.state !== 'draft') return false;
    const found = this.draftChoices.find((r) => r.id === relicId);
    if (!found) return false;

    this.relics[relicId] = (this.relics[relicId] || 0) + 1;

    if (relicId === 'reactive_armor') {
      this.player.maxShield += 40;
      this.player.shield = this.player.maxShield;
      this.player.maxHp += 25;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
    } else if (relicId === 'extended_mag') {
      const mult = 1 + 0.5 * this.relicCount('extended_mag');
      for (const k of this.weaponOrder) {
        const spec = WEAPON_SPECS[k];
        this.weapons[k].maxAmmo = Math.round(spec.magSize * mult);
        this.weapons[k].ammo = this.weapons[k].maxAmmo;
      }
    }

    this.draftChoices = [];
    this.state = 'playing';
    this.sound?.playReload();
    this._emit('state', { state: this.state });
    this._spawnWave(this.wave + 1);
    return true;
  }

  // ---- WAVE DIRECTOR (8-WAVE CAMPAIGN + ENDLESS, 7 ENEMY TYPES) ----

  _spawnWave(waveNum) {
    this.wave = waveNum;
    this.waveClearTimer = 0;
    this.projectiles = [];

    const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.veteran;
    const scale = (1 + (waveNum - 1) * 0.13) * diff.enemyHp;
    const isBoss = waveNum === 4 || (waveNum >= 8 && waveNum % 4 === 0);

    if (isBoss) {
      this._spawnEnemy('gunship', 0, 17.5, -18, scale);
      this._spawnEnemy('viper', -27.5, 8.6, -27.5, scale);
      this._spawnEnemy('viper', 27.5, 8.6, -27.5, scale);
      this._spawnEnemy('seeker', -12, 9, -15, scale);
      this._spawnEnemy('seeker', 12, 9, -15, scale);
      this._emit('announcement', {
        title: `WAVE ${waveNum} · VALKYRIE-${waveNum >= 8 ? '02 APEX' : '01'} GUNSHIP`,
        subtitle: 'Destroy its 4 glowing Turbine Nacelles with the Railgun [2] or Grapple [E]!',
      });
      return;
    }

    const droneCount = 2 + Math.min(4, Math.floor((waveNum + 1) * 0.6));
    const strikerCount = 2 + Math.min(4, Math.floor(waveNum * 0.7));
    const seekerCount = waveNum >= 2 ? 2 + Math.min(4, Math.floor(waveNum * 0.6)) : 0;
    const viperCount = waveNum >= 2 ? Math.min(3, Math.floor(waveNum * 0.5)) : 0;
    const aegisCount = waveNum >= 3 ? Math.min(3, Math.floor((waveNum - 1) * 0.6)) : 0;
    const juggCount = waveNum >= 3 ? Math.min(2, Math.floor((waveNum - 1) * 0.5)) : 0;

    for (let i = 0; i < droneCount; i++) {
      const a = (i / droneCount) * Math.PI * 2 + waveNum * 0.5;
      this._spawnEnemy('drone', Math.cos(a) * 20, 6.2 + (i % 3) * 2.5, Math.sin(a) * 20, scale);
    }

    const islandCoords = [
      [0, 2.3, -38],
      [0, 2.3, 38],
      [-38, 2.3, 0],
      [38, 2.3, 0],
    ];
    for (let i = 0; i < strikerCount; i++) {
      const c = islandCoords[i % islandCoords.length];
      this._spawnEnemy('striker', c[0] + (i - 1) * 2.4, c[1], c[2], scale);
    }

    for (let i = 0; i < seekerCount; i++) {
      const a = (i / Math.max(1, seekerCount)) * Math.PI * 2 + 1.1;
      this._spawnEnemy('seeker', Math.cos(a) * 18, 9.2 + (i % 2) * 3.0, Math.sin(a) * 18, scale);
    }

    for (let i = 0; i < aegisCount; i++) {
      const c = islandCoords[(i + 1) % islandCoords.length];
      this._spawnEnemy('aegis', c[0], c[1] + 0.1, c[2], scale);
    }

    for (let i = 0; i < juggCount; i++) {
      const c = islandCoords[(i + 2) % islandCoords.length];
      this._spawnEnemy('juggernaut', c[0], c[1] + 0.8, c[2], scale);
    }

    const watchtowers = [
      [-27.5, 8.6, -27.5],
      [27.5, 8.6, -27.5],
      [-27.5, 8.6, 27.5],
      [27.5, 8.6, 27.5],
    ];
    for (let i = 0; i < viperCount; i++) {
      const w = watchtowers[i % watchtowers.length];
      this._spawnEnemy('viper', w[0], w[1], w[2], scale);
    }

    const titles = [
      'FIRST CONTACT',
      'PERIMETER BREACH',
      'ARMORED ADVANCE',
      'VALKYRIE-01 GUNSHIP',
      'COMBINED ARMS',
      'IRON BLOCKADE',
      'FINAL APPROACH',
      'APEX DREADNOUGHT',
    ];
    this._emit('announcement', {
      title: `WAVE ${waveNum} · ${titles[(waveNum - 1) % titles.length]}`,
      subtitle:
        waveNum === 1
          ? 'RMB Aim Down Sights · [1/2/3] Switch Weapons · Shift Slide/Dash · E Grapple'
          : waveNum === 2
            ? 'Viper Snipers on Watchtowers — watch their red laser sight!'
            : waveNum === 3
              ? 'Use the Helio-9 Railgun [2] to pierce Aegis Ballistic Shields!'
              : 'Clear all hostiles to unlock your next Field Mod.',
    });
  }

  _spawnEnemy(type, x, y, z, scale = 1) {
    const specs = {
      drone: { hp: 58, radius: 1.1, speed: 7.4, score: 150, fireCd: 2.2 },
      seeker: { hp: 38, radius: 0.95, speed: 12.8, score: 135, fireCd: 2.0 },
      striker: { hp: 82, radius: 1.05, speed: 9.2, score: 210, fireCd: 1.9 },
      aegis: { hp: 135, radius: 1.25, speed: 6.2, score: 290, fireCd: 2.1 },
      viper: { hp: 68, radius: 1.15, speed: 0, score: 280, fireCd: 3.1 },
      juggernaut: { hp: 230, radius: 1.85, speed: 5.8, score: 420, fireCd: 2.7 },
      gunship: { hp: 960, radius: 4.5, speed: 5.5, score: 2800, fireCd: 1.85 },
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
      fireTimer: 1.0 + Math.random() * 1.3,
      fireCd: s.fireCd,
      telegraphTimer: 0,
      hitFlash: 0,
      shieldFlash: 0,
      slowTimer: 0,
      burnTimer: 0,
      stridePhase: Math.random() * Math.PI * 2,
      phase: 1,
      angle: 0,
      crystals: [],
    };

    if (type === 'gunship') {
      // 4 Destructible Armored Turbine Nacelles attached around the Gunship
      const offsets = [
        [-4.5, -0.3, 1.4],
        [4.5, -0.3, 1.4],
        [-3.2, -0.4, -3.2],
        [3.2, -0.4, -3.2],
      ];
      for (const [ox, oy, oz] of offsets) {
        enemy.crystals.push({
          id: uid(),
          ox,
          oy,
          oz,
          hp: Math.round(125 * scale),
          maxHp: Math.round(125 * scale),
          alive: true,
          x: x + ox,
          y: y + oy,
          z: z + oz,
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
    this.player.slideTimer = 0;
    if (this.player.grapple) {
      this.player.grapple = null;
      this.player.vy = Math.max(this.player.vy, 11.8);
      this.player.jumpsLeft = Math.max(this.player.jumpsLeft, 1 + this.relicCount('exo_boosters'));
      this.sound?.playDash();
    }
  }

  triggerDashOrSlide() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    const exo = this.relicCount('exo_boosters');

    // Auto-reload on Dash/Slide if player has Extended Mag Core relic
    if (this.relicCount('extended_mag') > 0) {
      const w = this.getActiveWeapon();
      w.ammo = w.maxAmmo;
      p.reloadTimer = 0;
    }

    // Grounded & moving -> Tactical Crouch-Slide!
    const hSpd = Math.hypot(p.vx, p.vz);
    if (p.grounded && hSpd > 3.5 && p.slideTimer <= 0) {
      const dirX = p.vx / hSpd;
      const dirZ = p.vz / hSpd;
      const slideSpd = PLAYER_CFG.SLIDE_SPEED * (1 + 0.15 * exo);
      p.vx = dirX * slideSpd;
      p.vz = dirZ * slideSpd;
      p.slideTimer = PLAYER_CFG.SLIDE_DURATION;
      p.fovBoost = Math.max(p.fovBoost, 10);
      this.sound?.playSlide();
      this._addStyle(45, 'TACTICAL SLIDE');
      return true;
    }

    // Otherwise -> Kinetic Air-Dash!
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
    if (len < 0.01) { dx = fwdX; dz = fwdZ; }
    else { dx /= len; dz /= len; }

    p.vx = dx * PLAYER_CFG.DASH_SPEED * (1 + 0.14 * exo);
    p.vz = dz * PLAYER_CFG.DASH_SPEED * (1 + 0.14 * exo);
    p.vy = Math.max(p.vy, 3.4);
    p.dashTimer = PLAYER_CFG.DASH_DURATION;
    p.dashCooldown = PLAYER_CFG.DASH_COOLDOWN * Math.max(0.5, 1 - 0.25 * exo);
    p.invulnTimer = Math.max(p.invulnTimer, 0.28);
    p.fovBoost = Math.max(p.fovBoost, 12);
    p.grapple = null;

    this.sound?.playDash();
    this._emit('dash', { x: p.x, y: p.y, z: p.z });
    return true;
  }

  // Keep backwards-compatible alias
  triggerDash() {
    return this.triggerDashOrSlide();
  }

  fireWeapon() {
    if (this.state !== 'playing') return false;
    const p = this.player;
    const w = this.getActiveWeapon();
    if (p.fireCooldown > 0 || p.reloadTimer > 0) return false;

    if (w.ammo <= 0) {
      this.startReload();
      return false;
    }

    w.ammo--;
    const cryo = this.relicCount('cryo_coils');
    const flowRate = this.relicCount('overdrive_flow') > 0 ? this.getStyleRank().boost : 1;
    p.fireCooldown = w.fireCd / ((1 + 0.22 * cryo) * flowRate);
    p.recoil = 1.0;

    // Gentle upward vertical recoil kick (recoverable & tactile)
    p.pitch = clamp(p.pitch + (w.id === 'carbine' ? 0.0045 : w.id === 'shotgun' ? 0.022 : 0.018), -1.45, 1.45);

    const baseDir = this.getForwardVector();
    const spread = p.ads ? w.adsSpread : w.hipSpread;

    for (let k = 0; k < w.pellets; k++) {
      const dir = {
        x: baseDir.x + (Math.random() - 0.5) * spread * 2,
        y: baseDir.y + (Math.random() - 0.5) * spread * 2,
        z: baseDir.z + (Math.random() - 0.5) * spread * 2,
      };
      const dl = Math.hypot(dir.x, dir.y, dir.z) || 1;
      dir.x /= dl;
      dir.y /= dl;
      dir.z /= dl;
      this._fireSingleRay(dir, w);
    }

    this.sound?.playShot(w.id);
    if (w.id !== 'railgun') {
      this._emit('shell_eject', { weaponId: w.id });
    }
    if (w.ammo === 0) {
      this.startReload();
    }
    return true;
  }

  _fireSingleRay(dir, w) {
    const p = this.player;
    const eye = this.getEyePos();
    const maxDist = w.id === 'shotgun' ? 42 : 145;

    let bestT = maxDist;
    let hitEnemy = null;
    let hitNacelle = null;
    let isCrit = false;

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;

      if (e.type === 'gunship') {
        for (const c of e.crystals) {
          if (!c.alive) continue;
          const t = this._raySphere(eye, dir, c.x, c.y, c.z, 1.45);
          if (t !== null && t < bestT) {
            bestT = t;
            hitEnemy = e;
            hitNacelle = c;
            isCrit = true;
          }
        }
      }

      const t = this._raySphere(eye, dir, e.x, e.y + (e.type === 'juggernaut' ? 0.6 : 0.25), e.z, e.radius + 0.35);
      if (t !== null && t < bestT) {
        bestT = t;
        hitEnemy = e;
        hitNacelle = null;
        const hitY = eye.y + dir.y * t;
        // Authentic headshot / optical sensor weakpoint crit check
        isCrit = hitY >= e.y + e.radius * 0.55 || p.slideTimer > 0 || p.wallRunSide !== 0;
      }
    }

    for (const b of this.arena.boxes) {
      const t = this._rayBox(eye, dir, b);
      if (t !== null && t < bestT) {
        bestT = t;
        hitEnemy = null;
        hitNacelle = null;
      }
    }

    const endX = eye.x + dir.x * bestT;
    const endY = eye.y + dir.y * bestT;
    const endZ = eye.z + dir.z * bestT;

    const muzzleOffset = p.ads ? 0 : 0.22;
    this._emit('tracer', {
      sx: eye.x + Math.cos(p.yaw) * muzzleOffset,
      sy: eye.y - (p.ads ? 0.08 : 0.14),
      sz: eye.z - Math.sin(p.yaw) * muzzleOffset,
      ex: endX,
      ey: endY,
      ez: endZ,
      color: w.tracerColor,
      superBeam: w.id === 'railgun',
    });

    if (hitEnemy) {
      // Check Aegis frontal Ballistic Shield block (unless Railgun or Tungsten Penetrators!)
      const canPierce = w.pierceShield || this.relicCount('tungsten_rounds') > 0;
      if (hitEnemy.type === 'aegis' && !canPierce) {
        const enemyFwdX = Math.sin(hitEnemy.angle);
        const enemyFwdZ = Math.cos(hitEnemy.angle);
        const toPlayerX = eye.x - hitEnemy.x;
        const toPlayerZ = eye.z - hitEnemy.z;
        const tl = Math.hypot(toPlayerX, toPlayerZ) || 1;
        const facingDot = (enemyFwdX * toPlayerX + enemyFwdZ * toPlayerZ) / tl;
        if (facingDot > 0.55) {
          // Blocked by energy shield!
          hitEnemy.shieldFlash = 1.0;
          this.sound?.playHit(false, true);
          this._emit('impact', { x: endX, y: endY, z: endZ, color: 0x38bdf8, count: 10 });
          this._emit('damage_number', { x: endX, y: endY + 0.6, z: endZ, amount: 'SHIELD', crit: false });
          return;
        }
      }

      const dmg = Math.round(w.damage * (isCrit ? w.critMult : 1.0) * this.getDamageMultiplier());
      p.hitMarker = 0.2;
      p.hitMarkerCrit = isCrit;
      p.hitsLanded++;
      this.sound?.playHit(isCrit, false);

      if (this.relicCount('cryo_coils') > 0) {
        hitEnemy.slowTimer = Math.max(hitEnemy.slowTimer, 2.2);
      }

      if (hitNacelle) {
        hitNacelle.hp -= dmg;
        this._emit('damage_number', { x: endX, y: endY + 0.8, z: endZ, amount: dmg, crit: true });
        this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xffb84d, count: 18 });
        if (hitNacelle.hp <= 0) {
          hitNacelle.alive = false;
          this._damageEnemy(hitEnemy, 210, true, 'TURBINE DESTROYED!');
          this.sound?.playExplosion(true);
        }
      } else {
        const tag =
          w.id === 'railgun' && isCrit
            ? 'RAILGUN HEADSHOT'
            : p.slideTimer > 0
              ? 'SLIDE SHOT'
              : p.wallRunSide !== 0
                ? 'WALL-RUN KILL'
                : isCrit
                  ? 'PRECISION CRIT'
                  : null;
        this._damageEnemy(hitEnemy, dmg, isCrit, tag);
        this._emit('impact', { x: endX, y: endY, z: endZ, color: isCrit ? 0xfde047 : 0xff7b29, count: 9 });

        if (this.relicCount('frag_shells') > 0 && isCrit) {
          this._fragSplash(endX, endY, endZ, hitEnemy.id, 26 * this.relicCount('frag_shells') * this.getDamageMultiplier());
        }
        if (this.relicCount('arc_chain') > 0 && p.hitsLanded % 3 === 0) {
          this._arcChain(hitEnemy, Math.round(dmg * 0.55 * this.relicCount('arc_chain')));
        }
      }
    } else {
      // Concrete/steel spark impact!
      this._emit('impact', { x: endX, y: endY, z: endZ, color: 0xffe4a0, count: 5 });
    }
  }

  _fragSplash(x, y, z, excludeId, dmg) {
    this._emit('impact', { x, y, z, color: 0xff9f1c, count: 16 });
    for (const o of this.enemies) {
      if (o.id === excludeId || o.hp <= 0) continue;
      if (Math.hypot(o.x - x, o.y - y, o.z - z) <= 7.5) {
        this._damageEnemy(o, Math.round(dmg), false, null);
      }
    }
  }

  _arcChain(sourceEnemy, dmg) {
    let best = null;
    let bestD = 14;
    for (const o of this.enemies) {
      if (o.id === sourceEnemy.id || o.hp <= 0) continue;
      const d = Math.hypot(o.x - sourceEnemy.x, o.y - sourceEnemy.y, o.z - sourceEnemy.z);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (best) {
      this._emit('tracer', {
        sx: sourceEnemy.x,
        sy: sourceEnemy.y + 0.5,
        sz: sourceEnemy.z,
        ex: best.x,
        ey: best.y + 0.5,
        ez: best.z,
        color: 0x38bdf8,
        superBeam: true,
      });
      this._damageEnemy(best, dmg, false, 'ARC CHAIN');
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
    p.slideTimer = 0;
    p.jumpsLeft = 2 + this.relicCount('exo_boosters');
    p.fovBoost = Math.max(p.fovBoost, 15);

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
    const sup = this.relicCount('supernova_deflect');
    const radius = PLAYER_CFG.PARRY_RADIUS * (1 + 0.45 * sup);
    let deflected = 0;
    const extra = [];

    for (const proj of this.projectiles) {
      if (proj.friendly) continue;
      if (Math.hypot(proj.x - eye.x, proj.y - eye.y, proj.z - eye.z) <= radius) {
        deflected++;
        this.parries++;
        proj.friendly = true;
        proj.life = 4.2;
        proj.damage = Math.round(110 * this.getDamageMultiplier());
        const dir = this.getForwardVector();
        const spd = 52;
        proj.vx = dir.x * spd;
        proj.vy = dir.y * spd;
        proj.vz = dir.z * spd;

        if (sup > 0) {
          for (const side of [-0.14, 0.14]) {
            const cos = Math.cos(side);
            const sin = Math.sin(side);
            extra.push({
              id: uid(),
              x: proj.x,
              y: proj.y,
              z: proj.z,
              vx: (dir.x * cos - dir.z * sin) * spd,
              vy: dir.y * spd,
              vz: (dir.x * sin + dir.z * cos) * spd,
              radius: 0.46,
              friendly: true,
              damage: Math.round(78 * this.getDamageMultiplier()),
              life: 4.0,
            });
          }
        }
      }
    }
    if (extra.length) this.projectiles.push(...extra);

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y, e.z - p.z);
      if (d <= 7.2 + sup * 2.5) {
        const inv = 1 / Math.max(0.1, d);
        e.vx += (e.x - p.x) * inv * 18;
        e.vz += (e.z - p.z) * inv * 18;
        this._damageEnemy(e, Math.round(38 * this.getDamageMultiplier()), false, 'ARC SHOCKWAVE');
      }
    }

    if (deflected > 0) {
      this._addStyle(300 * deflected, `DEFLECT ×${deflected}`);
      this.hitStop = 0.045;
    }

    this.sound?.playParry(deflected);
    this._emit('parry', { x: eye.x, y: eye.y, z: eye.z, deflected });
    return true;
  }

  _findBestGrappleTarget() {
    const eye = this.getEyePos();
    const fwd = this.getForwardVector();
    const maxRange = PLAYER_CFG.GRAPPLE_RANGE * (1 + 0.4 * this.relicCount('grapple_exec'));
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
      const score = dot * 100 - dist * 0.4 + (kind === 'enemy' ? 6 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { kind, id, x, y, z, dist };
      }
    };

    for (const r of this.arena.skyRings) consider('ring', r.id, r.x, r.y, r.z);
    for (const e of this.enemies) {
      if (e.hp > 0) consider('enemy', e.id, e.x, e.y + 0.5, e.z);
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
    const flowDecay = 1 / (1 + 0.4 * this.relicCount('overdrive_flow'));
    this.stylePoints = Math.max(0, this.stylePoints - dt * (90 + this.stylePoints * 0.055) * flowDecay);

    this._updatePlayer(dt);
    this._updateEnemies(dt);
    this._updateProjectiles(dt);

    if (this.input.firing) {
      this.fireWeapon();
    }

    this.grappleHighlight = this._findBestGrappleTarget();

    // Wave complete check -> Victory at Wave 8 or Draft!
    if (this.enemies.length === 0) {
      this.waveClearTimer += dt;
      if (this.waveClearTimer >= 1.3) {
        const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.veteran;
        this.score += Math.round(this.wave * 600 * diff.scoreMult);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25);
        this.player.shield = this.player.maxShield;
        if (this.score > this.bestScore) this.bestScore = this.score;

        if (this.wave === 8 && !this.endless) {
          this.state = 'victory';
          this._emit('state', { state: this.state });
        } else {
          this._openDraft();
        }
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
    p.recoil = Math.max(0, p.recoil - dt * 6.8);
    p.hitMarker = Math.max(0, p.hitMarker - dt);
    p.damageFlash = Math.max(0, p.damageFlash - dt * 2.5);
    p.fovBoost *= Math.exp(-6.5 * dt);

    // Reload progress
    if (p.reloadTimer > 0) {
      p.reloadTimer -= dt;
      if (p.reloadTimer <= 0) {
        p.reloadTimer = 0;
        const w = this.getActiveWeapon();
        w.ammo = w.maxAmmo;
      }
    }

    // Armor passive regeneration
    const armorMod = this.relicCount('reactive_armor');
    if (p.shieldRegenDelay > 0) {
      p.shieldRegenDelay -= dt;
    } else if (p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + (18 + armorMod * 12) * dt);
    }

    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

    // Smooth crouch-slide camera eye height
    const targetEye = p.slideTimer > 0 ? PLAYER_CFG.SLIDE_EYE_HEIGHT : PLAYER_CFG.EYE_HEIGHT;
    p.eyeHeight += (targetEye - p.eyeHeight) * Math.min(1, 14 * dt);

    if (p.grapple) {
      p.grapple.timer += dt;
      let enemyTarget = null;
      if (p.grapple.targetKind === 'enemy') {
        enemyTarget = this.enemies.find((e) => e.id === p.grapple.targetId && e.hp > 0);
        if (!enemyTarget) p.grapple = null;
        else {
          p.grapple.x = enemyTarget.x;
          p.grapple.y = enemyTarget.y + 0.5;
          p.grapple.z = enemyTarget.z;
        }
      }

      if (p.grapple) {
        const dx = p.grapple.x - p.x;
        const dy = p.grapple.y - (p.y + 1.0);
        const dz = p.grapple.z - p.z;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < (p.grapple.targetKind === 'enemy' ? 3.2 : 3.5) || p.grapple.timer > 1.35) {
          if (enemyTarget) {
            const dmg = Math.round(150 * this.getDamageMultiplier());
            this._damageEnemy(enemyTarget, dmg, true, 'KINETIC TAKEDOWN!');
            this.executes++;
            p.dashCooldown = 0;
            if (this.relicCount('grapple_exec') > 0) p.grappleCooldown = 0;
            p.shield = Math.min(p.maxShield, p.shield + 28);
            if (this.relicCount('vampire_nanites') > 0) {
              p.hp = Math.min(p.maxHp, p.hp + 28 * this.relicCount('vampire_nanites'));
            }
            p.invulnTimer = Math.max(p.invulnTimer, 0.42);
            p.vy = 11.8;
            p.vx *= 0.45;
            p.vz *= 0.45;
            this.hitStop = 0.055;
            this.sound?.playExecute();
            this._emit('impact', { x: enemyTarget.x, y: enemyTarget.y + 0.5, z: enemyTarget.z, color: 0xfde047, count: 28 });
          } else {
            p.vy = Math.max(p.vy, 13.0);
            p.jumpsLeft = 2 + this.relicCount('exo_boosters');
            this._addStyle(110, 'GRAPPLE SLINGSHOT');
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
    } else if (p.slideTimer > 0) {
      p.slideTimer -= dt;
      p.vx *= Math.exp(-1.6 * dt);
      p.vz *= Math.exp(-1.6 * dt);
      p.vy -= PLAYER_CFG.GRAVITY * dt;
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
      if (wLen > 0.001) { wishX /= wLen; wishZ /= wLen; }

      const speedMult = (1 + 0.15 * this.relicCount('exo_boosters')) * (p.ads ? 0.68 : 1.0);
      if (p.grounded) {
        const targetVx = wishX * PLAYER_CFG.GROUND_SPEED * speedMult;
        const targetVz = wishZ * PLAYER_CFG.GROUND_SPEED * speedMult;
        const blend = Math.min(1, PLAYER_CFG.GROUND_ACCEL * dt * 0.16);
        p.vx += (targetVx - p.vx) * blend;
        p.vz += (targetVz - p.vz) * blend;

        // Footstep rhythm while moving on stone/concrete
        const hSpd = Math.hypot(p.vx, p.vz);
        if (hSpd > 3.5) {
          p.footstepTimer -= dt * (hSpd / 11);
          if (p.footstepTimer <= 0) {
            p.footstepTimer = 0.36;
            this.sound?.playFootstep();
          }
        }
      } else if (p.wallRunSide !== 0) {
        p.vx += wishX * 28 * dt;
        p.vz += wishZ * 28 * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        const cap = PLAYER_CFG.WALL_RUN_SPEED * speedMult;
        if (hSpd > cap) { p.vx = (p.vx / hSpd) * cap; p.vz = (p.vz / hSpd) * cap; }
      } else {
        p.vx += wishX * PLAYER_CFG.AIR_ACCEL * speedMult * dt;
        p.vz += wishZ * PLAYER_CFG.AIR_ACCEL * speedMult * dt;
        const hSpd = Math.hypot(p.vx, p.vz);
        if (hSpd > 38) { p.vx = (p.vx / hSpd) * 38; p.vz = (p.vz / hSpd) * 38; }
      }

      const grav = p.wallRunSide !== 0 ? PLAYER_CFG.WALL_RUN_GRAVITY : PLAYER_CFG.GRAVITY;
      p.vy -= grav * dt;
      if (p.wallRunSide !== 0 && p.vy < -2.0) p.vy = -2.0;
    }

    if (p.jumpBuffer > 0) {
      const maxAir = 1 + this.relicCount('exo_boosters');
      if (p.wallRunSide !== 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED * 1.1;
        p.vx += p.wallRunNormalX * 14.0;
        p.vz += p.wallRunNormalZ * 14.0;
        p.wallRunSide = 0;
        p.jumpsLeft = maxAir;
        p.jumpBuffer = 0;
        p.fovBoost = Math.max(p.fovBoost, 8);
        this.sound?.playDash();
        this._addStyle(85, 'WALL LEAP');
      } else if (p.grounded || p.coyoteTimer > 0) {
        p.vy = PLAYER_CFG.JUMP_SPEED;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.jumpsLeft = maxAir;
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
      if (Math.hypot(p.x - pad.x, p.z - pad.z) <= pad.radius && Math.abs(p.y - pad.y) <= 1.8) {
        p.vy = pad.boostY;
        const toC = Math.hypot(p.x, p.z) || 1;
        p.vx += (-p.x / toC) * pad.boostHoriz;
        p.vz += (-p.z / toC) * pad.boostHoriz;
        p.grounded = false;
        p.jumpsLeft = 2 + this.relicCount('exo_boosters');
        p.fovBoost = Math.max(p.fovBoost, 13);
        this.sound?.playJumpPad();
        this._addStyle(75, 'TURBINE LAUNCH');
      }
    }

    // Ocean Rescue Updraft if knocked over cliff
    if (p.y < -11.5) {
      p.x = 0;
      p.y = 13;
      p.z = 16;
      p.vx = 0;
      p.vy = 6;
      p.vz = 0;
      p.grapple = null;
      this.sound?.playJumpPad();
    }

    const strafeRoll = (this.input.left ? 1 : 0) * 0.02 + (this.input.right ? -1 : 0) * 0.02;
    const targetRoll = p.wallRunSide !== 0 ? p.wallRunSide * 0.22 : p.slideTimer > 0 ? -0.09 : strafeRoll;
    p.cameraRoll += (targetRoll - p.cameraRoll) * Math.min(1, 11 * dt);

    const spd = Math.hypot(p.vx, p.vy, p.vz);
    if (spd > this.maxSpeedReached) this.maxSpeedReached = spd;
    this.sound?.updateWind(spd);
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
      if (boxTop - p.y <= 0.95 && boxTop - p.y > 0) { p.y = boxTop; p.grounded = true; continue; }
      if (p.vx > 0) p.x = b.x - b.w * 0.5 - r;
      else if (p.vx < 0) p.x = b.x + b.w * 0.5 + r;
      p.vx = 0;
    }

    p.z += p.vz * dt;
    for (const b of this.arena.boxes) {
      if (!this._overlapsBox(p.x, p.y, p.z, r, h, b)) continue;
      const boxTop = b.y + b.h * 0.5;
      if (boxTop - p.y <= 0.95 && boxTop - p.y > 0) { p.y = boxTop; p.grounded = true; continue; }
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
        p.jumpsLeft = 2 + this.relicCount('exo_boosters');
      } else {
        p.y = b.y - b.h * 0.5 - h;
        p.vy = 0;
      }
    }

    if (!p.grounded && !p.grapple && Math.hypot(p.vx, p.vz) > 4.5) {
      const rightX = Math.cos(p.yaw);
      for (const b of this.arena.boxes) {
        if (!b.wallRun) continue;
        if (
          p.x >= b.x - b.w * 0.5 - r - 0.45 &&
          p.x <= b.x + b.w * 0.5 + r + 0.45 &&
          p.y + 0.8 >= b.y - b.h * 0.5 &&
          p.y <= b.y + b.h * 0.5 &&
          p.z >= b.z - b.d * 0.5 - r - 0.45 &&
          p.z <= b.z + b.d * 0.5 + r + 0.45
        ) {
          const nx = p.x < b.x ? -1 : 1;
          p.wallRunSide = nx * rightX > 0 ? -1 : 1;
          p.wallRunNormalX = nx;
          p.wallRunNormalZ = 0;
          p.jumpsLeft = 1 + this.relicCount('exo_boosters');
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
      e.shieldFlash = Math.max(0, e.shieldFlash - dt * 4);
      e.slowTimer = Math.max(0, e.slowTimer - dt);
      const slowMult = e.slowTimer > 0 ? 0.62 : 1.0;

      const dx = eye.x - e.x;
      const dy = eye.y - e.y;
      const dz = eye.z - e.z;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const hDist = Math.hypot(dx, dz) || 1;

      // Face player smoothly (all articulated units aim toward player!)
      e.angle = Math.atan2(dx, dz);

      if (e.type === 'drone') {
        const radial = dist > 16 ? 1 : -0.4;
        const strafe = Math.sin(this.time * 1.4 + e.id) * 0.85;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const targetY = Math.max(4.5, p.y + 4.4 + Math.sin(this.time * 2 + e.id) * 1.3);
        e.vx += (tx * e.speed * slowMult - e.vx) * Math.min(1, 3.5 * dt);
        e.vz += (tz * e.speed * slowMult - e.vz) * Math.min(1, 3.5 * dt);
        e.vy += ((targetY - e.y) * 2.2 - e.vy) * Math.min(1, 4 * dt);
      } else if (e.type === 'seeker') {
        const strafe = Math.cos(this.time * 2.8 + e.id * 1.5) * 1.1;
        const radial = dist > 13 ? 1.0 : -0.6;
        const tx = (dx / dist) * radial - (dz / dist) * strafe;
        const tz = (dz / dist) * radial + (dx / dist) * strafe;
        const targetY = Math.max(3.8, p.y + 3.4 + Math.sin(this.time * 3.6 + e.id) * 2.0);
        e.vx += (tx * e.speed * slowMult - e.vx) * Math.min(1, 4.8 * dt);
        e.vz += (tz * e.speed * slowMult - e.vz) * Math.min(1, 4.8 * dt);
        e.vy += ((targetY - e.y) * 3.0 - e.vy) * Math.min(1, 4.5 * dt);
      } else if (e.type === 'striker' || e.type === 'aegis' || e.type === 'juggernaut') {
        const stopDist = e.type === 'juggernaut' ? 14 : e.type === 'aegis' ? 9 : 11;
        const moveMult = hDist > stopDist ? 1 : -0.2;
        e.vx += ((dx / hDist) * e.speed * slowMult * moveMult - e.vx) * Math.min(1, 4.5 * dt);
        e.vz += ((dz / hDist) * e.speed * slowMult * moveMult - e.vz) * Math.min(1, 4.5 * dt);
        // Keep bipedal walkers grounded on fortress height smoothly
        const desiredY = e.type === 'juggernaut' ? 1.95 : 1.15;
        e.vy += ((desiredY - e.y) * 6 - e.vy) * Math.min(1, 8 * dt);
        e.stridePhase += Math.hypot(e.vx, e.vz) * dt * (e.type === 'juggernaut' ? 0.9 : 1.6);
      } else if (e.type === 'viper') {
        e.telegraphTimer = e.fireTimer < 1.0 ? 1.0 - e.fireTimer : 0;
      } else if (e.type === 'gunship') {
        if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
          e.phase = 2;
          this._emit('announcement', {
            title: 'VALKYRIE GUNSHIP · OVERDRIVE BARRAGE',
            subtitle: 'Use Shockwave Parry [Q] to send missiles right back!',
          });
        }
        const orbitA = this.time * (e.phase === 2 ? 0.34 : 0.24);
        const targetX = Math.cos(orbitA) * 20;
        const targetZ = Math.sin(orbitA) * 20;
        const targetY = 17.0 + Math.sin(this.time * 0.8) * 1.8;
        e.vx += ((targetX - e.x) * 1.2 - e.vx) * Math.min(1, 2.2 * dt);
        e.vy += ((targetY - e.y) * 1.5 - e.vy) * Math.min(1, 2.5 * dt);
        e.vz += ((targetZ - e.z) * 1.2 - e.vz) * Math.min(1, 2.2 * dt);

        // Transform attached destructible Engine Nacelles into world coordinates
        const ca = Math.cos(e.angle);
        const sa = Math.sin(e.angle);
        for (const c of e.crystals) {
          c.x = e.x + c.ox * ca + c.oz * sa;
          c.y = e.y + c.oy;
          c.z = e.z - c.ox * sa + c.oz * ca;
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;

      e.fireTimer -= dt * slowMult;
      if (e.fireTimer <= 0) {
        e.fireTimer = e.fireCd * (e.phase === 2 ? 0.72 : 1.0);
        e.telegraphTimer = 0;
        this._fireEnemyProjectile(e, eye);
      }
    }
  }

  _fireEnemyProjectile(e, eye) {
    const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.veteran;
    const dx = eye.x - e.x;
    const dy = eye.y - (e.y + 0.5);
    const dz = eye.z - e.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const spd = e.type === 'viper' ? 36 : e.type === 'gunship' ? 23 : 20;

    if (e.type === 'gunship' || e.type === 'juggernaut') {
      const fan = e.type === 'juggernaut' ? 3 : e.phase === 2 ? 5 : 3;
      const baseYaw = Math.atan2(dx, dz);
      for (let k = 0; k < fan; k++) {
        const a = baseYaw + (k - (fan - 1) / 2) * 0.18;
        this.projectiles.push({
          id: uid(),
          x: e.x,
          y: e.y + 0.5,
          z: e.z,
          vx: Math.sin(a) * spd,
          vy: (dy / len) * spd,
          vz: Math.cos(a) * spd,
          radius: 0.55,
          friendly: false,
          damage: Math.round(15 * diff.enemyDmg),
          life: 5.5,
        });
      }
      return;
    }

    this.projectiles.push({
      id: uid(),
      x: e.x,
      y: e.y + 0.5,
      z: e.z,
      vx: (dx / len) * spd,
      vy: (dy / len) * spd,
      vz: (dz / len) * spd,
      radius: e.type === 'viper' ? 0.4 : 0.46,
      friendly: false,
      damage: Math.round((e.type === 'viper' ? 22 : 13) * diff.enemyDmg),
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
          if (Math.hypot(proj.x - e.x, proj.y - e.y, proj.z - e.z) <= e.radius + proj.radius + 0.8) {
            this._damageEnemy(e, proj.damage, true, 'PARRY RETURN!');
            this._emit('impact', { x: proj.x, y: proj.y, z: proj.z, color: 0xfde047, count: 18 });
            hit = true;
            break;
          }
        }
        if (hit) this.projectiles.splice(i, 1);
      } else {
        if (p.invulnTimer <= 0 && Math.hypot(proj.x - eye.x, proj.y - (p.y + 0.9), proj.z - eye.z) <= 1.2) {
          this._damagePlayer(proj.damage, proj.x - proj.vx * 0.2, proj.z - proj.vz * 0.2);
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
      y: e.y + e.radius + 0.5,
      z: e.z,
      amount: Math.round(amount),
      crit,
    });

    if (e.hp <= 0) {
      e.hp = 0;
      this.kills++;
      if (crit) this.headshots++;
      this.player.hitMarkerKill = true;
      this.combo++;
      this.comboTimer = 5.0;

      const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.veteran;
      const mult = (1 + Math.min(5, this.combo * 0.25)) * diff.scoreMult;
      this.score += Math.round(e.score * mult);
      if (this.score > this.bestScore) this.bestScore = this.score;

      const vamp = this.relicCount('vampire_nanites');
      if (vamp > 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8 * vamp);
        this.player.shield = Math.min(this.player.maxShield, this.player.shield + 12 * vamp);
      }

      if (this.relicCount('frag_shells') > 0) {
        this._fragSplash(e.x, e.y, e.z, e.id, 30 * this.relicCount('frag_shells') * this.getDamageMultiplier());
      }

      this._addStyle(crit ? 260 : 170, styleTag || (crit ? 'CRITICAL KILL' : 'HOSTILE DOWN'));
      this.sound?.playExplosion(e.type === 'gunship' || e.type === 'juggernaut');
      this._emit('enemy_kill', { enemy: e, crit, styleTag });
    } else if (styleTag) {
      this._addStyle(110, styleTag);
    }
  }

  _damagePlayer(amount, srcX = 0, srcZ = 0) {
    const p = this.player;
    if (p.invulnTimer > 0) return;
    p.invulnTimer = 0.42;
    p.shieldRegenDelay = 2.8;
    p.damageFlash = 1.0;

    // Relative angle from player's view direction to damage source for directional hit indicator!
    const worldAngle = Math.atan2(srcX - p.x, -(srcZ - p.z));
    p.damageDirAngle = worldAngle + p.yaw;

    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, amount);
      p.shield -= absorbed;
      const rem = amount - absorbed;
      if (rem > 0) p.hp = Math.max(0, p.hp - rem);
    } else {
      p.hp = Math.max(0, p.hp - amount);
    }

    this.stylePoints = Math.max(0, this.stylePoints - 300);
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
