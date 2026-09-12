const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthEl = document.getElementById('health');
const shardEl = document.getElementById('shard-count');

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 4700;
const GRAVITY = 1900;
const SPEED = 360;
const JUMP = 760;

const keys = new Set();
const pressed = new Set();

addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) {
    e.preventDefault();
  }

  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
});

addEventListener('keyup', (e) => keys.delete(e.code));

const down = (...codes) => codes.some((c) => keys.has(c));
const hit = (...codes) => codes.some((c) => pressed.has(c));

const clamp = (n, a, b) =>
  Math.max(a, Math.min(b, n));

const overlap = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;


/* =========================================================
   LEVEL 1 — FRACTURED CORE
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

].map(([x, y, w, h]) => ({ x, y, w, h }));


const hazards = [

  [850, 650, 150, 70],

  [1500, 650, 140, 70],

  [2330, 650, 150, 70],

  [3310, 650, 180, 70],

  [4250, 650, 160, 70]

].map(([x, y, w, h]) => ({ x, y, w, h }));


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

  y: 560,

  w: 40,

  h: 60,

  active: false

};


const portal = {

  x: 4555,

  y: 480,

  w: 95,

  h: 140

};


const shardSpots = [

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
   ENEMIES
========================================================= */

function newEnemy(type, x, y, hp) {

  const size =
    type === 'guardian'
      ? [82, 100]
      : type === 'drone'
      ? [52, 38]
      : [52, 56];

  return {

    type,

    x,

    y,

    w: size[0],

    h: size[1],

    homeX: x,

    homeY: y,

    hp,

    maxHp: hp,

    dir: -1,

    alive: true,

    shoot: 0.7 + Math.random(),

    phase: Math.random() * 6,

    flash: 0

  };

}


function makeEnemies() {

  return [

    newEnemy('sentry', 1180, 564, 3),

    newEnemy('drone', 1710, 300, 2),

    newEnemy('sentry', 2160, 564, 3),

    newEnemy('drone', 2890, 300, 2),

    newEnemy('sentry', 3650, 564, 3),

    newEnemy('guardian', 4110, 520, 10)

  ];

}


let enemies = [];

let shots = [];

let enemyShots = [];

let cameraX = 0;

let time = 0;

let complete = false;

let guardianDown = false;

let banner = '';

let bannerTime = 0;


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

  shootCool: 0,

  hp: 3,

  inv: 0,

  spawnX: 120,

  spawnY: 520

};


/* =========================================================
   GAME RESET
========================================================= */

function reset() {

  Object.assign(player, {

    x: 120,

    y: 520,

    vx: 0,

    vy: 0,

    face: 1,

    hp: 3,

    inv: 0,

    spawnX: 120,

    spawnY: 520

  });


  checkpoint.active = false;


  shards = shardSpots.map(([x, y], i) => ({

    x,

    y,

    w: 22,

    h: 30,

    taken: false,

    phase: i * 0.7

  }));


  enemies = makeEnemies();

  shots = [];

  enemyShots = [];

  cameraX = 0;

  complete = false;

  guardianDown = false;


  banner = 'SYSTEM LINK ESTABLISHED';

  bannerTime = 1.8;


  updateHud();

}


/* =========================================================
   HUD
========================================================= */

function updateHud() {

  healthEl.textContent =
    '❤️'.repeat(player.hp) +
    '🖤'.repeat(3 - player.hp);


  shardEl.textContent =
    shards.filter((s) => s.taken).length;

}


/* =========================================================
   PLAYER DAMAGE / RESPAWN
========================================================= */

function respawn() {

  player.hp = 3;

  player.x = player.spawnX;

  player.y = player.spawnY;

  player.vx = 0;

  player.vy = 0;

  player.inv = 1.2;

  enemyShots = [];


  banner =
    checkpoint.active
      ? 'CHECKPOINT RESTORED'
      : 'SYSTEM REBOOT';


  bannerTime = 1.2;


  updateHud();

}


