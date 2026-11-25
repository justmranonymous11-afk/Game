import test from 'node:test';
import assert from 'node:assert/strict';

import { PLAYER_CFG, SolarisEngine } from '../src/physics.js';

test('3D physics: player lands cleanly on limestone courtyard and double-jumps', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  for (let i = 0; i < 60; i++) eng.step(1 / 60);
  assert.equal(eng.player.grounded, true);
  assert.ok(Math.abs(eng.player.y - 0) < 0.05, `Expected y ~ 0, got ${eng.player.y}`);

  eng.pressJump();
  eng.step(1 / 60);
  assert.equal(eng.player.grounded, false);
  assert.ok(eng.player.vy > 10);

  for (let i = 0; i < 15; i++) eng.step(1 / 60);
  eng.pressJump();
  eng.step(1 / 60);
  assert.equal(eng.player.jumpsLeft, 0);
});

test('3D movement: grounded sprint + Shift triggers Tactical Crouch-Slide lowering eye height', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  for (let i = 0; i < 60; i++) eng.step(1 / 60);
  eng.input.forward = true;
  for (let i = 0; i < 30; i++) eng.step(1 / 60);

  assert.equal(eng.triggerDashOrSlide(), true);
  assert.ok(eng.player.slideTimer > 0, 'Must enter crouch-slide state');
  for (let i = 0; i < 12; i++) eng.step(1 / 60);
  assert.ok(eng.player.eyeHeight < 1.35, `Expected crouched eye height, got ${eng.player.eyeHeight}`);
});

test('3D arsenal: switching between Carbine, Railgun, and Shotgun, ammo consumption, and Aegis shield pierce', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  eng.player.y = 0;
  eng.player.z = 16;
  eng.player.yaw = 0;
  eng.player.pitch = 0;

  // Place Aegis Shield-Trooper facing player cleanly at z = 9 (in front of central tower)
  const aegis = eng._spawnEnemy('aegis', 0, 1.15, 9, 1);
  aegis.angle = 0; // Facing +Z (toward player at z=16)

  // Carbine frontal shot should be blocked by Aegis Ballistic Shield!
  assert.equal(eng.activeWeaponId, 'carbine');
  const hpBefore = aegis.hp;
  assert.equal(eng.fireWeapon(), true);
  assert.equal(eng.getActiveWeapon().ammo, 29);
  assert.equal(aegis.hp, hpBefore, 'Frontal Carbine shot should be blocked by Aegis Shield');

  // Switch to Helio-9 Railgun [2] -> pierces right through Aegis Ballistic Shield!
  assert.equal(eng.selectWeapon('railgun'), true);
  eng.player.fireCooldown = 0;
  assert.equal(eng.fireWeapon(), true);
  assert.ok(aegis.hp < hpBefore, 'Railgun must pierce Aegis Ballistic Shield');

  // Switch to M88 Breacher Shotgun [3]
  assert.equal(eng.selectWeapon('shotgun'), true);
  assert.equal(eng.getActiveWeapon().pellets, 8);
});

test('3D grapple: Grapple locks enemy and executes Kinetic Takedown on arrival', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  const drone = eng._spawnEnemy('drone', 0, eng.getEyePos().y, eng.player.z - 8, 1);
  eng.player.yaw = 0;
  eng.player.pitch = 0;

  assert.equal(eng.triggerGrapple(), true);
  assert.ok(eng.player.grapple !== null);

  for (let i = 0; i < 60; i++) eng.step(1 / 60);
  assert.equal(eng.executes, 1);
  assert.equal(eng.kills, 1);
});

test('3D parry: Arc Shockwave deflects incoming enemy projectile into friendly counter', () => {
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
    radius: 0.46,
    friendly: false,
    damage: 14,
    life: 4,
  });

  assert.equal(eng.triggerParry(), true);
  assert.equal(eng.parries, 1);
  assert.equal(eng.projectiles[0].friendly, true);
});

