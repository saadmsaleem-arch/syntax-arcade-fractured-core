/* =========================================================
   SYNTAX ARCADE: FRACTURED CORE
   LEVEL 1 — EXTENDED MISSION BUILD
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthEl = document.getElementById("health");
const shardEl = document.getElementById("shard-count");

ctx.imageSmoothingEnabled = true;


/* =========================================================
   CONSTANTS
========================================================= */

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 9000;

const GRAVITY = 1900;
const RUN_SPEED = 360;
const JUMP_POWER = 760;

const DASH_SPEED = 920;
const DASH_TIME = 0.15;
const DASH_COOLDOWN = 0.65;

const WALL_SLIDE_SPEED = 180;
const WALL_JUMP_X = 470;
const WALL_JUMP_Y = 760;

const MAX_HP = 3;

let time = 0;
let cameraX = 0;
let cameraShake = 0;
let cameraZoom = 1;

let complete = false;
let banner = "";
let bannerTime = 0;

let runStartedAt = 0;
let deaths = 0;
let enemiesDefeated = 0;

let bossStarted = false;
let bossDefeated = false;

let corruptionEscapeActive = false;
let corruptionFrontX = -9999;

let worldFlags = {
  securityGateOpen: false,
  coreGateOpen: false,
  secretWallBroken: false,
  arena1Cleared: false,
  arena2Cleared: false,
  escapeTriggered: false
};


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

    console.warn(
      "Could not load:",
      src
    );

  };

  image.src = src;

  return image;

}


function loadSequence(prefix, count) {

  const frames = [];

  for (
    let i = 1;
    i <= count;
    i++
  ) {

    frames.push(
      loadImage(
        `${prefix}${i}.png`
      )
    );

  }

  return frames;

}


/* =========================================================
   ART
========================================================= */

const art = {

  background:
    loadImage(
      "level1-bg.png"
    ),

  player: {

    idle:
      loadSequence(
        "player-idle-",
        4
      ),

    run:
      loadSequence(
        "player-run-",
        6
      ),

    jump:
      loadSequence(
        "player-jump-",
        4
      ),

    shoot:
      loadSequence(
        "player-shoot-",
        4
      ),

    hurt:
      loadSequence(
        "player-hurt-",
        3
      ),

    fall:
      loadSequence(
        "player-fall-",
        2
      ),

    dash:
      loadSequence(
        "player-dash-",
        3
      ),

    death:
      loadSequence(
        "player-death-",
        4
      )

  },

  sentry:
    loadSequence(
      "sentry-",
      5
    ),

  drone:
    loadSequence(
      "drone-",
      4
    ),

  guardian:
    loadSequence(
      "guardian-",
      3
    ),

  platformMid:
    loadImage(
      "platform-mid.png"
    ),

  platformLeft:
    loadImage(
      "platform-left.png"
    ),

  platformRight:
    loadImage(
      "platform-right.png"
    ),

  platformLarge:
    loadImage(
      "platform-large.png"
    ),

  booster:
    loadImage(
      "booster.png"
    ),

  checkpoint:
    loadImage(
      "checkpoint.png"
    ),

  portal:
    loadImage(
      "portal.png"
    ),

  shard:
    loadImage(
      "shard.png"
    ),

  projectile:
    loadImage(
      "projectile.png"
    ),

  enemyShot:
    loadImage(
      "enemy-shot.png"
    ),

  muzzleFlash:
    loadImage(
      "muzzle-flash.png"
    ),

  hitEffect:
    loadImage(
      "hit-effect.png"
    ),

  explosion:
    loadImage(
      "explosion.png"
    ),

  glitchParticles:
    loadImage(
      "glitch-particles.png"
    ),

  backgroundProp:
    loadImage(
      "background-prop.png"
    ),

  tallStructure:
    loadImage(
      "tall-structure.png"
    ),

  pipeSupport:
    loadImage(
      "pipe-support.png"
    ),

  crackedWall:
    loadImage(
      "cracked-wall.png"
    ),

  groundDecor:
    loadImage(
      "ground-decor.png"
    )

};


/* =========================================================
   MUSIC
========================================================= */

const music = {

  level:
    new Audio(
      "level1-music.mp3"
    ),

  boss:
    new Audio(
      "boss-music.mp3"
    ),

  complete:
    new Audio(
      "level-complete.mp3"
    )

};

music.level.loop = true;
music.boss.loop = true;

music.level.volume = 0.42;
music.boss.volume = 0.46;
music.complete.volume = 0.58;

let audioUnlocked = false;
let muted = false;
let activeTrack = null;


function unlockAudio() {

  if (audioUnlocked) {
    return;
  }

  audioUnlocked = true;

  playTrack("level");

}


function playTrack(name) {

  if (
    !audioUnlocked ||
    muted
  ) {
    return;
  }

  const next =
    music[name];

  if (
    !next ||
    activeTrack === next
  ) {
    return;
  }

  if (activeTrack) {
    activeTrack.pause();
  }

  activeTrack = next;

  activeTrack.currentTime = 0;

  activeTrack
    .play()
    .catch(() => {});

}


function stopMusic() {

  Object
    .values(music)
    .forEach(track => {

      track.pause();

      track.currentTime = 0;

    });

  activeTrack = null;

}


function playVictory() {

  stopMusic();

  if (
    !muted &&
    audioUnlocked
  ) {

    music.complete.currentTime = 0;

    music.complete
      .play()
      .catch(() => {});

  }

}


function toggleMute() {

  muted = !muted;

  if (muted) {

    stopMusic();

  }

  else if (
    bossStarted &&
    !bossDefeated
  ) {

    playTrack("boss");

  }

  else if (!complete) {

    playTrack("level");

  }

  showBanner(
    muted
      ? "AUDIO MUTED"
      : "AUDIO ON",
    0.8
  );

}


/* =========================================================
   INPUT
========================================================= */

const keys = new Set();
const pressed = new Set();

let chargeHeld = false;
let chargeTime = 0;


window.addEventListener(
  "keydown",
  e => {

    if (
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight" ||
      e.code === "ArrowUp" ||
      e.code === "Space"
    ) {

      e.preventDefault();

    }

    unlockAudio();

    if (!keys.has(e.code)) {

      pressed.add(
        e.code
      );

    }

    keys.add(
      e.code
    );


    if (
      (
        e.code === "KeyZ" ||
        e.code === "KeyX"
      )
      &&
      !chargeHeld
    ) {

      chargeHeld = true;

      chargeTime = 0;

    }

  }
);


window.addEventListener(
  "keyup",
  e => {

    if (
      (
        e.code === "KeyZ" ||
        e.code === "KeyX"
      )
      &&
      chargeHeld
    ) {

      releaseChargeShot();

      chargeHeld = false;

      chargeTime = 0;

    }

    keys.delete(
      e.code
    );

  }
);


function down(...codes) {

  return codes.some(
    code =>
      keys.has(code)
  );

}


function hit(...codes) {

  return codes.some(
    code =>
      pressed.has(code)
  );

}


/* =========================================================
   HELPERS
========================================================= */

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


function overlap(a, b) {

  return (

    a.x <
    b.x + b.w

    &&

    a.x + a.w >
    b.x

    &&

    a.y <
    b.y + b.h

    &&

    a.y + a.h >
    b.y

  );

}


function frame(
  sequence,
  speed,
  offset = 0
) {

  if (
    !sequence ||
    sequence.length === 0
  ) {

    return null;

  }

  return sequence[
    Math.floor(
      time * speed +
      offset
    )
    %
    sequence.length
  ];

}


function showBanner(
  text,
  duration = 1.2
) {

  banner = text;

  bannerTime = duration;

}


