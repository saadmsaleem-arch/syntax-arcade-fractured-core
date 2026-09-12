/* =========================================================
   SYNTAX ARCADE: FRACTURED CORE
   LEVEL 1 — ART INTEGRATION BUILD
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthEl = document.getElementById("health");
const shardEl = document.getElementById("shard-count");

ctx.imageSmoothingEnabled = true;


/* =========================================================
   GAME CONSTANTS
========================================================= */

const W = canvas.width;
const H = canvas.height;

const WORLD_W = 4700;

const GRAVITY = 1900;
const SPEED = 360;
const JUMP_POWER = 760;


/* =========================================================
   ASSET LOADER
========================================================= */

let totalAssets = 0;
let loadedAssets = 0;

function loadImage(src) {

  totalAssets++;

  const image = new Image();

  image.onload = () => {
    loadedAssets++;
  };

  image.onerror = () => {
    loadedAssets++;
    console.warn("Could not load asset:", src);
  };

  image.src = src;

  return image;
}

function loadSequence(prefix, count) {

  const frames = [];

  for (let i = 1; i <= count; i++) {
    frames.push(loadImage(`${prefix}${i}.png`));
  }

  return frames;
}


/* =========================================================
   GAME ART
========================================================= */

const art = {

  background:
    loadImage("level1-bg.png"),

  player: {

    idle:
      loadSequence("player-idle-", 4),

    run:
      loadSequence("player-run-", 6),

    jump:
      loadSequence("player-jump-", 4),

    shoot:
      loadSequence("player-shoot-", 4),

    hurt:
      loadSequence("player-hurt-", 3),

    fall:
      loadSequence("player-fall-", 2),

    dash:
      loadSequence("player-dash-", 3),

    death:
      loadSequence("player-death-", 4)

  },

  sentry:
    loadSequence("sentry-", 5),

  drone:
    loadSequence("drone-", 4),

  guardian:
    loadSequence("guardian-", 3),

  platformMid:
    loadImage("platform-mid.png"),

  platformLeft:
    loadImage("platform-left.png"),

  platformRight:
    loadImage("platform-right.png"),

  platformLarge:
    loadImage("platform-large.png"),

  booster:
    loadImage("booster.png"),

  checkpoint:
    loadImage("checkpoint.png"),

  portal:
    loadImage("portal.png"),

  shard:
    loadImage("shard.png"),

  projectile:
    loadImage("projectile.png"),

  enemyShot:
    loadImage("enemy-shot.png"),

  muzzleFlash:
    loadImage("muzzle-flash.png"),

  hitEffect:
    loadImage("hit-effect.png"),

  explosion:
    loadImage("explosion.png"),

  glitchParticles:
    loadImage("glitch-particles.png"),

  backgroundProp:
    loadImage("background-prop.png"),

  tallStructure:
    loadImage("tall-structure.png"),

  pipeSupport:
    loadImage("pipe-support.png"),

  crackedWall:
    loadImage("cracked-wall.png"),

  groundDecor:
    loadImage("ground-decor.png")

};


/* =========================================================
   INPUT
========================================================= */

const keys = new Set();
const pressed = new Set();

window.addEventListener("keydown", e => {

  if (
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight" ||
    e.code === "ArrowUp" ||
    e.code === "Space"
  ) {
    e.preventDefault();
  }

  if (!keys.has(e.code)) {
    pressed.add(e.code);
  }

  keys.add(e.code);

});

window.addEventListener("keyup", e => {
  keys.delete(e.code);
});

function down(...codes) {
  return codes.some(code => keys.has(code));
}

function hit(...codes) {
  return codes.some(code => pressed.has(code));
}


/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function overlap(a, b) {

  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );

}

function frame(sequence, speed, offset = 0) {

  if (!sequence || sequence.length === 0) {
    return null;
  }

  const index =
    Math.floor(time * speed + offset) %
    sequence.length;

  return sequence[index];
}


/* =========================================================
   SPRITE DRAWING
========================================================= */

function drawSprite(
  image,
  centerX,
  bottomY,
  width,
  height,
  flip = false,
  alpha = 1
) {

  if (!image || !image.naturalWidth) {
    return false;
  }

  ctx.save();

  ctx.globalAlpha = alpha;

  ctx.translate(centerX, bottomY);

  if (flip) {
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    image,
    -width / 2,
    -height,
    width,
    height
  );

  ctx.restore();

  return true;
}


/* =========================================================
   LEVEL GEOMETRY

   THESE INVISIBLE RECTANGLES STILL CONTROL COLLISION.
   ART IS DRAWN ON TOP.
========================================================= */