test('3D boss & enemies: Valkyrie Gunship + all 6 regular archetypes spawn & simulate cleanly', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  const types = ['drone', 'striker', 'aegis', 'viper', 'juggernaut', 'seeker'];
  types.forEach((t, i) => eng._spawnEnemy(t, (i - 3) * 4, 3, 6, 1));
  const boss = eng._spawnEnemy('gunship', 0, 17, -14, 1);
  assert.equal(boss.crystals.length, 4);

  boss.hp = boss.maxHp * 0.45;
  for (let i = 0; i < 90; i++) eng.step(1 / 60);
  assert.equal(boss.phase, 2, 'Valkyrie Gunship must enter Phase II below 50% HP');
  assert.ok(eng.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y)));
});

test('3D progression: wave clear opens 3-card Tactical Armory Draft and Wave 8 triggers Victory', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.enemies = [];
  for (let i = 0; i < 90; i++) eng.step(1 / 60);
  assert.equal(eng.state, 'draft');
  assert.equal(eng.draftChoices.length, 3);

  const pick = eng.draftChoices[0];
  assert.equal(eng.selectRelic(pick.id), true);
  assert.equal(eng.state, 'playing');
  assert.equal(eng.wave, 2);

  // Simulate completing Wave 8 -> Campaign Victory -> Continue Endless!
  eng.wave = 8;
  eng.enemies = [];
  for (let i = 0; i < 90; i++) eng.step(1 / 60);
  assert.equal(eng.state, 'victory');
  eng.continueEndless();
  assert.equal(eng.state, 'draft');
  assert.equal(eng.endless, true);
});

test('3D stress: 5,000-tick combat & movement simulation stays NaN-free', () => {
  const eng = new SolarisEngine();
  eng.startRun();
  eng.player.maxHp = 9999;
  eng.player.hp = 9999;

  for (let i = 0; i < 5000; i++) {
    eng.input.forward = (i % 120) < 90;
    eng.input.right = (i % 200) < 100;
    eng.player.yaw += 0.015;
    if (i % 55 === 0) eng.pressJump();
    if (i % 90 === 0) eng.triggerDashOrSlide();
    if (i % 75 === 0) eng.triggerGrapple();
    if (i % 20 === 0) eng.fireWeapon();
    if (i % 130 === 0) eng.triggerParry();
    if (i % 240 === 0) eng.cycleWeapon(1);
    if (eng.state === 'draft' && eng.draftChoices[0]) eng.selectRelic(eng.draftChoices[0].id);
    if (eng.state === 'victory') eng.continueEndless();
    eng.step(1 / 60);

    assert.ok(
      Number.isFinite(eng.player.x) && Number.isFinite(eng.player.y) && Number.isFinite(eng.player.z),
      'Player 3D coordinates must stay finite'
    );
  }
});

test('3D expansion: all 3 maps build cleanly, Frag Grenade detonates & kills enemies, and Med-Stim heals', () => {
  for (const mapId of ['aegis', 'helios', 'frostpeak']) {
    const eng = new SolarisEngine({ mapId });
    eng.startRun();
    assert.ok(eng.arena.boxes.length >= 12, `${mapId} must contain architectural colliders`);
    assert.ok(eng.supplyStates.length >= 3, `${mapId} must contain Med/Armor supply crates`);
  }

  const eng = new SolarisEngine({ mapId: 'aegis' });
  eng.startRun();
  eng.enemies = [];
  eng.player.y = 0;
  eng.player.z = 16;
  eng.player.yaw = 0;
  eng.player.pitch = 0.05;
  const target = eng._spawnEnemy('striker', 0, 1.15, 9, 1);
  eng._spawnEnemy('viper', 35, 8.6, 35, 1); // Keeps wave active after grenade kill

  assert.equal(eng.throwGrenade(), true);
  assert.equal(eng.grenades.length, 1);
  for (let i = 0; i < 95; i++) eng.step(1 / 60);
  assert.equal(target.hp, 0, 'Frag grenade blast must eliminate Striker trooper');

  // Walk onto Med-Stim supply crate when damaged
  const med = eng.supplyStates.find((s) => s.kind === 'med');
  eng.player.hp = 50;
  eng.player.x = med.x;
  eng.player.y = med.y;
  eng.player.z = med.z;
  eng.step(1 / 60);
  assert.ok(eng.player.hp > 50, 'Med-Stim crate must heal player on pickup');
  assert.equal(med.ready, false);
});