function drawSprite(
  image,
  centerX,
  bottomY,
  width,
  height,
  flip = false,
  alpha = 1
) {

  if (
    !image ||
    !image.naturalWidth
  ) {

    return false;

  }

  ctx.save();

  ctx.globalAlpha = alpha;

  ctx.translate(
    centerX,
    bottomY
  );

  if (flip) {

    ctx.scale(
      -1,
      1
    );

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
   PLATFORMS
========================================================= */

function makePlatform(
  x,
  y,
  w,
  h = 24,
  type = "static",
  extra = {}
) {

  return {

    x,
    y,
    w,
    h,

    type,

    baseX: x,
    baseY: y,

    dx: 0,
    dy: 0,

    active: true,

    axis:
      extra.axis ||
      "x",

    range:
      extra.range ||
      0,

    speed:
      extra.speed ||
      0,

    phase:
      extra.phase ||
      0,

    collapseTimer: -1,

    collapseDelay:
      extra.collapseDelay ||
      0.75,

    respawnTimer: 0,

    respawnDelay:
      extra.respawnDelay ||
      2.7

  };

}


const platforms = [

  // ENTRY

  makePlatform(
    0,
    620,
    820,
    100
  ),

  makePlatform(
    590,
    500,
    170
  ),

  makePlatform(
    820,
    430,
    150
  ),

  makePlatform(
    1020,
    620,
    470,
    100
  ),

  makePlatform(
    1160,
    500,
    170
  ),

  makePlatform(
    1380,
    420,
    155
  ),


  // BROKEN TRANSIT

  makePlatform(
    1620,
    620,
    390,
    100
  ),

  makePlatform(
    1800,
    490,
    160
  ),

  makePlatform(
    2050,
    560,
    150,
    24,
    "moving",
    {
      axis: "y",
      range: 150,
      speed: 1.2
    }
  ),

  makePlatform(
    2320,
    430,
    160,
    24,
    "moving",
    {
      axis: "x",
      range: 180,
      speed: 1
    }
  ),

  makePlatform(
    2580,
    620,
    420,
    100
  ),

  makePlatform(
    2710,
    500,
    150,
    24,
    "collapse"
  ),


  // SECURITY

  makePlatform(
    3090,
    620,
    700,
    100
  ),

  makePlatform(
    3250,
    490,
    150
  ),

  makePlatform(
    3470,
    410,
    155
  ),

  makePlatform(
    3650,
    510,
    140
  ),


  // CORE SHAFT

  makePlatform(
    3920,
    620,
    360,
    100
  ),

  makePlatform(
    4030,
    510,
    125
  ),

  makePlatform(
    4200,
    420,
    125
  ),

  makePlatform(
    4030,
    330,
    125
  ),

  makePlatform(
    4200,
    240,
    125
  ),

  makePlatform(
    4380,
    330,
    135,
    24,
    "moving",
    {
      axis: "y",
      range: 100,
      speed: 1.3
    }
  ),

  makePlatform(
    4580,
    620,
    420,
    100
  ),


  // CORRUPTED ZONE

  makePlatform(
    5100,
    620,
    480,
    100
  ),

  makePlatform(
    5260,
    500,
    140,
    24,
    "collapse",
    {
      collapseDelay: 0.65
    }
  ),

  makePlatform(
    5450,
    420,
    140,
    24,
    "collapse",
    {
      collapseDelay: 0.55
    }
  ),

  makePlatform(
    5650,
    510,
    150,
    24,
    "moving",
    {
      axis: "x",
      range: 150,
      speed: 1.4
    }
  ),

  makePlatform(
    5890,
    620,
    470,
    100
  ),


  // ESCAPE

  makePlatform(
    6460,
    620,
    330,
    100
  ),

  makePlatform(
    6830,
    540,
    135,
    24,
    "collapse",
    {
      collapseDelay: 0.5
    }
  ),

  makePlatform(
    7020,
    455,
    135,
    24,
    "collapse",
    {
      collapseDelay: 0.5
    }
  ),

  makePlatform(
    7210,
    370,
    135,
    24,
    "moving",
    {
      axis: "y",
      range: 120,
      speed: 1.7
    }
  ),

  makePlatform(
    7410,
    620,
    430,
    100
  ),


  // CORE APPROACH

  makePlatform(
    7920,
    620,
    430,
    100
  ),

  makePlatform(
    8100,
    500,
    150
  ),

  makePlatform(
    8330,
    430,
    150
  ),


  // BOSS

  makePlatform(
    8520,
    620,
    480,
    100
  )

];


const staticWalls = [

  {
    x: 3870,
    y: 260,
    w: 40,
    h: 360
  },

  {
    x: 4540,
    y: 240,
    w: 40,
    h: 380
  }

];


const boosters = [

  {
    x: 1945,
    y: 585,
    w: 90,
    h: 35,
    cool: 0
  },

  {
    x: 4250,
    y: 585,
    w: 90,
    h: 35,
    cool: 0
  },

  {
    x: 5940,
    y: 585,
    w: 90,
    h: 35,
    cool: 0
  }

];


const checkpoints = [

  {
    x: 3720,
    y: 550,
    w: 46,
    h: 70,
    active: false
  },

  {
    x: 7425,
    y: 550,
    w: 46,
    h: 70,
    active: false
  }

];


const portal = {

  x: 8870,
  y: 470,

  w: 95,
  h: 150

};


/* =========================================================
   HAZARDS
========================================================= */

function makeHazard(
  x,
  y,
  w,
  h,
  mode = "static",
  extra = {}
) {

  return {

    x,
    y,
    w,
    h,

    mode,

    period:
      extra.period ||
      2,

    activeTime:
      extra.activeTime ||
      1,

    phase:
      extra.phase ||
      0

  };

}


const hazards = [

  makeHazard(
    820,
    650,
    200,
    70
  ),

  makeHazard(
    1490,
    650,
    130,
    70
  ),

  makeHazard(
    2010,
    650,
    310,
    70
  ),

  makeHazard(
    3000,
    650,
    90,
    70
  ),

  makeHazard(
    3790,
    650,
    130,
    70
  ),

  makeHazard(
    5000,
    650,
    100,
    70
  ),

  makeHazard(
    5580,
    650,
    310,
    70,
    "pulse",
    {
      period: 2.2,
      activeTime: 1.25
    }
  ),

  makeHazard(
    6360,
    650,
    100,
    70
  ),

  makeHazard(
    6790,
    650,
    40,
    70
  ),

  makeHazard(
    6965,
    650,
    55,
    70
  ),

  makeHazard(
    7155,
    650,
    55,
    70
  ),

  makeHazard(
    7840,
    650,
    80,
    70
  )

];


/* =========================================================
   SWITCHES + GATES
========================================================= */

const switches = [

  {

    id:
      "security-switch",

    x: 3520,
    y: 365,

    w: 36,
    h: 36,

    hit: false,

    target:
      "securityGateOpen"

  },

  {

    id:
      "core-switch",

    x: 5480,
    y: 375,

    w: 36,
    h: 36,

    hit: false,

    target:
      "coreGateOpen"

  }

];


const gates = [

  {

    id:
      "security-gate",

    x: 3825,
    y: 300,

    w: 36,
    h: 320,

    openFlag:
      "securityGateOpen"

  },

  {

    id:
      "core-gate",

    x: 6300,
    y: 320,

    w: 36,
    h: 300,

    openFlag:
      "coreGateOpen"

  }

];


/* =========================================================
   SECRET WALL
========================================================= */

const breakableWalls = [

  {

    id:
      "secret-wall",

    x: 3290,
    y: 430,

    w: 55,
    h: 190,

    hp: 5,
    maxHp: 5,

    broken: false

  }

];


const shieldPickup = {

  x: 3370,
  y: 510,

  w: 36,
  h: 36,

  taken: false

};


/* =========================================================
   LASERS
========================================================= */

const lasers = [

  {

    x: 5200,
    y: 250,

    length: 260,

    angle: 0,

    speed: 1.2,

    thickness: 8,

    active: true

  },

  {

    x: 6020,
    y: 300,

    length: 260,

    angle:
      Math.PI,

    speed: -1,

    thickness: 8,

    active: true

  }

];


/* =========================================================
   COMBAT ROOMS
========================================================= */

const combatRooms = [

  {

    id:
      "arena1",

    x1: 3120,
    x2: 3770,

    entered: false,
    cleared: false,

    leftBarrier: null,

    rightBarrier: {

      x: 3775,
      y: 300,

      w: 36,
      h: 320

    },

    enemyTags: [
      "arena1-a",
      "arena1-b",
      "arena1-c"
    ]

  },

  {

    id:
      "arena2",

    x1: 5900,
    x2: 6340,

    entered: false,
    cleared: false,

    leftBarrier: {

      x: 5880,
      y: 300,

      w: 36,
      h: 320

    },

    rightBarrier: {

      x: 6345,
      y: 300,

      w: 36,
      h: 320

    },

    enemyTags: [
      "arena2-a",
      "arena2-b",
      "arena2-c"
    ]

  }

];


/* =========================================================
   SHARDS
========================================================= */

const shardLocations = [

  [660, 455],
  [880, 385],
  [1230, 455],
  [1450, 375],

  [1830, 440],
  [2110, 375],
  [2380, 360],
  [2750, 455],

  [3280, 450],
  [3510, 365],
  [3700, 460],

  [4090, 465],
  [4225, 375],
  [4100, 285],
  [4250, 195],

  [5290, 455],
  [5480, 375],
  [5715, 465],
  [6060, 455],

  [6860, 495],
  [7050, 410],
  [7245, 325],

  [8140, 455],
  [8370, 385]

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
  onPlatform: null,

  coyote: 0,
  jumpBuffer: 0,

  hp: MAX_HP,

  invincible: 0,
  hurtAnim: 0,

  shootCooldown: 0,
  shootAnim: 0,

  dashTimer: 0,
  dashCooldown: 0,
  dashDir: 1,

  wallSide: 0,
  wallSliding: false,

  shieldTime: 0,

  spawnX: 120,
  spawnY: 520

};


/* =========================================================
   ENEMIES
========================================================= */

function createEnemy(
  type,
  x,
  y,
  hp,
  variant = "normal",
  tag = ""
) {

  let w = 52;
  let h = 56;

  if (type === "drone") {

    w = 58;
    h = 40;

  }

  if (type === "guardian") {

    w = 110;
    h = 115;

  }

  return {

    type,
    variant,
    tag,

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
      0.6 +
      Math.random(),

    phase:
      Math.random() *
      10,

    flash: 0,

    bossPhase: 1

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
      2,
      "normal"
    ),

    createEnemy(
      "drone",
      2430,
      320,
      2,
      "dive"
    ),

    createEnemy(
      "sentry",
      3220,
      564,
      3,
      "burst",
      "arena1-a"
    ),

    createEnemy(
      "drone",
      3440,
      320,
      2,
      "dive",
      "arena1-b"
    ),

    createEnemy(
      "sentry",
      3640,
      564,
      4,
      "shielded",
      "arena1-c"
    ),

    createEnemy(
      "drone",
      4140,
      270,
      2
    ),

    createEnemy(
      "drone",
      4410,
      260,
      2,
      "chase"
    ),

    createEnemy(
      "sentry",
      5270,
      564,
      3,
      "burst"
    ),

    createEnemy(
      "drone",
      5710,
      340,
      2,
      "dive"
    ),

    createEnemy(
      "sentry",
      5970,
      564,
      4,
      "shielded",
      "arena2-a"
    ),

    createEnemy(
      "drone",
      6110,
      320,
      3,
      "chase",
      "arena2-b"
    ),

    createEnemy(
      "sentry",
      6250,
      564,
      3,
      "burst",
      "arena2-c"
    ),

    createEnemy(
      "drone",
      7000,
      300,
      2,
      "chase"
    ),

    createEnemy(
      "sentry",
      7580,
      564,
      4,
      "burst"
    ),

    createEnemy(
      "drone",
      8180,
      340,
      3,
      "dive"
    ),

    createEnemy(
      "guardian",
      8705,
      505,
      18,
      "boss",
      "boss"
    )

  ];

}

let enemies = [];


/* =========================================================
   EFFECTS
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


function spawnExplosion(
  x,
  y,
  size = 100
) {

  spawnEffect(
    "explosion",
    x,
    y,
    0.55,
    size
  );

  cameraShake =
    Math.max(
      cameraShake,
      9
    );

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

  Object.assign(
    player,
    {

      x: 120,
      y: 520,

      vx: 0,
      vy: 0,

      face: 1,

      grounded: false,
      onPlatform: null,

      hp: MAX_HP,

      invincible: 0,
      hurtAnim: 0,

      shootCooldown: 0,
      shootAnim: 0,

      dashTimer: 0,
      dashCooldown: 0,

      dashDir: 1,

      wallSide: 0,
      wallSliding: false,

      shieldTime: 0,

      spawnX: 120,
      spawnY: 520

    }
  );


  platforms.forEach(
    p => {

      p.x = p.baseX;
      p.y = p.baseY;

      p.dx = 0;
      p.dy = 0;

      p.active = true;

      p.collapseTimer = -1;

      p.respawnTimer = 0;

    }
  );


  checkpoints.forEach(
    c => {

      c.active = false;

    }
  );


  switches.forEach(
    s => {

      s.hit = false;

    }
  );


  breakableWalls.forEach(
    wall => {

      wall.hp =
        wall.maxHp;

      wall.broken =
        false;

    }
  );


  shieldPickup.taken =
    false;


  combatRooms.forEach(
    room => {

      room.entered = false;

      room.cleared = false;

    }
  );


  worldFlags = {

    securityGateOpen: false,

    coreGateOpen: false,

    secretWallBroken: false,

    arena1Cleared: false,

    arena2Cleared: false,

    escapeTriggered: false

  };


  shards =
    shardLocations.map(
      ([x, y], index) => ({

        x,
        y,

        w: 24,
        h: 32,

        taken: false,

        phase:
          index *
          0.8

      })
    );


  enemies =
    createEnemies();


  shots = [];
  enemyShots = [];
  effects = [];


  cameraX = 0;

  cameraShake = 0;

  cameraZoom = 1;


  bossStarted = false;

  bossDefeated = false;


  corruptionEscapeActive =
    false;

  corruptionFrontX =
    -9999;


  complete = false;

  deaths = 0;

  enemiesDefeated = 0;


  runStartedAt =
    performance.now();


  showBanner(
    "SYSTEM LINK ESTABLISHED",
    1.8
  );


  updateHUD();


  if (
    audioUnlocked &&
    !muted
  ) {

    playTrack(
      "level"
    );

  }

}

/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  healthEl.textContent =
    "❤️".repeat(
      player.hp
    )
    +
    "🖤".repeat(
      MAX_HP -
      player.hp
    );


  shardEl.textContent =
    shards
      .filter(
        s => s.taken
      )
      .length;

}


/* =========================================================
   DAMAGE
========================================================= */

function hurtPlayer(
  sourceX,
  damage = 1
) {

  if (
    player.invincible > 0 ||
    complete ||
    player.shieldTime > 0
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


  player.vy =
    -400;


  cameraShake =
    Math.max(
      cameraShake,
      6
    );


  spawnEffect(

    "hit",

    player.x +
    player.w / 2,

    player.y +
    player.h / 2,

    0.3,

    70

  );


  updateHUD();


  if (
    player.hp <= 0
  ) {

    respawn();

  }

}


function respawn() {

  deaths++;


  player.hp =
    MAX_HP;


  player.x =
    player.spawnX;


  player.y =
    player.spawnY;


  player.vx = 0;

  player.vy = 0;


  player.invincible =
    1.3;


  player.hurtAnim =
    0;


  player.shieldTime =
    0;


  enemyShots = [];


  corruptionEscapeActive =
    false;


  corruptionFrontX =
    -9999;


  showBanner(
    "CHECKPOINT RESTORED",
    1.2
  );


  updateHUD();

}


/* =========================================================
   SHOOTING
========================================================= */

function firePlayerShot(
  charge = 0
) {

  if (
    player.shootCooldown > 0 ||
    complete
  ) {

    return;

  }


  const level =

    charge >= 1
      ? 3

      : charge >= 0.45
      ? 2

      : 1;


  const muzzleX =

    player.face > 0

      ? player.x +
        player.w +
        12

      : player.x -
        12;


  const muzzleY =
    player.y +
    28;


  const size =

    level === 3
      ? 38

      : level === 2
      ? 30

      : 24;


  shots.push({

    x: muzzleX,

    y: muzzleY,

    w: size,

    h:
      size *
      0.45,

    vx:
      (
        level === 3
          ? 980
          : 850
      )
      *
      player.face,

    dir:
      player.face,

    damage:
      level,

    chargeLevel:
      level,

    life:
      1.55

  });


  spawnEffect(

    "muzzle",

    muzzleX,

    muzzleY,

    0.12,

    level === 3
      ? 70
      : 42

  );


  player.shootCooldown =

    level === 3
      ? 0.32
      : 0.18;


  player.shootAnim =
    0.24;

}


function releaseChargeShot() {

  if (complete) {
    return;
  }

  firePlayerShot(
    chargeTime
  );

}


function enemyFire(
  enemy,
  speed,
  spread = 0
) {

  const startX =
    enemy.x +
    enemy.w / 2;


  const startY =
    enemy.y +
    enemy.h / 2;


  const targetX =
    player.x +
    player.w / 2;


  const targetY =
    player.y +
    player.h / 2;


  const dx =
    targetX -
    startX;


  const dy =
    targetY -
    startY;


  const baseAngle =
    Math.atan2(
      dy,
      dx
    );


  const shotsToFire =

    spread
      ? 3
      : 1;


  for (
    let i = 0;
    i < shotsToFire;
    i++
  ) {

    const offset =

      spread

        ? (
            i - 1
          )
          *
          spread

        : 0;


    const angle =
      baseAngle +
      offset;


    enemyShots.push({

      x: startX,

      y: startY,

      w: 18,

      h: 12,

      vx:
        Math.cos(
          angle
        )
        *
        speed,

      vy:
        Math.sin(
          angle
        )
        *
        speed,

      life: 4

    });

  }

}


/* =========================================================
   PLATFORM UPDATE
========================================================= */

function updatePlatforms(dt) {

  for (
    const p
    of platforms
  ) {

    p.dx = 0;
    p.dy = 0;


    if (
      p.type ===
      "moving"
    ) {

      const oldX =
        p.x;

      const oldY =
        p.y;


      const offset =

        Math.sin(
          time *
          p.speed +
          p.phase
        )

        *

        p.range;


      if (
        p.axis ===
        "x"
      ) {

        p.x =
          p.baseX +
          offset;

      }

      else {

        p.y =
          p.baseY +
          offset;

      }


      p.dx =
        p.x -
        oldX;


      p.dy =
        p.y -
        oldY;

    }


    if (
      p.type ===
      "collapse"
    ) {

      if (!p.active) {

        p.respawnTimer -=
          dt;


        if (
          p.respawnTimer <= 0
        ) {

          p.active =
            true;


          p.collapseTimer =
            -1;

        }


        continue;

      }


      if (
        p.collapseTimer >= 0
      ) {

        p.collapseTimer +=
          dt;


        if (
          p.collapseTimer >=
          p.collapseDelay
        ) {

          p.active =
            false;


          p.respawnTimer =
            p.respawnDelay;


          if (
            player.onPlatform ===
            p
          ) {

            player.onPlatform =
              null;


            player.grounded =
              false;

          }


          cameraShake =
            Math.max(
              cameraShake,
              4
            );

        }

      }

    }

  }

}


/* =========================================================
   COLLISION
========================================================= */

function solidRects() {

  const rects = [];


  for (
    const p
    of platforms
  ) {

    if (p.active) {

      rects.push(
        p
      );

    }

  }


  rects.push(
    ...staticWalls
  );


  for (
    const gate
    of gates
  ) {

    if (
      !worldFlags[
        gate.openFlag
      ]
    ) {

      rects.push(
        gate
      );

    }

  }


  for (
    const room
    of combatRooms
  ) {

    if (
      room.entered &&
      !room.cleared
    ) {

      if (
        room.leftBarrier
      ) {

        rects.push(
          room.leftBarrier
        );

      }


      if (
        room.rightBarrier
      ) {

        rects.push(
          room.rightBarrier
        );

      }

    }

  }


  for (
    const wall
    of breakableWalls
  ) {

    if (
      !wall.broken
    ) {

      rects.push(
        wall
      );

    }

  }


  return rects;

}


function checkWallSide() {

  player.wallSide =
    0;


  const solids =
    solidRects();


  const leftProbe = {

    x:
      player.x -
      4,

    y:
      player.y +
      6,

    w: 4,

    h:
      player.h -
      12

  };


  const rightProbe = {

    x:
      player.x +
      player.w,

    y:
      player.y +
      6,

    w: 4,

    h:
      player.h -
      12

  };


  for (
    const solid
    of solids
  ) {

    if (
      overlap(
        leftProbe,
        solid
      )
    ) {

      player.wallSide =
        -1;

      break;

    }


    if (
      overlap(
        rightProbe,
        solid
      )
    ) {

      player.wallSide =
        1;

      break;

    }

  }

}


/* =========================================================
   DASH
========================================================= */

function doDash() {

  if (
    player.dashCooldown > 0 ||
    player.dashTimer > 0 ||
    complete
  ) {

    return;

  }


  player.dashDir =

    down(
      "ArrowLeft",
      "KeyA"
    )

      ? -1

      : down(
          "ArrowRight",
          "KeyD"
        )

      ? 1

      : player.face;


  player.face =
    player.dashDir;


  player.dashTimer =
    DASH_TIME;


  player.dashCooldown =
    DASH_COOLDOWN;


  player.vx =
    DASH_SPEED *
    player.dashDir;


  player.vy =
    0;


  spawnEffect(

    "dash",

    player.x +
    player.w / 2,

    player.y +
    player.h / 2,

    0.18,

    85

  );

}


/* =========================================================
   MOVEMENT
========================================================= */

function moveHorizontal(dt) {

  let desiredVX =
    player.vx;


  if (
    player.dashTimer <= 0
  ) {

    if (
      down(
        "ArrowLeft",
        "KeyA"
      )
      &&
      !down(
        "ArrowRight",
        "KeyD"
      )
    ) {

      desiredVX =
        -RUN_SPEED;


      player.face =
        -1;

    }

    else if (
      down(
        "ArrowRight",
        "KeyD"
      )
      &&
      !down(
        "ArrowLeft",
        "KeyA"
      )
    ) {

      desiredVX =
        RUN_SPEED;


      player.face =
        1;

    }

    else {

      desiredVX *=
        Math.pow(
          0.001,
          dt
        );

    }

  }


  player.vx =
    desiredVX;


  const solids =
    solidRects();


  let newX =

    player.x +
    player.vx *
    dt;


  const probe = {

    x:
      newX,

    y:
      player.y,

    w:
      player.w,

    h:
      player.h

  };


  for (
    const solid
    of solids
  ) {

    if (
      !overlap(
        probe,
        solid
      )
    ) {

      continue;

    }


    if (
      player.vx > 0
    ) {

      newX =
        solid.x -
        player.w;

    }

    else if (
      player.vx < 0
    ) {

      newX =
        solid.x +
        solid.w;

    }


    player.vx =
      0;


    player.dashTimer =
      0;


    probe.x =
      newX;

  }


  player.x =
    clamp(

      newX,

      0,

      WORLD_W -
      player.w

    );

}


function moveVertical(dt) {

  player.onPlatform =
    null;


  const oldBottom =

    player.y +
    player.h;


  if (
    player.dashTimer <= 0
  ) {

    player.vy =
      Math.min(

        1200,

        player.vy +
        GRAVITY *
        dt

      );

  }


  player.y +=
    player.vy *
    dt;


  player.grounded =
    false;


  if (
    player.vy >= 0
  ) {

    const newBottom =

      player.y +
      player.h;


    for (
      const p
      of platforms
    ) {

      if (!p.active) {
        continue;
      }


      const horizontal =

        player.x +
        player.w >
        p.x

        &&

        player.x <
        p.x +
        p.w;


      if (
        horizontal

        &&

        oldBottom <=
        p.y + 12

        &&

        newBottom >=
        p.y
      ) {

        player.y =
          p.y -
          player.h;


        player.vy =
          0;


        player.grounded =
          true;


        player.onPlatform =
          p;


        if (
          p.type ===
          "collapse"

          &&

          p.collapseTimer < 0
        ) {

          p.collapseTimer =
            0;

        }


        break;

      }

    }

  }


  if (
    player.onPlatform

    &&

    player.onPlatform.type ===
    "moving"
  ) {

    player.x +=
      player.onPlatform.dx;


    player.y +=
      player.onPlatform.dy;

  }

}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer(dt) {

  if (complete) {
    return;
  }


  if (chargeHeld) {

    chargeTime =
      Math.min(
        1.2,
        chargeTime +
        dt
      );

  }


  if (
    hit("KeyM")
  ) {

    toggleMute();

  }


  if (
    hit(
      "ShiftLeft",
      "ShiftRight",
      "KeyC"
    )
  ) {

    doDash();

  }


  player.dashCooldown =
    Math.max(
      0,
      player.dashCooldown -
      dt
    );


  player.dashTimer =
    Math.max(
      0,
      player.dashTimer -
      dt
    );


  player.shootCooldown =
    Math.max(
      0,
      player.shootCooldown -
      dt
    );


  player.shootAnim =
    Math.max(
      0,
      player.shootAnim -
      dt
    );


  player.hurtAnim =
    Math.max(
      0,
      player.hurtAnim -
      dt
    );


  player.invincible =
    Math.max(
      0,
      player.invincible -
      dt
    );


  player.shieldTime =
    Math.max(
      0,
      player.shieldTime -
      dt
    );


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
      player.jumpBuffer -
      dt
    );


  player.coyote =

    player.grounded

      ? 0.11

      : Math.max(
          0,
          player.coyote -
          dt
        );


  checkWallSide();


  player.wallSliding =

    !player.grounded

    &&

    player.wallSide !== 0

    &&

    player.vy > 0

    &&

    (
      down(
        "ArrowLeft",
        "KeyA"
      )

      ||

      down(
        "ArrowRight",
        "KeyD"
      )
    );


  if (
    player.wallSliding
  ) {

    player.vy =
      Math.min(
        player.vy,
        WALL_SLIDE_SPEED
      );

  }


  if (
    player.jumpBuffer > 0
  ) {

    if (
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

    else if (
      player.wallSide !== 0
    ) {

      player.vx =

        -player.wallSide
        *
        WALL_JUMP_X;


      player.vy =
        -WALL_JUMP_Y;


      player.face =
        -player.wallSide;


      player.jumpBuffer =
        0;


      player.wallSide =
        0;


      player.wallSliding =
        false;


      showBanner(
        "WALL REBOUND",
        0.45
      );

    }

  }


  if (
    !down(
      "ArrowUp",
      "KeyW",
      "Space"
    )
    &&
    player.vy < -250
  ) {

    player.vy +=

      GRAVITY *
      1.4 *
      dt;

  }


  moveHorizontal(dt);

  moveVertical(dt);

  updatePlayerInteractions(dt);


  if (
    player.y >
    H + 220
  ) {

    respawn();

  }

}


/* =========================================================
   PLAYER INTERACTIONS
========================================================= */

function hazardIsActive(
  hazard
) {

  if (
    hazard.mode !==
    "pulse"
  ) {

    return true;

  }


  const t =

    (
      time +
      hazard.phase
    )

    %

    hazard.period;


  return (
    t <
    hazard.activeTime
  );

}


function updatePlayerInteractions(dt) {

  for (
    const booster
    of boosters
  ) {

    booster.cool =
      Math.max(
        0,
        booster.cool -
        dt
      );


    if (
      booster.cool === 0

      &&

      overlap(
        player,
        booster
      )

      &&

      player.vy >= -100
    ) {

      player.vy =
        -1080;


      booster.cool =
        0.5;


      showBanner(
        "BOOST LINKED",
        0.65
      );

    }

  }


  for (
    const hazard
    of hazards
  ) {

    if (
      hazardIsActive(
        hazard
      )

      &&

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


  for (
    const checkpoint
    of checkpoints
  ) {

    if (
      !checkpoint.active

      &&

      overlap(
        player,
        checkpoint
      )
    ) {

      checkpoints.forEach(
        c => {

          c.active =
            false;

        }
      );


      checkpoint.active =
        true;


      player.spawnX =
        checkpoint.x +
        30;


      player.spawnY =
        checkpoint.y -
        player.h;


      showBanner(
        "CHECKPOINT SAVED",
        1.25
      );

    }

  }


  for (
    const shard
    of shards
  ) {

    if (
      !shard.taken

      &&

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

        0.45,

        78

      );


      showBanner(
        "DATA SHARD +1",
        0.55
      );


      updateHUD();

    }

  }


  if (
    !shieldPickup.taken

    &&

    overlap(
      player,
      shieldPickup
    )
  ) {

    shieldPickup.taken =
      true;


    player.shieldTime =
      8;


    showBanner(
      "PHASE SHIELD: 8 SEC",
      1.2
    );

  }


  for (
    const enemy
    of enemies
  ) {

    if (
      !enemy.alive
    ) {

      continue;

    }


    if (
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


  if (
    corruptionEscapeActive

    &&

    player.x <
    corruptionFrontX +
    50
  ) {

    respawn();

  }


  if (
    !bossStarted

    &&

    player.x > 8420
  ) {

    bossStarted =
      true;


    cameraShake =
      12;


    showBanner(
      "CORE GUARDIAN ONLINE",
      2
    );


    if (
      audioUnlocked &&
      !muted
    ) {

      playTrack(
        "boss"
      );

    }

  }


  if (
    bossDefeated

    &&

    overlap(
      player,
      portal
    )
  ) {

    finishLevel();

  }

}


/* =========================================================
   COMBAT ROOMS
========================================================= */

function updateCombatRooms() {

  for (
    const room
    of combatRooms
  ) {

    if (
      !room.entered

      &&

      player.x >
      room.x1

      &&

      player.x <
      room.x2
    ) {

      room.entered =
        true;


      showBanner(
        "SECURITY LOCKDOWN",
        1.1
      );

    }


    if (
      !room.entered ||
      room.cleared
    ) {

      continue;

    }


    const stillAlive =

      enemies.some(
        enemy =>

          enemy.alive

          &&

          room.enemyTags.includes(
            enemy.tag
          )
      );


    if (
      !stillAlive
    ) {

      room.cleared =
        true;


      if (
        room.id ===
        "arena1"
      ) {

        worldFlags.arena1Cleared =
          true;

      }

      else {

        worldFlags.arena2Cleared =
          true;

      }


      showBanner(
        "LOCKDOWN CLEARED",
        1.1
      );

    }

  }

}


/* =========================================================
   SCRIPTED EVENTS
========================================================= */

function updateScriptedEvents(dt) {

  if (
    !worldFlags.escapeTriggered

    &&

    player.x > 6520
  ) {

    worldFlags.escapeTriggered =
      true;


    corruptionEscapeActive =
      true;


    corruptionFrontX =
      player.x -
      700;


    showBanner(
      "CORRUPTION SURGE — RUN",
      2
    );

  }


  if (
    corruptionEscapeActive
  ) {

    corruptionFrontX +=
      245 *
      dt;


    if (
      player.x >
      7580
    ) {

      corruptionEscapeActive =
        false;


      corruptionFrontX =
        -9999;


      showBanner(
        "SURGE OUTRUN",
        1.1
      );

    }

  }

}


/* =========================================================
   SHOTS
========================================================= */

function updateShots(dt) {

  for (
    const shot
    of shots
  ) {

    shot.x +=
      shot.vx *
      dt;


    shot.life -=
      dt;


    for (
      const enemy
      of enemies
    ) {

      if (
        enemy.alive

        &&

        shot.life > 0

        &&

        overlap(
          shot,
          enemy
        )
      ) {

        if (
          enemy.variant ===
          "shielded"

          &&

          Math.sign(
            shot.vx
          )
          ===
          enemy.dir
        ) {

          spawnEffect(
            "hit",
            shot.x,
            shot.y,
            0.16,
            42
          );


          shot.life =
            0;


          continue;

        }


        enemy.hp -=
          shot.damage;


        enemy.flash =
          0.12;


        shot.life =
          0;


        spawnEffect(

          "hit",

          shot.x,

          shot.y,

          0.2,

          shot.chargeLevel === 3
            ? 90
            : 60

        );


        if (
          enemy.hp <= 0
        ) {

          enemy.alive =
            false;


          enemiesDefeated++;


          spawnExplosion(

            enemy.x +
            enemy.w / 2,

            enemy.y +
            enemy.h / 2,

            enemy.type ===
            "guardian"
              ? 190
              : 95

          );


          if (
            enemy.type ===
            "guardian"
          ) {

            bossDefeated =
              true;


            showBanner(
              "CORE GUARDIAN OFFLINE — EXIT ONLINE",
              2.4
            );


            if (
              audioUnlocked &&
              !muted
            ) {

              stopMusic();

            }

          }

        }

      }

    }


    for (
      const sw
      of switches
    ) {

      if (
        !sw.hit

        &&

        shot.life > 0

        &&

        overlap(
          shot,
          sw
        )
      ) {

        sw.hit =
          true;


        worldFlags[
          sw.target
        ] =
          true;


        shot.life =
          0;


        spawnEffect(
          "glitch",
          sw.x,
          sw.y,
          0.5,
          80
        );


        showBanner(
          "SYSTEM NODE HACKED",
          1.1
        );

      }

    }


    for (
      const wall
      of breakableWalls
    ) {

      if (
        !wall.broken

        &&

        shot.life > 0

        &&

        overlap(
          shot,
          wall
        )
      ) {

        wall.hp -=
          shot.damage;


        shot.life =
          0;


        cameraShake =
          Math.max(
            cameraShake,
            3
          );


        if (
          wall.hp <= 0
        ) {

          wall.broken =
            true;


          worldFlags.secretWallBroken =
            true;


          spawnExplosion(

            wall.x +
            wall.w / 2,

            wall.y +
            wall.h / 2,

            120

          );


          showBanner(
            "SECRET CACHE FOUND",
            1.2
          );

        }

      }

    }

  }


  shots =
    shots.filter(
      shot =>

        shot.life > 0

        &&

        shot.x > -100

        &&

        shot.x <
        WORLD_W +
        100
    );


  for (
    const shot
    of enemyShots
  ) {

    shot.x +=
      shot.vx *
      dt;


    shot.y +=
      shot.vy *
      dt;


    shot.life -=
      dt;


    if (
      shot.life > 0

      &&

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

  for (
    const enemy
    of enemies
  ) {

    if (
      !enemy.alive
    ) {

      continue;

    }


    enemy.flash =
      Math.max(
        0,
        enemy.flash -
        dt
      );


    enemy.shootTimer -=
      dt;


    if (
      enemy.type ===
      "guardian"
    ) {

      updateGuardian(
        enemy,
        dt
      );


      continue;

    }


    if (
      enemy.type ===
      "drone"
    ) {

      updateDrone(
        enemy,
        dt
      );

    }

    else {

      updateSentry(
        enemy,
        dt
      );

    }

  }

}

function updateDrone(
  enemy,
  dt
) {

  enemy.phase +=
    dt *
    2;


  if (
    enemy.variant ===
    "chase"
  ) {

    const dx =
      player.x -
      enemy.x;


    const dy =
      (
        player.y -
        80
      )
      -
      enemy.y;


    const distance =
      Math.hypot(
        dx,
        dy
      )
      ||
      1;


    if (
      Math.abs(dx) <
      650
    ) {

      enemy.x +=
        (
          dx /
          distance
        )
        *
        90
        *
        dt;


      enemy.y +=
        (
          dy /
          distance
        )
        *
        70
        *
        dt;

    }

  }

  else {

    enemy.x =

      enemy.homeX

      +

      Math.sin(
        enemy.phase *
        0.7
      )

      *

      90;


    enemy.y =

      enemy.homeY

      +

      Math.sin(
        enemy.phase
      )

      *

      26;

  }


  if (
    Math.abs(
      player.x -
      enemy.x
    )
    <
    620

    &&

    enemy.shootTimer <= 0
  ) {

    if (
      enemy.variant ===
      "dive"
    ) {

      enemy.x +=

        Math.sign(
          player.x -
          enemy.x
        )

        *

        42;


      enemy.y +=

        Math.sign(
          player.y -
          enemy.y
        )

        *

        28;

    }


    enemyFire(
      enemy,
      390
    );


    enemy.shootTimer =

      enemy.variant ===
      "chase"

        ? 1

        : 1.25;

  }

}


function updateSentry(
  enemy,
  dt
) {

  const range = 70;
  const speed = 55;


  enemy.x +=

    enemy.dir

    *

    speed

    *

    dt;


  if (
    enemy.x <
    enemy.homeX -
    range

    ||

    enemy.x >
    enemy.homeX +
    range
  ) {

    enemy.dir *=
      -1;

  }


  if (
    Math.abs(
      player.x -
      enemy.x
    )
    <
    540

    &&

    enemy.shootTimer <= 0
  ) {

    if (
      enemy.variant ===
      "burst"
    ) {

      enemyFire(
        enemy,
        340,
        0.11
      );


      enemy.shootTimer =
        1.8;

    }

    else {

      enemyFire(
        enemy,
        330
      );


      enemy.shootTimer =
        1.55;

    }

  }

}


function updateGuardian(
  enemy,
  dt
) {

  if (!bossStarted) {
    return;
  }


  const hpRatio =

    enemy.hp /
    enemy.maxHp;


  if (
    hpRatio >
    0.66
  ) {

    enemy.bossPhase =
      1;

  }

  else if (
    hpRatio >
    0.33
  ) {

    enemy.bossPhase =
      2;

  }

  else {

    enemy.bossPhase =
      3;

  }


  const range =

    enemy.bossPhase === 3
      ? 200
      : 125;


  const speed =

    enemy.bossPhase === 1
      ? 85

      : enemy.bossPhase === 2
      ? 115

      : 145;


  enemy.x +=

    enemy.dir

    *

    speed

    *

    dt;


  if (
    enemy.x <
    enemy.homeX -
    range

    ||

    enemy.x >
    enemy.homeX +
    range
  ) {

    enemy.dir *=
      -1;

  }


  if (
    enemy.shootTimer <= 0
  ) {

    if (
      enemy.bossPhase ===
      1
    ) {

      enemyFire(
        enemy,
        450
      );


      enemy.shootTimer =
        0.85;

    }


    if (
      enemy.bossPhase ===
      2
    ) {

      enemyFire(
        enemy,
        470,
        0.13
      );


      enemy.shootTimer =
        0.95;

    }


    if (
      enemy.bossPhase ===
      3
    ) {

      enemyFire(
        enemy,
        510,
        0.18
      );


      enemy.shootTimer =
        0.72;


      cameraShake =
        Math.max(
          cameraShake,
          4
        );

    }

  }

}


/* =========================================================
   LASERS
========================================================= */

function pointToSegmentDistance(
  px,
  py,
  x1,
  y1,
  x2,
  y2
) {

  const A =
    px -
    x1;


  const B =
    py -
    y1;


  const C =
    x2 -
    x1;


  const D =
    y2 -
    y1;


  const dot =
    A * C +
    B * D;


  const lengthSquared =
    C * C +
    D * D;


  let t =

    lengthSquared

      ? dot /
        lengthSquared

      : 0;


  t =
    clamp(
      t,
      0,
      1
    );


  const xx =
    x1 +
    t * C;


  const yy =
    y1 +
    t * D;


  return Math.hypot(

    px -
    xx,

    py -
    yy

  );

}


function updateLasers(dt) {

  const px =
    player.x +
    player.w / 2;


  const py =
    player.y +
    player.h / 2;


  for (
    const laser
    of lasers
  ) {

    if (
      !laser.active
    ) {

      continue;

    }


    laser.angle +=
      laser.speed *
      dt;


    const x2 =

      laser.x

      +

      Math.cos(
        laser.angle
      )

      *

      laser.length;


    const y2 =

      laser.y

      +

      Math.sin(
        laser.angle
      )

      *

      laser.length;


    const distance =
      pointToSegmentDistance(

        px,
        py,

        laser.x,
        laser.y,

        x2,
        y2

      );


    if (
      distance <
      laser.thickness +
      14
    ) {

      hurtPlayer(
        laser.x
      );

    }

  }

}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(dt) {

  for (
    const effect
    of effects
  ) {

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
   CAMERA
========================================================= */

function updateCamera(dt) {

  let target =
    clamp(

      player.x -
      W * 0.38,

      0,

      WORLD_W -
      W

    );


  if (
    bossStarted

    &&

    !bossDefeated

    &&

    player.x > 8300
  ) {

    target =
      clamp(
        8250,
        0,
        WORLD_W -
        W
      );

  }


  cameraX +=

    (
      target -
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


  cameraShake *=
    Math.pow(
      0.02,
      dt
    );


  const targetZoom =

    bossStarted &&
    !bossDefeated

      ? 0.985

      : 1;


  cameraZoom +=

    (
      targetZoom -
      cameraZoom
    )

    *

    0.04;

}


/* =========================================================
   LEVEL COMPLETE
========================================================= */

function finishLevel() {

  complete =
    true;


  player.vx =
    0;


  player.vy =
    0;


  playVictory();


  showBanner(
    "FRACTURED CORE STABILIZED",
    999
  );

}


function getScoreData() {

  const elapsed =

    (
      performance.now() -
      runStartedAt
    )

    /

    1000;


  const shardCount =

    shards.filter(
      shard =>
        shard.taken
    ).length;


  const shardPercentage =

    shardCount /
    shards.length;


  let score =
    100;


  score -=
    deaths *
    8;


  if (
    elapsed >
    600
  ) {

    score -=
      8;

  }


  if (
    elapsed >
    750
  ) {

    score -=
      8;

  }


  score +=

    Math.round(

      shardPercentage

      *

      20

    );


  score =
    clamp(
      score,
      0,
      120
    );


  let rank =
    "C";


  if (
    score >= 110
  ) {

    rank =
      "S";

  }

  else if (
    score >= 95
  ) {

    rank =
      "A";

  }

  else if (
    score >= 80
  ) {

    rank =
      "B";

  }


  return {

    elapsed,

    shardCount,

    score,

    rank

  };

}


/* =========================================================
   MAIN UPDATE
========================================================= */

function update(dt) {

  time +=
    dt;


  bannerTime =
    Math.max(
      0,
      bannerTime -
      dt
    );


  if (
    hit("KeyR")
  ) {

    resetGame();

  }


  updatePlatforms(dt);

  updatePlayer(dt);

  updateShots(dt);

  updateEnemies(dt);

  updateLasers(dt);

  updateCombatRooms();

  updateScriptedEvents(dt);

  updateEffects(dt);

  updateCamera(dt);


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

      image.naturalWidth

      *

      scale;


    const maxPan =

      Math.max(
        0,
        bgWidth -
        W
      );


    const worldProgress =

      cameraX

      /

      Math.max(
        1,
        WORLD_W -
        W
      );


    const pan =

      worldProgress

      *

      maxPan;


    ctx.drawImage(

      image,

      -pan,

      0,

      bgWidth,

      H

    );

  }


  const darkness =

    player.x > 5000

      ? 0.18

      : 0.10;


  ctx.fillStyle =

    `rgba(2,5,18,${darkness})`;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );

}


/* =========================================================
   PLATFORMS
========================================================= */

function drawPlatform(p) {

  if (
    !p.active
  ) {

    return;

  }


  const screenX =

    p.x -
    cameraX;


  if (
    screenX +
    p.w <
    -100

    ||

    screenX >
    W + 100
  ) {

    return;

  }


  if (
    p.type ===
    "collapse"

    &&

    p.collapseTimer >= 0
  ) {

    const flash =

      Math.sin(
        time *
        28
      )
      >
      0

        ? 0.55

        : 1;


    ctx.globalAlpha =
      flash;

  }


  if (
    p.h > 40
  ) {

    ctx.fillStyle =
      "rgba(4,9,19,0.92)";


    ctx.fillRect(

      screenX,

      p.y +
      20,

      p.w,

      p.h

    );

  }


  const visualHeight =

    p.h > 40

      ? 70

      : 54;


  const tileWidth =
    145;


  if (
    art.platformLeft.naturalWidth
  ) {

    ctx.drawImage(

      art.platformLeft,

      screenX,

      p.y -
      14,

      76,

      visualHeight

    );

  }


  let tileX =
    screenX +
    60;


  const end =

    screenX +
    p.w -
    60;


  while (
    tileX <
    end
  ) {

    const width =

      Math.min(

        tileWidth,

        end -
        tileX

      );


    if (
      art.platformMid.naturalWidth
    ) {

      ctx.drawImage(

        art.platformMid,

        tileX,

        p.y -
        14,

        width,

        visualHeight

      );

    }


    tileX +=
      tileWidth;

  }


  if (
    art.platformRight.naturalWidth
  ) {

    ctx.drawImage(

      art.platformRight,

      screenX +
      p.w -
      76,

      p.y -
      14,

      76,

      visualHeight

    );

  }


  ctx.globalAlpha =
    1;

}


/* =========================================================
   HAZARDS
========================================================= */

function drawHazards() {

  for (
    const hazard
    of hazards
  ) {

    const x =

      hazard.x -
      cameraX;


    if (
      !hazardIsActive(
        hazard
      )
    ) {

      ctx.globalAlpha =
        0.18;

    }


    const pulse =

      0.65

      +

      Math.sin(
        time *
        6
      )

      *

      0.15;


    const gradient =

      ctx.createLinearGradient(

        0,

        hazard.y -
        25,

        0,

        hazard.y +
        hazard.h

      );


    gradient.addColorStop(

      0,

      `rgba(235,65,255,${
        0.42 +
        pulse *
        0.15
      })`

    );


    gradient.addColorStop(

      0.35,

      "rgba(139,20,190,0.38)"

    );


    gradient.addColorStop(

      1,

      "rgba(23,5,42,0)"

    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(

      x,

      hazard.y -
      28,

      hazard.w,

      hazard.h +
      28

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


    ctx.globalAlpha =
      1;

  }

}


/* =========================================================
   BOOSTERS
========================================================= */

function drawBoosters() {

  for (
    const booster
    of boosters
  ) {

    const x =

      booster.x -
      cameraX;


    const pulse =

      1

      +

      Math.sin(
        time *
        8
      )

      *

      0.06;


    drawSprite(

      art.booster,

      x +
      booster.w / 2,

      booster.y +
      booster.h,

      110 *
      pulse,

      60 *
      pulse

    );

  }

}


/* =========================================================
   CHECKPOINTS
========================================================= */

function drawCheckpoints() {

  for (
    const checkpoint
    of checkpoints
  ) {

    const x =

      checkpoint.x -
      cameraX;


    drawSprite(

      art.checkpoint,

      x +
      checkpoint.w / 2,

      checkpoint.y +
      checkpoint.h,

      78,

      110,

      false,

      checkpoint.active
        ? 1
        : 0.58

    );

  }

}


/* =========================================================
   SHARDS
========================================================= */

function drawShards() {

  for (
    const shard
    of shards
  ) {

    if (
      shard.taken
    ) {

      continue;

    }


    const x =

      shard.x -
      cameraX;


    const y =

      shard.y

      +

      Math.sin(
        time *
        3 +
        shard.phase
      )

      *

      7;


    const pulse =

      1

      +

      Math.sin(
        time *
        5 +
        shard.phase
      )

      *

      0.08;


    drawSprite(

      art.shard,

      x +
      12,

      y +
      30,

      38 *
      pulse,

      52 *
      pulse

    );

  }

}


/* =========================================================
   SWITCHES
========================================================= */

function drawSwitches() {

  for (
    const sw
    of switches
  ) {

    const x =

      sw.x -
      cameraX;


    ctx.save();


    ctx.shadowBlur =
      18;


    ctx.shadowColor =

      sw.hit
        ? "#55ffe0"
        : "#da48ff";


    ctx.fillStyle =

      sw.hit
        ? "#55ffe0"
        : "#da48ff";


    ctx.fillRect(

      x,

      sw.y,

      sw.w,

      sw.h

    );


    ctx.fillStyle =
      "#09101d";


    ctx.fillRect(

      x + 9,

      sw.y + 9,

      sw.w - 18,

      sw.h - 18

    );


    ctx.restore();

  }

}


/* =========================================================
   GATES
========================================================= */

function drawGates() {

  for (
    const gate
    of gates
  ) {

    if (
      worldFlags[
        gate.openFlag
      ]
    ) {

      continue;

    }


    const x =

      gate.x -
      cameraX;


    ctx.save();


    ctx.shadowBlur =
      16;


    ctx.shadowColor =
      "#49eaff";


    ctx.strokeStyle =
      "#49eaff";


    ctx.lineWidth =
      5;


    for (
      let y = gate.y;
      y < gate.y + gate.h;
      y += 26
    ) {

      ctx.beginPath();


      ctx.moveTo(
        x,
        y
      );


      ctx.lineTo(
        x +
        gate.w,
        y +
        14
      );


      ctx.stroke();

    }


    ctx.restore();

  }


  for (
    const room
    of combatRooms
  ) {

    if (
      !(
        room.entered &&
        !room.cleared
      )
    ) {

      continue;

    }


    const barriers =

      [
        room.leftBarrier,
        room.rightBarrier
      ]

      .filter(
        Boolean
      );


    for (
      const barrier
      of barriers
    ) {

      const x =

        barrier.x -
        cameraX;


      ctx.save();


      ctx.shadowBlur =
        18;


      ctx.shadowColor =
        "#ff4be3";


      ctx.fillStyle =
        "rgba(255,55,220,.22)";


      ctx.fillRect(

        x,

        barrier.y,

        barrier.w,

        barrier.h

      );


      ctx.strokeStyle =
        "#ff4be3";


      ctx.lineWidth =
        4;


      ctx.strokeRect(

        x,

        barrier.y,

        barrier.w,

        barrier.h

      );


      ctx.restore();

    }

  }

}


/* =========================================================
   BREAKABLE WALL
========================================================= */

function drawBreakables() {

  for (
    const wall
    of breakableWalls
  ) {

    if (
      wall.broken
    ) {

      continue;

    }


    const x =

      wall.x -
      cameraX;


    drawSprite(

      art.crackedWall,

      x +
      wall.w / 2,

      wall.y +
      wall.h,

      95,

      220

    );


    const ratio =

      wall.hp /
      wall.maxHp;


    ctx.fillStyle =
      "#1a0c20";


    ctx.fillRect(

      x -
      10,

      wall.y -
      15,

      75,

      6

    );


    ctx.fillStyle =
      "#d84cff";


    ctx.fillRect(

      x -
      10,

      wall.y -
      15,

      75 *
      ratio,

      6

    );

  }

}


/* =========================================================
   SHIELD PICKUP
========================================================= */

function drawShieldPickup() {

  if (
    shieldPickup.taken
  ) {

    return;

  }


  const x =

    shieldPickup.x -
    cameraX;


  const pulse =

    1

    +

    Math.sin(
      time *
      5
    )

    *

    0.08;


  ctx.save();


  ctx.shadowBlur =
    20;


  ctx.shadowColor =
    "#62f5ff";


  ctx.strokeStyle =
    "#62f5ff";


  ctx.lineWidth =
    4;


  ctx.beginPath();


  ctx.arc(

    x + 18,

    shieldPickup.y +
    18,

    17 *
    pulse,

    0,

    Math.PI *
    2

  );


  ctx.stroke();

  ctx.restore();

}


/* =========================================================
   LASER DRAW
========================================================= */

function drawLasers() {

  for (
    const laser
    of lasers
  ) {

    const x1 =

      laser.x -
      cameraX;


    const y1 =
      laser.y;


    const x2 =

      x1

      +

      Math.cos(
        laser.angle
      )

      *

      laser.length;


    const y2 =

      y1

      +

      Math.sin(
        laser.angle
      )

      *

      laser.length;


    ctx.save();


    ctx.shadowBlur =
      20;


    ctx.shadowColor =
      "#ff4c91";


    ctx.strokeStyle =
      "#ff4c91";


    ctx.lineWidth =
      laser.thickness;


    ctx.beginPath();


    ctx.moveTo(
      x1,
      y1
    );


    ctx.lineTo(
      x2,
      y2
    );


    ctx.stroke();

    ctx.restore();

  }

}


/* =========================================================
   CORRUPTION CHASE
========================================================= */

function drawCorruptionFront() {

  if (
    !corruptionEscapeActive
  ) {

    return;

  }


  const x =

    corruptionFrontX -
    cameraX;


  const gradient =

    ctx.createLinearGradient(

      x - 180,
      0,

      x + 50,
      0

    );


  gradient.addColorStop(

    0,

    "rgba(50,0,90,0)"

  );


  gradient.addColorStop(

    0.55,

    "rgba(155,20,220,.42)"

  );


  gradient.addColorStop(

    1,

    "rgba(240,40,255,.78)"

  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(

    x -
    180,

    0,

    230,

    H

  );


  ctx.fillStyle =
    "rgba(255,80,255,.65)";


  for (
    let y = 0;
    y < H;
    y += 45
  ) {

    ctx.fillRect(

      x -
      8

      +

      Math.sin(
        time *
        8 +
        y
      )

      *

      10,

      y,

      16,

      22

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

    bossDefeated

      ? 1 +
        Math.sin(
          time *
          5
        )
        *
        0.05

      : 1;


  drawSprite(

    art.portal,

    x +
    portal.w / 2,

    portal.y +
    portal.h,

    150 *
    pulse,

    180 *
    pulse,

    false,

    bossDefeated
      ? 1
      : 0.4

  );


  ctx.font =
    "bold 14px Arial";


  ctx.textAlign =
    "center";


  ctx.fillStyle =

    bossDefeated

      ? "#7cf7ff"

      : "#9c8ca8";


  ctx.fillText(

    bossDefeated

      ? "EXIT ONLINE"

      : "PORTAL LOCKED",

    x +
    portal.w / 2,

    portal.y -
    18

  );

}

/* =========================================================
   PLAYER SPRITES
========================================================= */

function getPlayerSprite() {

  if (
    player.hurtAnim > 0
  ) {

    const progress =

      1

      -

      player.hurtAnim /
      0.45;


    const index =

      Math.min(

        art.player.hurt.length -
        1,

        Math.floor(

          progress

          *

          art.player.hurt.length

        )

      );


    return art.player.hurt[
      index
    ];

  }


  if (
    player.dashTimer > 0
  ) {

    return frame(
      art.player.dash,
      14
    );

  }


  if (
    player.shootAnim > 0
  ) {

    const progress =

      1

      -

      player.shootAnim /
      0.24;


    const index =

      Math.min(

        art.player.shoot.length -
        1,

        Math.floor(

          progress

          *

          art.player.shoot.length

        )

      );


    return art.player.shoot[
      index
    ];

  }


  if (
    !player.grounded
  ) {

    if (
      player.wallSliding
    ) {

      return frame(
        art.player.fall,
        5
      );

    }


    if (
      player.vy > 120
    ) {

      return frame(
        art.player.fall,
        6
      );

    }


    let index =
      0;


    if (
      player.vy < -450
    ) {

      index =
        0;

    }

    else if (
      player.vy < -150
    ) {

      index =
        1;

    }

    else if (
      player.vy < 100
    ) {

      index =
        2;

    }

    else {

      index =
        3;

    }


    return (

      art.player.jump[
        index
      ]

      ||

      art.player.jump[
        0
      ]

    );

  }


  if (
    Math.abs(
      player.vx
    )
    >
    60
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


  let alpha =
    1;


  if (
    player.invincible > 0

    &&

    Math.floor(
      player.invincible *
      14
    )
    %
    2
    ===
    0
  ) {

    alpha =
      0.45;

  }


  drawSprite(

    sprite,

    screenX +
    player.w / 2,

    player.y +
    player.h +
    5,

    138,

    112,

    player.face < 0,

    alpha

  );


  if (
    player.shieldTime > 0
  ) {

    ctx.save();


    ctx.shadowBlur =
      18;


    ctx.shadowColor =
      "#61f5ff";


    ctx.strokeStyle =
      "rgba(97,245,255,.85)";


    ctx.lineWidth =
      3;


    ctx.beginPath();


    ctx.ellipse(

      screenX +
      player.w / 2,

      player.y +
      player.h / 2,

      38,

      48,

      0,

      0,

      Math.PI *
      2

    );


    ctx.stroke();

    ctx.restore();

  }


  if (
    chargeHeld

    &&

    chargeTime > 0.12
  ) {

    const percentage =

      clamp(
        chargeTime /
        1,
        0,
        1
      );


    ctx.save();


    ctx.shadowBlur =
      14;


    ctx.shadowColor =
      "#58f6ff";


    ctx.fillStyle =

      `rgba(88,246,255,${
        0.35 +
        percentage *
        0.55
      })`;


    ctx.beginPath();


    ctx.arc(

      screenX

      +

      (
        player.face > 0
          ? 70
          : -25
      ),

      player.y +
      28,

      8

      +

      percentage *
      12,

      0,

      Math.PI *
      2

    );


    ctx.fill();

    ctx.restore();

  }

}


/* =========================================================
   ENEMY DRAW
========================================================= */

function drawEnemies() {

  for (
    const enemy
    of enemies
  ) {

    if (
      !enemy.alive
    ) {

      continue;

    }


    const screenX =

      enemy.x -
      cameraX;


    if (
      screenX < -220

      ||

      screenX >
      W + 220
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
        210;


      height =
        180;

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


    if (
      enemy.variant ===
      "shielded"
    ) {

      ctx.save();


      ctx.strokeStyle =
        "rgba(98,245,255,.85)";


      ctx.lineWidth =
        3;


      ctx.beginPath();


      ctx.arc(

        screenX +
        enemy.w / 2,

        enemy.y +
        enemy.h / 2,

        42,

        enemy.dir > 0

          ? -Math.PI / 2

          : Math.PI / 2,

        enemy.dir > 0

          ? Math.PI / 2

          : Math.PI * 1.5

      );


      ctx.stroke();

      ctx.restore();

    }


    if (
      enemy.type ===
      "guardian"
    ) {

      const barWidth =
        180;


      const barX =

        screenX

        +

        enemy.w / 2

        -

        barWidth / 2;


      ctx.fillStyle =
        "#260b1d";


      ctx.fillRect(

        barX,

        enemy.y -
        40,

        barWidth,

        11

      );


      ctx.fillStyle =
        "#ff4bd8";


      ctx.fillRect(

        barX,

        enemy.y -
        40,

        barWidth

        *

        (
          enemy.hp /
          enemy.maxHp
        ),

        11

      );


      ctx.strokeStyle =
        "#ffffff55";


      ctx.strokeRect(

        barX,

        enemy.y -
        40,

        barWidth,

        11

      );


      ctx.fillStyle =
        "#ffffff";


      ctx.font =
        "bold 13px Arial";


      ctx.textAlign =
        "center";


      ctx.fillText(

        `CORE GUARDIAN — PHASE ${enemy.bossPhase}`,

        screenX +
        enemy.w / 2,

        enemy.y -
        50

      );

    }

  }

}


/* =========================================================
   PROJECTILES
========================================================= */

function drawProjectiles() {

  for (
    const shot
    of shots
  ) {

    const x =

      shot.x -
      cameraX;


    const size =

      shot.chargeLevel ===
      3

        ? 64

        : shot.chargeLevel ===
          2

        ? 52

        : 44;


    drawSprite(

      art.projectile,

      x,

      shot.y +
      8,

      size,

      size *
      0.45,

      shot.dir < 0

    );

  }


  for (
    const shot
    of enemyShots
  ) {

    const x =

      shot.x -
      cameraX;


    drawSprite(

      art.enemyShot,

      x,

      shot.y +
      8,

      34,

      22

    );

  }

}


/* =========================================================
   EFFECT DRAW
========================================================= */

function drawEffects() {

  for (
    const effect
    of effects
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


    if (
      effect.type ===
      "dash"
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

  for (
    const platform
    of platforms
  ) {

    drawPlatform(
      platform
    );

  }


  drawHazards();

  drawBoosters();

  drawCheckpoints();

  drawShards();

  drawSwitches();

  drawGates();

  drawBreakables();

  drawShieldPickup();

  drawLasers();

  drawPortal();

  drawCorruptionFront();

}


/* =========================================================
   OVERLAY
========================================================= */

function drawOverlay() {

  ctx.save();


  ctx.fillStyle =
    "rgba(3,7,18,.72)";


  ctx.fillRect(
    16,
    16,
    270,
    78
  );


  ctx.fillStyle =
    "#a7dfe8";


  ctx.font =
    "13px Arial";


  ctx.textAlign =
    "left";


  ctx.fillText(
    "SHIFT / C  Dash",
    30,
    42
  );


  ctx.fillText(
    "Hold Z / X  Charge shot",
    30,
    62
  );


  ctx.fillText(
    "M  Mute",
    30,
    82
  );


  ctx.restore();


  if (
    bannerTime > 0
  ) {

    ctx.fillStyle =
      "rgba(3,7,20,.78)";


    ctx.fillRect(

      W / 2 -
      290,

      42,

      580,

      58

    );


    ctx.strokeStyle =
      "rgba(69,234,255,.55)";


    ctx.strokeRect(

      W / 2 -
      290,

      42,

      580,

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


  if (
    complete
  ) {

    const score =
      getScoreData();


    ctx.fillStyle =
      "rgba(2,5,16,.84)";


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

      220

    );


    ctx.fillStyle =
      "#ffffff";


    ctx.font =
      "bold 82px Arial";


    ctx.fillText(

      score.rank,

      W / 2,

      320

    );


    ctx.font =
      "21px Arial";


    ctx.fillText(

      `DATA SHARDS: ${score.shardCount} / ${shards.length}`,

      W / 2,

      370

    );


    ctx.fillText(

      `ENEMIES DEFEATED: ${enemiesDefeated}`,

      W / 2,

      404

    );


    ctx.fillText(

      `DEATHS: ${deaths}`,

      W / 2,

      438

    );


    ctx.fillText(

      `TIME: ${
        Math.floor(
          score.elapsed /
          60
        )
      }:${
        String(
          Math.floor(
            score.elapsed %
            60
          )
        )
        .padStart(
          2,
          "0"
        )
      }`,

      W / 2,

      472

    );


    ctx.fillStyle =
      "#b9a9d0";


    ctx.font =
      "17px Arial";


    ctx.fillText(

      "Press R to replay",

      W / 2,

      530

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


  const percentage =

    Math.floor(

      loadedAssets

      /

      totalAssets

      *

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

    `Loading system assets... ${percentage}%`,

    W / 2,

    350

  );


  ctx.fillStyle =
    "#111a31";


  ctx.fillRect(

    W / 2 -
    200,

    380,

    400,

    12

  );


  ctx.fillStyle =
    "#3cecff";


  ctx.fillRect(

    W / 2 -
    200,

    380,

    400

    *

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

  ctx.save();


  const shakeX =

    cameraShake > 0

      ? (
          Math.random() -
          0.5
        )
        *
        cameraShake

      : 0;


  const shakeY =

    cameraShake > 0

      ? (
          Math.random() -
          0.5
        )
        *
        cameraShake

      : 0;


  ctx.translate(

    W / 2 +
    shakeX,

    H / 2 +
    shakeY

  );


  ctx.scale(

    cameraZoom,

    cameraZoom

  );


  ctx.translate(

    -W / 2,

    -H / 2

  );


  drawBackground();

  drawWorld();

  drawEnemies();

  drawProjectiles();

  drawPlayer();

  drawEffects();


  ctx.restore();


  drawOverlay();

}


/* =========================================================
   LOOP
========================================================= */

let last =
  performance.now();


function loop(now) {

  const dt =

    Math.min(

      (
        now -
        last
      )

      /

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