function hurt(sourceX, amount = 1) {

  if (player.inv > 0 || complete) return;


  player.hp -= amount;

  player.inv = 1;


  player.vx =
    player.x < sourceX
      ? -420
      : 420;


  player.vy = -420;


  updateHud();


  if (player.hp <= 0) {

    respawn();

  }

}


/* =========================================================
   SHOOTING
========================================================= */

function fire() {

  if (player.shootCool > 0 || complete) return;


  shots.push({

    x:
      player.face > 0
        ? player.x + player.w
        : player.x - 18,

    y: player.y + 27,

    w: 18,

    h: 6,

    vx: 760 * player.face,

    life: 1.3

  });


  player.shootCool = 0.18;

}


function enemyFire(e, speed) {

  const ax = e.x + e.w / 2;

  const ay = e.y + e.h / 2;

  const bx = player.x + player.w / 2;

  const by = player.y + player.h / 2;


  const dx = bx - ax;

  const dy = by - ay;

  const d = Math.hypot(dx, dy) || 1;


  enemyShots.push({

    x: ax,

    y: ay,

    w: 10,

    h: 10,

    vx: (dx / d) * speed,

    vy: (dy / d) * speed,

    life: 4

  });

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(dt) {

  if (complete) return;


  if (
    down('ArrowLeft', 'KeyA') &&
    !down('ArrowRight', 'KeyD')
  ) {

    player.vx = -SPEED;

    player.face = -1;

  }

  else if (
    down('ArrowRight', 'KeyD') &&
    !down('ArrowLeft', 'KeyA')
  ) {

    player.vx = SPEED;

    player.face = 1;

  }

  else {

    player.vx *= Math.pow(0.001, dt);

  }


  /* Jump input */

  if (hit('ArrowUp', 'KeyW', 'Space')) {

    player.jumpBuffer = 0.12;

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

    player.vy = -JUMP;

    player.grounded = false;

    player.jumpBuffer = 0;

    player.coyote = 0;

  }


  /* Short jump if key released */

  if (
    !down('ArrowUp', 'KeyW', 'Space') &&
    player.vy < -250
  ) {

    player.vy +=
      GRAVITY * 1.4 * dt;

  }


  if (hit('KeyZ', 'KeyX')) {

    fire();

  }


  player.shootCool =
    Math.max(
      0,
      player.shootCool - dt
    );


  player.inv =
    Math.max(
      0,
      player.inv - dt
    );


  /* Horizontal movement */

  player.x =
    clamp(
      player.x + player.vx * dt,
      0,
      WORLD_W - player.w
    );


  /* Gravity */

  const oldBottom =
    player.y + player.h;


  player.vy =
    Math.min(
      1200,
      player.vy + GRAVITY * dt
    );


  player.y +=
    player.vy * dt;


  player.grounded = false;


  /* Platform collision */

  if (player.vy >= 0) {

    const newBottom =
      player.y + player.h;


    for (const p of platforms) {

      const inX =
        player.x + player.w > p.x &&
        player.x < p.x + p.w;


      if (
        inX &&
        oldBottom <= p.y + 8 &&
        newBottom >= p.y
      ) {

        player.y =
          p.y - player.h;


        player.vy = 0;

        player.grounded = true;

        break;

      }

    }

  }


  /* Boost pads */

  for (const b of boosters) {

    b.cool =
      Math.max(
        0,
        b.cool - dt
      );


    if (
      b.cool === 0 &&
      overlap(player, b) &&
      player.vy >= -100
    ) {

      player.vy = -1080;

      b.cool = 0.45;


      banner =
        'BOOST LINKED';


      bannerTime =
        0.7;

    }

  }


  /* Corrupted pits */

  for (const h of hazards) {

    if (overlap(player, h)) {

      hurt(
        h.x + h.w / 2
      );


      player.y -= 18;

      break;

    }

  }


  /* Fell out of world */

  if (player.y > H + 180) {

    respawn();

  }


  /* Checkpoint */

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
      checkpoint.x + 20;


    player.spawnY =
      checkpoint.y -
      player.h;


    banner =
      'CHECKPOINT SAVED';


    bannerTime =
      1.5;

  }


  /* Collect data shards */

  for (const s of shards) {

    if (
      !s.taken &&
      overlap(player, s)
    ) {

      s.taken = true;


      banner =
        'DATA SHARD +1';


      bannerTime =
        0.7;


      updateHud();

    }

  }


  /* Player touches enemy */

  for (const e of enemies) {

    if (
      e.alive &&
      overlap(player, e)
    ) {

      hurt(
        e.x + e.w / 2,
        e.type === 'guardian'
          ? 2
          : 1
      );


      break;

    }

  }


  /* Exit */

  if (
    guardianDown &&
    overlap(
      player,
      portal
    )
  ) {

    complete = true;

    player.vx = 0;

    player.vy = 0;


    banner =
      'FRACTURED CORE STABILIZED';


    bannerTime =
      999;

  }

}


