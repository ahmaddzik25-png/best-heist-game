// MIDNIGHT VAULT - staged scenes for the maker's screenshots. The
// game reads ?shot=start|play|caught|end and arranges a real, playable
// state of itself (same world, same rules), so a screenshot is always
// an honest render of the game's own code - just posed, like a photo.

export function stageShot(state, name) {
  if (name === 'start') {
    state.mode = 'title';
    return;
  }
  if (name === 'play') {
    state.mode = 'play';
    state.elapsed = 74;
    state.alarm = 46;
    state.peakAlarm = 46;
    state.lootTotal = 10500;
    state.loot.find((i) => i.id === 'gem1').taken = true;
    state.loot.find((i) => i.id === 'painting').taken = true;
    // the thief, mid-hall, slipping along the edge of a guard's cone
    state.player.x = 596;
    state.player.y = 408;
    state.player.angle = 0.4;
    // gallery guard posed on patrol; hall guard turning toward a coin
    const [g1, g2] = state.guards;
    g1.x = 300;
    g1.y = 250;
    g1.angle = 2.5;
    g2.x = 760;
    g2.y = 330;
    g2.angle = 2.9;
    g2.state = 'investigate';
    g2.target = { x: 700, y: 300 };
    state.coin = { x: 700, y: 300, tx: 700, ty: 300, flying: false, landedAt: -0.4 };
    state.time = 1.2;
    return;
  }
  if (name === 'caught') {
    state.mode = 'busted';
    state.alarm = 100;
    state.bustedReason = 'The alarm hit 100% - lights, sirens, and nowhere to run.';
    state.player.x = 700;
    state.player.y = 300;
    const g2 = state.guards[1];
    g2.x = 664;
    g2.y = 276;
    g2.angle = 0.7;
    g2.state = 'chase';
    return;
  }
  if (name === 'end') {
    state.mode = 'escaped';
    state.elapsed = 132;
    state.peakAlarm = 43;
    for (const item of state.loot) item.taken = true;
    state.vault.cracked = true;
    state.lootTotal = 56500;
    state.ghostBonus = 3000;
    state.score = 59500;
    state.player.x = state.exit.x + state.exit.w / 2;
    state.player.y = state.exit.y + 16;
    return;
  }
  state.mode = 'title';
}
