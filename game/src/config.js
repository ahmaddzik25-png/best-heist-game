// MIDNIGHT VAULT - tuning constants for the whole game.
// Everything the other modules need to agree on lives here: the stage
// size, how fast everyone moves, how vision and the alarm behave, and
// what each piece of loot is worth.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 54; // top bar: alarm meter, loot, timer

export const THIEF = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 96,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 74,
  chaseSpeed: 148,
  investigateSpeed: 108,
  viewRange: 178,
  viewFov: (118 * Math.PI) / 180,
  catchRange: 21,
};

export const CAMERA = {
  viewRange: 158,
  viewFov: (52 * Math.PI) / 180,
  sweepSpeed: 0.55, // radians of sway per second, roughly
};

export const ALARM = {
  guardRate: 30, // per second at point blank, scaled by distance
  cameraRate: 44,
  sneakFactor: 0.62, // sneaking is harder to spot
  decay: 11, // per second once nobody sees you
  decayDelay: 0.8, // seconds unseen before the meter starts falling
};

export const COIN = {
  range: 280, // how far a coin can be thrown
  lureRadius: 190, // guards this close hear it land
  lureTime: 2.6, // seconds a guard spends staring at the spot
  cooldown: 1.1,
};

export const VAULT = {
  crackSeconds: 3.0,
  value: 25000,
};

export const GHOST_BONUS = 3000; // escaped with the alarm never over half
export const GHOST_LIMIT = 50;