/* =========================================================
   BULLET UPDATE
========================================================= */

function updateShots(dt) {

  for (const s of shots) {

    s.x +=
      s.vx * dt;


    s.life -=
      dt;


    for (const e of enemies) {

      if (
        e.alive &&
        s.life > 0 &&
        overlap(s, e)
      ) {

        e.hp--;

        e.flash =
          0.12;


        s.life =
          0;


        if (e.hp <= 0) {

          e.alive =
            false;


          if (
            e.type ===
            'guardian'
          ) {

            guardianDown =
              true;


            banner =
              'CORE GUARDIAN OFFLINE — PORTAL UNLOCKED';


            bannerTime =
              2.5;

          }

        }

      }

    }

  }


  shots =
    shots.filter(
      (s) =>
        s.life > 0 &&
        s.x > -100 &&
        s.x < WORLD_W + 100
    );


  for (const s of enemyShots) {

    s.x +=
      s.vx * dt;


    s.y +=
      s.vy * dt;


    s.life -=
      dt;


    if (
      s.life > 0 &&
      overlap(s, player)
    ) {

      hurt(s.x);

      s.life =
        0;

    }

  }


  enemyShots =
    enemyShots.filter(
      (s) => s.life > 0
    );

}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(dt) {

  for (const e of enemies) {

    if (!e.alive) continue;


    e.flash =
      Math.max(
        0,
        e.flash - dt
      );


    e.shoot -=
      dt;


    if (
      e.type ===
      'drone'
    ) {

      e.phase +=
        dt * 2;


      e.x =
        e.homeX +
        Math.sin(
          e.phase * 0.7
        ) * 90;


      e.y =
        e.homeY +
        Math.sin(
          e.phase
        ) * 26;


      if (
        Math.abs(
          player.x -
          e.x
        ) < 600 &&
        e.shoot <= 0
      ) {

        enemyFire(
          e,
          390
        );


        e.shoot =
          1.25;

      }

    }

    else {

      const range =
        e.type ===
        'guardian'
          ? 120
          : 70;


      const speed =
        e.type ===
        'guardian'
          ? 80
          : 55;


      e.x +=
        e.dir *
        speed *
        dt;


      if (
        e.x <
          e.homeX -
            range ||
        e.x >
          e.homeX +
            range
      ) {

        e.dir *=
          -1;

      }


      const maxDist =
        e.type ===
        'guardian'
          ? 760
          : 520;


      if (
        Math.abs(
          player.x -
          e.x
        ) < maxDist &&
        e.shoot <= 0
      ) {

        enemyFire(
          e,
          e.type ===
          'guardian'
            ? 430
            : 330
        );


        e.shoot =
          e.type ===
          'guardian'
            ? 0.85
            : 1.6;

      }

    }

  }

}


