// MIDNIGHT VAULT - the game itself: state, the loop, the thief, the
// guards' brains, the cameras, the alarm, and how a heist is won or
// lost. Drawing lives in render.js; the floor plan lives in world.js.

import {
  THIEF, GUARD, CAMERA, ALARM, COIN, VAULT as VAULT_CFG, GHOST_BONUS, GHOST_LIMIT,
} from './config.js';
import {
  buildWalls, buildLoot, buildVault, buildExit, buildGuards, buildCameras,
  moveCircle, lineOfSight, angleDiff,
} from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(window.location.search);

export function createState() {
  const exit = buildExit();
  return {
    mode: 'title',
    time: 0,
    elapsed: 0,
    walls: buildWalls(),
    loot: buildLoot(),
    vault: buildVault(),
    exit,
    guards: buildGuards(),
    cameras: buildCameras().map((c) => ({ ...c, angle: c.base })),
    player: { x: exit.x + exit.w / 2, y: exit.y + 10, angle: -Math.PI / 2 },
    alarm: 0,
    unseenTimer: 0,
    peakAlarm: 0,
    lootTotal: 0,
    coin: null,
    coinCooldown: 0,
    seenBy: new Set(),
    seenByCamera: false,
    bustedReason: '',
    ghostBonus: 0,
    score: 0,
    spotSoundAt: -9,
  };
}

let state = createState();
if (params.get('shot')) stageShot(state, params.get('shot'));
window.__heist = state;

function reset() {
  state = createState();
  state.mode = 'play';
  window.__heist = state;
}

function bust(reason) {
  state.mode = 'busted';
  state.bustedReason = reason;
  state.score = 0;
  audio.busted();
}

function escape() {
  state.mode = 'escaped';
  state.ghostBonus = state.peakAlarm < GHOST_LIMIT ? GHOST_BONUS : 0;
  state.score = state.lootTotal + state.ghostBonus;
  audio.escaped();
}

function seesPlayer(g, range, fov) {
  const p = state.player;
  const dx = p.x - g.x;
  const dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { sees: false, dist };
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.angle)) > fov / 2) return { sees: false, dist };
  return { sees: lineOfSight(g.x, g.y, p.x, p.y, state.walls), dist };
}

function guardStepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  g.angle = Math.atan2(dy, dx);
  moveCircle(g, Math.cos(g.angle) * speed * dt, Math.sin(g.angle) * speed * dt, GUARD.radius, state.walls);
  return Math.hypot(tx - g.x, ty - g.y) < 8;
}

