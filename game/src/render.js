// MIDNIGHT VAULT - all drawing. One canvas, flat shapes, a dark
// museum at night: amber light on the loot, red cones for guard eyes,
// pale yellow for the cameras. Vision cones are drawn with real
// raycasts, so a cone bends around a wall exactly where sight stops.

import { VIEW_W, VIEW_H, HUD_H, GUARD, CAMERA } from './config.js';
import { rayDistance } from './world.js';

const FLOOR = '#232733';
const FLOOR_LINE = '#2c3140';
const WALL = '#4a5169';
const WALL_TOP = '#5d6582';

function conePath(ctx, x, y, angle, fov, range, walls) {
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - fov / 2 + (fov * i) / steps;
    const d = rayDistance(x, y, a, range, walls);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
}

function drawFloor(ctx, state) {
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = FLOOR_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.moveTo(x, HUD_H);
    ctx.lineTo(x, VIEW_H);
  }
  for (let y = HUD_H; y <= VIEW_H; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
  }
  ctx.stroke();
  // room labels, painted faint on the floor
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.font = '700 21px system-ui, sans-serif';
  ctx.fillText('G A L L E R Y', 120, 140);
  ctx.fillText('G R A N D   H A L L', 540, 560);
  ctx.fillText('V A U L T   R O O M', 950, 538);
}

function drawExit(ctx, state) {
  const e = state.exit;
  const ready = state.vault.cracked;
  ctx.fillStyle = ready ? '#1f5c38' : '#374151';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = ready ? '#4ade80' : '#6b7280';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = ready ? '#bbf7d0' : '#9ca3af';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'GETAWAY - GO!' : 'GETAWAY', e.x + e.w / 2, e.y + e.h / 2 + 6);
  ctx.textAlign = 'left';
}

function drawLootItem(ctx, item, t) {
  if (item.taken) return;
  const glow = 0.55 + 0.25 * Math.sin(t * 3 + item.x);
  ctx.save();
  ctx.shadowColor = 'rgba(250, 204, 21, 0.9)';
  ctx.shadowBlur = 14 * glow;
  if (item.kind === 'gem') {
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 10);
    ctx.lineTo(item.x + 8, item.y);
    ctx.lineTo(item.x, item.y + 10);
    ctx.lineTo(item.x - 8, item.y);
    ctx.closePath();
    ctx.fill();
  } else if (item.kind === 'gold') {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(item.x - 11, item.y - 4, 22, 9);
    ctx.fillRect(item.x - 8, item.y - 11, 16, 7);
  } else {
    // painting: a little gilt frame with a stormy sea inside
    ctx.fillStyle = '#b45309';
    ctx.fillRect(item.x - 15, item.y - 19, 30, 38);
    ctx.fillStyle = '#164e63';
    ctx.fillRect(item.x - 11, item.y - 15, 22, 30);
    ctx.strokeStyle = '#a5f3fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x - 11, item.y + 6);
    ctx.quadraticCurveTo(item.x, item.y - 4, item.x + 11, item.y + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVault(ctx, state) {
  const v = state.vault;
  ctx.fillStyle = v.cracked ? '#6b7280' : '#8a6d1f';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = v.cracked ? '#9ca3af' : '#facc15';
  ctx.lineWidth = 4;
  ctx.strokeRect(v.x, v.y, v.w, v.h);
  // door wheel
  ctx.strokeStyle = v.cracked ? '#d1d5db' : '#fde68a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.5;
    ctx.moveTo(v.x + v.w / 2, v.y + v.h / 2);
    ctx.lineTo(v.x + v.w / 2 + Math.cos(a) * 24, v.y + v.h / 2 + Math.sin(a) * 24);
  }
  ctx.stroke();
  ctx.fillStyle = '#fef3c7';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(v.cracked ? 'VAULT OPEN' : 'THE VAULT', v.x + v.w / 2, v.y - 10);
  ctx.textAlign = 'left';
  if (!v.cracked && v.progress > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(v.x, v.y + v.h + 10, v.w, 10);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(v.x, v.y + v.h + 10, (v.w * v.progress) / 100, 10);
  }
}

function drawGuard(ctx, g, seesYou) {
  // body
  ctx.fillStyle = g.state === 'chase' ? '#b91c1c' : '#1d4ed8';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
  ctx.fill();
  // cap, turned toward facing
  ctx.fillStyle = '#172554';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 5, g.y + Math.sin(g.angle) * 5, 8, 0, Math.PI * 2);
  ctx.fill();
  // nose direction tick
  ctx.strokeStyle = '#dbeafe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
  ctx.stroke();
  if (g.state === 'investigate' || g.state === 'look') {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 24);
    ctx.textAlign = 'left';
  }
  if (seesYou || g.state === 'chase') {
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 26);
    ctx.textAlign = 'left';
  }
}

