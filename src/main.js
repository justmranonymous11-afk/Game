import { AudioEngine } from './audio.js';
import { ARENA, RELICS } from './constants.js';
import { GameEngine } from './engine.js';
import { Renderer } from './renderer.js';

const STORAGE_KEY = 'sunthread_records_v1';

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, bestWave: 0 };
    const parsed = JSON.parse(raw);
    return {
      bestScore: Number(parsed.bestScore) || 0,
      bestWave: Number(parsed.bestWave) || 0,
    };
  } catch {
    return { bestScore: 0, bestWave: 0 };
  }
}

function saveRecords(bestScore, bestWave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bestScore, bestWave }));
  } catch {
    // Ignore storage quota / sandbox restrictions
  }
}

const RELIC_ICONS = {
  spool: '◎',
  flame: '✦',
  echo: '◈',
  chime: '✧',
  mend: '✚',
  wind: '⇶',
  bell: '⬡',
  magnet: '⊕',
  sun: '✺',
  ribbon: '〰',
  flow: '∞',
  dart: '➤',
};

export function bootGame() {
  const canvas = document.getElementById('game-canvas');
  const audio = new AudioEngine();
  const records = loadRecords();

  const els = {
    hud: document.getElementById('hud'),
    hpPips: document.getElementById('hp-pips'),
    waveLabel: document.getElementById('wave-label'),
    scoreValue: document.getElementById('score-value'),
    comboBadge: document.getElementById('combo-badge'),
    tetherStatus: document.getElementById('tether-status'),
    relicStrip: document.getElementById('relic-strip'),
    muteBtn: document.getElementById('mute-btn'),
    pauseBtn: document.getElementById('pause-btn'),

    titleOverlay: document.getElementById('title-overlay'),
    titleBest: document.getElementById('title-best'),
    startBtn: document.getElementById('start-btn'),

    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    restartFromPauseBtn: document.getElementById('restart-pause-btn'),

    draftOverlay: document.getElementById('draft-overlay'),
    draftWaveLabel: document.getElementById('draft-wave-label'),
    draftCards: document.getElementById('draft-cards'),

    endOverlay: document.getElementById('end-overlay'),
    endKicker: document.getElementById('end-kicker'),
    endTitle: document.getElementById('end-title'),
    endStats: document.getElementById('end-stats'),
    endlessBtn: document.getElementById('endless-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
  };

  const engine = new GameEngine({
    audio,
    bestScore: records.bestScore,
    bestWave: records.bestWave,
  });
  engine.onStateChange = (state) => syncOverlays(state);

  // Expose cleanly for automated verification & debugging
  window.__SUNTHREAD__ = engine;

  const renderer = new Renderer(canvas);

  function syncOverlays(state) {
    saveRecords(engine.bestScore, engine.bestWave);

    els.titleOverlay.classList.toggle('hidden', state !== 'title');
    els.pauseOverlay.classList.toggle('hidden', state !== 'paused');
    els.draftOverlay.classList.toggle('hidden', state !== 'draft');
    els.endOverlay.classList.toggle('hidden', state !== 'gameover' && state !== 'victory');
    els.hud.classList.toggle('hidden', state === 'title');
    canvas.classList.toggle('playing-cursor', state === 'playing');

    if (state === 'title') {
      els.titleBest.textContent =
        engine.bestScore > 0
          ? `BEST SCORE ${engine.bestScore.toLocaleString()} · HIGHEST WAVE ${engine.bestWave}`
          : 'ORIGINAL ELASTIC-TETHER ACTION ROGUELITE';
    }

    if (state === 'draft') {
      els.draftWaveLabel.textContent = `WAVE ${engine.wave} CLEARED — CHOOSE A RELIC`;
      els.draftCards.innerHTML = '';
      engine.draftChoices.forEach((relic, index) => {
        const stacks = engine.relicCount(relic.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'relic-card';
        btn.dataset.relicId = relic.id;
        btn.innerHTML = `
          <div class="relic-card-top">
            <span class="relic-tag">${relic.tag}</span>
            <span class="relic-key">${index + 1}</span>
          </div>
          <div class="relic-emblem">${RELIC_ICONS[relic.icon] || '✦'}</div>
          <h3 class="relic-name">${relic.name}${stacks > 0 ? ` · Lv ${stacks + 1}` : ''}</h3>
          <p class="relic-desc">${relic.description}</p>
        `;
        btn.addEventListener('click', () => {
          audio.unlock();
          engine.selectRelic(relic.id);
        });
        els.draftCards.appendChild(btn);
      });
    }

    if (state === 'gameover' || state === 'victory') {
      const won = state === 'victory';
      els.endKicker.textContent = won ? 'SANCTUARY MASTERED' : 'THREAD SEVERED';
      els.endTitle.textContent = won ? 'VICTORY' : 'RUN ENDED';
      els.endlessBtn.classList.toggle('hidden', !won);
      els.endStats.innerHTML = `
        <div class="stat-box"><span class="stat-label">SCORE</span><span class="stat-val">${engine.score.toLocaleString()}</span></div>
        <div class="stat-box"><span class="stat-label">WAVE</span><span class="stat-val">${engine.wave}</span></div>
        <div class="stat-box"><span class="stat-label">VANQUISHED</span><span class="stat-val">${engine.kills}</span></div>
        <div class="stat-box"><span class="stat-label">LOOM SEALS</span><span class="stat-val">${engine.sealsTriggered}</span></div>
        <div class="stat-box"><span class="stat-label">PARRIES</span><span class="stat-val">${engine.parriesLanded}</span></div>
        <div class="stat-box"><span class="stat-label">MAX COMBO</span><span class="stat-val">${engine.maxCombo}×</span></div>
      `;
    }
  }

  let lastHudKey = '';
  function updateHud() {
    if (engine.state === 'title') return;
    const p = engine.player;
    const tCount = engine.tethers.length;
    const maxT = engine.getMaxTethers();
    const relicEntries = Object.entries(engine.relics);
    const key = `${p.hp}/${p.maxHp}|${engine.wave}|${engine.score}|${engine.combo}|${tCount}/${maxT}|${relicEntries.length}`;
    if (key === lastHudKey) return;
    lastHudKey = key;

    // HP Pips
    let hpHtml = '';
    for (let i = 0; i < p.maxHp; i++) {
      hpHtml += `<span class="hp-pip ${i < p.hp ? 'filled' : ''}"></span>`;
    }
    els.hpPips.innerHTML = hpHtml;

    els.waveLabel.textContent = `WAVE ${engine.wave}${engine.endless ? ' ∞' : ' / 10'}`;
    els.scoreValue.textContent = engine.score.toLocaleString();

    if (engine.combo >= 2) {
      els.comboBadge.textContent = `${engine.combo}× FLOW · ${engine.getComboMultiplier().toFixed(1)}×`;
      els.comboBadge.classList.remove('hidden');
    } else {
      els.comboBadge.classList.add('hidden');
    }

    if (tCount >= 3) {
      els.tetherStatus.textContent = `LOOM SEAL READY (${tCount}) — SPACE / RMB`;
      els.tetherStatus.className = 'tether-status seal-ready';
    } else if (tCount > 0) {
      els.tetherStatus.textContent = `TETHERED ${tCount}/${maxT} — SPACE TO CLEAVE`;
      els.tetherStatus.className = 'tether-status active';
    } else {
      els.tetherStatus.textContent = `LMB TETHER · SPACE PARRY`;
      els.tetherStatus.className = 'tether-status';
    }

    // Active relics strip
    if (relicEntries.length > 0) {
      els.relicStrip.innerHTML = relicEntries
        .map(([id, count]) => {
          const def = RELICS.find((r) => r.id === id);
          const icon = def ? RELIC_ICONS[def.icon] || '✦' : '✦';
          const title = def ? `${def.name}: ${def.description}` : id;
          return `<span class="relic-chip" title="${title}">${icon}${count > 1 ? `<sub>${count}</sub>` : ''}</span>`;
        })
        .join('');
    } else {
      els.relicStrip.innerHTML = '';
    }
  }

  // ---- INPUT BINDINGS ----

  function canvasCoordsFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = ARENA.WIDTH / rect.width;
    const scaleY = ARENA.HEIGHT / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointermove', (ev) => {
    const pt = canvasCoordsFromEvent(ev);
    engine.input.mouseX = pt.x;
    engine.input.mouseY = pt.y;
  });

  canvas.addEventListener('pointerdown', (ev) => {
    audio.unlock();
    const pt = canvasCoordsFromEvent(ev);
    engine.input.mouseX = pt.x;
    engine.input.mouseY = pt.y;

    if (engine.state !== 'playing') return;
    if (ev.button === 2) {
      engine.triggerSnap();
    } else if (ev.button === 0) {
      engine.fireTether(pt.x, pt.y);
    }
  });

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  window.addEventListener('keydown', (ev) => {
    const code = ev.code;
    if (code === 'KeyW' || code === 'ArrowUp') engine.input.up = true;
    if (code === 'KeyS' || code === 'ArrowDown') engine.input.down = true;
    if (code === 'KeyA' || code === 'ArrowLeft') engine.input.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') engine.input.right = true;

    if (code === 'Space') {
      ev.preventDefault();
      audio.unlock();
      if (engine.state === 'playing') {
        engine.triggerSnap();
      } else if (engine.state === 'title') {
        engine.startRun();
      }
    }

    if (code === 'Escape' || code === 'KeyP') {
      if (engine.state === 'playing' || engine.state === 'paused') {
        engine.togglePause();
      }
    }

    if (code === 'KeyM') {
      const muted = audio.toggleMute();
      els.muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
    }

    // Quick keyboard selection for relic draft (1, 2, 3)
    if (engine.state === 'draft') {
      if (code === 'Digit1' && engine.draftChoices[0]) engine.selectRelic(engine.draftChoices[0].id);
      if (code === 'Digit2' && engine.draftChoices[1]) engine.selectRelic(engine.draftChoices[1].id);
      if (code === 'Digit3' && engine.draftChoices[2]) engine.selectRelic(engine.draftChoices[2].id);
    }
  });

  window.addEventListener('keyup', (ev) => {
    const code = ev.code;
    if (code === 'KeyW' || code === 'ArrowUp') engine.input.up = false;
    if (code === 'KeyS' || code === 'ArrowDown') engine.input.down = false;
    if (code === 'KeyA' || code === 'ArrowLeft') engine.input.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') engine.input.right = false;
  });

  window.addEventListener('blur', () => {
    engine.input.up = false;
    engine.input.down = false;
    engine.input.left = false;
    engine.input.right = false;
  });

  // UI Buttons
  els.startBtn.addEventListener('click', () => {
    audio.unlock();
    engine.startRun();
  });

  els.pauseBtn.addEventListener('click', () => engine.togglePause());
  els.resumeBtn.addEventListener('click', () => engine.togglePause());
  els.restartFromPauseBtn.addEventListener('click', () => {
    audio.unlock();
    engine.startRun();
  });

  els.muteBtn.addEventListener('click', () => {
    audio.unlock();
    const muted = audio.toggleMute();
    els.muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  });

  els.endlessBtn.addEventListener('click', () => {
    audio.unlock();
    engine.continueEndless();
  });

  els.playAgainBtn.addEventListener('click', () => {
    audio.unlock();
    engine.startRun();
  });

  window.addEventListener('resize', () => renderer.resize());

  // ---- FIXED-STEP LOOP ----
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    engine.step(dt);
    renderer.render(engine);
    updateHud();
    requestAnimationFrame(frame);
  }

  syncOverlays(engine.state);
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
  } else {
    bootGame();
  }
}
