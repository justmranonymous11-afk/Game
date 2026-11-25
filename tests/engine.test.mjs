import test from 'node:test';
import assert from 'node:assert/strict';

import { ARENA, PLAYER_BASE, RELICS } from '../src/constants.js';
import { GameEngine } from '../src/engine.js';
import { createEnemy, createProjectile } from '../src/entities.js';
import {
  orderPolygonPoints,
  pointInPolygon,
  polygonArea,
  segmentIntersectsCircle,
} from '../src/math.js';

test('math: orderPolygonPoints produces non-self-intersecting polygon and pointInPolygon works accurately', () => {
  // Bowtie input order
  const raw = [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
  ];
  const poly = orderPolygonPoints(raw);
  assert.equal(Math.round(polygonArea(poly)), 10000);
  assert.equal(pointInPolygon(50, 50, poly), true);
  assert.equal(pointInPolygon(150, 50, poly), false);
  // Edge padding allows enemies straddling border to be caught
  assert.equal(pointInPolygon(108, 50, poly, 10), true);
  assert.equal(segmentIntersectsCircle(0, 0, 100, 0, 50, 8, 10), true);
  assert.equal(segmentIntersectsCircle(0, 0, 100, 0, 50, 20, 10), false);
});

test('engine: player movement stays clamped within arena bounds', () => {
  const engine = new GameEngine({ seed: 101 });
  engine.startRun();
  engine.input.left = true;
  engine.input.up = true;
  for (let i = 0; i < 300; i++) engine.step(1 / 60);

  assert.ok(engine.player.x >= ARENA.PADDING + engine.player.radius - 0.01);
  assert.ok(engine.player.y >= ARENA.PADDING + engine.player.radius - 0.01);
  assert.ok(!Number.isNaN(engine.player.x) && !Number.isNaN(engine.player.y));
});

test('engine: tethering enemies and snapping triggers chain cleave & kills target', () => {
  const engine = new GameEngine({ seed: 202 });
  engine.startRun();
  engine.spawnQueue = [];
  engine.enemies = [];

  const target = createEnemy('mote', engine.player.x + 160, engine.player.y, 1);
  target.spawnTimer = 0;
  engine.enemies.push(target);

  assert.equal(engine.fireTether(target.x, target.y), true);
  // Step until dart hits target
  for (let i = 0; i < 30; i++) engine.step(1 / 60);
  assert.equal(engine.tethers.length, 1);

  // Snap-cleave through the tethered enemy
  assert.equal(engine.triggerSnap(), true);
  assert.equal(engine.player.cleaving, true);

  for (let i = 0; i < 45; i++) engine.step(1 / 60);
  assert.equal(engine.player.cleaving, false);
  assert.equal(engine.kills >= 1, true);
  assert.equal(engine.enemies.length, 0);
});

test('engine: 3+ tethers trigger Loom Seal, obliterate interior enemies, prevent weaver split, and erase bullets', () => {
  const engine = new GameEngine({ seed: 303 });
  engine.startRun();
  engine.spawnQueue = [];
  engine.enemies = [];

  const cx = ARENA.WIDTH * 0.5;
  const cy = ARENA.HEIGHT * 0.5;

  // 3 vertices forming a large triangle around center
  const a = createEnemy('mote', cx, cy - 160, 1);
  const b = createEnemy('mote', cx - 170, cy + 120, 1);
  const c = createEnemy('mote', cx + 170, cy + 120, 1);
  // Spindle Weaver inside the triangle — should NOT split when killed by Seal!
  const weaver = createEnemy('weaver', cx, cy, 1);
  for (const e of [a, b, c, weaver]) {
    e.spawnTimer = 0;
    engine.enemies.push(e);
  }

  // Enemy bullet inside the triangle — should be erased!
  engine.projectiles.push(createProjectile(cx + 15, cy + 10, 0, 0, false));

  // Attach 3 tethers directly
  engine._attachTether(a, 'enemy');
  engine._attachTether(b, 'enemy');
  engine._attachTether(c, 'enemy');
  assert.equal(engine.tethers.length, 3);
  assert.ok(engine.getTetherGeometry().polygon !== null);

  assert.equal(engine.triggerSnap(), true);
  assert.equal(engine.sealsTriggered, 1);
  assert.equal(engine.projectiles.length, 0, 'Enemy bullets inside Loom Seal must be erased');
  assert.equal(weaver.hp, 0, 'Interior Spindle Weaver must be obliterated');

  // Step once to prune dead enemies and verify weaver did NOT split into 2 motes
  engine.hitStop = 0;
  engine.step(1 / 60);
  assert.equal(engine.enemies.length, 0, 'Weaver killed by Loom Seal must not split');
});