/* =========================================================
   UPDATE GAME
========================================================= */

function update(dt) {

  time += dt;


  bannerTime =
    Math.max(
      0,
      bannerTime - dt
    );


  if (hit('KeyR')) {

    reset();

  }


  updatePlayer(dt);

  updateShots(dt);

  updateEnemies(dt);


  const target =
    clamp(
      player.x -
      W * 0.38,
      0,
      WORLD_W - W
    );


  cameraX +=
    (target - cameraX) *
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

  const g =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H
    );


  g.addColorStop(
    0,
    '#11183b'
  );


  g.addColorStop(
    0.5,
    '#0a1028'
  );


  g.addColorStop(
    1,
    '#040713'
  );


  ctx.fillStyle =
    g;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* distant city */

  ctx.save();


  ctx.translate(
    -cameraX * 0.15,
    0
  );


  ctx.fillStyle =
    'rgba(32,55,98,.28)';


  for (
    let i = 0;
    i < 38;
    i++
  ) {

    const x =
      i * 155;


    const h =
      90 +
      (i * 67) %
      250;


    const w =
      55 +
      (i * 41) %
      85;


    ctx.fillRect(
      x,
      H - 110 - h,
      w,
      h
    );

  }


  ctx.restore();


  /* giant corrupted core */

  const coreX =
    2860 -
    cameraX * 0.08;


  ctx.strokeStyle =
    'rgba(183,62,255,.35)';


  ctx.lineWidth =
    10;


  ctx.beginPath();


  ctx.arc(
    coreX,
    150,
    135 +
      Math.sin(
        time * 2
      ) *
        10,
    0,
    Math.PI * 2
  );


  ctx.stroke();

}


/* =========================================================
   WORLD
========================================================= */

function drawWorld() {

  /* platforms */

  for (const p of platforms) {

    const x =
      p.x -
      cameraX;


    if (
      x + p.w < 0 ||
      x > W
    ) continue;


    ctx.fillStyle =
      '#07111f';


    ctx.fillRect(
      x,
      p.y,
      p.w,
      p.h
    );


    ctx.fillStyle =
      '#26e8ff';


    ctx.fillRect(
      x,
      p.y,
      p.w,
      4
    );


    ctx.fillStyle =
      'rgba(38,232,255,.13)';


    for (
      let i = 15;
      i < p.w;
      i += 48
    ) {

      ctx.fillRect(
        x + i,
        p.y + 18,
        22,
        4
      );

    }

  }


  /* corrupted pits */

  for (const h of hazards) {

    const x =
      h.x -
      cameraX;


    ctx.fillStyle =
      'rgba(229,60,255,.22)';


    ctx.fillRect(
      x,
      h.y - 25,
      h.w,
      h.h + 25
    );


    ctx.fillStyle =
      '#e43cff';


    for (
      let i = 0;
      i < h.w;
      i += 22
    ) {

      ctx.beginPath();


      ctx.moveTo(
        x + i,
        h.y
      );


      ctx.lineTo(
        x + i + 11,
        h.y - 25
      );


      ctx.lineTo(
        x + i + 22,
        h.y
      );


      ctx.fill();

    }

  }


  /* boosters */

  for (const b of boosters) {

    const x =
      b.x -
      cameraX;


    ctx.fillStyle =
      '#162858';


    ctx.fillRect(
      x,
      b.y,
      b.w,
      b.h
    );


    ctx.fillStyle =
      '#56f2ff';


    ctx.fillRect(
      x + 8,
      b.y + 6,
      b.w - 16,
      5
    );

  }


  /* checkpoint */

  const cx =
    checkpoint.x -
    cameraX;


  ctx.strokeStyle =
    checkpoint.active
      ? '#73ffe1'
      : '#7285a8';


  ctx.lineWidth =
    4;


  ctx.beginPath();


  ctx.moveTo(
    cx + 18,
    620
  );


  ctx.lineTo(
    cx + 18,
    550
  );


  ctx.stroke();


  ctx.fillStyle =
    checkpoint.active
      ? '#73ffe1'
      : '#7285a8';


  ctx.beginPath();


  ctx.moveTo(
    cx + 20,
    552
  );


  ctx.lineTo(
    cx + 55,
    567
  );


  ctx.lineTo(
    cx + 20,
    582
  );


  ctx.fill();

}


