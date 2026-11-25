import { ARENA, PALETTE } from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.bgCanvas = this._buildPaperBackdrop();
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(ARENA.WIDTH * this.dpr);
    this.canvas.height = Math.round(ARENA.HEIGHT * this.dpr);
  }

  /**
   * Pre-renders the warm washi-paper texture, subtle linen fibers,
   * delicate etched astrolabe rings, and lacquer frame once onto an offscreen canvas.
   */
  _buildPaperBackdrop() {
    const off = document.createElement('canvas');
    off.width = ARENA.WIDTH;
    off.height = ARENA.HEIGHT;
    const g = off.getContext('2d');

    // Warm parchment radial base
    const grad = g.createRadialGradient(
      ARENA.WIDTH * 0.5,
      ARENA.HEIGHT * 0.48,
      60,
      ARENA.WIDTH * 0.5,
      ARENA.HEIGHT * 0.5,
      ARENA.WIDTH * 0.72
    );
    grad.addColorStop(0, '#F7F1E7');
    grad.addColorStop(0.68, PALETTE.paper);
    grad.addColorStop(1, '#E4D8C3');
    g.fillStyle = grad;
    g.fillRect(0, 0, ARENA.WIDTH, ARENA.HEIGHT);

    // Subtle organic washi paper fibers (deterministic pseudo-random)
    let seed = 4219;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    g.lineWidth = 1;
    for (let i = 0; i < 480; i++) {
      const x = rand() * ARENA.WIDTH;
      const y = rand() * ARENA.HEIGHT;
      const len = 8 + rand() * 24;
      const a = rand() * Math.PI * 2;
      g.strokeStyle = i % 3 === 0 ? 'rgba(139, 108, 66, 0.045)' : 'rgba(28, 25, 23, 0.025)';
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }

    // Subtle etched brass astrolabe & compass rings in center
    const cx = ARENA.WIDTH * 0.5;
    const cy = ARENA.HEIGHT * 0.5;
    g.save();
    g.strokeStyle = 'rgba(164, 122, 46, 0.14)';
    g.lineWidth = 1.25;
    for (const r of [110, 215, 305]) {
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    }

    // Fine cardinal lines
    g.strokeStyle = 'rgba(28, 25, 23, 0.06)';
    g.beginPath();
    g.moveTo(ARENA.PADDING + 18, cy);
    g.lineTo(ARENA.WIDTH - ARENA.PADDING - 18, cy);
    g.moveTo(cx, ARENA.PADDING + 18);
    g.lineTo(cx, ARENA.HEIGHT - ARENA.PADDING - 18);
    g.stroke();

    // 24 subtle sundial ticks around middle ring
    g.strokeStyle = 'rgba(164, 122, 46, 0.18)';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r1 = i % 6 === 0 ? 203 : 209;
      const r2 = 215;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      g.stroke();
    }
    g.restore();

    // Outer lacquer-ink sanctuary border + inner gold hairline
    const pad = ARENA.PADDING;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 3;
    g.strokeRect(pad - 6, pad - 6, ARENA.WIDTH - (pad - 6) * 2, ARENA.HEIGHT - (pad - 6) * 2);

    g.strokeStyle = 'rgba(201, 138, 26, 0.55)';
    g.lineWidth = 1.2;
    g.strokeRect(pad, pad, ARENA.WIDTH - pad * 2, ARENA.HEIGHT - pad * 2);

    // Corner kintsugi brass brackets
    const bLen = 22;
    const corners = [
      [pad - 6, pad - 6, 1, 1],
      [ARENA.WIDTH - pad + 6, pad - 6, -1, 1],
      [pad - 6, ARENA.HEIGHT - pad + 6, 1, -1],
      [ARENA.WIDTH - pad + 6, ARENA.HEIGHT - pad + 6, -1, -1],
    ];
    g.strokeStyle = PALETTE.gold;
    g.lineWidth = 3;
    for (const [x, y, sx, sy] of corners) {
      g.beginPath();
      g.moveTo(x, y + sy * bLen);
      g.lineTo(x, y);
      g.lineTo(x + sx * bLen, y);
      g.stroke();
    }

    return off;
  }

  render(engine) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Camera zoom punch & screen shake
    const scale = 1 + engine.zoomPunch;
    ctx.translate(ARENA.WIDTH * 0.5 + engine.shakeX, ARENA.HEIGHT * 0.5 + engine.shakeY);
    ctx.scale(scale, scale);
    ctx.translate(-ARENA.WIDTH * 0.5, -ARENA.HEIGHT * 0.5);

    // 1. Washi paper backdrop
    ctx.drawImage(this.bgCanvas, 0, 0);

    // 2. Persistent ink & gold floor decals
    this._drawDecals(ctx, engine.decals);

    // 3. Mire zones
    this._drawMires(ctx, engine.mires, engine.time);

    // 4. Loom Seal detonation flashes
    this._drawSealFlashes(ctx, engine.sealFlashes);

    // 5. Active Loom polygon preview & vibrating gold threads
    this._drawTethers(ctx, engine);

    // 6. Slash ribbons & shockwaves
    this._drawSlashRibbons(ctx, engine.slashRibbons);
    this._drawShockwaves(ctx, engine.shockwaves);

    // 7. Brass Bell Pylons
    this._drawPylons(ctx, engine);

    // 8. Enemies & Boss
    this._drawEnemies(ctx, engine);

    // 9. Projectiles & Thread-Darts
    this._drawProjectiles(ctx, engine.projectiles);
    this._drawDarts(ctx, engine.darts);

    // 10. Player (The Weaver)
    this._drawPlayer(ctx, engine);

    // 11. Particles & Floating Combat Text
    this._drawParticles(ctx, engine.particles);
    this._drawFloaters(ctx, engine.floaters);

    // 12. Boss monument nameplate when boss is present
    const activeBoss = engine.enemies.find((e) => e.type === 'boss' && e.hp > 0);
    if (activeBoss && engine.state === 'playing') {
      this._drawBossBar(ctx, activeBoss);
    }

    // 13. Diegetic wave banner inside arena (non-blocking)
    if (engine.state === 'playing' && engine.waveBannerTimer > 0) {
      this._drawWaveBanner(ctx, engine);
    }

    // 14. Custom precision reticle & target hover bracket during active play
    if (engine.state === 'playing') {
      this._drawReticle(ctx, engine);
    }

    ctx.restore();
  }

  _drawDecals(ctx, decals) {
    for (const d of decals) {
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
      // Small satellite ink droplets
      for (let k = 0; k < 3; k++) {
        const a = d.seed + k * 2.1;
        const dist = d.radius * (0.95 + (k % 2) * 0.35);
        ctx.beginPath();
        ctx.arc(d.x + Math.cos(a) * dist, d.y + Math.sin(a) * dist, d.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawMires(ctx, mires, time) {
    for (const m of mires) {
      const alpha = Math.min(1, m.life / 1.2) * 0.32;
      ctx.save();
      ctx.fillStyle = `rgba(43, 122, 105, ${alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(43, 122, 105, ${alpha * 1.8})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -time * 18;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawSealFlashes(ctx, flashes) {
    for (const sf of flashes) {
      if (sf.poly.length < 3) continue;
      const t = Math.max(0, sf.life / sf.maxLife);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sf.poly[0].x, sf.poly[0].y);
      for (let i = 1; i < sf.poly.length; i++) {
        ctx.lineTo(sf.poly[i].x, sf.poly[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = sf.isEcho
        ? `rgba(217, 56, 30, ${t * 0.24})`
        : `rgba(242, 193, 78, ${t * 0.44})`;
      ctx.fill();

      ctx.strokeStyle = sf.isEcho
        ? `rgba(217, 56, 30, ${t * 0.9})`
        : `rgba(201, 138, 26, ${t * 0.95})`;
      ctx.lineWidth = 4 * t + 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawTethers(ctx, engine) {
    const { resolved, polygon } = engine.getTetherGeometry();
    if (!resolved.length) return;

    const p = engine.player;
    const isSealReady = polygon !== null;

    // 1. If 3+ targets are tethered, draw the shimmering Loom Seal polygon
    if (isSealReady) {
      const pulse = 0.5 + 0.5 * Math.sin(engine.time * 10);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(242, 193, 78, ${0.14 + pulse * 0.1})`;
      ctx.fill();

      // Golden perimeter
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -engine.time * 48;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw vibrating koto-string tethers from player to each target
    for (const r of resolved) {
      const dx = r.x - p.x;
      const dy = r.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const vib = Math.sin(r.pluckPhase) * r.pluckAmp * 16;
      const mx = (p.x + r.x) * 0.5 + nx * vib;
      const my = (p.y + r.y) * 0.5 + ny * vib;

      ctx.save();
      // Subtle ink shadow under gold thread for crisp contrast on parchment
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.18)';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 2);
      ctx.quadraticCurveTo(mx, my + 2, r.x, r.y + 2);
      ctx.stroke();

      // Burnished gold thread
      ctx.strokeStyle = engine.relicCount('cinnabar_silk') > 0 ? PALETTE.vermilion : PALETTE.gold;
      ctx.lineWidth = isSealReady ? 2.8 : 2.3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(mx, my, r.x, r.y);
      ctx.stroke();

      // Bright gold core highlight
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(mx, my, r.x, r.y);
      ctx.stroke();

      // Target golden ring knot
      ctx.strokeStyle = PALETTE.goldBright;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawSlashRibbons(ctx, ribbons) {
    for (const rb of ribbons) {
      if (rb.points.length < 2) continue;
      const t = Math.max(0, rb.life / rb.maxLife);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = rb.color;
      ctx.globalAlpha = t * 0.85;
      ctx.lineWidth = rb.width * t;
      ctx.beginPath();
      ctx.moveTo(rb.points[0].x, rb.points[0].y);
      for (let i = 1; i < rb.points.length; i++) {
        ctx.lineTo(rb.points[i].x, rb.points[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = rb.width * t * 0.35;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawShockwaves(ctx, shockwaves) {
    for (const sw of shockwaves) {
      const t = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = t * 0.85;
      ctx.lineWidth = sw.width * t + 1;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPylons(ctx, engine) {
    for (const py of engine.pylons) {
      const vibrate = py.ringTimer > 0 ? Math.sin(engine.time * 55) * py.ringTimer * 3.5 : 0;
      ctx.save();
      ctx.translate(py.x + vibrate, py.y);

      // Soft ground shadow
      ctx.fillStyle = 'rgba(28, 25, 23, 0.14)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer bronze bell pedestal
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(0, 0, py.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = py.ringTimer > 0 ? PALETTE.goldBright : PALETTE.gold;
      ctx.beginPath();
      ctx.arc(0, 0, py.radius - 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner engraved bell ring
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, py.radius - 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = PALETTE.porcelain;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  _drawEnemies(ctx, engine) {
    for (const e of engine.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Spawn ink-brush materialization animation
      if (e.spawnTimer > 0) {
        const s = 1 - e.spawnTimer / 0.45;
        ctx.globalAlpha = 0.25 + s * 0.75;
        ctx.scale(0.4 + s * 0.6, 0.4 + s * 0.6);
      }

      // Telegraph lines (drawn behind body)
      if (e.aiState === 'telegraph') {
        const len = e.type === 'archer' ? 360 : 210;
        ctx.save();
        ctx.rotate(e.telegraphAngle);
        ctx.strokeStyle = `rgba(217, 56, 30, ${0.35 + e.telegraphProgress * 0.65})`;
        ctx.lineWidth = 2 + e.telegraphProgress * 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(e.radius, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(28, 25, 23, 0.14)';
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.65, e.radius * 0.9, e.radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      const flash = e.hitFlash > 0.15;

      if (e.type === 'mote') {
        ctx.rotate(e.angle);
        ctx.fillStyle = flash ? PALETTE.cream : PALETTE.ink;
        ctx.beginPath();
        ctx.moveTo(e.radius + 4, 0);
        ctx.lineTo(0, e.radius * 0.85);
        ctx.lineTo(-e.radius, 0);
        ctx.lineTo(0, -e.radius * 0.85);
        ctx.closePath();
        ctx.fill();

        // Vermilion ember core
        ctx.fillStyle = PALETTE.vermilion;
        ctx.beginPath();
        ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'archer') {
        ctx.rotate(e.angle);
        ctx.fillStyle = flash ? PALETTE.cream : PALETTE.indigo;
        this._polygonPath(ctx, 8, e.radius);
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Lantern core + sight
        ctx.fillStyle = e.aiState === 'telegraph' ? PALETTE.goldBright : PALETTE.vermilion;
        ctx.beginPath();
        ctx.arc(0, 0, 6 + e.telegraphProgress * 3, 0, Math.PI * 2);
        ctx.fill();

        // Bow crest
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(5, 0, e.radius * 0.72, -0.85, 0.85);
        ctx.stroke();
      } else if (e.type === 'beetle') {
        ctx.rotate(e.angle);
        ctx.fillStyle = flash ? PALETTE.cream : PALETTE.slate;
        this._polygonPath(ctx, 6, e.radius);
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Armored golden frontal prow
        ctx.strokeStyle = e.aiState === 'charge' ? PALETTE.vermilion : PALETTE.goldBright;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(2, 0, e.radius - 2, -1.05, 1.05);
        ctx.stroke();

        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(-4, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'weaver') {
        ctx.rotate(e.angle);
        ctx.strokeStyle = flash ? PALETTE.cream : PALETTE.celadon;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = flash ? PALETTE.cream : PALETTE.ink;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Twin jade spindles
        ctx.fillStyle = PALETTE.goldBright;
        ctx.beginPath();
        ctx.arc(e.radius - 2, 0, 4, 0, Math.PI * 2);
        ctx.arc(-(e.radius - 2), 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'boss') {
        // Boss resonance spokes & orbiting brass nodes (in world space, so undo translate)
        ctx.restore();
        this._drawBoss(ctx, e, engine.time);
        continue;
      }

      ctx.restore();

      // Clean micro HP bar for wounded non-boss enemies
      if (e.hp < e.maxHp && e.hp > 0) {
        const w = e.radius * 2;
        const bx = e.x - w * 0.5;
        const by = e.y - e.radius - 11;
        ctx.fillStyle = 'rgba(28, 25, 23, 0.25)';
        ctx.fillRect(bx, by, w, 4);
        ctx.fillStyle = PALETTE.vermilion;
        ctx.fillRect(bx, by, w * (e.hp / e.maxHp), 4);
      }
    }
  }

  _drawBoss(ctx, boss, time) {
    ctx.save();
    // Delicate golden spokes to orbiting resonance nodes
    for (const node of boss.nodes) {
      ctx.strokeStyle = 'rgba(201, 138, 26, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(boss.x, boss.y);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting Brass Node
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = boss.phase === 2 ? PALETTE.vermilion : PALETTE.goldBright;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.porcelain;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main Obsidian Carillon body
    ctx.translate(boss.x, boss.y);
    if (boss.phase === 2) {
      ctx.strokeStyle = `rgba(217, 56, 30, ${0.35 + 0.2 * Math.sin(time * 9)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(boss.angle);
    ctx.fillStyle = boss.hitFlash > 0.15 ? PALETTE.cream : PALETTE.ink;
    this._polygonPath(ctx, 12, boss.radius);
    ctx.fill();

    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner temple bell sunburst
    ctx.strokeStyle = boss.phase === 2 ? PALETTE.vermilion : PALETTE.goldBright;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, boss.radius * 0.56, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * (boss.radius - 8), Math.sin(a) * (boss.radius - 8));
      ctx.stroke();
    }

    ctx.fillStyle = boss.stunTimer > 0 ? PALETTE.goldBright : PALETTE.vermilion;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circular Boss Health Arc around boss
    const pct = Math.max(0, boss.hp / boss.maxHp);
    ctx.save();
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.22)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius + 20, -Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = boss.phase === 2 ? PALETTE.vermilion : PALETTE.gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius + 20, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * pct);
    ctx.stroke();
    ctx.restore();
  }

  _drawProjectiles(ctx, projectiles) {
    for (const proj of projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      if (proj.friendly) {
        const a = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(a);
        ctx.fillStyle = PALETTE.goldBright;
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-7, 4.5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, -4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Enemy Cinnabar Orb — super readable vermilion with porcelain center
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius + 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = PALETTE.vermilion;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = PALETTE.cream;
        ctx.beginPath();
        ctx.arc(-1.5, -1.5, proj.radius * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawDarts(ctx, darts) {
    for (const d of darts) {
      ctx.save();
      if (d.trail.length >= 2) {
        ctx.strokeStyle = PALETTE.goldBright;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(d.trail[0].x, d.trail[0].y);
        for (let i = 1; i < d.trail.length; i++) {
          ctx.lineTo(d.trail[i].x, d.trail[i].y);
        }
        ctx.stroke();
      }
      const a = Math.atan2(d.vy, d.vx);
      ctx.translate(d.x, d.y);
      ctx.rotate(a);
      ctx.fillStyle = PALETTE.goldBright;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPlayer(ctx, engine) {
    const p = engine.player;
    ctx.save();

    // 1. Flowing Verlet vermilion ribbon scarf
    if (p.scarf.length >= 2) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < p.scarf.length; i++) {
        const w = (1 - i / p.scarf.length) * 8.5 + 1.5;
        ctx.strokeStyle = PALETTE.vermilion;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(p.scarf[i - 1].x, p.scarf[i - 1].y);
        ctx.lineTo(p.scarf[i].x, p.scarf[i].y);
        ctx.stroke();
      }
    }

    ctx.translate(p.x, p.y);

    // Invulnerability blink/glow ring
    if (p.invulnTimer > 0) {
      ctx.strokeStyle = 'rgba(242, 193, 78, 0.72)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rotating brass astrolabe halo with diegetic tether spool pips
    const maxT = engine.getMaxTethers();
    const activeT = engine.tethers.length;
    ctx.save();
    ctx.rotate(p.haloAngle);
    ctx.strokeStyle = activeT >= 3 ? PALETTE.goldBright : 'rgba(201, 138, 26, 0.48)';
    ctx.lineWidth = activeT >= 3 ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 16, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < maxT; i++) {
      const a = (i / maxT) * Math.PI * 2;
      const px = Math.cos(a) * (p.radius + 16);
      const py = Math.sin(a) * (p.radius + 16);
      ctx.fillStyle = i < activeT ? PALETTE.goldBright : PALETTE.paperWarm;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(px, py, i < activeT ? 4.3 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Porcelain & lacquer spindle body
    ctx.rotate(p.aimAngle);
    ctx.fillStyle = p.hitFlash > 0.1 ? PALETTE.vermilion : PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(p.radius + 5, 0);
    ctx.lineTo(0, p.radius - 1);
    ctx.lineTo(-p.radius + 1, 0);
    ctx.lineTo(0, -(p.radius - 1));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.porcelain;
    ctx.beginPath();
    ctx.moveTo(p.radius - 2, 0);
    ctx.lineTo(0, p.radius - 5);
    ctx.lineTo(-(p.radius - 5), 0);
    ctx.lineTo(0, -(p.radius - 5));
    ctx.closePath();
    ctx.fill();

    // Gold spindle core
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(1, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawParticles(ctx, particles) {
    for (const pt of particles) {
      const t = Math.max(0, pt.life / pt.maxLife);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.fillStyle = pt.color;
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.life * 7);
      const s = pt.size * t;
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
      ctx.restore();
    }
  }

  _drawFloaters(ctx, floaters) {
    for (const f of floaters) {
      const t = Math.max(0, f.life / f.maxLife);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.4);
      ctx.font = `700 ${f.size}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = PALETTE.paper;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  _drawWaveBanner(ctx, engine) {
    const t = engine.waveBannerTimer;
    const alpha = t > 2.7 ? (3.2 - t) / 0.5 : t < 0.5 ? t / 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    const cx = ARENA.WIDTH * 0.5;
    const cy = 96;

    ctx.fillStyle = 'rgba(243, 236, 224, 0.88)';
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    const bw = 460;
    const bh = 58;
    ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
    ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);

    ctx.font = '700 18px "Cinzel", Georgia, serif';
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.fillText(engine.waveTitle, cx, cy - 4);

    ctx.font = '500 12.5px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText(engine.waveSubtitle, cx, cy + 16);
    ctx.restore();
  }

  _drawBossBar(ctx, boss) {
    const cx = ARENA.WIDTH * 0.5;
    const y = ARENA.HEIGHT - ARENA.PADDING - 20;
    const w = 360;
    const h = 8;
    const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

    ctx.save();
    // Clean parchment plaque behind nameplate
    ctx.fillStyle = 'rgba(243, 236, 224, 0.9)';
    ctx.fillRect(cx - w * 0.5 - 14, y - 24, w + 28, 34);

    ctx.font = '700 11.5px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(
      `THE OBSIDIAN CARILLON  ·  PHASE ${boss.phase === 2 ? 'II' : 'I'}`,
      cx,
      y - 10
    );

    ctx.fillStyle = 'rgba(28, 25, 23, 0.2)';
    ctx.fillRect(cx - w * 0.5, y - h * 0.5, w, h);

    ctx.fillStyle = boss.phase === 2 ? PALETTE.vermilion : PALETTE.gold;
    ctx.fillRect(cx - w * 0.5, y - h * 0.5, w * pct, h);

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(cx - w * 0.5, y - h * 0.5, w, h);
    ctx.restore();
  }

  _drawReticle(ctx, engine) {
    const mx = engine.input.mouseX;
    const my = engine.input.mouseY;
    const sealReady = engine.tethers.length >= 3;

    // Subtle target lock-on bracket when hovering near a tetherable entity
    let hoverTarget = null;
    for (const e of engine.enemies) {
      if (e.hp <= 0) continue;
      if (e.type === 'boss') {
        for (const node of e.nodes) {
          if (Math.hypot(node.x - mx, node.y - my) <= node.radius + 22) {
            hoverTarget = node;
            break;
          }
        }
        if (hoverTarget) break;
      }
      if (Math.hypot(e.x - mx, e.y - my) <= e.radius + 22) {
        hoverTarget = e;
        break;
      }
    }
    if (!hoverTarget) {
      for (const py of engine.pylons) {
        if (Math.hypot(py.x - mx, py.y - my) <= py.radius + 22) {
          hoverTarget = py;
          break;
        }
      }
    }

    if (hoverTarget) {
      const hr = (hoverTarget.radius || 14) + 12;
      ctx.save();
      ctx.translate(hoverTarget.x, hoverTarget.y);
      ctx.rotate(engine.time * 1.4);
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, hr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(mx, my);
    ctx.strokeStyle = hoverTarget ? PALETTE.vermilion : sealReady ? PALETTE.gold : PALETTE.ink;
    ctx.lineWidth = sealReady || hoverTarget ? 2 : 1.5;
    const r = sealReady ? 12 : hoverTarget ? 11 : 9;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r - 4, 0);
    ctx.lineTo(-r + 3, 0);
    ctx.moveTo(r - 3, 0);
    ctx.lineTo(r + 4, 0);
    ctx.moveTo(0, -r - 4);
    ctx.lineTo(0, -r + 3);
    ctx.moveTo(0, r - 3);
    ctx.lineTo(0, r + 4);
    ctx.stroke();
    ctx.restore();
  }

  _polygonPath(ctx, sides, radius) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}