const platforms = [

  [0, 620, 850, 100],

  [1000, 620, 500, 100],

  [1640, 620, 690, 100],

  [2480, 620, 830, 100],

  [3490, 620, 760, 100],

  [4410, 620, 290, 100],

  [600, 500, 170, 24],

  [820, 430, 140, 24],

  [1140, 500, 180, 24],

  [1380, 420, 150, 24],

  [1580, 345, 160, 24],

  [1850, 500, 190, 24],

  [2090, 410, 150, 24],

  [2380, 500, 180, 24],

  [2680, 455, 170, 24],

  [2940, 380, 180, 24],

  [3210, 500, 150, 24],

  [3415, 430, 150, 24],

  [3740, 500, 180, 24],

  [4000, 410, 180, 24]

].map(([x, y, w, h]) => ({
  x,
  y,
  w,
  h
}));


const hazards = [

  [850, 650, 150, 70],

  [1500, 650, 140, 70],

  [2330, 650, 150, 70],

  [3310, 650, 180, 70],

  [4250, 650, 160, 70]

].map(([x, y, w, h]) => ({
  x,
  y,
  w,
  h
}));


const boosters = [

  {
    x: 1940,
    y: 585,
    w: 90,
    h: 35,
    cool: 0
  },

  {
    x: 3240,
    y: 465,
    w: 70,
    h: 35,
    cool: 0
  }

];


const checkpoint = {

  x: 2580,
  y: 550,

  w: 45,
  h: 70,

  active: false

};


const portal = {

  x: 4555,
  y: 470,

  w: 95,
  h: 150

};


/* =========================================================
   DECORATIONS
========================================================= */

const decorations = [

  {
    image: art.groundDecor,
    x: 420,
    bottom: 622,
    w: 260,
    h: 105
  },

  {
    image: art.crackedWall,
    x: 1450,
    bottom: 620,
    w: 180,
    h: 150
  },

  {
    image: art.backgroundProp,
    x: 2210,
    bottom: 620,
    w: 150,
    h: 150
  },

  {
    image: art.tallStructure,
    x: 3120,
    bottom: 620,
    w: 105,
    h: 220
  },

  {
    image: art.pipeSupport,
    x: 3820,
    bottom: 620,
    w: 180,
    h: 140
  }

];


/* =========================================================
   COLLECTIBLES
========================================================= */

const shardLocations = [

  [660, 455],
  [875, 385],
  [1210, 455],
  [1450, 375],
  [1650, 295],
  [1925, 455],
  [2160, 365],
  [2760, 410],
  [3020, 335],
  [4075, 365]

];

let shards = [];


/* =========================================================
   PLAYER
========================================================= */

const player = {

  x: 120,
  y: 520,

  w: 44,
  h: 62,

  vx: 0,
  vy: 0,

  face: 1,

  grounded: false,

  coyote: 0,

  jumpBuffer: 0,

  hp: 3,

  invincible: 0,

  hurtAnim: 0,

  shootCooldown: 0,

  shootAnim: 0,

  spawnX: 120,
  spawnY: 520

};


/* =========================================================
   ENEMIES
========================================================= */

function createEnemy(type, x, y, hp) {

  let w = 52;
  let h = 56;

  if (type === "drone") {
    w = 58;
    h = 40;
  }

  if (type === "guardian") {
    w = 100;
    h = 105;
  }

  return {

    type,

    x,
    y,

    homeX: x,
    homeY: y,

    w,
    h,

    hp,
    maxHp: hp,

    dir: -1,

    alive: true,

    shootTimer:
      0.6 + Math.random(),

    phase:
      Math.random() * 10,

    flash:
      0

  };

}


function createEnemies() {

  return [

    createEnemy(
      "sentry",
      1180,
      564,
      3
    ),

    createEnemy(
      "drone",
      1710,
      300,
      2
    ),

    createEnemy(
      "sentry",
      2160,
      564,
      3
    ),

    createEnemy(
      "drone",
      2890,
      300,
      2
    ),

    createEnemy(
      "sentry",
      3650,
      564,
      3
    ),

    createEnemy(
      "guardian",
      4110,
      515,
      10
    )

  ];

}

let enemies = [];


/* =========================================================
   PROJECTILES + EFFECTS
========================================================= */

let shots = [];
let enemyShots = [];
let effects = [];

function spawnEffect(
  type,
  x,
  y,
  duration = 0.25,
  size = 60
) {

  effects.push({

    type,

    x,
    y,

    life: duration,
    maxLife: duration,

    size

  });

}


/* =========================================================
   GAME STATE
========================================================= */

let time = 0;

let cameraX = 0;

let guardianDown = false;

let complete = false;

let banner = "";
let bannerTime = 0;


/* =========================================================
   RESET
========================================================= */

