import { ARENA, ENEMY_TYPES, PLAYER_BASE } from './constants.js';

let nextEntityId = 1;
export function genId() {
  return nextEntityId++;
}

export function resetEntityIds() {
  nextEntityId = 1;
}

export function createPlayer() {
  const x = ARENA.WIDTH * 0.5;
  const y = ARENA.HEIGHT * 0.5;
  const scarf = [];
  for (let i = 0; i < 10; i++) {
    scarf.push({ x: x - i * 4, y });
  }
  return {
    id: genId(),
    x,
    y,
    vx: 0,
    vy: 0,
    radius: PLAYER_BASE.RADIUS,
    hp: PLAYER_BASE.MAX_HP,
    maxHp: PLAYER_BASE.MAX_HP,
    aimAngle: 0,
    facingAngle: 0,
    invulnTimer: 0,
    tetherCooldown: 0,
    parryCooldown: 0,
    parryTimer: 0,
    parryFlash: 0,
    // Active cleave dash state
    cleaving: false,
    cleaveQueue: [],
    cleaveTarget: null,
    cleaveChainIndex: 0,
    cleaveTrail: [],
    // Visual flair
    haloAngle: 0,
    hitFlash: 0,
    scarf,
  };
}

export function createPylon(x, y) {
  return {
    id: genId(),
    kind: 'pylon',
    x,
    y,
    radius: 18,
    ringTimer: 0,
    ringScale: 0,
    tethered: false,
  };
}

export function createEnemy(typeId, x, y, waveScale = 1, rng = Math.random) {
  const spec = ENEMY_TYPES[typeId];
  const hp = Math.round(spec.hp * waveScale);
  const enemy = {
    id: genId(),
    kind: 'enemy',
    type: typeId,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: spec.radius,
    hp,
    maxHp: hp,
    speed: spec.speed,
    score: spec.score,
    mass: spec.mass,
    angle: rng() * Math.PI * 2,
    hitFlash: 0,
    burnTimer: 0,
    stunTimer: 0,
    spawnTimer: 0.45, // Brief ink-brush materialization telegraph before dealing contact damage
    // AI state
    aiTimer: 0.6 + rng() * 1.1,
    aiState: 'idle', // 'idle' | 'telegraph' | 'charge' | 'fire'
    telegraphAngle: 0,
    telegraphProgress: 0,
    chargeVx: 0,
    chargeVy: 0,
    // Boss-specific
    phase: 1,
    nodes: [],
    bossAttackIndex: 0,
  };

  if (typeId === 'boss') {
    const nodeCount = 3;
    for (let i = 0; i < nodeCount; i++) {
      const a = (i / nodeCount) * Math.PI * 2;
      enemy.nodes.push({
        id: genId(),
        kind: 'boss_node',
        parentId: enemy.id,
        angle: a,
        orbitRadius: 94,
        x: x + Math.cos(a) * 94,
        y: y + Math.sin(a) * 94,
        radius: 14,
        ringTimer: 0,
      });
    }
  }

  return enemy;
}

export function createDart(x, y, vx, vy, maxRange, pierce = 0) {
  return {
    id: genId(),
    x,
    y,
    startX: x,
    startY: y,
    vx,
    vy,
    radius: 9,
    maxRange,
    pierceLeft: pierce,
    hitIds: new Set(),
    alive: true,
    trail: [{ x, y }],
  };
}

export function createProjectile(x, y, vx, vy, friendly = false, opts = {}) {
  return {
    id: genId(),
    x,
    y,
    vx,
    vy,
    radius: opts.radius ?? (friendly ? 7 : 8),
    friendly,
    homing: opts.homing ?? friendly,
    damage: opts.damage ?? (friendly ? 46 : 1),
    life: opts.life ?? (friendly ? 3.2 : 5.5),
    pierce: opts.pierce ?? 0,
    hitIds: new Set(),
    color: opts.color ?? (friendly ? '#F2C14E' : '#D9381E'),
  };
}

export function createMire(x, y) {
  return {
    id: genId(),
    x,
    y,
    radius: 54,
    life: 5.5,
    maxLife: 5.5,
  };
}