function updateGuard(g, dt) {
  const p = state.player;
  const { sees, dist } = seesPlayer(g, GUARD.viewRange, GUARD.viewFov);

  if (sees) {
    state.seenBy.add(g.id);
    g.lastSeen = { x: p.x, y: p.y };
    if (state.time - state.spotSoundAt > 1.4 && g.state !== 'chase') {
      audio.spotted();
      state.spotSoundAt = state.time;
    }
    if (dist < 78) g.state = 'chase';
    const closeness = 1 - dist / (GUARD.viewRange * 1.7);
    const sneak = input.held('shift') ? ALARM.sneakFactor : 1;
    state.alarm += ALARM.guardRate * Math.max(0.25, closeness) * sneak * dt;
  } else {
    state.seenBy.delete(g.id);
  }

  if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD.catchRange) {
    bust('A guard grabbed you by the collar. The heist is over.');
    return;
  }

  switch (g.state) {
    case 'patrol': {
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
        break;
      }
      const wp = g.route[g.wp];
      if (guardStepToward(g, wp.x, wp.y, GUARD.patrolSpeed, dt)) {
        g.wp = (g.wp + 1) % g.route.length;
        g.pauseTimer = 0.7;
      }
      break;
    }
    case 'investigate': {
      if (sees) { g.state = 'chase'; break; }
      if (guardStepToward(g, g.target.x, g.target.y, GUARD.investigateSpeed, dt)) {
        g.state = 'look';
        g.lookTimer = 1.6;
        g.lookBase = g.angle;
      }
      break;
    }
    case 'look': {
      g.lookTimer -= dt;
      g.angle = g.lookBase + Math.sin((1.6 - g.lookTimer) * 2.4) * 0.8;
      if (g.lookTimer <= 0) {
        // back to the nearest patrol point
        let best = 0;
        let bestD = Infinity;
        g.route.forEach((wp, i) => {
          const d = Math.hypot(wp.x - g.x, wp.y - g.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        g.wp = best;
        g.state = 'patrol';
      }
      break;
    }
    case 'chase': {
      const target = sees ? p : g.lastSeen;
      if (target) guardStepToward(g, target.x, target.y, GUARD.chaseSpeed, dt);
      if (!sees && g.lastSeen && Math.hypot(g.lastSeen.x - g.x, g.lastSeen.y - g.y) < 10) {
        g.state = 'look';
        g.lookTimer = 1.4;
        g.lookBase = g.angle;
      }
      break;
    }
    default:
      break;
  }
}

function update(dt) {
  state.time += dt;
  // cameras sweep in every mode, so the title screen shows the museum alive
  for (const cam of state.cameras) {
    cam.angle = cam.base + Math.sin(state.time * CAMERA.sweepSpeed + cam.phase) * 0.65;
  }

  if (state.mode === 'title') {
    if (input.clicked || input.held('enter')) {
      audio.unlock();
      reset();
    }
    return;
  }
  if (state.mode === 'busted' || state.mode === 'escaped') {
    if (input.held('r')) reset();
    return;
  }

  // --- playing ---
  state.elapsed += dt;
  const p = state.player;
  const sneak = input.held('shift');
  let mx = 0;
  let my = 0;
  if (input.held('w', 'arrowup')) my -= 1;
  if (input.held('s', 'arrowdown')) my += 1;
  if (input.held('a', 'arrowleft')) mx -= 1;
  if (input.held('d', 'arrowright')) mx += 1;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const speed = sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
    p.angle = Math.atan2(my, mx);
    moveCircle(p, (mx / len) * speed * dt, (my / len) * speed * dt, THIEF.radius, state.walls);
  }

  // coin throw: click sends it arcing to the spot (clamped to range)
  state.coinCooldown = Math.max(0, state.coinCooldown - dt);
  if (input.clicked && state.coinCooldown <= 0) {
    audio.unlock();
    const dx = input.clicked.x - p.x;
    const dy = input.clicked.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(dist, COIN.range);
    state.coin = {
      x: p.x, y: p.y,
      tx: p.x + (dx / dist) * reach, ty: p.y + (dy / dist) * reach,
      flying: true, landedAt: 0,
    };
    state.coinCooldown = COIN.cooldown;
  }
  if (state.coin) {
    const c = state.coin;
    if (c.flying) {
      const dx = c.tx - c.x;
      const dy = c.ty - c.y;
      const dist = Math.hypot(dx, dy);
      const step = 460 * dt;
      if (dist <= step) {
        c.x = c.tx;
        c.y = c.ty;
        c.flying = false;
        c.landedAt = state.time;
        audio.coin();
        for (const g of state.guards) {
          if (Math.hypot(g.x - c.x, g.y - c.y) < COIN.lureRadius && g.state === 'patrol') {
            g.state = 'investigate';
            g.target = { x: c.x, y: c.y };
          }
        }
      } else {
        c.x += (dx / dist) * step;
        c.y += (dy / dist) * step;
      }
    } else if (state.time - c.landedAt > COIN.lureTime + 0.8) {
      state.coin = null;
    }
  }

  // guards and cameras raise the alarm
  const alarmBefore = state.alarm;
  state.seenByCamera = false;
  for (const cam of state.cameras) {
    const { sees, dist } = seesPlayer(cam, CAMERA.viewRange, CAMERA.viewFov);
    if (sees) {
      state.seenByCamera = true;
      const closeness = 1 - dist / (CAMERA.viewRange * 1.7);
      const sneakF = sneak ? ALARM.sneakFactor : 1;
      state.alarm += ALARM.cameraRate * Math.max(0.25, closeness) * sneakF * dt;
    }
  }
  for (const g of state.guards) updateGuard(g, dt);
  if (state.mode !== 'play') return; // a guard may have ended it

  const anyoneSees = state.seenBy.size > 0 || state.seenByCamera;
  if (anyoneSees) {
    state.unseenTimer = 0;
  } else {
    state.unseenTimer += dt;
    if (state.unseenTimer > ALARM.decayDelay) {
      state.alarm = Math.max(0, state.alarm - ALARM.decay * dt);
    }
  }
  state.alarm = Math.min(100, Math.max(0, state.alarm));
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  if (state.alarm >= 100 && alarmBefore < 100) {
    bust('The alarm hit 100% - lights, sirens, and nowhere to run.');
    return;
  }

  // loot pickup
  for (const item of state.loot) {
    if (!item.taken && Math.hypot(item.x - p.x, item.y - p.y) < 26) {
      item.taken = true;
      state.lootTotal += item.value;
      audio.loot();
    }
  }

  // vault cracking
  const v = state.vault;
  if (!v.cracked) {
    const near = p.x > v.x - 30 && p.x < v.x + v.w + 30 && p.y > v.y - 30 && p.y < v.y + v.h + 30;
    if (near && input.held('e')) {
      v.progress += (dt / VAULT_CFG.crackSeconds) * 100;
      if (v.progress >= 100) {
        v.cracked = true;
        state.lootTotal += v.value;
        audio.crack();
      }
    } else {
      v.progress = Math.max(0, v.progress - dt * 10);
    }
  }

  // escape
  const e = state.exit;
  if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) escape();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw(ctx, state);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