function resetGame() {

  Object.assign(player, {

    x: 120,
    y: 520,

    vx: 0,
    vy: 0,

    face: 1,

    grounded: false,

    hp: 3,

    invincible: 0,

    hurtAnim: 0,

    shootAnim: 0,

    spawnX: 120,
    spawnY: 520

  });


  checkpoint.active = false;


  shards = shardLocations.map(
    ([x, y], index) => ({

      x,
      y,

      w: 24,
      h: 32,

      taken: false,

      phase: index * 0.8

    })
  );


  enemies = createEnemies();

  shots = [];

  enemyShots = [];

  effects = [];

  cameraX = 0;

  guardianDown = false;

  complete = false;

  banner =
    "SYSTEM LINK ESTABLISHED";

  bannerTime =
    1.8;

  updateHUD();

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  healthEl.textContent =
    "❤️".repeat(player.hp) +
    "🖤".repeat(3 - player.hp);


  shardEl.textContent =
    shards.filter(
      shard => shard.taken
    ).length;

}


/* =========================================================
   DAMAGE / RESPAWN
========================================================= */

function hurtPlayer(sourceX, damage = 1) {

  if (
    player.invincible > 0 ||
    complete
  ) {
    return;
  }

  player.hp -= damage;

  player.invincible = 1;

  player.hurtAnim = 0.45;


  player.vx =
    player.x < sourceX
      ? -420
      : 420;


  player.vy = -400;


  spawnEffect(
    "hit",
    player.x + player.w / 2,
    player.y + player.h / 2,
    0.3,
    70
  );


  updateHUD();


  if (player.hp <= 0) {

    respawn();

  }

}


function respawn() {

  player.hp = 3;

  player.x = player.spawnX;

  player.y = player.spawnY;

  player.vx = 0;

  player.vy = 0;

  player.invincible = 1.2;

  player.hurtAnim = 0;

  enemyShots = [];


  banner =
    checkpoint.active
      ? "CHECKPOINT RESTORED"
      : "SYSTEM REBOOT";


  bannerTime = 1.3;

  updateHUD();

}


/* =========================================================
   PLAYER SHOOTING
========================================================= */

function firePlayerShot() {

  if (
    player.shootCooldown > 0 ||
    complete
  ) {
    return;
  }


  const muzzleX =
    player.face > 0
      ? player.x + player.w + 12
      : player.x - 12;


  const muzzleY =
    player.y + 28;


  shots.push({

    x: muzzleX,

    y: muzzleY,

    w: 26,
    h: 10,

    vx:
      850 * player.face,

    dir:
      player.face,

    life:
      1.4

  });


  spawnEffect(
    "muzzle",
    muzzleX,
    muzzleY,
    0.12,
    42
  );


  player.shootCooldown =
    0.18;


  player.shootAnim =
    0.24;

}


/* =========================================================
   ENEMY SHOOTING
========================================================= */

