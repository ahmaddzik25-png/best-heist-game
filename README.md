# best-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/ahmaddzik25-png/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/ahmaddzik25-png/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**MIDNIGHT VAULT** — a tiny stealth heist game in plain HTML and JavaScript. One thief, three guards, two sweeping cameras, and every gem in the museum.

Cross the gallery and the grand hall, stay out of the guards' vision cones (they stop at walls, so use the doorways), grab the gems, the painting and the gold, hold **E** beside the vault to crack it for the big $25,000 prize, then slip out of the getaway door. Being seen feeds the red **ALARM** meter — at 100% the night ends. A guard who touches you ends it sooner. Sneaking (Shift) makes you harder to spot, and a clicked coin throw sends guards off to investigate the wrong corner. Escape with the alarm never over half and you earn the $3,000 Ghost Bonus.

Everything is drawn in code on one canvas — no images, no libraries, no network requests — and the sounds are little WebAudio blips synthesised on the spot.

**Controls:** WASD / arrow keys move · Shift sneaks · E (hold) cracks the vault · mouse click throws a coin · R restarts

## Run it

Play it locally (Node 22, no dependencies, no build step):

```sh
node serve.ts
# then open http://localhost:8080
```

Hand the entry in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The screenshots in `screenshots/` are real renders of this game's own code in a browser (the game poses them itself via `?shot=play`, `?shot=start`, `?shot=caught`, `?shot=end`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=q1sv169n&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
