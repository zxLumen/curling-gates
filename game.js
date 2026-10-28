(() => {
  'use strict';

  // =========================================================================
  // DOM
  // =========================================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const multEl = document.getElementById('mult');
  const comboEl = document.getElementById('combo');
  const chainEl = document.getElementById('chain');
  const targetLabelEl = document.getElementById('targetLabel');
  const targetBarEl = document.getElementById('targetBar');
  const throwEl = document.getElementById('throwLabel');
  const bestEl = document.getElementById('bestLabel');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const overlayEl = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const shareBtn = document.getElementById('shareBtn');
  const towerBtn = document.getElementById('towerBtn');
  const homeBtn = document.getElementById('homeBtn');
  const footnoteEl = document.getElementById('footnote');
  const towerOverlay = document.getElementById('towerOverlay');
  const towerBadge = document.getElementById('towerBadge');
  const towerTitle = document.getElementById('towerTitle');
  const towerSub = document.getElementById('towerSub');
  const towerBalls = document.getElementById('towerBalls');
  const towerTip = document.getElementById('towerTip');
  const towerAtk = document.getElementById('towerAtk');
  const towerNextBtn = document.getElementById('towerNextBtn');
  const towerRetryBtn = document.getElementById('towerRetryBtn');
  const towerEndBtn = document.getElementById('towerEndBtn');
  const resultStatsEl = document.getElementById('resultStats');
  const restartBtn = document.getElementById('restartBtn');
  const ballBar = document.getElementById('ballBar');
  const muteBtn = document.getElementById('muteBtn');

  // =========================================================================
  // Constants
  // =========================================================================
  const WORLD = {
    halfWidth: 2.375,
    length: 36,
    releaseY: 6.0,
    houseY: 30,
    houseR: 1.83
  };
  const R0 = 0.16;
  const PIN_R = 0.12;
  const FIXED = 1 / 60;
  const MAX_STONES = 12;
  const SIZE_MAX = 3.0;
  const SIZE_MIN = 0.55;
  const SPEED_MAX = 13;
  const GATE_MULT_MAX = 5;
  const COMBO_MULT_MAX = 6;
  const TOTAL_MULT_MAX = 20;
  const SLIDE_TIME_SCALE = 1.15;
  const CURL_ACCEL = 0.90;
  const FULL_SPEED = 11.5;
  const TARGET_SCORE = 6000;
  const THREE_STAR_SCORE = 10000;
  const BEST_KEY = 'curling-gates-best-v1';
  const SPIN_KEY = 'curling-gates-spin-v1';
  const TOWER_BEST_KEY = 'curling-gates-tower-best-v1';
  const TOWER_BASE_DEF = 300;
  const TOWER_DEF_GROWTH = 1.5;
  const QUICK_SEED = 20261028;

  const BALL_TYPES = {
    standard: { name: '标准球', color: '#ff6b4a', radius: 1.0, atk: 0.0, desc: '均衡，稳定得分' },
    giant: { name: '巨力球', color: '#ffd34d', radius: 1.3, atk: 0.05, desc: '更大更重，撞击更强' },
    curl: { name: '旋弧球', color: '#5fe3ff', radius: 0.95, atk: 0.1, desc: '旋弧 ×1.6，适合绕门' },
    split: { name: '分裂球', color: '#39e58c', radius: 0.9, atk: 0.15, desc: '首次过门分裂成两颗' },
    magnet: { name: '磁力球', color: '#8b5cf6', radius: 1.0, atk: 0.08, desc: '吸附附近钉子' },
    pierce: { name: '穿透球', color: '#f59e0b', radius: 0.95, atk: 0.12, desc: '穿透前 3 个钉子' },
    bounce: { name: '弹跳球', color: '#ec4899', radius: 1.0, atk: 0.06, desc: '撞墙反弹更强' },
    bomb: { name: '爆裂球', color: '#ef4444', radius: 1.0, atk: 0.14, desc: '首次撞钉引发爆炸' }
  };

  const GATE_COLORS = {
    growth: '#39e58c',
    motion: '#4bb8ff',
    score: '#ffd34d',
    risk: '#c084fc',
    debuff: '#ff5d6c',
    utility: '#f2f5ff'
  };

  const GATE_DEFS = {
    sizeUp:  { name: '变大', icon: '大', color: 'growth', value: '+45%' },
    split:   { name: '分裂', icon: '分', color: 'growth', value: '×2' },
    speedUp: { name: '加速', icon: '速', color: 'motion', value: '+30%' },
    mult:    { name: '倍率', icon: '×',  color: 'score',  value: '+1x' },
    magnet:  { name: '磁铁', icon: '磁', color: 'motion', value: '4s' },
    pierce:  { name: '穿透', icon: '穿', color: 'motion', value: '×3' },
    shrink:  { name: '变小', icon: '小', color: 'risk',   value: '+1x' },
    sticky:  { name: '粘滞', icon: '粘', color: 'debuff', value: '×1.45' }
  };

  // =========================================================================
  // Utils
  // =========================================================================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(a, b) {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 1, 0xc2b2ae35);
    h ^= h >>> 16;
    h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15;
    return h >>> 0;
  }

  function loadBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(v) {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {
      /* ignore */
    }
  }

  function loadSpin() {
    try {
      const v = Number(localStorage.getItem(SPIN_KEY));
      return v === -1 || v === 1 ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  function saveSpin(v) {
    try {
      localStorage.setItem(SPIN_KEY, String(v));
    } catch (e) {
      /* ignore */
    }
  }

  function loadTowerBest() {
    try {
      return Number(localStorage.getItem(TOWER_BEST_KEY) || 0) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveTowerBest(v) {
    try {
      localStorage.setItem(TOWER_BEST_KEY, String(v));
    } catch (e) {
      /* ignore */
    }
  }

  // =========================================================================
  // Canvas / projection
  // =========================================================================
  let W = 0;
  let H = 0;
  let DPR = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initSnow();
  }

  function ppmAt(y) {
    return (W * 1.02 / (WORLD.halfWidth * 2)) / (1 + 0.028 * y);
  }

  function project(x, y) {
    const horizon = H * 0.08;
    const t = clamp(y / WORLD.length, 0, 1.05);
    const sy = H - (H - horizon) * Math.pow(t, 0.92);
    const ppm = ppmAt(y);
    const sx = W / 2 + x * ppm;
    return { sx, sy, ppm, scale: ppm / (W * 1.02 / (WORLD.halfWidth * 2)) };
  }

  function unproject(sx, sy) {
    const horizon = H * 0.08;
    const ratio = clamp((H - sy) / Math.max(1, H - horizon), 0, 1.05);
    const t = Math.pow(ratio, 1 / 0.92);
    const y = clamp(t * WORLD.length, 0, WORLD.length * 1.05);
    const x = (sx - W / 2) / Math.max(1, ppmAt(y));
    return { x, y };
  }

  // =========================================================================
  // Audio
  // =========================================================================
  const AudioFX = (() => {
    let ac = null;
    let master = null;
    let muted = false;
    let noiseBuf = null;

    function init() {
      if (ac) {
        if (ac.state === 'suspended') ac.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.16;
      master.connect(ac.destination);
      const len = Math.floor(ac.sampleRate * 0.5);
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }

    function tone(freq, dur, type, vol, slideTo, delay) {
      if (!ac || muted) return;
      const t0 = ac.currentTime + (delay || 0);
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol || 0.2), t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(master);
      o.start(t0);
      o.stop(t0 + dur + 0.03);
    }

    function noise(dur, vol, filterFreq, delay) {
      if (!ac || muted || !noiseBuf) return;
      const t0 = ac.currentTime + (delay || 0);
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq || 1200;
      const g = ac.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol || 0.2), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.03);
    }

    return {
      init,
      setMuted(v) { muted = v; },
      isMuted() { return muted; },
      throwStone() {
        noise(0.18, 0.22, 900);
        tone(180, 0.12, 'sine', 0.12, 120);
      },
      gate() {
        tone(660, 0.09, 'triangle', 0.22);
        tone(990, 0.12, 'triangle', 0.18, null, 0.06);
      },
      perfect() {
        tone(880, 0.08, 'square', 0.14);
        tone(1320, 0.14, 'square', 0.12, null, 0.05);
      },
      impact(strength, combo) {
        const s = clamp(strength || 1, 0.3, 2);
        const p = Math.min(20, combo || 0);
        noise(0.09 * s, 0.3 * s, 1600 + p * 30);
        tone(110 + p * 6, 0.12, 'sine', 0.26 * s, 60 + p * 3);
      },
      split() {
        tone(440, 0.06, 'square', 0.16);
        tone(550, 0.06, 'square', 0.14, null, 0.05);
        tone(660, 0.08, 'square', 0.12, null, 0.1);
      },
      sweep() {
        noise(0.08, 0.1, 2600);
      },
      charge(stage) {
        tone(280 + stage * 150, 0.05, 'square', 0.1);
        if (stage >= 4) tone(1200, 0.08, 'triangle', 0.12);
      },
      clear() {
        [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.2, null, i * 0.07));
      },
      win() {
        [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.26, 'triangle', 0.18, null, i * 0.09));
      },
      fail() {
        tone(220, 0.2, 'sawtooth', 0.12, 110);
      }
    };
  })();

  // =========================================================================
  // Game state
  // =========================================================================
  const game = {
    phase: 'menu',
    throwIndex: 0,
    throwsTotal: 3,
    score: 0,
    displayScore: 0,
    best: loadBest(),
    combo: 0,
    comboTimer: 0,
    gateMult: 0,
    maxMult: 1,
    throwMaxMult: 1,
    throwStartScore: 0,
    gateChain: 0,
    maxChain: 0,
    maxCombo: 0,
    targetScore: TARGET_SCORE,
    bigMoment: false,
    waveMoment: false,
    hitStop: 0,
    runHitPins: 0,
    runTotalPins: 0,
    hitPins: 0,
    totalPins: 0,
    cleared: false,
    throwScores: [],
    lastThrowScore: 0,
    stones: [],
    pins: [],
    gates: [],
    particles: [],
    popups: [],
    snow: [],
    aim: {
      charging: false,
      startX: 0,
      curX: 0,
      curY: 0,
      angle: 0
    },
    spin: 0,
    settleTimer: 0,
    betweenTimer: 0,
    shake: 0,
    flash: 0,
    slowTimer: 0,
    paused: false,
    mode: 'quick',
    tower: {
      floor: 1,
      def: TOWER_BASE_DEF,
      hearts: 3,
      floorDamage: 0,
      bestFloor: 0,
      runSeed: 0,
      floorSeed: QUICK_SEED,
      options: [],
      balls: [{ id: 'standard', level: 1 }],
      selectedBall: 0,
      upgraded: false,
      chosenOption: -1
    },
    time: 0
  };

  // =========================================================================
  // Level builders
  // =========================================================================
  function makeStone(x, y, opts) {
    const o = opts || {};
    const r = o.r == null ? R0 : o.r;
    return {
      x,
      y,
      vx: o.vx || 0,
      vy: o.vy || 0,
      r,
      mass: (r / R0) * (r / R0),
      friction: o.friction == null ? 1.55 : o.friction,
      spin: o.spin || 0,
      magnetTimer: o.magnetTimer || 0,
      magnetRadius: o.magnetRadius || 2.6,
      pierce: o.pierce || 0,
      shield: !!o.shield,
      alive: true,
      active: !!o.active,
      ballId: o.ballId || null,
      ballLevel: o.ballLevel || 1,
      ballColor: o.ballColor || null,
      ballSplitUsed: false,
      ballBomb: o.ballBomb || false,
      ballBombUsed: false,
      ballBounce: o.ballBounce || false,
      trail: []
    };
  }

  function makePin(x, y) {
    return {
      x,
      y,
      r: PIN_R,
      hit: false,
      vx: 0,
      vy: 0,
      life: 1,
      moving: false
    };
  }

  function buildPins(seed) {
    const rng = mulberry32(hashSeed(seed || QUICK_SEED, 777));
    const pins = [];
    const rows = [
      { dy: -2.1, n: 3 },
      { dy: -1.4, n: 4 },
      { dy: -0.7, n: 5 },
      { dy: 0.0, n: 6 },
      { dy: 0.7, n: 5 },
      { dy: 1.4, n: 4 },
      { dy: 2.1, n: 3 }
    ];
    const gap = 0.52 + rng() * 0.06;
    const shift = (rng() - 0.5) * 0.5;
    for (const row of rows) {
      for (let i = 0; i < row.n; i++) {
        const x =
          shift +
          (i - (row.n - 1) / 2) * gap +
          (rng() - 0.5) * 0.16;
        const y = WORLD.houseY + row.dy + (rng() - 0.5) * 0.12;
        pins.push(makePin(x, y));
      }
    }
    return pins;
  }

  function buildGates(seed, floor) {
    const level = Math.max(1, floor || 1);
    const rng = mulberry32(hashSeed(seed || QUICK_SEED, 9001 + level * 17));
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      return a;
    };
    const scale = Math.max(0.82, 1.05 - (level - 1) * 0.04);
    const debuffChance = level <= 1 ? 0 : Math.min(0.45, 0.18 + (level - 1) * 0.08);

    // Random vertical positions, min gap 4.2m
    const y1 = 11.4 + rng() * 2.2;
    const y2 = Math.min(18.5, y1 + 4.2 + rng() * 2.4);
    const y3 = Math.min(25.0, y2 + 4.2 + rng() * 2.4);

    // Row 1: two growth gates covering the center, so early shots are forgiving.
    const growth = shuffle(['sizeUp', 'split']);
    const row1 = {
      y: y1,
      gates: [
        {
          type: growth[0],
          x: -0.5 - rng() * 0.22,
          w: 1.2 + rng() * 0.22,
          used: false
        },
        {
          type: growth[1],
          x: 0.5 + rng() * 0.22,
          w: 1.2 + rng() * 0.22,
          used: false
        }
      ]
    };

    const makePositions = (count) => {
      if (count === 1) return [(rng() - 0.5) * 1.6];
      if (count === 2) {
        return [
          -1.18 + rng() * 0.5,
          0.55 + rng() * 0.5
        ];
      }
      return [
        -1.3 + (rng() - 0.5) * 0.3,
        (rng() - 0.5) * 0.45,
        1.3 + (rng() - 0.5) * 0.3
      ];
    };

    const makeRow = (y, count, buffs, debuffs) => {
      const chosen = [];
      const buffPool = shuffle(buffs);
      const debuffPool = shuffle(debuffs);
      for (let i = 0; i < count; i++) {
        const wantDebuff = i > 0 && rng() < debuffChance && debuffPool.length > 0;
        const type = wantDebuff ? debuffPool.pop() : buffPool.pop();
        chosen.push(type || pick(buffs));
      }
      if (chosen.every((t) => debuffs.includes(t))) {
        chosen[0] = pick(buffs);
      }
      const positions = makePositions(count);
      return {
        y,
        gates: chosen.map((type, i) => {
          const isDebuff = debuffs.includes(type);
          return {
            type,
            x: positions[i],
            w: (isDebuff ? 0.58 + rng() * 0.08 : 0.82 + rng() * 0.22) * scale,
            used: false
          };
        })
      };
    };

    const row2Count = level <= 1 ? 2 : rng() < 0.35 ? 1 : rng() < 0.55 ? 2 : 3;
    const row3Count = level <= 1 ? 2 : rng() < 0.4 ? 1 : rng() < 0.6 ? 2 : 3;
    const row2 = makeRow(
      y2,
      row2Count,
      ['speedUp', 'mult', 'magnet', 'pierce'],
      ['sticky']
    );
    const row3 = makeRow(
      y3,
      row3Count,
      ['magnet', 'pierce', 'mult'],
      ['shrink', 'sticky']
    );

    let rows = [row1, row2, row3];
    if (level >= 2 && rng() < 0.45) {
      const y4 = Math.min(26.2, y3 + 3.8 + rng() * 2.4);
      rows.push(
        makeRow(
          y4,
          rng() < 0.55 ? 1 : 2,
          ['mult', 'magnet', 'pierce'],
          ['sticky', 'shrink']
        )
      );
    }

    if (level >= 2) {
      for (const row of rows) {
        for (const gate of row.gates) {
          if (rng() < 0.35) {
            gate.move = {
              amp: 0.16 + rng() * 0.28,
              speed: 0.7 + rng() * 0.9,
              phase: rng() * TAU
            };
          }
        }
      }
    }

    return rows;
  }

  function gateX(gate) {
    if (!gate.move) return gate.x;
    return (
      gate.x +
      Math.sin(game.time * gate.move.speed + gate.move.phase) * gate.move.amp
    );
  }

  // =========================================================================
  // Scoring
  // =========================================================================
  function totalMult() {
    const comboMult = Math.min(COMBO_MULT_MAX, game.combo * 0.1);
    const chainMult = Math.min(2, Math.max(0, game.gateChain - 1) * 0.5);
    const val = Math.min(TOTAL_MULT_MAX, 1 + game.gateMult + comboMult + chainMult);
    if (val > game.maxMult) game.maxMult = val;
    if (val > game.throwMaxMult) game.throwMaxMult = val;
    return val;
  }

  function starsFor(score) {
    if (score >= THREE_STAR_SCORE) return 3;
    if (score >= TARGET_SCORE) return 2;
    if (score >= TARGET_SCORE / 2) return 1;
    return 0;
  }

  function getSelectedBall() {
    const t = game.tower;
    return t.balls[Math.max(0, Math.min(t.balls.length - 1, t.selectedBall))] || t.balls[0];
  }

  function ballType(ball) {
    return BALL_TYPES[ball.id] || BALL_TYPES.standard;
  }

  function ballPower(ball) {
    return 1 + 0.18 * (ball.level - 1) + ballType(ball).atk;
  }

  function ballRadius(ball) {
    return R0 * ballType(ball).radius * (1 + 0.05 * (ball.level - 1));
  }

  function ballSpinMult(ball) {
    return ball.id === 'curl' ? 1.6 + 0.12 * (ball.level - 1) : 1;
  }

  function towerAtkBonus() {
    return ballPower(getSelectedBall()) - 1;
  }

  function haptic(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {
      /* ignore */
    }
  }

  // =========================================================================
  // FX
  // =========================================================================
  function burst(x, y, color, count, speed) {
    const n = count || 10;
    const sp = speed || 0.8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const v = (0.5 + Math.random()) * sp;
      game.particles.push({
        type: 'dot',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 0.02 + Math.random() * 0.05,
        color
      });
    }
  }

  function ring(x, y, color) {
    game.particles.push({
      type: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.7,
      maxLife: 0.7,
      size: 0.4,
      color
    });
  }

  function addPopup(x, y, text, color, size) {
    game.popups.push({
      x,
      y,
      text,
      color: color || '#eaf7ff',
      size: size || 1,
      life: 1.1,
      maxLife: 1.1
    });
  }

  let toastTimer = null;
  function showToast(text, duration) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration || 1000);
  }

  function clearMoment() {
    if (game.cleared) return;
    game.cleared = true;
    game.slowTimer = 0.55;
    game.flash = 0.9;
    game.shake = 16;
    game.hitStop = 0.05;
    addPopup(0, WORLD.houseY, '清 屏 !', '#ffd34d', 2.1);
    ring(0, WORLD.houseY, '#ffd34d');
    haptic([20, 30, 40]);
    AudioFX.clear();
  }

  // =========================================================================
  // Game flow
  // =========================================================================
  function startGame(mode) {
    AudioFX.init();
    const nextMode = mode || game.mode || 'quick';
    game.mode = nextMode;
    overlayEl.classList.remove('show');
    overlayEl.style.display = 'none';
    overlayEl.classList.remove('result');
    resultStatsEl.classList.add('hidden');
    towerOverlay.classList.add('hidden');

    if (nextMode === 'tower') {
      startTower();
    } else {
      startQuick();
    }
  }

  function resetRunBase() {
    game.score = 0;
    game.displayScore = 0;
    game.throwIndex = 0;
    game.runHitPins = 0;
    game.throwScores = [];
    game.gateMult = 0;
    game.combo = 0;
    game.maxMult = 1;
    game.maxCombo = 0;
    game.maxChain = 0;
    game.gateChain = 0;
    game.cleared = false;
    game.best = loadBest();
  }

  function startQuick() {
    resetRunBase();
    game.targetScore = TARGET_SCORE;
    game.runTotalPins = 3 * buildPins(QUICK_SEED).length;
    startThrow();
  }

  function startTower() {
    resetRunBase();
    const t = game.tower;
    t.floor = 1;
    t.def = TOWER_BASE_DEF;
    t.hearts = 3;
    t.floorDamage = 0;
    t.bestFloor = loadTowerBest();
    t.runSeed = (Math.random() * 1e9) | 0;
    t.floorSeed = hashSeed(t.runSeed, 1);
    t.options = [];
    t.balls = [{ id: 'standard', level: 1, count: 1, used: 0 }];
    t.selectedBall = 0;
    t.upgraded = false;
    t.chosenOption = -1;
    game.targetScore = TOWER_BASE_DEF;
    game.runTotalPins = 0;
    startThrow();
  }

  function startThrow() {
    game.phase = 'aim';
    game.throwsTotal =
      game.mode === 'tower'
        ? Math.max(1, game.tower.balls.reduce((sum, b) => sum + b.count, 0))
        : 3;
    game.targetScore = game.mode === 'tower' ? game.tower.def : TARGET_SCORE;
    game.throwStartScore = game.score;
    game.throwMaxMult = 1;
    if (game.mode === 'tower') {
      const t = game.tower;
      let idx = t.selectedBall;
      if (!t.balls[idx] || t.balls[idx].used >= t.balls[idx].count) {
        idx = t.balls.findIndex((b) => b.used < b.count);
      }
      if (idx < 0) {
        resolveTowerFloor();
        return;
      }
      t.selectedBall = idx;
    }
    const selected = game.mode === 'tower' ? getSelectedBall() : null;
    const selectedType = selected ? ballType(selected) : null;
    game.stones = [
      makeStone(0, WORLD.releaseY, selected ? {
        r: ballRadius(selected),
        ballId: selected.id,
        ballLevel: selected.level,
        ballColor: selectedType.color
      } : {})
    ];
    const layoutSeed = game.mode === 'tower' ? game.tower.floorSeed : QUICK_SEED;
    game.gates = buildGates(layoutSeed, game.mode === 'tower' ? game.tower.floor : 1);
    game.pins = buildPins(layoutSeed);
    game.totalPins = game.pins.length;
    game.hitPins = 0;
    game.combo = 0;
    game.comboTimer = 0;
    game.gateMult = 0;
    game.gateChain = 0;
    game.bigMoment = false;
    game.waveMoment = false;
    game.hitStop = 0;
    game.cleared = false;
    game.aim.charging = false;
    game.aim.angle = 0;
    setSpinUI();
    game.settleTimer = 0.3;
    game.betweenTimer = 0;
    game.particles = [];
    game.popups = [];
    toastEl.classList.remove('show');
    renderBallBar();
    updateHUD();
  }

  function doThrow() {
    const s = game.stones[0];
    if (!s || !s.alive) return;
    const speed = FULL_SPEED;
    s.vx = Math.sin(game.aim.angle) * speed;
    s.vy = Math.cos(game.aim.angle) * speed;
    s.spin =
      game.spin *
      (game.mode === 'tower' ? ballSpinMult(getSelectedBall()) : 1);
    s.active = true;
    if (game.mode === 'tower') {
      const b = getSelectedBall();
      b.used += 1;
    }
    if (s.ballId === 'magnet') {
      s.magnetTimer = 4;
      s.magnetRadius = 2.8;
    }
    if (s.ballId === 'pierce') s.pierce = 3;
    if (s.ballId === 'bounce') s.ballBounce = true;
    if (s.ballId === 'bomb') s.ballBomb = true;
    game.phase = 'slide';
    game.aim.charging = false;
    game.settleTimer = 0.3;
    renderBallBar();
    AudioFX.throwStone();
  }

  function finishThrow() {
    if (game.phase !== 'slide') return;
    scoreHouse();
    let clearBonus = 0;
    if (game.totalPins > 0 && game.hitPins >= game.totalPins) {
      clearBonus = 800 * Math.max(1, game.throwMaxMult);
      game.score += clearBonus;
      addPopup(0, WORLD.houseY - 1, '清屏奖励 +' + Math.round(clearBonus), '#ffd34d', 1.4);
    }
    const gained = Math.round(game.score - game.throwStartScore);
    game.throwScores.push(gained);
    game.lastThrowScore = gained;
    game.phase = 'between';
    game.settleTimer = 0;
    game.betweenTimer = 1.0;
    renderBallBar();

    if (game.mode === 'tower') {
      const damage = Math.round(gained * (1 + towerAtkBonus()));
      game.tower.floorDamage += damage;
      game.throwStartScore = game.score;
      if (game.tower.floorDamage >= game.tower.def) {
        game.betweenTimer = 0.45;
        showToast('达标！伤害 ' + fmt(game.tower.floorDamage) + ' / ' + fmt(game.tower.def), 900);
      } else {
        showToast('第 ' + (game.throwIndex + 1) + ' 壶 +' + fmt(damage) + ' 伤害', 900);
      }
    } else {
      showToast('第 ' + (game.throwIndex + 1) + ' 壶 +' + fmt(gained) + (clearBonus ? ' · 清屏!' : ''), 900);
    }
  }

  function advanceBetween() {
    if (
      game.mode === 'tower' &&
      game.tower.floorDamage >= game.tower.def
    ) {
      resolveTowerFloor();
      return;
    }
    nextThrow();
  }

  function nextThrow() {
    if (game.mode === 'tower') {
      if (game.tower.floorDamage >= game.tower.def) {
        resolveTowerFloor();
        return;
      }
      if (!game.tower.balls.some((b) => b.used < b.count)) {
        resolveTowerFloor();
        return;
      }
      game.throwIndex += 1;
      if (game.throwIndex >= game.throwsTotal) {
        resolveTowerFloor();
        return;
      }
      startThrow();
      return;
    }

    game.throwIndex += 1;
    if (game.throwIndex >= game.throwsTotal) {
      showResult();
      return;
    }
    startThrow();
  }

  function resolveTowerFloor() {
    const t = game.tower;
    if (t.floorDamage >= t.def) {
      t.bestFloor = Math.max(t.bestFloor, t.floor);
      saveTowerBest(t.bestFloor);
      AudioFX.win();
      haptic([20, 30, 40]);
      showTowerClear();
      return;
    }

    t.hearts = Math.max(0, t.hearts - 1);
    if (t.hearts <= 0) {
      t.bestFloor = Math.max(t.bestFloor, t.floor - 1);
      saveTowerBest(t.bestFloor);
      AudioFX.fail();
      showResult();
      return;
    }
    AudioFX.fail();
    haptic(20);
    showTowerFail();
  }

  function showTowerClear() {
    const t = game.tower;
    game.phase = 'towerClear';
    towerOverlay.classList.remove('hidden');
    towerBadge.textContent = '第 ' + t.floor + ' 层突破';
    towerTitle.textContent = '选择 1 个冰球';
    towerSub.textContent = '伤害 ' + fmt(t.floorDamage) + ' / 防御 ' + fmt(t.def);
    towerBalls.classList.remove('hidden');
    towerTip.classList.remove('hidden');
    towerAtk.classList.remove('hidden');
    towerNextBtn.classList.remove('hidden');
    towerNextBtn.textContent = '进入第 ' + (t.floor + 1) + ' 层';
    towerNextBtn.disabled = true;
    towerRetryBtn.classList.add('hidden');
    towerEndBtn.classList.add('hidden');
    t.upgraded = false;
    t.chosenOption = -1;
    t.options = rollTowerOptions();
    renderTowerBalls();
    updateTowerAtkLabel();
  }

  function showTowerFail() {
    const t = game.tower;
    game.phase = 'towerFail';
    towerOverlay.classList.remove('hidden');
    towerBadge.textContent = '第 ' + t.floor + ' 层';
    towerTitle.textContent = '防御不足';
    towerSub.textContent =
      '伤害 ' + fmt(t.floorDamage) + ' / 防御 ' + fmt(t.def) + ' · 剩余 ' + t.hearts + ' 心';
    towerBalls.classList.add('hidden');
    towerTip.classList.add('hidden');
    towerAtk.classList.add('hidden');
    towerNextBtn.classList.add('hidden');
    towerRetryBtn.classList.remove('hidden');
    towerRetryBtn.textContent = '重试本层（❤' + t.hearts + '）';
    towerEndBtn.classList.remove('hidden');
    towerEndBtn.textContent = '放弃回主页';
  }

  function rollTowerOptions() {
    const t = game.tower;
    const pool = [];
    for (const id of Object.keys(BALL_TYPES)) {
      pool.push({ kind: 'new', id });
    }
    t.balls.forEach((b, i) => {
      if (b.level < 5) pool.push({ kind: 'upgrade', index: i });
    });
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled.slice(0, 3);
  }

  function renderTowerBalls() {
    const t = game.tower;
    towerBalls.innerHTML = '';
    t.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ball-card';
      if (t.chosenOption === i) btn.classList.add('selected');
      if (t.upgraded) btn.disabled = true;

      if (opt.kind === 'new') {
        const type = BALL_TYPES[opt.id];
        const owned = t.balls.find((b) => b.id === opt.id);
        const meta = owned
          ? '新增 1 颗 · 已有 Lv.' + owned.level + ' ×' + owned.count
          : '获得 Lv.1';
        btn.innerHTML =
          '<b>' + type.name + ' · 新冰球</b>' +
          '<span class="ball-meta">' + meta + '</span>' +
          '<span class="ball-desc">' + type.desc + '</span>';
      } else if (opt.kind === 'upgrade') {
        const ball = t.balls[opt.index];
        const type = ballType(ball);
        btn.innerHTML =
          '<b>' + type.name + ' Lv.' + ball.level + ' → Lv.' + (ball.level + 1) + '</b>' +
          '<span class="ball-meta">该种类全部 +18% 攻击</span>' +
          '<span class="ball-desc">' + type.desc + '</span>';
      } else {
        btn.innerHTML =
          '<b>恢复 1 心</b>' +
          '<span class="ball-meta">当前 ❤' + t.hearts + '</span>' +
          '<span class="ball-desc">球少的时候可以保命</span>';
      }

      btn.addEventListener('click', () => chooseTowerOption(i));
      towerBalls.appendChild(btn);
    });
  }

  function chooseTowerOption(i) {
    const t = game.tower;
    if (t.upgraded) return;
    const opt = t.options[i];
    if (!opt) return;
    if (opt.kind === 'new') {
      const existing = t.balls.findIndex((b) => b.id === opt.id);
      if (existing >= 0) {
        t.balls[existing].count += 1;
        t.selectedBall = existing;
      } else {
        t.balls.push({ id: opt.id, level: 1, count: 1, used: 0 });
        t.selectedBall = t.balls.length - 1;
      }
    } else if (opt.kind === 'upgrade') {
      t.balls[opt.index].level = Math.min(5, t.balls[opt.index].level + 1);
      t.selectedBall = opt.index;
    } else {
      t.hearts = Math.min(5, t.hearts + 1);
    }
    t.upgraded = true;
    t.chosenOption = i;
    AudioFX.gate();
    haptic(12);
    renderTowerBalls();
    renderBallBar();
    updateTowerAtkLabel();
    towerNextBtn.disabled = false;
  }

  function renderBallBar() {
    const t = game.tower;
    ballBar.innerHTML = '';
    if (game.mode !== 'tower') {
      ballBar.classList.add('hidden');
      return;
    }
    ballBar.classList.remove('hidden');
    ballBar.style.justifyContent = t.balls.length <= 4 ? 'center' : 'flex-start';
    t.balls.forEach((ball, i) => {
      const type = ballType(ball);
      const remaining = ball.count - ball.used;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ball-chip';
      if (i === t.selectedBall && remaining > 0) btn.classList.add('selected');
      if (remaining <= 0) btn.classList.add('used');
      btn.disabled = game.phase !== 'aim' || remaining <= 0;
      btn.innerHTML =
        '<span class="ball-name">' +
        type.name.replace('球', '') +
        ' ×' +
        remaining +
        '</span><span class="ball-lv">Lv.' +
        ball.level +
        '</span>';
      if (i === t.selectedBall) btn.style.borderColor = type.color;
      btn.addEventListener('click', () => selectBall(i));
      ballBar.appendChild(btn);
    });
    const selected = ballBar.querySelector('.ball-chip.selected');
    if (selected) {
      const target =
        selected.offsetLeft - (ballBar.clientWidth - selected.clientWidth) / 2;
      ballBar.scrollLeft = Math.max(0, target);
    }
  }

  function selectBall(i) {
    const t = game.tower;
    if (game.mode !== 'tower' || game.phase !== 'aim') return;
    if (!t.balls[i] || t.balls[i].used >= t.balls[i].count) return;
    t.selectedBall = i;
    const s = game.stones[0];
    if (s) {
      const ball = t.balls[i];
      const type = ballType(ball);
      s.r = ballRadius(ball);
      s.mass = (s.r / R0) * (s.r / R0);
      s.ballId = ball.id;
      s.ballLevel = ball.level;
      s.ballColor = type.color;
    }
    AudioFX.gate();
    haptic(8);
    renderBallBar();
    updateHUD();
  }

  function updateTowerAtkLabel() {
    const ball = getSelectedBall();
    const type = ballType(ball);
    towerAtk.textContent =
      '当前：' +
      type.name +
      ' Lv.' +
      ball.level +
      ' · 攻击 +' +
      Math.round((ballPower(ball) - 1) * 100) +
      '%';
  }

  function nextTowerFloor() {
    const t = game.tower;
    if (!t.upgraded) return;
    towerOverlay.classList.add('hidden');
    t.floor += 1;
    t.def = Math.round(t.def * TOWER_DEF_GROWTH);
    t.floorDamage = 0;
    t.floorSeed = hashSeed(t.runSeed, t.floor);
    t.options = [];
    t.upgraded = false;
    t.chosenOption = -1;
    t.balls.forEach((b) => { b.used = 0; });
    game.throwIndex = 0;
    game.throwScores = [];
    game.phase = 'aim';
    startThrow();
  }

  function retryTowerFloor() {
    const t = game.tower;
    towerOverlay.classList.add('hidden');
    t.floorDamage = 0;
    t.upgraded = false;
    t.options = [];
    t.chosenOption = -1;
    t.balls.forEach((b) => { b.used = 0; });
    game.throwIndex = 0;
    game.throwScores = [];
    game.phase = 'aim';
    startThrow();
  }

  function showResult() {
    game.phase = 'result';
    overlayEl.style.display = 'flex';
    overlayEl.classList.add('show');
    overlayEl.classList.add('result');
    resultStatsEl.classList.remove('hidden');
    homeBtn.classList.remove('hidden');
    towerBtn.classList.add('hidden');
    ballBar.classList.add('hidden');
    shareBtn.classList.remove('hidden');

    if (game.mode === 'tower') {
      const t = game.tower;
      startBtn.textContent = '重新爬塔';
      footnoteEl.textContent = '爬塔模式 · 最高第 ' + t.bestFloor + ' 层';
      resultStatsEl.innerHTML =
        '<div class="rs-row"><span>到达层数</span><b>第 ' + t.floor + ' 层</b></div>' +
        '<div class="rs-row"><span>最高层数</span><b>第 ' + t.bestFloor + ' 层</b></div>' +
        '<div class="rs-row"><span>剩余心数</span><b>' + '❤'.repeat(Math.max(0, t.hearts)) + '</b></div>' +
        '<div class="rs-row"><span>攻击加成</span><b>+' + Math.round(towerAtkBonus() * 100) + '%</b></div>' +
        '<div class="rs-row"><span>最高冰球</span><b>Lv.' + Math.max(...t.balls.map((b) => b.level)) + '</b></div>' +
        '<div class="rs-row"><span>通关层数</span><b>' + Math.max(0, t.floor - 1) + '</b></div>';
      AudioFX.fail();
      haptic(20);
      return;
    }

    const score = Math.round(game.score);
    if (score > game.best) {
      game.best = score;
      saveBest(score);
    }
    startBtn.textContent = '再来一局';
    footnoteEl.textContent = '3 壶 · 目标 6,000 · 3 星 10,000';
    const stars = starsFor(score);
    const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    let hint;
    if (score >= THREE_STAR_SCORE) hint = '三星达成，漂亮！';
    else if (score >= game.targetScore) hint = '二星达成，再冲 ' + fmt(THREE_STAR_SCORE);
    else hint = '距离目标还差 ' + fmt(game.targetScore - score) + ' 分';

    const rows = game.throwScores
      .map((s, i) => '<span>第' + (i + 1) + '壶 ' + fmt(s) + '</span>')
      .join('');
    resultStatsEl.innerHTML =
      '<div class="rs-stars">' + starText + '</div>' +
      '<div class="rs-row"><span>本局得分</span><b>' + fmt(score) + '</b></div>' +
      '<div class="rs-row"><span>最高分</span><b>' + fmt(game.best) + '</b></div>' +
      '<div class="rs-row"><span>最高倍率</span><b>×' + game.maxMult.toFixed(1) + '</b></div>' +
      '<div class="rs-row"><span>最高连击</span><b>' + game.maxCombo + '</b></div>' +
      '<div class="rs-row"><span>最高门链</span><b>x' + game.maxChain + '</b></div>' +
      '<div class="rs-row"><span>命中钉子</span><b>' + game.runHitPins + '/' + game.runTotalPins + '</b></div>' +
      '<div class="rs-hint">' + hint + '</div>' +
      '<div class="rs-throws">' + rows + '</div>';
    if (stars > 0) {
      AudioFX.win();
    } else {
      AudioFX.fail();
    }
    haptic(stars > 0 ? [15, 40, 20] : 20);
  }

  function showMenu() {
    game.phase = 'menu';
    game.mode = 'quick';
    game.score = 0;
    game.displayScore = 0;
    game.throwIndex = 0;
    game.throwsTotal = 3;
    game.gates = buildGates(QUICK_SEED, 1);
    game.pins = buildPins(QUICK_SEED);
    game.totalPins = game.pins.length;
    game.stones = [makeStone(0, WORLD.releaseY)];
    game.tower.bestFloor = loadTowerBest();
    overlayEl.style.display = 'flex';
    overlayEl.classList.add('show');
    overlayEl.classList.remove('result');
    startBtn.textContent = '爽快模式';
    towerBtn.textContent = '爬塔模式';
    towerBtn.classList.remove('hidden');
    homeBtn.classList.add('hidden');
    shareBtn.classList.add('hidden');
    footnoteEl.textContent = '3 壶 · 目标 6,000 · 3 星 10,000';
    towerOverlay.classList.add('hidden');
    ballBar.classList.add('hidden');
    resultStatsEl.classList.add('hidden');
    resultStatsEl.innerHTML = '';
    setSpinUI();
  }

  // =========================================================================
  // Input
  // =========================================================================
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function updateAimAngle() {
    const stone = game.stones[0];
    if (!stone) return;
    const target = unproject(game.aim.curX, game.aim.curY);
    const raw = Math.atan2(target.x - stone.x, target.y - stone.y);
    game.aim.angle = clamp(Number.isFinite(raw) ? raw : 0, -1.15, 1.15);
  }

  function setSpin(v) {
    game.spin = v;
    saveSpin(v);
    setSpinUI();
  }

  function setSpinUI() {
    document.querySelectorAll('.spin-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.spin) === game.spin);
    });
  }

  canvas.addEventListener('pointerdown', (e) => {
    AudioFX.init();
    if (game.phase === 'between') {
      advanceBetween();
      return;
    }
    if (game.phase === 'aim') {
      if (game.aim.charging) return;
      const p = getPointerPos(e);
      game.aim.charging = true;
      game.aim.startX = p.x;
      game.aim.curX = p.x;
      game.aim.curY = p.y;
      game.aim.angle = 0;
      updateAimAngle();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (game.phase === 'aim' && game.aim.charging) {
      const p = getPointerPos(e);
      game.aim.curX = p.x;
      game.aim.curY = p.y;
      updateAimAngle();
    }
  });

  function endPointer() {
    if (game.phase === 'aim' && game.aim.charging) {
      game.aim.charging = false;
      doThrow();
    }
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', () => {
    game.aim.charging = false;
  });

  document.querySelectorAll('.spin-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      AudioFX.init();
      setSpin(Number(btn.dataset.spin));
    });
  });

  startBtn.addEventListener('click', () => {
    AudioFX.init();
    startGame(game.mode === 'tower' ? 'tower' : 'quick');
  });

  towerBtn.addEventListener('click', () => {
    AudioFX.init();
    startGame('tower');
  });

  homeBtn.addEventListener('click', () => {
    AudioFX.init();
    showMenu();
  });

  function shareResult() {
    const text =
      game.mode === 'tower'
        ? '我在冰壶大作战爬到第 ' +
          game.tower.floor +
          ' 层，最高第 ' +
          game.tower.bestFloor +
          ' 层，来挑战！'
        : '我在冰壶大作战拿到 ' +
          fmt(game.score) +
          ' 分（' +
          '★'.repeat(starsFor(Math.round(game.score))) +
          '），来挑战！';
    const url = location.href;
    if (navigator.share) {
      try {
        navigator.share({ title: '冰壶大作战', text, url }).catch(() => {});
      } catch (e) {
        showToast('分享不可用，截图吧', 900);
      }
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text + ' ' + url)
        .then(() => showToast('已复制成绩', 900))
        .catch(() => showToast('分享不可用，截图吧', 900));
      return;
    }
    showToast('分享不可用，截图吧', 900);
  }

  shareBtn.addEventListener('click', () => {
    AudioFX.init();
    shareResult();
  });

  towerNextBtn.addEventListener('click', () => {
    AudioFX.init();
    if (game.phase === 'towerClear') nextTowerFloor();
  });

  towerRetryBtn.addEventListener('click', () => {
    AudioFX.init();
    if (game.phase === 'towerFail') retryTowerFloor();
  });

  towerEndBtn.addEventListener('click', () => {
    AudioFX.init();
    showMenu();
  });

  function restartRun() {
    startGame();
    showToast('已重开', 700);
    haptic(10);
  }

  restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    AudioFX.init();
    restartRun();
  });

  muteBtn.addEventListener('click', () => {
    AudioFX.init();
    const next = !AudioFX.isMuted();
    AudioFX.setMuted(next);
    muteBtn.textContent = next ? '🔇' : '🔊';
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
    } else if (e.code === 'KeyR') {
      restartRun();
    } else if (e.code === 'KeyA') {
      setSpin(-1);
    } else if (e.code === 'KeyD') {
      setSpin(1);
    } else if (e.code === 'KeyS') {
      setSpin(0);
    } else if (e.code === 'KeyM') {
      muteBtn.click();
    }
  });

  window.addEventListener('keyup', (e) => {
    /* space no longer used */
  });

  // =========================================================================
  // Physics
  // =========================================================================
  function stepStone(s, dt) {
    if (!s.alive) return;
    const speed = Math.hypot(s.vx, s.vy);
    if (speed < 0.15) {
      s.vx = 0;
      s.vy = 0;
      return;
    }

    const sizeFactor = clamp(1.15 - 0.15 * (s.r / R0), 0.7, 1.15);
    const lowSpeed = clamp((1.6 - speed) / 1.6, 0, 1);
    let fr = s.friction * sizeFactor * (1 + 1.4 * lowSpeed);

    const dec = Math.min(speed, fr * dt);
    s.vx -= (s.vx / speed) * dec;
    s.vy -= (s.vy / speed) * dec;

    const sp = Math.hypot(s.vx, s.vy);
    if (sp > 0.15 && s.spin !== 0) {
      const curl = s.spin * CURL_ACCEL * (0.6 + 0.4 * (sp / 8));
      const nx = s.vx / sp;
      const ny = s.vy / sp;
      s.vx += ny * curl * dt;
      s.vy += -nx * curl * dt;
    }

    if (s.magnetTimer > 0) {
      s.magnetTimer = Math.max(0, s.magnetTimer - dt);
      for (const p of game.pins) {
        if (p.hit) continue;
        const dx = s.x - p.x;
        const dy = s.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < s.magnetRadius && d > 0.01) {
          p.vx += (dx / d) * 3.2 * dt;
          p.vy += (dy / d) * 3.2 * dt;
          p.moving = true;
        }
      }
    }

    const prevY = s.y;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    const minX = -WORLD.halfWidth + s.r;
    const maxX = WORLD.halfWidth - s.r;
    const wallBounce = s.ballBounce ? 0.88 : 0.55;
    if (s.x < minX) {
      s.x = minX;
      s.vx = Math.abs(s.vx) * wallBounce;
      onWallHit(s);
    } else if (s.x > maxX) {
      s.x = maxX;
      s.vx = -Math.abs(s.vx) * wallBounce;
      onWallHit(s);
    }

    checkGateCrossing(s, prevY);
    checkPinCollisions(s);

    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 14) s.trail.shift();

    if (s.y > WORLD.length + 2) {
      s.alive = false;
      burst(s.x, WORLD.length - 1, '#9fd8ff', 8, 0.6);
    }
  }

  function onWallHit(s) {
    game.shake = Math.max(game.shake, 2.5);
    burst(s.x, s.y, '#bfe6ff', 5, 0.5);
    AudioFX.impact(0.35);
  }

  function updateStones(dt) {
    const list = game.stones.slice();
    let maxSpeed = 0;
    for (const s of list) {
      maxSpeed = Math.max(maxSpeed, Math.hypot(s.vx, s.vy));
    }
    // 高速时细分步进，避免穿透钉子/门
    const substeps = Math.min(5, Math.max(1, Math.ceil((maxSpeed * dt) / 0.1)));
    const sub = dt / substeps;
    for (let k = 0; k < substeps; k++) {
      for (const s of list) stepStone(s, sub);
    }
    resolveStoneCollisions();
    game.stones = game.stones.filter((s) => s.alive);
  }

  function resolveStoneCollisions() {
    const arr = game.stones;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (!a.alive || !b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d <= 0.0001 || d >= min) continue;

        const nx = dx / d;
        const ny = dy / d;
        const overlap = min - d;
        const invA = 1 / a.mass;
        const invB = 1 / b.mass;
        const invSum = invA + invB;

        a.x -= nx * overlap * (invA / invSum);
        a.y -= ny * overlap * (invA / invSum);
        b.x += nx * overlap * (invB / invSum);
        b.y += ny * overlap * (invB / invSum);

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const along = rvx * nx + rvy * ny;
        if (along < 0) {
          const e = 0.9;
          const impulse = -(1 + e) * along / invSum;
          a.vx -= impulse * nx * invA;
          a.vy -= impulse * ny * invA;
          b.vx += impulse * nx * invB;
          b.vy += impulse * ny * invB;
          if (Math.abs(impulse) > 0.6) {
            game.shake = Math.max(game.shake, 3);
            AudioFX.impact(0.45);
            burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#cfe9ff', 6, 0.5);
          }
        }
      }
    }
  }

  function checkGateCrossing(s, prevY) {
    if (!s.gateRows) s.gateRows = new Set();
    const sp = project(s.x, s.y);
    const prevSp = project(s.x, prevY);

    for (const row of game.gates) {
      if (row.gates.length === 0) continue;
      const matches = [];
      let maxR = 0;
      let rowP = null;
      for (const g of row.gates) {
        const gx = gateX(g);
        const gp = project(gx, row.y);
        const R = Math.max(6, (g.w / 2) * gp.ppm);
        rowP = gp;
        maxR = Math.max(maxR, R);
        if (g.used) continue;
        const dx = sp.sx - gp.sx;
        const dy = sp.sy - gp.sy;
        if (dx * dx + dy * dy <= R * R) {
          matches.push({ g, gx });
        }
      }

      if (matches.length > 0) {
        s.gateRows.add(row);
        // 同时吃到多个门 → 全部生效；分裂门最后，子球继承前面的增益。
        matches.sort((a, b) => {
          const sa = a.g.type === 'split' ? 1 : 0;
          const sb = b.g.type === 'split' ? 1 : 0;
          return sa - sb;
        });
        for (const hit of matches) {
          hit.g.used = true;
          applyGate(s, hit.g, row, hit.gx);
          if (!s.alive) break;
        }
      }

      // 越过整排圆圈的下沿仍没吃到 → MISS，门链断。
      if (!s.gateRows.has(row) && rowP) {
        const passY = rowP.sy + maxR;
        if (prevSp.sy < passY && sp.sy >= passY) {
          const hadChain = game.gateChain > 0;
          game.gateChain = 0;
          addPopup(
            s.x,
            row.y + 1.2,
            hadChain ? 'MISS · 门链断' : 'MISS',
            'rgba(255,93,108,0.85)',
            0.55
          );
          s.gateRows.add(row);
        }
      }
    }
  }

  function applyGate(s, g, row, gx) {
    const def = GATE_DEFS[g.type];
    const color = GATE_COLORS[def.color];
    const x = gx == null ? g.x : gx;
    const gp = project(x, row.y);
    const sp = project(s.x, s.y);
    const R = Math.max(6, (g.w / 2) * gp.ppm);
    const perfect = Math.hypot(sp.sx - gp.sx, sp.sy - gp.sy) <= R * 0.3;

    game.gateChain += 1;
    game.maxChain = Math.max(game.maxChain, game.gateChain);
    game.combo += 1;
    game.comboTimer = 2.6;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    addPopup(x, row.y + 1.9, def.name, color, 0.8);
    if (game.gateChain > 1) {
      addPopup(x, row.y + 3.4, '门链 x' + game.gateChain, '#ffd34d', 0.7);
    }
    burst(x, row.y, color, 16, 0.7);
    game.shake = Math.max(game.shake, 4);
    haptic(8);
    AudioFX.gate();

    if (perfect) {
      game.gateMult = Math.min(GATE_MULT_MAX, game.gateMult + 0.5);
      addPopup(x, row.y + 2.7, 'PERFECT +0.5x', '#ffd34d', 0.7);
      AudioFX.perfect();
    }

    switch (g.type) {
      case 'sizeUp':
        growStone(s, 1.45);
        break;
      case 'split':
        splitStone(s, 2);
        break;
      case 'speedUp':
        boostSpeed(s, 1.3);
        break;
      case 'mult':
        game.gateMult = Math.min(GATE_MULT_MAX, game.gateMult + 1);
        break;
      case 'magnet':
        s.magnetTimer = 4;
        s.magnetRadius = 2.6;
        break;
      case 'pierce':
        s.pierce += 3;
        break;
      case 'shrink':
        shrinkStone(s, 0.72);
        game.gateMult = Math.min(GATE_MULT_MAX, game.gateMult + 1);
        break;
      case 'sticky':
        if (s.shield) {
          s.shield = false;
          addPopup(s.x, s.y + 0.6, '免疫', '#f2f5ff', 0.9);
        } else {
          s.friction *= 1.45;
        }
        break;
      default:
        break;
    }

    if (s.alive && s.ballId === 'split' && !s.ballSplitUsed) {
      s.ballSplitUsed = true;
      splitStone(s, 2);
    }
  }

  function growStone(s, mult) {
    const next = Math.min(R0 * SIZE_MAX, s.r * mult);
    if (next <= s.r + 0.0001) return;
    s.r = next;
    s.mass = (s.r / R0) * (s.r / R0);
    ring(s.x, s.y, '#39e58c');
    game.shake = Math.max(game.shake, 5);
  }

  function shrinkStone(s, mult) {
    const next = Math.max(R0 * SIZE_MIN, s.r * mult);
    if (next >= s.r - 0.0001) return;
    s.r = next;
    s.mass = (s.r / R0) * (s.r / R0);
    burst(s.x, s.y, '#c084fc', 10, 0.5);
  }

  function boostSpeed(s, mult) {
    const sp = Math.hypot(s.vx, s.vy);
    if (sp < 0.01) return;
    const target = Math.min(SPEED_MAX, sp * mult);
    s.vx = (s.vx / sp) * target;
    s.vy = (s.vy / sp) * target;
    ring(s.x, s.y, '#4bb8ff');
  }

  function splitStone(s, count) {
    const parentSpeed = Math.hypot(s.vx, s.vy);
    if (parentSpeed < 0.05) return;

    const available = MAX_STONES - game.stones.length;
    if (available <= 0) {
      growStone(s, 1.12);
      addPopup(s.x, s.y + 0.6, '上限·变大', '#39e58c', 0.8);
      return;
    }

    const n = Math.min(count, available + 1);
    const baseAngle = Math.atan2(s.vy, s.vx);
    const spread = 0.18;
    const children = [];
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i - (n - 1) / 2) * spread * 2;
      const a = baseAngle + off;
      const childSpeed = parentSpeed * 0.95;
      const child = makeStone(s.x, s.y, {
        r: Math.max(R0 * SIZE_MIN, s.r * 0.72),
        vx: Math.cos(a) * childSpeed,
        vy: Math.sin(a) * childSpeed,
        friction: s.friction,
        spin: s.spin,
        magnetTimer: s.magnetTimer,
        magnetRadius: s.magnetRadius,
        pierce: s.pierce,
        shield: s.shield,
        active: true
      });
      children.push(child);
    }
    s.alive = false;
    game.stones.push(...children);
    burst(s.x, s.y, '#39e58c', 24, 0.9);
    ring(s.x, s.y, '#39e58c');
    game.shake = Math.max(game.shake, 8);
    game.flash = Math.max(game.flash, 0.25);
    game.hitStop = 0.03;
    haptic(15);
    AudioFX.split();
  }

  function checkPinCollisions(s) {
    for (const p of game.pins) {
      if (p.hit) continue;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const rr = s.r + p.r;
      if (dx * dx + dy * dy > rr * rr) continue;
      const d = Math.max(0.001, Math.hypot(dx, dy));
      hitPin(p, dx / d, dy / d, Math.hypot(s.vx, s.vy), 0, s);
    }
  }

  /**
   * 命中一个钉子。
   * depth 0 = 冰壶直接撞击；depth 1/2 = 钉子之间的连锁反应。
   */
  function hitPin(p, nx, ny, speed, depth, stone) {
    if (p.hit) return;
    p.hit = true;
    p.moving = true;

    const kick = depth === 0 ? 3.6 + speed * 0.55 : 1.8 + speed * 0.18;
    p.vx = nx * kick + (depth === 0 && stone ? stone.vx * 0.25 : 0);
    p.vy = ny * kick + (depth === 0 && stone ? stone.vy * 0.25 : 0);
    p.life = 1;

    game.combo += 1;
    game.comboTimer = 1.6;
    game.hitPins += 1;
    game.runHitPins += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);

    const pts = 15 * totalMult();
    game.score += pts;
    addPopup(p.x, p.y + 0.35, '+' + Math.round(pts), '#ffe07a', depth === 0 ? 0.95 : 0.75);
    burst(p.x, p.y, '#eaf7ff', depth === 0 ? 9 : 4, 0.7);
    game.shake = Math.max(game.shake, depth === 0 ? 3.5 : 1.5);

    if (depth === 0 && game.combo % 10 === 0) {
      addPopup(p.x, p.y + 0.95, 'COMBO x' + game.combo, '#5fe3ff', 1.05);
      game.shake = Math.max(game.shake, 6);
    }

    if (depth === 0 || Math.random() < 0.25) {
      AudioFX.impact(depth === 0 ? 0.65 : 0.3, game.combo);
    }
    if (depth === 0) haptic(8);

    if (game.hitPins === 15 && !game.bigMoment) {
      game.bigMoment = true;
      game.slowTimer = 0.32;
      game.flash = Math.max(game.flash, 0.45);
      game.shake = Math.max(game.shake, 10);
      game.hitStop = 0.04;
      addPopup(0, WORLD.houseY, '大爆发!', '#ffd34d', 1.5);
      ring(0, WORLD.houseY, '#ffd34d');
    }

    if (game.hitPins === 25 && !game.waveMoment) {
      game.waveMoment = true;
      game.slowTimer = 0.4;
      game.flash = Math.max(game.flash, 0.6);
      game.shake = Math.max(game.shake, 14);
      game.hitStop = 0.05;
      addPopup(0, WORLD.houseY, '狂潮!', '#5fe3ff', 1.7);
      ring(0, WORLD.houseY, '#5fe3ff');
      haptic([15, 25, 35]);
    }

    if (stone && depth === 0) {
      if (stone.pierce > 0) {
        stone.pierce -= 1;
        burst(stone.x, stone.y, '#ffd34d', 8, 0.5);
        addPopup(stone.x, stone.y + 0.5, '穿透', '#ffd34d', 0.8);
      } else {
        const damp = clamp(0.14 / (stone.mass + 0.14) * 0.9, 0.02, 0.25);
        stone.vx *= 1 - damp;
        stone.vy *= 1 - damp;
      }

      if (stone.ballBomb && !stone.ballBombUsed) {
        stone.ballBombUsed = true;
        ring(p.x, p.y, '#ef4444');
        burst(p.x, p.y, '#ef4444', 18, 1.0);
        game.shake = Math.max(game.shake, 8);
        addPopup(p.x, p.y + 0.8, '爆裂!', '#ef4444', 1.0);
        for (const other of game.pins) {
          if (other.hit) continue;
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.001 && d < 1.25) {
            hitPin(other, dx / d, dy / d, 3.0, 1, null);
          }
        }
      }
    }

    if (game.hitPins >= game.totalPins) clearMoment();

    // 钉子连锁：最多两代，制造“一壶清一片”的爽感。
    if (depth < 2) {
      for (const other of game.pins) {
        if (other.hit) continue;
        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001 && d < 0.66) {
          hitPin(other, dx / d, dy / d, 2.2, depth + 1, null);
        }
      }
    }
  }

  function updatePins(dt) {
    for (const p of game.pins) {
      if (p.hit) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life -= dt * 1.15;
      } else if (p.moving) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
        if (Math.hypot(p.vx, p.vy) < 0.05) p.moving = false;
      }
    }
  }

  function scoreHouse() {
    const mult = Math.max(1, game.throwMaxMult);
    let gained = 0;
    for (const s of game.stones) {
      if (!s.alive) continue;
      const d = Math.hypot(s.x, s.y - WORLD.houseY);
      if (d < WORLD.houseR) {
        const base = d < 0.35 ? 250 : d < 1.05 ? 120 : 60;
        const pts = base * mult;
        gained += pts;
        addPopup(s.x, s.y + 0.5, '+' + Math.round(pts), '#ffd34d', 1.05);
        ring(s.x, s.y, '#ffd34d');
      }
    }
    game.score += gained;
    return gained;
  }

  function allStonesDone() {
    if (game.stones.length === 0) return true;
    return game.stones.every((s) => !s.alive || Math.hypot(s.vx, s.vy) < 0.16);
  }

  // =========================================================================
  // Update
  // =========================================================================
  function update(dt) {
    game.time += dt;

    if (game.phase === 'slide' || game.phase === 'between') {
      const slideScale = game.phase === 'slide' ? SLIDE_TIME_SCALE : 1;
      updateStones(dt * slideScale);
      updatePins(dt * slideScale);
    }
    updateParticles(dt);
    updatePopups(dt);

    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) game.combo = 0;
    }

    if (game.phase === 'slide') {
      if (allStonesDone()) {
        game.settleTimer -= dt;
        if (game.settleTimer <= 0) finishThrow();
      } else {
        game.settleTimer = 0.3;
      }
    } else if (game.phase === 'between') {
      game.betweenTimer -= dt;
      if (game.betweenTimer <= 0) advanceBetween();
    }

    game.shake *= Math.pow(0.9, dt * 60);
    if (game.shake < 0.05) game.shake = 0;
    game.flash *= Math.pow(0.88, dt * 60);
    if (game.flash < 0.005) game.flash = 0;
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      p.life -= dt;
      if (p.type === 'dot') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }
    }
    game.particles = game.particles.filter((p) => p.life > 0);
  }

  function updatePopups(dt) {
    for (const p of game.popups) {
      p.life -= dt;
      p.y += 0.55 * dt;
    }
    game.popups = game.popups.filter((p) => p.life > 0);
  }

  // =========================================================================
  // Aim preview
  // =========================================================================
  function ghostPath(power, angle) {
    const speed = 4.5 + power * 7.0;
    const ball = game.mode === 'tower' ? getSelectedBall() : null;
    const s = {
      x: game.stones[0] ? game.stones[0].x : 0,
      y: game.stones[0] ? game.stones[0].y : WORLD.releaseY,
      vx: Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
      r: ball ? ballRadius(ball) : R0,
      spin: game.spin * (ball ? ballSpinMult(ball) : 1),
      friction: 1.55
    };
    const pts = [];
    for (let i = 0; i < 240; i++) {
      const sp = Math.hypot(s.vx, s.vy);
      if (sp < 0.15 || s.y > WORLD.length) break;
      const low = clamp((1.6 - sp) / 1.6, 0, 1);
      const fr = 1.55 * (1 + 1.4 * low);
      const dec = Math.min(sp, fr * FIXED);
      s.vx -= (s.vx / sp) * dec;
      s.vy -= (s.vy / sp) * dec;
      const sp2 = Math.hypot(s.vx, s.vy);
      if (sp2 > 0.15 && s.spin !== 0) {
        const curl = s.spin * CURL_ACCEL * (0.6 + 0.4 * (sp2 / 8));
        const nx = s.vx / sp2;
        const ny = s.vy / sp2;
        s.vx += ny * curl * FIXED;
        s.vy += -nx * curl * FIXED;
      }
      s.x += s.vx * FIXED;
      s.y += s.vy * FIXED;
      if (s.x < -WORLD.halfWidth) break;
      if (s.x > WORLD.halfWidth) break;
      if (i % 3 === 0) pts.push({ x: s.x, y: s.y });
    }
    return pts;
  }

  // =========================================================================
  // Rendering helpers
  // =========================================================================
  function lineAcross(y, color, width, dash) {
    const l = project(-WORLD.halfWidth, y);
    const r = project(WORLD.halfWidth, y);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(l.sx, l.sy);
    ctx.lineTo(r.sx, r.sy);
    ctx.stroke();
    ctx.restore();
  }

  function initSnow() {
    game.snow = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      game.snow.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.5, 1.8),
        v: rand(5, 16),
        drift: rand(-4, 4),
        a: rand(0.12, 0.42)
      });
    }
  }

  // =========================================================================
  // Render
  // =========================================================================
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#061022');
    g.addColorStop(0.45, '#0a1c36');
    g.addColorStop(1, '#07101f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const rg = ctx.createRadialGradient(W * 0.5, H * 0.2, 10, W * 0.5, H * 0.2, W * 0.85);
    rg.addColorStop(0, 'rgba(60,180,255,0.16)');
    rg.addColorStop(0.55, 'rgba(30,90,160,0.06)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // A faint moon / arena glow
    const moon = ctx.createRadialGradient(W * 0.78, H * 0.12, 2, W * 0.78, H * 0.12, W * 0.22);
    moon.addColorStop(0, 'rgba(180,235,255,0.22)');
    moon.addColorStop(1, 'rgba(180,235,255,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTrack() {
    const nearL = project(-WORLD.halfWidth, 0);
    const nearR = project(WORLD.halfWidth, 0);
    const farL = project(-WORLD.halfWidth, WORLD.length);
    const farR = project(WORLD.halfWidth, WORLD.length);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(nearL.sx, nearL.sy);
    ctx.lineTo(farL.sx, farL.sy);
    ctx.lineTo(farR.sx, farR.sy);
    ctx.lineTo(nearR.sx, nearR.sy);
    ctx.closePath();

    const ice = ctx.createLinearGradient(0, H, 0, farL.sy);
    ice.addColorStop(0, '#c6ebff');
    ice.addColorStop(0.35, '#9ed4f2');
    ice.addColorStop(0.72, '#79b3d9');
    ice.addColorStop(1, '#5b91bb');
    ctx.fillStyle = ice;
    ctx.fill();

    // inner sheen
    const sheen = ctx.createLinearGradient(nearL.sx, 0, nearR.sx, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0.22)');
    sheen.addColorStop(0.6, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // side boards
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(13,42,72,0.95)';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(nearL.sx, nearL.sy);
    ctx.lineTo(farL.sx, farL.sy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nearR.sx, nearR.sy);
    ctx.lineTo(farR.sx, farR.sy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,210,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nearL.sx + 4, nearL.sy);
    ctx.lineTo(farL.sx + 2, farL.sy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nearR.sx - 4, nearR.sy);
    ctx.lineTo(farR.sx - 2, farR.sy);
    ctx.stroke();
    ctx.restore();

    // center line
    const c0 = project(0, 0);
    const c1 = project(0, WORLD.length);
    ctx.save();
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c0.sx, c0.sy);
    ctx.lineTo(c1.sx, c1.sy);
    ctx.stroke();
    ctx.restore();

    // hog line
    lineAcross(8.5, 'rgba(230,70,80,0.85)', 3);
    // tee line
    lineAcross(WORLD.houseY, 'rgba(255,255,255,0.35)', 1.5);

    // ice scratches
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const x = -1.9 + i * 0.48;
      const a = project(x, 2 + (i % 3) * 1.7);
      const b = project(x + 0.18, 12 + (i % 4) * 3.1);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHouse() {
    const c = project(0, WORLD.houseY);
    const rings = [
      { r: 1.83, color: '#2a7de1' },
      { r: 1.40, color: '#eaf7ff' },
      { r: 0.95, color: '#e04444' },
      { r: 0.50, color: '#eaf7ff' },
      { r: 0.15, color: '#e04444' }
    ];
    ctx.save();
    for (const ringDef of rings) {
      const rx = ringDef.r * c.ppm;
      const ry = rx * 0.46;
      ctx.beginPath();
      ctx.ellipse(c.sx, c.sy, rx, ry, 0, 0, TAU);
      ctx.fillStyle = ringDef.color;
      ctx.globalAlpha = 0.92;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(c.sx, c.sy, 1.83 * c.ppm, 1.83 * c.ppm * 0.46, 0, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawTowerMonster() {
    const t = game.tower;
    const p = project(0, 33.2);
    const r = Math.max(10, 0.5 * p.ppm);
    ctx.save();
    const g = ctx.createRadialGradient(p.sx, p.sy, r * 0.2, p.sx, p.sy, r * 1.8);
    g.addColorStop(0, 'rgba(95,227,255,0.22)');
    g.addColorStop(1, 'rgba(95,227,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r * 1.8, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, TAU);
    ctx.fillStyle = '#10233b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(95,227,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#5fe3ff';
    ctx.beginPath();
    ctx.arc(p.sx - r * 0.35, p.sy - r * 0.1, Math.max(1.5, r * 0.12), 0, TAU);
    ctx.arc(p.sx + r * 0.35, p.sy - r * 0.1, Math.max(1.5, r * 0.12), 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(4,12,24,0.82)';
    roundRect(ctx, p.sx - 36, p.sy - r - 28, 72, 18, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(95,227,255,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffd34d';
    ctx.font = '700 10px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEF ' + fmt(t.def), p.sx, p.sy - r - 19);
    ctx.restore();
  }

  function drawGates() {
    for (const row of game.gates) {
      for (const g of row.gates) {
        const def = GATE_DEFS[g.type];
        const color = GATE_COLORS[def.color];
        const gx = gateX(g);
        const p = project(gx, row.y);
        const R = Math.max(6, (g.w / 2) * p.ppm);

        ctx.save();
        ctx.globalAlpha = g.used ? 0.22 : 1;

        // 圆形触发区：屏幕上的圆，直径 = 设计宽度；整圆内部都可触发。
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, R, 0, TAU);
        ctx.fillStyle = color + '26';
        ctx.fill();
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // PERFECT 区：半径 30%，和判定完全一致。
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, R * 0.3, 0, TAU);
        ctx.fillStyle = 'rgba(255,211,77,0.20)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,211,77,0.75)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 中心点
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 2.2, 0, TAU);
        ctx.fillStyle = color;
        ctx.fill();

        const iconSize = clamp(R * 0.45, 10, 20);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 ' + iconSize + 'px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillText(def.icon, p.sx, p.sy - R * 0.46);

        ctx.fillStyle = color;
        ctx.font = '700 ' + clamp(R * 0.26, 8, 12) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillText(def.value, p.sx, p.sy + R * 0.46);

        if (g.move) {
          ctx.fillStyle = color + 'cc';
          ctx.font = '700 ' + clamp(R * 0.2, 7, 9) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
          ctx.fillText('↔', p.sx, p.sy + R * 0.72);
        }

        if (g.used) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '700 12px sans-serif';
          ctx.fillText('✓', p.sx, p.sy);
        }
        ctx.restore();
      }
    }
  }

  function drawPins() {
    const sorted = game.pins.slice().sort((a, b) => b.y - a.y);
    for (const pin of sorted) {
      const p = project(pin.x, pin.y);
      const r = Math.max(2, pin.r * p.ppm);
      const alpha = pin.hit ? clamp(pin.life, 0, 1) : 1;
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = alpha;

      // shadow
      ctx.beginPath();
      ctx.ellipse(p.sx, p.sy + r * 0.55, r * 0.95, r * 0.4, 0, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();

      // body
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, TAU);
      ctx.fillStyle = '#eaf7ff';
      ctx.fill();
      ctx.strokeStyle = '#9fb4c8';
      ctx.lineWidth = Math.max(0.8, r * 0.16);
      ctx.stroke();

      // red band
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r * 0.58, 0, TAU);
      ctx.strokeStyle = '#e04444';
      ctx.lineWidth = Math.max(1, r * 0.22);
      ctx.stroke();

      // highlight
      ctx.beginPath();
      ctx.arc(p.sx - r * 0.28, p.sy - r * 0.35, Math.max(0.8, r * 0.18), 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      ctx.restore();
    }
  }

  function drawStones() {
    const sorted = game.stones.slice().sort((a, b) => b.y - a.y);
    for (const s of sorted) {
      if (!s.alive) continue;
      const p = project(s.x, s.y);
      const r = Math.max(4, s.r * p.ppm);

      // trail
      for (let i = 0; i < s.trail.length; i++) {
        const t = s.trail[i];
        const q = project(t.x, t.y);
        const a = (i / s.trail.length) * 0.16;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, Math.max(1, s.r * q.ppm * (0.35 + 0.65 * (i / s.trail.length))), 0, TAU);
        ctx.fillStyle = 'rgba(95,227,255,' + a.toFixed(3) + ')';
        ctx.fill();
      }

      // speed lines
      const sp = Math.hypot(s.vx, s.vy);
      if (game.phase === 'slide' && sp > 6 && s.trail.length > 2) {
        const dirX = s.vx / sp;
        const dirY = s.vy / sp;
        ctx.save();
        ctx.strokeStyle = 'rgba(220,245,255,0.26)';
        ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
          const ox = -dirY * i * 0.2;
          const oy = dirX * i * 0.2;
          const a = project(s.x - dirX * 0.75 + ox, s.y - dirY * 0.75 + oy);
          const b = project(s.x - dirX * 1.75 + ox, s.y - dirY * 1.75 + oy);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // shadow
      ctx.beginPath();
      ctx.ellipse(p.sx, p.sy + r * 0.38, r * 1.05, r * 0.44, 0, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fill();

      // magnet aura
      if (s.magnetTimer > 0) {
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(75,184,255,0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(r + 6, s.magnetRadius * p.ppm * 0.35), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // growth glow
      if (s.r > R0 * 1.45) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * 1.18, 0, TAU);
        ctx.strokeStyle = 'rgba(57,229,140,0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // body
      const g = ctx.createRadialGradient(p.sx - r * 0.35, p.sy - r * 0.42, r * 0.15, p.sx, p.sy, r);
      g.addColorStop(0, '#f5f9ff');
      g.addColorStop(0.5, '#97a4b3');
      g.addColorStop(1, '#394657');
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, TAU);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = s.pierce > 0 ? '#ffd34d' : 'rgba(223,244,255,0.95)';
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.stroke();

      // handle
      ctx.beginPath();
      ctx.moveTo(p.sx - r * 0.55, p.sy);
      ctx.lineTo(p.sx + r * 0.55, p.sy);
      ctx.strokeStyle = s.ballColor || '#ff6b4a';
      ctx.lineWidth = Math.max(2, r * 0.22);
      ctx.lineCap = 'round';
      ctx.stroke();

      // spin marker
      if (s.spin !== 0) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * 1.35, s.spin > 0 ? -0.9 : Math.PI - 0.9, s.spin > 0 ? 0.9 : Math.PI + 0.9);
        ctx.strokeStyle = 'rgba(95,227,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // aim pulse
      if (game.phase === 'aim' && s === game.stones[0]) {
        const pulse = 1 + Math.sin(game.time * 5) * 0.08;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * 1.55 * pulse, 0, TAU);
        ctx.strokeStyle = 'rgba(95,227,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  function drawAimLine(p, r) {
    if (!game.aim.charging) return;
    const stone = game.stones[0];
    if (!stone) return;
    const pts = ghostPath(1, game.aim.angle);
    if (pts.length < 2) return;
    const n = pts.length;
    const solid = Math.max(2, Math.floor(n * 0.72));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(95,227,255,0.65)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = 'rgba(95,227,255,0.92)';
    ctx.beginPath();
    ctx.moveTo(p.sx, p.sy);
    for (let i = 0; i < solid; i++) {
      const q = project(pts[i].x, pts[i].y);
      ctx.lineTo(q.sx, q.sy);
    }
    ctx.stroke();

    // 后半段淡出，提示真实停点
    ctx.shadowBlur = 0;
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(95,227,255,0.28)';
    ctx.beginPath();
    const firstTail = project(pts[solid - 1].x, pts[solid - 1].y);
    ctx.moveTo(firstTail.sx, firstTail.sy);
    for (let i = solid; i < n; i++) {
      const q = project(pts[i].x, pts[i].y);
      ctx.lineTo(q.sx, q.sy);
    }
    ctx.stroke();

    // ghost stone at predicted stop
    const last = pts[n - 1];
    const q = project(last.x, last.y);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(q.sx, q.sy, Math.max(3, stone.r * q.ppm), 0, TAU);
    ctx.fillStyle = 'rgba(95,227,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(95,227,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // reticle at the finger
    const tx = game.aim.curX;
    const ty = game.aim.curY;
    ctx.strokeStyle = 'rgba(234,247,255,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx, ty, 11, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx - 17, ty);
    ctx.lineTo(tx - 6, ty);
    ctx.moveTo(tx + 6, ty);
    ctx.lineTo(tx + 17, ty);
    ctx.moveTo(tx, ty - 17);
    ctx.lineTo(tx, ty - 6);
    ctx.moveTo(tx, ty + 6);
    ctx.lineTo(tx, ty + 17);
    ctx.stroke();
    ctx.restore();
  }

  function drawAim() {
    if (game.phase !== 'aim') return;
    const stone = game.stones[0];
    if (!stone) return;
    const p = project(stone.x, stone.y);
    const r = Math.max(4, stone.r * p.ppm);

    if (!game.aim.charging) {
      // idle hint arrow
      const a = 0.5 + Math.sin(game.time * 3) * 0.2;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#5fe3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy - r - 12);
      ctx.lineTo(p.sx, p.sy - r - 32);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.sx - 5, p.sy - r - 26);
      ctx.lineTo(p.sx, p.sy - r - 34);
      ctx.lineTo(p.sx + 5, p.sy - r - 26);
      ctx.stroke();
      ctx.restore();
    }

    drawAimLine(p, r);
  }

  function drawParticles() {
    for (const p of game.particles) {
      const q = project(p.x, p.y);
      const t = clamp(p.life / p.maxLife, 0, 1);
      if (p.type === 'ring') {
        const rr = (1 - t) * 2.2 + 0.15;
        ctx.save();
        ctx.globalAlpha = t * 0.8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(q.sx, q.sy, rr * q.ppm, rr * q.ppm * 0.5, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = t * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, Math.max(0.5, p.size * q.ppm * (0.5 + t * 0.5)), 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawPopups() {
    for (const p of game.popups) {
      const q = project(p.x, p.y);
      const t = clamp(p.life / p.maxLife, 0, 1);
      const size = clamp(12 * q.scale * p.size + 5, 9, 24);
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.8);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 ' + size + 'px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(4,12,24,0.7)';
      ctx.strokeText(p.text, q.sx, q.sy);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, q.sx, q.sy);
      ctx.restore();
    }
  }

  function drawSnow() {
    for (const f of game.snow) {
      f.y += f.v * 0.016;
      f.x += f.drift * 0.016;
      if (f.y > H + 4) {
        f.y = -4;
        f.x = Math.random() * W;
      }
      if (f.x < -4) f.x = W + 4;
      if (f.x > W + 4) f.x = -4;
      ctx.save();
      ctx.globalAlpha = f.a;
      ctx.fillStyle = '#eaf7ff';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    ctx.save();
    if (game.shake > 0.3) {
      ctx.translate(rand(-game.shake, game.shake), rand(-game.shake, game.shake));
    }
    drawTrack();
    drawHouse();
    if (game.mode === 'tower') drawTowerMonster();
    drawGates();
    drawPins();
    drawStones();
    drawParticles();
    drawAim();
    drawPopups();
    ctx.restore();

    drawSnow();

    if (game.flash > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + (game.flash * 0.35).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // =========================================================================
  // HUD
  // =========================================================================
  function updateHUD() {
    multEl.textContent = '×' + totalMult().toFixed(1);
    comboEl.textContent = '连击 ' + game.combo;
    chainEl.textContent = game.gateChain > 0 ? '门链 x' + game.gateChain : '门链 —';

    const idx = Math.min(game.throwIndex + 1, game.throwsTotal);
    throwEl.textContent = '第 ' + idx + '/' + game.throwsTotal + ' 壶';

    if (game.mode === 'tower') {
      const t = game.tower;
      const liveDamage =
        t.floorDamage +
        Math.max(0, game.score - game.throwStartScore) * (1 + towerAtkBonus());
      scoreEl.textContent = fmt(liveDamage);
      targetLabelEl.textContent = '第 ' + t.floor + ' 层 · 防御 ' + fmt(t.def);
      const pct = Math.min(100, (liveDamage / t.def) * 100);
      targetBarEl.style.width = pct.toFixed(1) + '%';
      targetBarEl.style.background =
        liveDamage >= t.def
          ? 'linear-gradient(90deg, #ffd34d, #ffb020)'
          : 'linear-gradient(90deg, #5fe3ff, #ffd34d)';
      bestEl.textContent =
        '❤'.repeat(Math.max(0, t.hearts)) +
        '♡'.repeat(Math.max(0, 5 - t.hearts)) +
        ' · 攻击 +' +
        Math.round(towerAtkBonus() * 100) +
        '%';
    } else {
      game.displayScore += (game.score - game.displayScore) * 0.18;
      scoreEl.textContent = fmt(game.displayScore);
      if (game.score >= THREE_STAR_SCORE) {
        targetLabelEl.textContent = '三星达成 ' + fmt(THREE_STAR_SCORE);
      } else if (game.score >= game.targetScore) {
        targetLabelEl.textContent = '二星达成 · 冲 ' + fmt(THREE_STAR_SCORE);
      } else {
        targetLabelEl.textContent = '目标 ' + fmt(game.targetScore);
      }
      const targetPct = Math.min(100, (game.score / game.targetScore) * 100);
      targetBarEl.style.width = targetPct.toFixed(1) + '%';
      targetBarEl.style.background =
        game.score >= game.targetScore
          ? 'linear-gradient(90deg, #ffd34d, #ffb020)'
          : 'linear-gradient(90deg, #5fe3ff, #ffd34d)';
      bestEl.textContent = '最高 ' + fmt(game.best);
    }

    if (game.phase === 'slide') {
      hintEl.textContent = '全力投掷中';
    } else if (game.phase === 'aim') {
      hintEl.textContent = game.aim.charging ? '松手投掷' : '按住瞄准，手指指向目标';
    } else if (game.phase === 'between') {
      hintEl.textContent = '点击继续';
    } else {
      hintEl.textContent = '';
    }
  }

  // =========================================================================
  // Main loop
  // =========================================================================
  let lastT = performance.now();
  let lastFrameAt = 0;
  let acc = 0;

  function frame(now) {
    // 60fps cap：避免高刷屏/无帧率限制环境下空转
    if (now - lastFrameAt < 1000 / 60) {
      requestAnimationFrame(frame);
      return;
    }
    lastFrameAt = now;
    window.__frameCount = (window.__frameCount || 0) + 1;
    if (game.paused) {
      requestAnimationFrame(frame);
      return;
    }

    const real = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    // 命中停顿：只冻结世界，仍然渲染和更新 HUD
    if (game.hitStop > 0) {
      game.hitStop = Math.max(0, game.hitStop - real);
      render();
      updateHUD();
      requestAnimationFrame(frame);
      return;
    }

    try {
      const t0 = performance.now();
      const scale = game.slowTimer > 0 ? 0.32 : 1;
      game.slowTimer = Math.max(0, game.slowTimer - real);
      acc += real * scale;

      let steps = 0;
      while (acc >= FIXED && steps < 5) {
        update(FIXED);
        acc -= FIXED;
        steps++;
      }
      if (steps >= 5) acc = 0;
      const t1 = performance.now();

      render();
      const t2 = performance.now();
      window.__perf = { update: t1 - t0, render: t2 - t1, total: t2 - t0, steps };

      updateHUD();
    } catch (err) {
      window.__err = String((err && err.stack) || err);
      console.error('FRAME ERROR', err);
    } finally {
      requestAnimationFrame(frame);
    }
  }

  // =========================================================================
  // Init
  // =========================================================================
  window.addEventListener('resize', resize);

  resize();
  game.best = loadBest();
  game.spin = loadSpin();
  setSpinUI();
  showMenu();
  updateHUD();
  requestAnimationFrame(frame);

  // Debug / test hook
  window.__game = {
    get state() { return game; },
    startGame,
    throwNow(_power, angle, spin) {
      if (game.phase !== 'aim') startThrow();
      game.aim.angle = angle || 0;
      game.spin = spin || 0;
      setSpinUI();
      doThrow();
    },
    nextThrow() {
      nextThrow();
    },
    pause() {
      game.paused = true;
    },
    resume() {
      game.paused = false;
      lastT = performance.now();
      lastFrameAt = 0;
    },
    tick(seconds) {
      const n = Math.max(1, Math.round((seconds || FIXED) / FIXED));
      for (let i = 0; i < n; i++) update(FIXED);
      render();
      updateHUD();
    },
    debugAim() {
      const s = game.stones[0];
      return {
        W,
        H,
        p: s ? project(s.x, s.y) : null,
        stone: s,
        aim: game.aim
      };
    },
    projectAt(x, y) {
      return project(x, y);
    },
    info() {
      return {
        phase: game.phase,
        score: Math.round(game.score),
        throwIndex: game.throwIndex,
        stones: game.stones.length,
        hitPins: game.hitPins,
        totalPins: game.totalPins,
        combo: game.combo,
        mult: totalMult(),
        gateMult: game.gateMult,
        mode: game.mode,
        floor: game.tower.floor,
        def: game.tower.def,
        damage: Math.round(game.tower.floorDamage),
        hearts: game.tower.hearts,
        atk: Math.round(towerAtkBonus() * 100)
      };
    },
    showResult
  };
})();