function enemyFire(enemy, speed) {

  const startX =
    enemy.x + enemy.w / 2;

  const startY =
    enemy.y + enemy.h / 2;


  const targetX =
    player.x + player.w / 2;

  const targetY =
    player.y + player.h / 2;


  const dx =
    targetX - startX;

  const dy =
    targetY - startY;


  const distance =
    Math.hypot(dx, dy) || 1;


  enemyShots.push({

    x: startX,

    y: startY,

    w: 18,
    h: 12,

    vx:
      dx / distance * speed,

    vy:
      dy / distance * speed,

    life: 4

  });

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(dt) {

  if (complete) {
    return;
  }


  /* -------------------------
     MOVEMENT
  ------------------------- */

  if (
    down("ArrowLeft", "KeyA") &&
    !down("ArrowRight", "KeyD")
  ) {

    player.vx = -SPEED;

    player.face = -1;

  }

  else if (
    down("ArrowRight", "KeyD") &&
    !down("ArrowLeft", "KeyA")
  ) {

    player.vx = SPEED;

    player.face = 1;

  }

  else {

    player.vx *=
      Math.pow(0.001, dt);

  }


  /* -------------------------
     JUMP INPUT
  ------------------------- */

  if (
    hit(
      "ArrowUp",
      "KeyW",
      "Space"
    )
  ) {

    player.jumpBuffer =
      0.12;

  }


  player.jumpBuffer =
    Math.max(
      0,
      player.jumpBuffer - dt
    );


  player.coyote =
    player.grounded
      ? 0.1
      : Math.max(
          0,
          player.coyote - dt
        );


  if (
    player.jumpBuffer > 0 &&
    player.coyote > 0
  ) {

    player.vy =
      -JUMP_POWER;

    player.grounded =
      false;

    player.jumpBuffer =
      0;

    player.coyote =
      0;

  }


  /* shorter jump */

  if (
    !down(
      "ArrowUp",
      "KeyW",
      "Space"
    ) &&
    player.vy < -250
  ) {

    player.vy +=
      GRAVITY *
      1.4 *
      dt;

  }


  /* -------------------------
     SHOOT
  ------------------------- */

  if (
    hit("KeyZ", "KeyX")
  ) {

    firePlayerShot();

  }


  player.shootCooldown =
    Math.max(
      0,
      player.shootCooldown - dt
    );


  player.shootAnim =
    Math.max(
      0,
      player.shootAnim - dt
    );


  player.hurtAnim =
    Math.max(
      0,
      player.hurtAnim - dt
    );


  player.invincible =
    Math.max(
      0,
      player.invincible - dt
    );


  /* -------------------------
     HORIZONTAL MOVEMENT
  ------------------------- */

  player.x =
    clamp(
      player.x +
      player.vx * dt,
      0,
      WORLD_W - player.w
    );


  /* -------------------------
     GRAVITY
  ------------------------- */

  const oldBottom =
    player.y + player.h;


  player.vy =
    Math.min(
      1200,
      player.vy +
      GRAVITY * dt
    );


  player.y +=
    player.vy * dt;


  player.grounded =
    false;


  /* -------------------------
     PLATFORM COLLISION
  ------------------------- */

  if (player.vy >= 0) {

    const newBottom =
      player.y + player.h;


    for (const p of platforms) {

      const horizontal =
        player.x + player.w > p.x &&
        player.x < p.x + p.w;


      if (
        horizontal &&
        oldBottom <= p.y + 8 &&
        newBottom >= p.y
      ) {

        player.y =
          p.y - player.h;


        player.vy =
          0;


        player.grounded =
          true;

        break;

      }

    }

  }


  /* -------------------------
     BOOSTERS
  ------------------------- */

  for (const booster of boosters) {

    booster.cool =
      Math.max(
        0,
        booster.cool - dt
      );


    if (
      booster.cool === 0 &&
      overlap(player, booster) &&
      player.vy >= -100
    ) {

      player.vy =
        -1080;


      booster.cool =
        0.5;


      banner =
        "BOOST LINKED";


      bannerTime =
        0.7;

    }

  }


  /* -------------------------
     HAZARDS
  ------------------------- */

  for (const hazard of hazards) {

    if (
      overlap(
        player,
        hazard
      )
    ) {

      hurtPlayer(
        hazard.x +
        hazard.w / 2
      );


      player.y -=
        18;

      break;

    }

  }


  /* -------------------------
     FALL OUT OF LEVEL
  ------------------------- */

  if (
    player.y >
    H + 180
  ) {

    respawn();

  }


  /* -------------------------
     CHECKPOINT
  ------------------------- */

  if (
    !checkpoint.active &&
    overlap(
      player,
      checkpoint
    )
  ) {

    checkpoint.active =
      true;


    player.spawnX =
      checkpoint.x + 30;


    player.spawnY =
      checkpoint.y -
      player.h;


    banner =
      "CHECKPOINT SAVED";


    bannerTime =
      1.5;

  }


  /* -------------------------
     DATA SHARDS
  ------------------------- */

  for (const shard of shards) {

    if (
      !shard.taken &&
      overlap(
        player,
        shard
      )
    ) {

      shard.taken =
        true;


      spawnEffect(
        "glitch",
        shard.x,
        shard.y,
        0.5,
        75
      );


      banner =
        "DATA SHARD +1";


      bannerTime =
        0.65;


      updateHUD();

    }

  }


  /* -------------------------
     PLAYER TOUCHES ENEMY
  ------------------------- */

  for (const enemy of enemies) {

    if (
      enemy.alive &&
      overlap(
        player,
        enemy
      )
    ) {

      hurtPlayer(

        enemy.x +
        enemy.w / 2,

        enemy.type ===
        "guardian"
          ? 2
          : 1

      );

      break;

    }

  }


  /* -------------------------
     EXIT PORTAL
  ------------------------- */

  if (
    guardianDown &&
    overlap(
      player,
      portal
    )
  ) {

    complete =
      true;


    player.vx =
      0;


    player.vy =
      0;


    banner =
      "FRACTURED CORE STABILIZED";


    bannerTime =
      999;

  }

}


/* =========================================================
   SHOTS UPDATE
========================================================= */

function updateShots(dt) {

  /* PLAYER SHOTS */

  for (const shot of shots) {

    shot.x +=
      shot.vx * dt;


    shot.life -=
      dt;


    for (const enemy of enemies) {

      if (
        enemy.alive &&
        shot.life > 0 &&
        overlap(
          shot,
          enemy
        )
      ) {

        enemy.hp--;

        enemy.flash =
          0.12;


        shot.life =
          0;


        spawnEffect(
          "hit",
          shot.x,
          shot.y,
          0.22,
          60
        );


        if (
          enemy.hp <= 0
        ) {

          enemy.alive =
            false;


          spawnEffect(
            "explosion",
            enemy.x +
            enemy.w / 2,
            enemy.y +
            enemy.h / 2,
            0.6,
            enemy.type ===
            "guardian"
              ? 180
              : 95
          );


          if (
            enemy.type ===
            "guardian"
          ) {

            guardianDown =
              true;


            banner =
              "CORE GUARDIAN OFFLINE — PORTAL UNLOCKED";


            bannerTime =
              2.5;

          }

        }

      }

    }

  }


  shots =
    shots.filter(
      shot =>
        shot.life > 0 &&
        shot.x > -100 &&
        shot.x <
        WORLD_W + 100
    );


  /* ENEMY SHOTS */

  for (
    const shot of enemyShots
  ) {

    shot.x +=
      shot.vx * dt;


    shot.y +=
      shot.vy * dt;


    shot.life -=
      dt;


    if (
      shot.life > 0 &&
      overlap(
        shot,
        player
      )
    ) {

      hurtPlayer(
        shot.x
      );


      shot.life =
        0;

    }

  }


  enemyShots =
    enemyShots.filter(
      shot =>
        shot.life > 0
    );

}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(dt) {

  for (const enemy of enemies) {

    if (!enemy.alive) {
      continue;
    }


    enemy.flash =
      Math.max(
        0,
        enemy.flash - dt
      );


    enemy.shootTimer -=
      dt;


    /* DRONE */

    if (
      enemy.type ===
      "drone"
    ) {

      enemy.phase +=
        dt * 2;


      enemy.x =
        enemy.homeX +
        Math.sin(
          enemy.phase * 0.7
        ) * 90;


      enemy.y =
        enemy.homeY +
        Math.sin(
          enemy.phase
        ) * 25;


      if (
        Math.abs(
          player.x -
          enemy.x
        ) < 600 &&
        enemy.shootTimer <= 0
      ) {

        enemyFire(
          enemy,
          390
        );


        enemy.shootTimer =
          1.25;

      }

    }


    /* SENTRY / GUARDIAN */

    else {

      const range =
        enemy.type ===
        "guardian"
          ? 120
          : 65;


      const speed =
        enemy.type ===
        "guardian"
          ? 80
          : 55;


      enemy.x +=
        enemy.dir *
        speed *
        dt;


      if (
        enemy.x <
        enemy.homeX -
        range ||
        enemy.x >
        enemy.homeX +
        range
      ) {

        enemy.dir *=
          -1;

      }


      const attackRange =
        enemy.type ===
        "guardian"
          ? 760
          : 520;


      if (
        Math.abs(
          player.x -
          enemy.x
        ) < attackRange &&
        enemy.shootTimer <= 0
      ) {

        enemyFire(

          enemy,

          enemy.type ===
          "guardian"
            ? 440
            : 330

        );


        enemy.shootTimer =
          enemy.type ===
          "guardian"
            ? 0.85
            : 1.6;

      }

    }

  }

}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(dt) {

  for (const effect of effects) {

    effect.life -=
      dt;

  }


  effects =
    effects.filter(
      effect =>
        effect.life > 0
    );

}


/* =========================================================
   MAIN UPDATE
========================================================= */

function update(dt) {

  time += dt;


  bannerTime =
    Math.max(
      0,
      bannerTime - dt
    );


  if (
    hit("KeyR")
  ) {

    resetGame();

  }


  updatePlayer(dt);

  updateShots(dt);

  updateEnemies(dt);

  updateEffects(dt);


  /* CAMERA */

  const targetCamera =
    clamp(

      player.x -
      W * 0.38,

      0,

      WORLD_W - W

    );


  cameraX +=

    (
      targetCamera -
      cameraX
    )

    *

    (
      1 -
      Math.pow(
        0.00002,
        dt
      )
    );


  pressed.clear();

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

  ctx.fillStyle =
    "#050816";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  const image =
    art.background;


  if (
    image &&
    image.naturalWidth
  ) {

    const scale =
      H /
      image.naturalHeight;


    const bgWidth =
      image.naturalWidth *
      scale;


    const maxPan =
      Math.max(
        0,
        bgWidth - W
      );


    const worldProgress =
      cameraX /
      Math.max(
        1,
        WORLD_W - W
      );


    const pan =
      worldProgress *
      maxPan;


    ctx.drawImage(

      image,

      -pan,

      0,

      bgWidth,

      H

    );

  }


  /* gameplay contrast */

  ctx.fillStyle =
    "rgba(2,5,18,0.16)";


  ctx.fillRect(
    0,
    0,
    W,
    H
  );

}


/* =========================================================
   WORLD DECOR
========================================================= */

function drawDecorations() {

  for (
    const decor of decorations
  ) {

    const screenX =
      decor.x -
      cameraX;


    if (
      screenX <
      -decor.w ||
      screenX >
      W + decor.w
    ) {
      continue;
    }


    drawSprite(

      decor.image,

      screenX,

      decor.bottom,

      decor.w,

      decor.h

    );

  }

}


/* =========================================================
   PLATFORM ART
========================================================= */

function drawPlatform(platform) {

  const screenX =
    platform.x -
    cameraX;


  if (
    screenX + platform.w < -100 ||
    screenX > W + 100
  ) {
    return;
  }


  /* dark structural body */

  if (
    platform.h >
    40
  ) {

    ctx.fillStyle =
      "rgba(4,9,19,0.92)";


    ctx.fillRect(

      screenX,

      platform.y + 18,

      platform.w,

      platform.h

    );

  }


  const visualHeight =
    platform.h > 40
      ? 58
      : 48;


  const tileWidth =
    100;


  /* LEFT CAP */

  if (
    art.platformLeft.naturalWidth
  ) {

    ctx.drawImage(

      art.platformLeft,

      screenX,

      platform.y - 12,

      70,

      visualHeight

    );

  }


  /* MIDDLE TILES */

  let tileX =
    screenX + 55;


  const end =
    screenX +
    platform.w -
    55;


  while (
    tileX < end
  ) {

    const remaining =
      end -
      tileX;


    const width =
      Math.min(
        tileWidth,
        remaining
      );


    if (
      art.platformMid.naturalWidth
    ) {

      ctx.drawImage(

        art.platformMid,

        tileX,

        platform.y - 12,

        width,

        visualHeight

      );

    }


    tileX +=
      tileWidth;

  }


  /* RIGHT CAP */

  if (
    art.platformRight.naturalWidth
  ) {

    ctx.drawImage(

      art.platformRight,

      screenX +
      platform.w -
      70,

      platform.y - 12,

      70,

      visualHeight

    );

  }

}


/* =========================================================
   HAZARDS
========================================================= */

function drawHazards() {

  for (
    const hazard of hazards
  ) {

    const x =
      hazard.x -
      cameraX;


    const pulse =
      0.65 +
      Math.sin(
        time * 6
      ) * 0.15;


    ctx.fillStyle =
      `rgba(220,40,255,${pulse * 0.22})`;


    ctx.fillRect(

      x,

      hazard.y - 30,

      hazard.w,

      hazard.h + 30

    );


    ctx.fillStyle =
      "#d63cff";


    for (
      let i = 0;
      i < hazard.w;
      i += 24
    ) {

      ctx.beginPath();


      ctx.moveTo(
        x + i,
        hazard.y
      );


      ctx.lineTo(
        x + i + 12,
        hazard.y - 30
      );


      ctx.lineTo(
        x + i + 24,
        hazard.y
      );


      ctx.closePath();

      ctx.fill();

    }

  }

}


/* =========================================================
   BOOSTERS
========================================================= */

function drawBoosters() {

  for (
    const booster of boosters
  ) {

    const x =
      booster.x -
      cameraX;


    const pulse =
      1 +
      Math.sin(
        time * 8
      ) * 0.06;


    drawSprite(

      art.booster,

      x + booster.w / 2,

      booster.y +
      booster.h,

      110 * pulse,

      60 * pulse

    );

  }

}


/* =========================================================
   CHECKPOINT
========================================================= */

function drawCheckpoint() {

  const x =
    checkpoint.x -
    cameraX;


  drawSprite(

    art.checkpoint,

    x + checkpoint.w / 2,

    checkpoint.y +
    checkpoint.h,

    78,

    110,

    false,

    checkpoint.active
      ? 1
      : 0.65

  );

}


/* =========================================================
   SHARDS
========================================================= */

function drawShards() {

  for (const shard of shards) {

    if (shard.taken) {
      continue;
    }


    const x =
      shard.x -
      cameraX;


    const y =
      shard.y +
      Math.sin(
        time * 3 +
        shard.phase
      ) * 7;


    const pulse =
      1 +
      Math.sin(
        time * 5 +
        shard.phase
      ) * 0.08;


    drawSprite(

      art.shard,

      x + 12,

      y + 30,

      38 * pulse,

      52 * pulse

    );

  }

}


/* =========================================================
   PORTAL
========================================================= */

function drawPortal() {

  const x =
    portal.x -
    cameraX;


  const pulse =
    guardianDown
      ? 1 +
        Math.sin(
          time * 5
        ) * 0.05
      : 1;


  drawSprite(

    art.portal,

    x + portal.w / 2,

    portal.y +
    portal.h,

    150 * pulse,

    180 * pulse,

    false,

    guardianDown
      ? 1
      : 0.45

  );


  ctx.font =
    "bold 14px Arial";


  ctx.textAlign =
    "center";


  ctx.fillStyle =
    guardianDown
      ? "#7cf7ff"
      : "#9c8ca8";


  ctx.fillText(

    guardianDown
      ? "EXIT ONLINE"
      : "PORTAL LOCKED",

    x +
    portal.w / 2,

    portal.y - 18

  );

}


/* =========================================================
   PLAYER SPRITE SELECTION
========================================================= */

function getPlayerSprite() {

  if (
    player.hurtAnim > 0
  ) {

    const progress =
      1 -
      player.hurtAnim /
      0.45;


    const index =
      Math.min(

        art.player.hurt.length - 1,

        Math.floor(
          progress *
          art.player.hurt.length
        )

      );


    return art.player.hurt[index];

  }


  if (
    player.shootAnim > 0
  ) {

    const progress =
      1 -
      player.shootAnim /
      0.24;


    const index =
      Math.min(

        art.player.shoot.length - 1,

        Math.floor(
          progress *
          art.player.shoot.length
        )

      );


    return art.player.shoot[index];

  }


  if (
    !player.grounded
  ) {

    if (
      player.vy >
      120
    ) {

      return frame(
        art.player.fall,
        6
      );

    }


    let index = 0;


    if (
      player.vy < -450
    ) {
      index = 0;
    }

    else if (
      player.vy < -150
    ) {
      index = 1;
    }

    else if (
      player.vy < 100
    ) {
      index = 2;
    }

    else {
      index = 3;
    }


    return (
      art.player.jump[index] ||
      art.player.jump[0]
    );

  }


  if (
    Math.abs(
      player.vx
    ) > 60
  ) {

    return frame(
      art.player.run,
      10
    );

  }


  return frame(
    art.player.idle,
    4
  );

}


/* =========================================================
   PLAYER DRAW
========================================================= */

function drawPlayer() {

  const screenX =
    player.x -
    cameraX;


  const sprite =
    getPlayerSprite();


  let alpha = 1;


  if (
    player.invincible > 0 &&
    Math.floor(
      player.invincible * 14
    ) %
    2 ===
    0
  ) {

    alpha =
      0.45;

  }


  const drawn =
    drawSprite(

      sprite,

      screenX +
      player.w / 2,

      player.y +
      player.h +
      5,

      122,

      98,

      player.face < 0,

      alpha

    );


  /* fallback */

  if (!drawn) {

    ctx.fillStyle =
      "#32eaff";


    ctx.fillRect(

      screenX,

      player.y,

      player.w,

      player.h

    );

  }

}


/* =========================================================
   ENEMY DRAW
========================================================= */

function drawEnemies() {

  for (const enemy of enemies) {

    if (!enemy.alive) {
      continue;
    }


    const screenX =
      enemy.x -
      cameraX;


    if (
      screenX <
      -200 ||
      screenX >
      W + 200
    ) {
      continue;
    }


    let sprite;
    let width;
    let height;


    if (
      enemy.type ===
      "sentry"
    ) {

      sprite =
        frame(
          art.sentry,
          5,
          enemy.phase
        );


      width =
        100;


      height =
        100;

    }


    else if (
      enemy.type ===
      "drone"
    ) {

      sprite =
        frame(
          art.drone,
          7,
          enemy.phase
        );


      width =
        108;


      height =
        76;

    }


    else {

      sprite =
        frame(
          art.guardian,
          4
        );


      width =
        190;


      height =
        160;

    }


    const alpha =
      enemy.flash > 0
        ? 0.55
        : 1;


    drawSprite(

      sprite,

      screenX +
      enemy.w / 2,

      enemy.y +
      enemy.h,

      width,

      height,

      enemy.dir > 0,

      alpha

    );


    /* BOSS HEALTH */

    if (
      enemy.type ===
      "guardian"
    ) {

      const barWidth =
        140;


      const barX =
        screenX +
        enemy.w / 2 -
        barWidth / 2;


      ctx.fillStyle =
        "rgba(20,5,24,.85)";


      ctx.fillRect(

        barX,

        enemy.y - 32,

        barWidth,

        10

      );


      ctx.fillStyle =
        "#db44ff";


      ctx.fillRect(

        barX,

        enemy.y - 32,

        barWidth *
        (
          enemy.hp /
          enemy.maxHp
        ),

        10

      );


      ctx.strokeStyle =
        "#ffffff55";


      ctx.strokeRect(

        barX,

        enemy.y - 32,

        barWidth,

        10

      );

    }

  }

}


/* =========================================================
   PROJECTILES
========================================================= */

function drawProjectiles() {

  for (const shot of shots) {

    const x =
      shot.x -
      cameraX;


    const drawn =
      drawSprite(

        art.projectile,

        x,

        shot.y + 8,

        44,

        20,

        shot.dir < 0

      );


    if (!drawn) {

      ctx.fillStyle =
        "#72f7ff";


      ctx.fillRect(

        x,

        shot.y,

        shot.w,

        shot.h

      );

    }

  }


  for (
    const shot of enemyShots
  ) {

    const x =
      shot.x -
      cameraX;


    drawSprite(

      art.enemyShot,

      x,

      shot.y + 8,

      34,

      22

    );

  }

}


/* =========================================================
   EFFECT DRAWING
========================================================= */

function drawEffects() {

  for (
    const effect of effects
  ) {

    const x =
      effect.x -
      cameraX;


    const progress =
      effect.life /
      effect.maxLife;


    let image =
      art.hitEffect;


    if (
      effect.type ===
      "muzzle"
    ) {
      image =
        art.muzzleFlash;
    }


    if (
      effect.type ===
      "explosion"
    ) {
      image =
        art.explosion;
    }


    if (
      effect.type ===
      "glitch"
    ) {
      image =
        art.glitchParticles;
    }


    drawSprite(

      image,

      x,

      effect.y +
      effect.size / 2,

      effect.size,

      effect.size,

      false,

      progress

    );

  }

}


/* =========================================================
   WORLD DRAW
========================================================= */

function drawWorld() {

  drawDecorations();


  for (
    const platform of platforms
  ) {

    drawPlatform(
      platform
    );

  }


  drawHazards();

  drawBoosters();

  drawCheckpoint();

  drawShards();

  drawPortal();

}


/* =========================================================
   BANNERS / END SCREEN
========================================================= */

function drawOverlay() {

  if (
    bannerTime > 0
  ) {

    ctx.fillStyle =
      "rgba(3,7,20,.78)";


    ctx.fillRect(

      W / 2 - 270,

      42,

      540,

      58

    );


    ctx.strokeStyle =
      "rgba(69,234,255,.55)";


    ctx.strokeRect(

      W / 2 - 270,

      42,

      540,

      58

    );


    ctx.fillStyle =
      "#c9fbff";


    ctx.font =
      "bold 18px Arial";


    ctx.textAlign =
      "center";


    ctx.fillText(

      banner,

      W / 2,

      78

    );

  }


  if (complete) {

    ctx.fillStyle =
      "rgba(2,5,16,.82)";


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    ctx.fillStyle =
      "#68f5ff";


    ctx.textAlign =
      "center";


    ctx.font =
      "bold 44px Arial";


    ctx.fillText(

      "LEVEL 1 COMPLETE",

      W / 2,

      270

    );


    ctx.fillStyle =
      "#ffffff";


    ctx.font =
      "22px Arial";


    ctx.fillText(

      `DATA SHARDS: ${
        shards.filter(
          shard =>
            shard.taken
        ).length
      } / ${shards.length}`,

      W / 2,

      320

    );


    ctx.fillStyle =
      "#b9a9d0";


    ctx.font =
      "17px Arial";


    ctx.fillText(

      "Press R to replay",

      W / 2,

      365

    );

  }

}


/* =========================================================
   LOADING SCREEN
========================================================= */

function drawLoading() {

  ctx.fillStyle =
    "#050816";


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  const percent =
    Math.floor(
      loadedAssets /
      totalAssets *
      100
    );


  ctx.textAlign =
    "center";


  ctx.fillStyle =
    "#5bf2ff";


  ctx.font =
    "bold 36px Arial";


  ctx.fillText(

    "FRACTURED CORE",

    W / 2,

    300

  );


  ctx.fillStyle =
    "#c5d7ef";


  ctx.font =
    "18px Arial";


  ctx.fillText(

    `Loading system assets... ${percent}%`,

    W / 2,

    350

  );


  ctx.fillStyle =
    "#111a31";


  ctx.fillRect(

    W / 2 - 200,

    380,

    400,

    12

  );


  ctx.fillStyle =
    "#3cecff";


  ctx.fillRect(

    W / 2 - 200,

    380,

    400 *
    (
      loadedAssets /
      totalAssets
    ),

    12

  );

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

  drawBackground();

  drawWorld();

  drawEnemies();

  drawProjectiles();

  drawPlayer();

  drawEffects();

  drawOverlay();

}


/* =========================================================
   GAME LOOP
========================================================= */

let last =
  performance.now();


function loop(now) {

  const dt =
    Math.min(

      (now - last) /
      1000,

      1 / 30

    );


  last =
    now;


  if (
    loadedAssets <
    totalAssets
  ) {

    drawLoading();


    requestAnimationFrame(
      loop
    );

    return;

  }


  update(dt);

  draw();


  requestAnimationFrame(
    loop
  );

}


/* =========================================================
   START
========================================================= */

resetGame();

requestAnimationFrame(
  loop
);