test('engine: Parry Chime with 0 tethers deflects enemy projectiles into homing gold needles', () => {
  const engine = new GameEngine({ seed: 404 });
  engine.startRun();
  engine.spawnQueue = [];
  engine.enemies = [];
  engine.relics.shatter_chime = 1; // Should split into 3 gold needles!

  const proj = createProjectile(engine.player.x + 40, engine.player.y, -100, 0, false);
  engine.projectiles.push(proj);

  assert.equal(engine.tethers.length, 0);
  assert.equal(engine.triggerSnap(), true);
  assert.equal(engine.parriesLanded, 1);
  assert.equal(engine.projectiles.length, 3, 'Shatter Chime Lv1 should split 1 parried bullet into 3 friendly needles');
  assert.ok(engine.projectiles.every((p) => p.friendly && p.homing));
});

test('engine: Boss phase transition and Resonance Break via Loom Seal', () => {
  const engine = new GameEngine({ seed: 505 });
  engine.startRun();
  engine.spawnQueue = [];
  engine.enemies = [];

  const boss = createEnemy('boss', ARENA.WIDTH * 0.5, ARENA.HEIGHT * 0.5, 1);
  boss.spawnTimer = 0;
  engine.enemies.push(boss);

  // Tether all 3 orbiting boss resonance nodes!
  for (const node of boss.nodes) {
    engine._attachTether(node, 'boss_node');
  }
  const hpBefore = boss.hp;
  engine.triggerSnap();
  assert.ok(boss.hp < hpBefore, 'Loom Seal on boss nodes must deal heavy damage');
  assert.ok(boss.stunTimer > 0, 'Loom Seal on boss must trigger Resonance Break stun');

  // Drop boss below 55% HP and verify Phase 2 triggers
  boss.hp = boss.maxHp * 0.5;
  boss.stunTimer = 0;
  engine.hitStop = 0;
  engine.step(1 / 60);
  assert.equal(boss.phase, 2, 'Boss must transition to Phase 2 below 55% HP');
});

test('engine: wave completion opens Relic Draft and selecting a relic advances wave', () => {
  const engine = new GameEngine({ seed: 606 });
  engine.startRun();
  engine.spawnQueue.forEach((s) => {
    s.spawned = true;
  });
  engine.enemies = [];

  // Advance past waveClearDelay (0.9s)
  for (let i = 0; i < 70; i++) engine.step(1 / 60);
  assert.equal(engine.state, 'draft');
  assert.equal(engine.draftChoices.length, 3);

  const pick = engine.draftChoices[0];
  assert.equal(engine.selectRelic(pick.id), true);
  assert.equal(engine.state, 'playing');
  assert.equal(engine.wave, 2);
  assert.equal(engine.relicCount(pick.id), 1);
});

test('engine: all 12 relics stack cleanly and 10,000-tick stress simulation stays NaN-free', () => {
  const engine = new GameEngine({ seed: 707 });
  engine.startRun();

  // Grant 1 stack of every relic to exercise every code path simultaneously
  for (const r of RELICS) {
    engine.relics[r.id] = 1;
  }
  engine._setupPylons();
  engine.player.maxHp = 99;
  engine.player.hp = 99;

  for (let tick = 0; tick < 10000; tick++) {
    // Simulate active player inputs
    engine.input.up = (tick % 180) < 90;
    engine.input.right = (tick % 240) < 120;
    engine.input.left = !engine.input.right;

    if (tick % 25 === 0 && engine.enemies.length > 0) {
      const target = engine.enemies[tick % engine.enemies.length];
      engine.fireTether(target.x, target.y);
    }
    if (tick % 65 === 0) {
      engine.triggerSnap();
    }

    if (engine.state === 'draft' && engine.draftChoices.length > 0) {
      engine.selectRelic(engine.draftChoices[0].id);
    } else if (engine.state === 'victory') {
      engine.continueEndless();
    } else if (engine.state === 'gameover') {
      break;
    }

    engine.step(1 / 60);

    // Invariants
    assert.ok(Number.isFinite(engine.player.x) && Number.isFinite(engine.player.y), 'Player position must stay finite');
    assert.ok(engine.particles.length <= 260, 'Particle pool must stay bounded');
    assert.ok(engine.decals.length <= 95, 'Decal pool must stay bounded');
  }

  assert.ok(engine.kills > 0, 'Simulated player must score kills');
  assert.ok(engine.score > 0, 'Simulated player must earn score');
});