/* =========================================================
   DATA SHARDS
========================================================= */

function drawShards() {

  for (const s of shards) {

    if (s.taken) continue;


    const x =
      s.x -
      cameraX;


    const y =
      s.y +
      Math.sin(
        time * 3 +
        s.phase
      ) *
        7;


    ctx.fillStyle =
      '#65f5ff';


    ctx.beginPath();


    ctx.moveTo(
      x + 11,
      y
    );


    ctx.lineTo(
      x + 22,
      y + 15
    );


    ctx.lineTo(
      x + 11,
      y + 30
    );


    ctx.lineTo(
      x,
      y + 15
    );


    ctx.closePath();

    ctx.fill();

  }

}


/* =========================================================
   DRAW ENEMIES
========================================================= */

function drawEnemies() {

  for (const e of enemies) {

    if (!e.alive) continue;


    const x =
      e.x -
      cameraX;


    if (
      x + e.w < 0 ||
      x > W
    ) continue;


    ctx.fillStyle =
      e.flash > 0
        ? '#ffffff'
        : e.type ===
          'guardian'
        ? '#281433'
        : '#17233d';


    if (
      e.type ===
      'drone'
    ) {

      ctx.beginPath();


      ctx.ellipse(
        x + 26,
        e.y + 19,
        26,
        17,
        0,
        0,
        Math.PI * 2
      );


      ctx.fill();

    }

    else {

      ctx.fillRect(
        x,
        e.y,
        e.w,
        e.h
      );

    }


    ctx.fillStyle =
      e.type ===
      'guardian'
        ? '#ff4bd8'
        : '#ff456e';


    ctx.fillRect(
      x + 10,
      e.y + 14,
      e.w - 20,
      e.type ===
        'guardian'
        ? 12
        : 8
    );


    /* boss health */

    if (
      e.type ===
      'guardian'
    ) {

      ctx.fillStyle =
        '#260b1d';


      ctx.fillRect(
        x - 9,
        e.y - 18,
        100,
        8
      );


      ctx.fillStyle =
        '#ff4bd8';


      ctx.fillRect(
        x - 9,
        e.y - 18,
        100 *
          (
            e.hp /
            e.maxHp
          ),
        8
      );

    }

  }

}


/* =========================================================
   PORTAL
========================================================= */

function drawPortal() {

  const x =
    portal.x -
    cameraX;


  const active =
    guardianDown;


  ctx.strokeStyle =
    active
      ? '#63f4ff'
      : '#5b426e';


  ctx.lineWidth =
    9;


  ctx.beginPath();


  ctx.ellipse(
    x + 48,
    portal.y + 70,
    38,
    62,
    0,
    0,
    Math.PI * 2
  );


  ctx.stroke();


  ctx.fillStyle =
    active
      ? 'rgba(85,238,255,.22)'
      : 'rgba(80,60,95,.18)';


  ctx.beginPath();


  ctx.ellipse(
    x + 48,
    portal.y + 70,
    28,
    51,
    0,
    0,
    Math.PI * 2
  );


  ctx.fill();


  ctx.fillStyle =
    active
      ? '#82fbff'
      : '#89769c';


  ctx.font =
    'bold 13px Arial';


  ctx.textAlign =
    'center';


  ctx.fillText(
    active
      ? 'EXIT ONLINE'
      : 'PORTAL LOCKED',
    x + 48,
    portal.y - 16
  );

}


