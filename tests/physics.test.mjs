import test from 'node:test';
import assert from 'node:assert/strict';

import { PLAYER_CFG, SolarisEngine } from '../src/physics.js';

test('3D physics: player lands cleanly on central deck and double-jumps', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  for (let i = 0; i < 60; i++) eng.step(1 / 60);
  assert.equal(eng.player.grounded, true);
  assert.ok(Math.abs(eng.player.y - 0) < 0.05, `Expected y ~ 0, got ${eng.player.y}`);

  eng.pressJump();
  eng.step(1 / 60);
  assert.equal(eng.player.grounded, false);
  assert.ok(eng.player.vy > 10);

  // Double jump mid-air
  for (let i = 0; i < 15; i++) eng.step(1 / 60);
  eng.pressJump();
  eng.step(1 / 60);
  assert.equal(eng.player.jumpsLeft, 0);
});

test('3D combat: Prism Lance raycast hits enemy and deals crit/kill damage', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  const drone = eng._spawnEnemy('drone', 0, eng.getEyePos().y, eng.player.z - 8, 1);
  eng.player.yaw = 0;
  eng.player.pitch = 0;

  assert.equal(eng.fireWeapon(), true);
  assert.ok(drone.hp < drone.maxHp, 'Hitscan Prism Lance must damage enemy directly ahead');
});

test('3D grapple: Solar Grapple locks enemy and executes shatter on arrival', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  const drone = eng._spawnEnemy('drone', 0, eng.getEyePos().y, eng.player.z - 8, 1);
  eng.player.yaw = 0;
  eng.player.pitch = 0;

  assert.equal(eng.triggerGrapple(), true);
  assert.ok(eng.player.grapple !== null);

  for (let i = 0; i < 60; i++) eng.step(1 / 60);
  assert.equal(eng.executes, 1, 'Grappling into enemy must trigger Execute Shatter');
  assert.equal(eng.kills, 1, 'Execute Shatter must eliminate standard Sentinel Drone');
});

test('3D parry: Shockwave Parry deflects incoming enemy plasma orb into friendly counter', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  const eye = eng.getEyePos();
  eng.projectiles.push({
    id: 999,
    x: eye.x,
    y: eye.y,
    z: eye.z - 4,
    vx: 0,
    vy: 0,
    vz: 15,
    radius: 0.5,
    friendly: false,
    damage: 14,
    life: 4,
  });

  assert.equal(eng.triggerParry(), true);
  assert.equal(eng.parries, 1);
  assert.equal(eng.projectiles[0].friendly, true);
});

test('3D boss: Solar Colossus spawns orbiting crystals and transitions to Phase II', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  const boss = eng._spawnEnemy('colossus', 0, 14, -14, 1);
  assert.equal(boss.crystals.length, 4);

  boss.hp = boss.maxHp * 0.45;
  eng.step(1 / 60);
  assert.equal(boss.phase, 2);
});

test('3D stress: 5,000-tick kinetic parkour & combat simulation stays NaN-free', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.player.maxHp = 9999;
  eng.player.hp = 9999;

  for (let i = 0; i < 5000; i++) {
    eng.input.forward = (i % 120) < 90;
    eng.input.right = (i % 200) < 100;
    eng.player.yaw += 0.015;
    if (i % 55 === 0) eng.pressJump();
    if (i % 90 === 0) eng.triggerDash();
    if (i % 75 === 0) eng.triggerGrapple();
    if (i % 20 === 0) eng.fireWeapon();
    if (i % 130 === 0) eng.triggerParry();
    eng.step(1 / 60);

    assert.ok(
      Number.isFinite(eng.player.x) && Number.isFinite(eng.player.y) && Number.isFinite(eng.player.z),
      'Player 3D coordinates must remain finite'
    );
  }
});