function drawThief(ctx, state) {
  const p = state.player;
  ctx.fillStyle = '#0b0b10';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.stroke();
  // mask stripe and loot sack
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(p.x - 7, p.y - 4, 14, 4);
  ctx.fillStyle = state.lootTotal > 0 ? '#a16207' : '#374151';
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.angle) * 12, p.y - Math.sin(p.angle) * 12, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoin(ctx, state) {
  const c = state.coin;
  if (!c) return;
  if (c.flying) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const age = state.time - c.landedAt;
    ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, 0.8 - age * 0.3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8 + age * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(-2, -2, VIEW_W + 4, HUD_H + 2);
  // alarm meter
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('ALARM', 18, 33);
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(84, 19, 300, 17);
  const a = state.alarm / 100;
  ctx.fillStyle = state.alarm > 66 ? '#ef4444' : state.alarm > 33 ? '#f97316' : '#eab308';
  if (state.alarm > 80 && Math.sin(state.time * 14) > 0) ctx.fillStyle = '#fecaca';
  ctx.fillRect(84, 19, 300 * a, 17);
  ctx.strokeStyle = '#71717a';
  ctx.strokeRect(84, 19, 300, 17);
  // loot
  ctx.fillStyle = '#facc15';
  ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText(`LOOT  $${state.lootTotal.toLocaleString('en-US')}`, 420, 34);
  // objective
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '600 16px system-ui, sans-serif';
  const obj = state.vault.cracked
    ? 'Objective: ESCAPE through the getaway door!'
    : 'Objective: crack the VAULT (hold E beside it), grab loot, escape';
  ctx.fillText(obj, 660, 34);
  // timer
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '700 19px ui-monospace, monospace';
  const s = Math.max(0, Math.floor(state.elapsed));
  ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, VIEW_W - 18, 34);
  ctx.textAlign = 'left';
}

function banner(ctx, title, titleColor, lines) {
  ctx.fillStyle = 'rgba(5, 6, 10, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText(title, VIEW_W / 2, 268);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '500 22px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 330 + i * 34));
  ctx.textAlign = 'left';
}

export function draw(ctx, state) {
  drawFloor(ctx, state);
  drawExit(ctx, state);
  drawVault(ctx, state);

  // vision cones, under the actors but over the floor dressing
  for (const cam of state.cameras) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.13)';
    conePath(ctx, cam.x, cam.y, cam.angle, CAMERA.viewFov, CAMERA.viewRange, state.walls);
    ctx.fill();
  }
  for (const g of state.guards) {
    ctx.fillStyle = g.state === 'chase' ? 'rgba(239, 68, 68, 0.30)' : 'rgba(248, 113, 113, 0.16)';
    conePath(ctx, g.x, g.y, g.angle, GUARD.viewFov, GUARD.viewRange, state.walls);
    ctx.fill();
  }

  // walls and cases
  for (const w of state.walls) {
    ctx.fillStyle = w.case ? '#5b4a2f' : WALL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = w.case ? '#77603c' : WALL_TOP;
    ctx.fillRect(w.x, w.y, w.w, Math.min(5, w.h));
    if (w.case) {
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 5, w.y + 5, w.w - 10, w.h - 10);
    }
  }

  // loot sits on top of its cases, glowing where a thief can see it
  for (const item of state.loot) drawLootItem(ctx, item, state.time);

  // cameras: a box and a red eye on the wall
  for (const cam of state.cameras) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(cam.x - 9, cam.y - 9, 18, 18);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 4, cam.y + Math.sin(cam.angle) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCoin(ctx, state);
  for (const g of state.guards) drawGuard(ctx, g, state.seenBy.has(g.id));
  drawThief(ctx, state);
  drawHud(ctx, state);

  // controls strip
  ctx.fillStyle = 'rgba(10,10,14,0.65)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillText('WASD / arrows: move    SHIFT: sneak    E (hold): crack vault    CLICK: throw a coin to distract    R: restart', 14, VIEW_H - 8);

  if (state.mode === 'title') {
    banner(ctx, 'MIDNIGHT VAULT', '#facc15', [
      'One thief. Three guards. Every gem in the museum.',
      'Slip past the vision cones, crack the vault, and get out the door.',
      '',
      'Click or press Enter to start the heist',
    ]);
  } else if (state.mode === 'busted') {
    banner(ctx, 'BUSTED!', '#ef4444', [
      state.bustedReason,
      `You kept nothing. The museum sleeps soundly tonight.`,
      '',
      'Press R to try the heist again',
    ]);
  } else if (state.mode === 'escaped') {
    const lines = [
      `Loot hauled: $${state.lootTotal.toLocaleString('en-US')}`,
      `Time inside: ${Math.floor(state.elapsed)} seconds - Spotted peak: ${Math.round(state.peakAlarm)}% alarm`,
    ];
    if (state.ghostBonus > 0) lines.push(`GHOST BONUS +$${state.ghostBonus.toLocaleString('en-US')} - never really seen`);
    lines.push(`TOTAL SCORE: $${state.score.toLocaleString('en-US')}`, '', 'Press R to run it again');
    banner(ctx, 'CLEAN GETAWAY!', '#4ade80', lines);
  }
}