/* =========================================================
   BULLETS
========================================================= */

function drawShots() {

  ctx.fillStyle =
    '#7af9ff';


  for (const s of shots) {

    ctx.fillRect(
      s.x - cameraX,
      s.y,
      s.w,
      s.h
    );

  }


  ctx.fillStyle =
    '#ff4c91';


  for (const s of enemyShots) {

    ctx.beginPath();


    ctx.arc(
      s.x - cameraX + 5,
      s.y + 5,
      6,
      0,
      Math.PI * 2
    );


    ctx.fill();

  }

}


/* =========================================================
   PLAYER ART
========================================================= */

function drawPlayer() {

  const x =
    player.x -
    cameraX;


  if (
    player.inv > 0 &&
    Math.floor(
      player.inv * 14
    ) %
      2 ===
      0
  ) {

    ctx.globalAlpha =
      0.35;

  }


  ctx.save();


  ctx.translate(
    x + 22,
    player.y + 31
  );


  ctx.scale(
    player.face,
    1
  );


  /* body */

  ctx.fillStyle =
    '#18294a';


  ctx.fillRect(
    -17,
    -29,
    34,
    46
  );


  /* visor */

  ctx.fillStyle =
    '#4ff3ff';


  ctx.fillRect(
    -10,
    -18,
    20,
    5
  );


  /* legs */

  ctx.fillStyle =
    '#102039';


  ctx.fillRect(
    -14,
    17,
    10,
    14
  );


  ctx.fillRect(
    4,
    17,
    10,
    14
  );


  /* weapon */

  ctx.fillStyle =
    '#87fbff';


  ctx.fillRect(
    10,
    -2,
    26,
    7
  );


  ctx.fillStyle =
    '#36d7ff';


  ctx.fillRect(
    30,
    0,
    12,
    3
  );


  ctx.restore();


  ctx.globalAlpha =
    1;

}


/* =========================================================
   MESSAGES / END SCREEN
========================================================= */

function drawOverlay() {

  if (
    bannerTime > 0
  ) {

    ctx.fillStyle =
      'rgba(4,7,20,.75)';


    ctx.fillRect(
      W / 2 - 240,
      50,
      480,
      50
    );


    ctx.strokeStyle =
      'rgba(70,235,255,.5)';


    ctx.strokeRect(
      W / 2 - 240,
      50,
      480,
      50
    );


    ctx.fillStyle =
      '#c8fbff';


    ctx.font =
      'bold 18px Arial';


    ctx.textAlign =
      'center';


    ctx.fillText(
      banner,
      W / 2,
      82
    );

  }


  if (complete) {

    ctx.fillStyle =
      'rgba(2,5,16,.8)';


    ctx.fillRect(
      0,
      0,
      W,
      H
    );


    ctx.fillStyle =
      '#63f4ff';


    ctx.font =
      'bold 44px Arial';


    ctx.textAlign =
      'center';


    ctx.fillText(
      'LEVEL 1 COMPLETE',
      W / 2,
      270
    );


    ctx.fillStyle =
      '#d7eaff';


    ctx.font =
      '22px Arial';


    ctx.fillText(

      `Data shards: ${
        shards.filter(
          s => s.taken
        ).length
      } / ${
        shards.length
      }`,

      W / 2,

      320

    );


    ctx.fillStyle =
      '#aaa1c7';


    ctx.font =
      '17px Arial';


    ctx.fillText(
      'Press R to replay',
      W / 2,
      365
    );

  }

}


/* =========================================================
   DRAW EVERYTHING
========================================================= */

function draw() {

  drawBackground();

  drawWorld();

  drawShards();

  drawPortal();

  drawEnemies();

  drawShots();

  drawPlayer();

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
      (now - last) / 1000,
      1 / 30
    );


  last =
    now;


  update(dt);

  draw();


  requestAnimationFrame(
    loop
  );

}


reset();

requestAnimationFrame(
  loop
);
