/* =========================================================
   DRAWING
========================================================= */
function drawBackground() {
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, W, H);

  const image = art.background;
  if (image && image.naturalWidth) {
    const scale = H / image.naturalHeight;
    const bgWidth = image.naturalWidth * scale;
    const maxPan = Math.max(0, bgWidth - W);
    const worldProgress = cameraX / Math.max(1, WORLD_W - W);
    const pan = worldProgress * maxPan;
    ctx.drawImage(image, -pan, 0, bgWidth, H);
  }

  const darkness = player.x > 5000 ? 0.18 : 0.10;
  ctx.fillStyle = `rgba(2,5,18,${darkness})`;
  ctx.fillRect(0, 0, W, H);
}

function drawPlatform(p) {
  if (!p.active) return;
  const screenX = p.x - cameraX;
  if (screenX + p.w < -100 || screenX > W + 100) return;

  if (p.type === "collapse" && p.collapseTimer >= 0) {
    ctx.globalAlpha = Math.sin(time * 28) > 0 ? 0.55 : 1;
  }

  if (p.h > 40) {
    ctx.fillStyle = "rgba(4,9,19,0.92)";
    ctx.fillRect(screenX, p.y + 20, p.w, p.h);
  }

  const visualHeight = p.h > 40 ? 70 : 54;
  const tileWidth = 145;

  if (art.platformLeft.naturalWidth) ctx.drawImage(art.platformLeft, screenX, p.y - 14, 76, visualHeight);

  let tileX = screenX + 60;
  const end = screenX + p.w - 60;
  while (tileX < end) {
    const width = Math.min(tileWidth, end - tileX);
    if (art.platformMid.naturalWidth) ctx.drawImage(art.platformMid, tileX, p.y - 14, width, visualHeight);
    tileX += tileWidth;
  }

  if (art.platformRight.naturalWidth) ctx.drawImage(art.platformRight, screenX + p.w - 76, p.y - 14, 76, visualHeight);
  ctx.globalAlpha = 1;
}

