// MIDNIGHT VAULT - the museum floor: walls, loot, the vault, the
// getaway door, guard patrols and cameras, plus the geometry helpers
// (collision and line of sight) that movement and vision share.

import { HUD_H, VIEW_W, VIEW_H, VAULT } from './config.js';

// Walls are plain rectangles. The outer shell plus a few inner walls
// split the floor into a gallery (left), a grand hall (centre) and the
// vault room (right), joined by door gaps.
export function buildWalls() {
  const t = 18; // outer wall thickness
  return [
    { x: 0, y: HUD_H, w: VIEW_W, h: t }, // north
    { x: 0, y: VIEW_H - t, w: VIEW_W, h: t }, // south
    { x: 0, y: HUD_H, w: t, h: VIEW_H - HUD_H }, // west
    { x: VIEW_W - t, y: HUD_H, w: t, h: VIEW_H - HUD_H }, // east
    // gallery | hall divider, door gap between y 292 and 352
    { x: 430, y: HUD_H + t, w: 12, h: 220 },
    { x: 430, y: 352, w: 12, h: 118 },
    // gallery floor divider, door gap between x 520 and 580
    { x: t, y: 470, w: 502, h: 12 },
    { x: 580, y: 470, w: 130, h: 12 },
    // vault room west wall, door gap between y 300 and 370
    { x: 880, y: HUD_H + t, w: 12, h: 228 },
    { x: 880, y: 370, w: 12, h: 190 },
    // vault room south wall
    { x: 880, y: 560, w: VIEW_W - 880 - t, h: 12 },
    // display cases and pillars: solid, and they block sight too
    { x: 110, y: 170, w: 96, h: 46, case: true },
    { x: 110, y: 320, w: 96, h: 46, case: true },
    { x: 240, y: 580, w: 96, h: 46, case: true },
    { x: 640, y: 180, w: 46, h: 46, case: true },
    { x: 640, y: 620, w: 46, h: 46, case: true },
  ];
}

export function buildLoot() {
  return [
    { id: 'gem1', kind: 'gem', x: 158, y: 193, value: 4000, taken: false },
    { id: 'gem2', kind: 'gem', x: 158, y: 343, value: 4000, taken: false },
    { id: 'gem3', kind: 'gem', x: 288, y: 603, value: 5000, taken: false },
    { id: 'painting', kind: 'painting', x: 52, y: 250, value: 6500, taken: false },
    { id: 'gold1', kind: 'gold', x: 960, y: 480, value: 6000, taken: false },
    { id: 'gold2', kind: 'gold', x: 1180, y: 480, value: 6000, taken: false },
  ];
}

export function buildVault() {
  return { x: 1071, y: 190, w: 130, h: 92, cracked: false, progress: 0, value: VAULT.value };
}

export function buildExit() {
  // The getaway door in the south-west corner; the thief starts here.
  return { x: 56, y: 726, w: 138, h: 56 };
}

export function buildGuards() {
  const routes = [
    // gallery guard
    [
      { x: 92, y: 122 }, { x: 384, y: 122 }, { x: 384, y: 424 }, { x: 92, y: 424 },
    ],
    // hall guard
    [
      { x: 520, y: 140 }, { x: 836, y: 140 }, { x: 836, y: 700 }, { x: 520, y: 700 },
    ],
    // vault room guard
    [
      { x: 936, y: 122 }, { x: 1212, y: 122 }, { x: 1212, y: 506 }, { x: 936, y: 506 },
    ],
  ];
  return routes.map((route, i) => ({
    id: i,
    x: route[0].x,
    y: route[0].y,
    angle: 0,
    route,
    wp: 1,
    state: 'patrol', // patrol | investigate | chase | look
    target: null,
    lookTimer: 0,
    pauseTimer: 0,
  }));
}

export function buildCameras() {
  return [
    { x: 452, y: 322, base: Math.PI, phase: 0 }, // watches the gallery door gap
    { x: 874, y: 548, base: -1.85, phase: 2.1 }, // watches the vault door
  ];
}

// --- geometry ---------------------------------------------------------

export function circleHitsWall(x, y, r, wall) {
  const nx = Math.max(wall.x, Math.min(x, wall.x + wall.w));
  const ny = Math.max(wall.y, Math.min(y, wall.y + wall.h));
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy < r * r;
}

// Move a circle by (dx, dy), sliding along any wall it runs into.
export function moveCircle(pos, dx, dy, r, walls) {
  let nx = pos.x + dx;
  for (const w of walls) {
    if (circleHitsWall(nx, pos.y, r, w)) {
      nx = dx > 0 ? w.x - r : w.x + w.w + r;
      if (circleHitsWall(nx, pos.y, r, w)) nx = pos.x;
    }
  }
  let ny = pos.y + dy;
  for (const w of walls) {
    if (circleHitsWall(nx, ny, r, w)) {
      ny = dy > 0 ? w.y - r : w.y + w.h + r;
      if (circleHitsWall(nx, ny, r, w)) ny = pos.y;
    }
  }
  pos.x = nx;
  pos.y = ny;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (d === 0) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

// True when nothing solid stands between two points.
export function lineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (
      segmentsCross(x1, y1, x2, y2, w.x, w.y, w.x + w.w, w.y) ||
      segmentsCross(x1, y1, x2, y2, w.x + w.w, w.y, w.x + w.w, w.y + w.h) ||
      segmentsCross(x1, y1, x2, y2, w.x + w.w, w.y + w.h, w.x, w.y + w.h) ||
      segmentsCross(x1, y1, x2, y2, w.x, w.y + w.h, w.x, w.y)
    ) {
      return false;
    }
  }
  return true;
}

// Distance from a point along a ray until it hits a wall (for drawing
// vision cones that stop at walls instead of shining through them).
export function rayDistance(x, y, angle, maxDist, walls) {
  const ex = x + Math.cos(angle) * maxDist;
  const ey = y + Math.sin(angle) * maxDist;
  let best = maxDist;
  for (const w of walls) {
    const edges = [
      [w.x, w.y, w.x + w.w, w.y],
      [w.x + w.w, w.y, w.x + w.w, w.y + w.h],
      [w.x + w.w, w.y + w.h, w.x, w.y + w.h],
      [w.x, w.y + w.h, w.x, w.y],
    ];
    for (const [cx, cy, dx, dy] of edges) {
      const d = (ex - x) * (dy - cy) - (ey - y) * (dx - cx);
      if (d === 0) continue;
      const t = ((cx - x) * (dy - cy) - (cy - y) * (dx - cx)) / d;
      const u = ((cx - x) * (ey - y) - (cy - y) * (ex - x)) / d;
      if (t > 0 && t < 1 && u > 0 && u < 1) best = Math.min(best, t * maxDist);
    }
  }
  return best;
}

export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