function drawHazards() {
  for (const hazard of hazards) {
    const x = hazard.x - cameraX;
    if (!hazardIsActive(hazard)) ctx.globalAlpha = 0.18;

    const pulse = 0.65 + Math.sin(time * 6) * 0.15;
    const gradient = ctx.createLinearGradient(0, hazard.y - 25, 0, hazard.y + hazard.h);
    gradient.addColorStop(0, `rgba(235,65,255,${0.42 + pulse * 0.15})`);
    gradient.addColorStop(0.35, "rgba(139,20,190,0.38)");
    gradient.addColorStop(1, "rgba(23,5,42,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, hazard.y - 28, hazard.w, hazard.h + 28);

    ctx.fillStyle = "#d63cff";
    for (let i = 0; i < hazard.w; i += 24) {
      ctx.beginPath();
      ctx.moveTo(x + i, hazard.y);
      ctx.lineTo(x + i + 12, hazard.y - 30);
      ctx.lineTo(x + i + 24, hazard.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawBoosters() {
  for (const booster of boosters) {
    const x = booster.x - cameraX;
    const pulse = 1 + Math.sin(time * 8) * 0.06;
    drawSprite(art.booster, x + booster.w / 2, booster.y + booster.h, 110 * pulse, 60 * pulse);
  }
}

function drawCheckpoints() {
  for (const checkpoint of checkpoints) {
    const x = checkpoint.x - cameraX;
    drawSprite(art.checkpoint, x + checkpoint.w / 2, checkpoint.y + checkpoint.h, 78, 110, false, checkpoint.active ? 1 : 0.58);
  }
}

function drawShards() {
  for (const shard of shards) {
    if (shard.taken) continue;
    const x = shard.x - cameraX;
    const y = shard.y + Math.sin(time * 3 + shard.phase) * 7;
    const pulse = 1 + Math.sin(time * 5 + shard.phase) * 0.08;
    drawSprite(art.shard, x + 12, y + 30, 38 * pulse, 52 * pulse);
  }
}

function drawSwitches() {
  for (const sw of switches) {
    const x = sw.x - cameraX;
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = sw.hit ? "#55ffe0" : "#da48ff";
    ctx.fillStyle = sw.hit ? "#55ffe0" : "#da48ff";
    ctx.fillRect(x, sw.y, sw.w, sw.h);
    ctx.fillStyle = "#09101d";
    ctx.fillRect(x + 9, sw.y + 9, sw.w - 18, sw.h - 18);
    ctx.restore();
  }
}

function drawGates() {
  for (const gate of gates) {
    if (worldFlags[gate.openFlag]) continue;
    const x = gate.x - cameraX;

    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#49eaff";
    ctx.strokeStyle = "#49eaff";
    ctx.lineWidth = 5;

    for (let y = gate.y; y < gate.y + gate.h; y += 26) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + gate.w, y + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const room of combatRooms) {
    if (!(room.entered && !room.cleared)) continue;
    const barriers = [room.leftBarrier, room.rightBarrier].filter(Boolean);

    for (const barrier of barriers) {
      const x = barrier.x - cameraX;
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ff4be3";
      ctx.fillStyle = "rgba(255,55,220,.22)";
      ctx.fillRect(x, barrier.y, barrier.w, barrier.h);
      ctx.strokeStyle = "#ff4be3";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, barrier.y, barrier.w, barrier.h);
      ctx.restore();
    }
  }
}

function drawBreakables() {
  for (const wall of breakableWalls) {
    if (wall.broken) continue;
    const x = wall.x - cameraX;

    drawSprite(art.crackedWall, x + wall.w / 2, wall.y + wall.h, 95, 220);

    const hpRatio = wall.hp / wall.maxHp;
    ctx.fillStyle = "#1a0c20";
    ctx.fillRect(x - 10, wall.y - 15, 75, 6);
    ctx.fillStyle = "#d84cff";
    ctx.fillRect(x - 10, wall.y - 15, 75 * hpRatio, 6);
  }
}

function drawShieldPickup() {
  if (shieldPickup.taken) return;
  const x = shieldPickup.x - cameraX;
  const pulse = 1 + Math.sin(time * 5) * 0.08;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#62f5ff";
  ctx.strokeStyle = "#62f5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + 18, shieldPickup.y + 18, 17 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLasers() {
  for (const laser of lasers) {
    const x1 = laser.x - cameraX;
    const y1 = laser.y;
    const x2 = x1 + Math.cos(laser.angle) * laser.length;
    const y2 = y1 + Math.sin(laser.angle) * laser.length;

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff4c91";
    ctx.strokeStyle = "#ff4c91";
    ctx.lineWidth = laser.thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCorruptionFront() {
  if (!corruptionEscapeActive) return;
  const x = corruptionFrontX - cameraX;
  const gradient = ctx.createLinearGradient(x - 180, 0, x + 50, 0);

  gradient.addColorStop(0, "rgba(50,0,90,0)");
  gradient.addColorStop(0.55, "rgba(155,20,220,.42)");
  gradient.addColorStop(1, "rgba(240,40,255,.78)");

  ctx.fillStyle = gradient;
  ctx.fillRect(x - 180, 0, 230, H);

  ctx.fillStyle = "rgba(255,80,255,.65)";
  for (let y = 0; y < H; y += 45) {
    ctx.fillRect(x - 8 + Math.sin(time * 8 + y) * 10, y, 16, 22);
  }
}

function drawPortal() {
  const x = portal.x - cameraX;
  const pulse = bossDefeated ? 1 + Math.sin(time * 5) * 0.05 : 1;

  drawSprite(art.portal, x + portal.w / 2, portal.y + portal.h, 150 * pulse, 180 * pulse, false, bossDefeated ? 1 : 0.4);

  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = bossDefeated ? "#7cf7ff" : "#9c8ca8";
  ctx.fillText(bossDefeated ? "EXIT ONLINE" : "PORTAL LOCKED", x + portal.w / 2, portal.y - 18);
}

function getPlayerSprite() {
  if (player.hurtAnim > 0) {
    const progress = 1 - player.hurtAnim / 0.45;
    const index = Math.min(art.player.hurt.length - 1, Math.floor(progress * art.player.hurt.length));
    return art.player.hurt[index];
  }

  if (player.dashTimer > 0) return frame(art.player.dash, 14);

  if (player.shootAnim > 0) {
    const progress = 1 - player.shootAnim / 0.24;
    const index = Math.min(art.player.shoot.length - 1, Math.floor(progress * art.player.shoot.length));
    return art.player.shoot[index];
  }

  if (!player.grounded) {
    if (player.wallSliding) return frame(art.player.fall, 5);
    if (player.vy > 120) return frame(art.player.fall, 6);

    let index = 0;
    if (player.vy < -450) index = 0;
    else if (player.vy < -150) index = 1;
    else if (player.vy < 100) index = 2;
    else index = 3;

    return art.player.jump[index] || art.player.jump[0];
  }

  if (Math.abs(player.vx) > 60) return frame(art.player.run, 10);
  return frame(art.player.idle, 4);
}

function drawPlayer() {
  const screenX = player.x - cameraX;
  const sprite = getPlayerSprite();

  let alpha = 1;
  if (player.invincible > 0 && Math.floor(player.invincible * 14) % 2 === 0) alpha = 0.45;

  drawSprite(sprite, screenX + player.w / 2, player.y + player.h + 5, 138, 112, player.face < 0, alpha);

  if (player.shieldTime > 0) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#61f5ff";
    ctx.strokeStyle = "rgba(97,245,255,.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(screenX + player.w / 2, player.y + player.h / 2, 38, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (chargeHeld && chargeTime > 0.12) {
    const pct = clamp(chargeTime / 1.0, 0, 1);
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#58f6ff";
    ctx.fillStyle = `rgba(88,246,255,${0.35 + pct * 0.55})`;
    ctx.beginPath();
    ctx.arc(screenX + (player.face > 0 ? 70 : -25), player.y + 28, 8 + pct * 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const screenX = enemy.x - cameraX;
    if (screenX < -220 || screenX > W + 220) continue;

    let sprite, width, height;
    if (enemy.type === "sentry") {
      sprite = frame(art.sentry, 5, enemy.phase);
      width = 100;
      height = 100;
    } else if (enemy.type === "drone") {
      sprite = frame(art.drone, 7, enemy.phase);
      width = 108;
      height = 76;
    } else {
      sprite = frame(art.guardian, 4);
      width = 210;
      height = 180;
    }

    const alpha = enemy.flash > 0 ? 0.55 : 1;
    drawSprite(sprite, screenX + enemy.w / 2, enemy.y + enemy.h, width, height, enemy.dir > 0, alpha);

    if (enemy.variant === "shielded") {
      ctx.save();
      ctx.strokeStyle = "rgba(98,245,255,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        screenX + enemy.w / 2,
        enemy.y + enemy.h / 2,
        42,
        enemy.dir > 0 ? -Math.PI / 2 : Math.PI / 2,
        enemy.dir > 0 ? Math.PI / 2 : Math.PI * 1.5
      );
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.type === "guardian") {
      const barWidth = 180;
      const barX = screenX + enemy.w / 2 - barWidth / 2;

      ctx.fillStyle = "#260b1d";
      ctx.fillRect(barX, enemy.y - 40, barWidth, 11);
      ctx.fillStyle = "#ff4bd8";
      ctx.fillRect(barX, enemy.y - 40, barWidth * (enemy.hp / enemy.maxHp), 11);
      ctx.strokeStyle = "#ffffff55";
      ctx.strokeRect(barX, enemy.y - 40, barWidth, 11);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`CORE GUARDIAN — PHASE ${enemy.bossPhase}`, screenX + enemy.w / 2, enemy.y - 50);
    }
  }
}

function drawProjectiles() {
  for (const shot of shots) {
    const x = shot.x - cameraX;
    const size = shot.chargeLevel === 3 ? 64 : shot.chargeLevel === 2 ? 52 : 44;
    drawSprite(art.projectile, x, shot.y + 8, size, size * 0.45, shot.dir < 0);
  }

  for (const shot of enemyShots) {
    const x = shot.x - cameraX;
    drawSprite(art.enemyShot, x, shot.y + 8, 34, 22);
  }
}

function drawEffects() {
  for (const effect of effects) {
    const x = effect.x - cameraX;
    const progress = effect.life / effect.maxLife;

    let image = art.hitEffect;
    if (effect.type === "muzzle") image = art.muzzleFlash;
    if (effect.type === "explosion") image = art.explosion;
    if (effect.type === "glitch") image = art.glitchParticles;
    if (effect.type === "dash") image = art.glitchParticles;

    drawSprite(image, x, effect.y + effect.size / 2, effect.size, effect.size, false, progress);
  }
}

function drawWorld() {
  for (const p of platforms) drawPlatform(p);
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

function drawMenu() {
  ctx.fillStyle = "rgba(2,5,16,.72)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#68f5ff";
  ctx.font = "bold 48px Arial";
  ctx.fillText("FRACTURED CORE", W / 2, 150);

  ctx.fillStyle = "#d8e7ff";
  ctx.font = "20px Arial";
  ctx.fillText("Select Difficulty", W / 2, 205);

  const rows = [
    ["1", "PRACTICE", "Unlimited health"],
    ["2", "EASY", "8 hearts"],
    ["3", "MEDIUM", "5 hearts"],
    ["4", "HARD", "3 hearts"]
  ];

  rows.forEach((row, i) => {
    const y = 280 + i * 80;
    ctx.fillStyle = "rgba(4,10,28,.8)";
    ctx.fillRect(W / 2 - 260, y - 34, 520, 56);
    ctx.strokeStyle = "#36e8ff66";
    ctx.strokeRect(W / 2 - 260, y - 34, 520, 56);

    ctx.fillStyle = "#7ff8ff";
    ctx.font = "bold 26px Arial";
    ctx.fillText(`${row[0]}  ${row[1]}`, W / 2, y - 2);

    ctx.fillStyle = "#cfd8f6";
    ctx.font = "16px Arial";
    ctx.fillText(row[2], W / 2, y + 20);
  });

  ctx.fillStyle = "#a7dfe8";
  ctx.font = "15px Arial";
  ctx.fillText("Press 1, 2, 3, or 4 to start", W / 2, 630);
  ctx.fillText("Press M to mute/unmute audio", W / 2, 655);
}

function drawOverlay() {
  if (gameState === "menu") {
    drawMenu();
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(3,7,18,.72)";
  ctx.fillRect(16, 16, 290, 96);
  ctx.fillStyle = "#a7dfe8";
  ctx.font = "13px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SHIFT / C  Dash", 30, 42);
  ctx.fillText("Hold Z / X  Charge shot", 30, 62);
  ctx.fillText("M  Mute    ESC  Menu", 30, 82);
  ctx.fillText("R  Restart", 30, 102);
  ctx.restore();

  if (bannerTime > 0 && banner) {
    ctx.fillStyle = "rgba(3,7,20,.78)";
    ctx.fillRect(W / 2 - 290, 42, 580, 58);
    ctx.strokeStyle = "rgba(69,234,255,.55)";
    ctx.strokeRect(W / 2 - 290, 42, 580, 58);
    ctx.fillStyle = "#c9fbff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(banner, W / 2, 78);
  }

  if (gameState === "complete") {
    const score = getScoreData();
    ctx.fillStyle = "rgba(2,5,16,.84)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#68f5ff";
    ctx.textAlign = "center";
    ctx.font = "bold 44px Arial";
    ctx.fillText("LEVEL 1 COMPLETE", W / 2, 220);

    if (currentDifficulty.ranked) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 82px Arial";
      ctx.fillText(score.rank, W / 2, 320);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px Arial";
      ctx.fillText("PRACTICE", W / 2, 320);
    }

    ctx.font = "21px Arial";
    ctx.fillText(`MODE: ${currentDifficulty.label}`, W / 2, 360);
    ctx.fillText(`DATA SHARDS: ${score.shardCount} / ${shards.length}`, W / 2, 392);
    ctx.fillText(`ENEMIES DEFEATED: ${enemiesDefeated}`, W / 2, 426);
    ctx.fillText(`DEATHS: ${deaths}`, W / 2, 460);
    ctx.fillText(`TIME: ${Math.floor(score.elapsed / 60)}:${String(Math.floor(score.elapsed % 60)).padStart(2, "0")}`, W / 2, 494);

    if (currentDifficulty.ranked) {
      ctx.fillStyle = "#b9a9d0";
      ctx.font = "17px Arial";
      ctx.fillText("Press R to replay or ESC for menu", W / 2, 545);
    } else {
      ctx.fillStyle = "#b9a9d0";
      ctx.font = "17px Arial";
      ctx.fillText("Practice mode does not award a rank", W / 2, 545);
      ctx.fillText("Press R to replay or ESC for menu", W / 2, 570);
    }
  }
}

function drawLoading() {
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, W, H);

  const percent = Math.floor((loadedAssets / totalAssets) * 100);

  ctx.textAlign = "center";
  ctx.fillStyle = "#5bf2ff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("FRACTURED CORE", W / 2, 300);

  ctx.fillStyle = "#c5d7ef";
  ctx.font = "18px Arial";
  ctx.fillText(`Loading system assets... ${percent}%`, W / 2, 350);

  ctx.fillStyle = "#111a31";
  ctx.fillRect(W / 2 - 200, 380, 400, 12);

  ctx.fillStyle = "#3cecff";
  ctx.fillRect(W / 2 - 200, 380, 400 * (loadedAssets / totalAssets), 12);
}

function draw() {
  ctx.save();

  const shakeX = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake : 0;
  const shakeY = cameraShake > 0 ? (Math.random() - 0.5) * cameraShake : 0;

  ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-W / 2, -H / 2);

  drawBackground();
  if (gameState !== "menu") {
    drawWorld();
    drawEnemies();
    drawProjectiles();
    drawPlayer();
    drawEffects();
  }

  ctx.restore();
  drawOverlay();
}

/* =========================================================
   LOOP
========================================================= */
let last = performance.now();

function loop(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  if (loadedAssets < totalAssets) {
    drawLoading();
    requestAnimationFrame(loop);
    return;
  }

  update(dt);
  draw();
  requestAnimationFrame(loop);
}
/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  if (currentDifficulty.maxHp === Infinity) {

    healthEl.textContent =
      `${currentDifficulty.label} • ❤️∞`;

  } else {

    healthEl.textContent =
      `${currentDifficulty.label} • ` +
      "❤️".repeat(player.hp) +
      "🖤".repeat(player.maxHp - player.hp);

  }

  shardEl.textContent =
    shards.filter(
      shard => shard.taken
    ).length;

}

/* =========================================================
   START
========================================================= */
updateHUD();
requestAnimationFrame(loop);
