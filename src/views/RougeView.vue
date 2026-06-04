<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

// ==================== DOM Refs ====================
const canvasRef = ref(null);
const gameContainerRef = ref(null);

// ==================== 响应式状态 ====================
const hp = ref(100);
const maxHp = ref(100);
const exp = ref(0);
const expToLevel = ref(20);
const level = ref(1);
const survivalTime = ref(0);
const killCount = ref(0);
const showUpgradePanel = ref(false);
const upgradeOptions = ref([]);

// ==================== 游戏常量 ====================
const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 240;
const BULLET_SPEED = 500;
const BULLET_RADIUS = 5;
const SHOOT_COOLDOWN = 0.25; // 秒
const PARTICLE_LIFETIME = 0.5; // 秒
const EXP_PICKUP_RANGE = 40;
const ORBIT_RADIUS = 55;
const ORBIT_SPEED = 3; // 弧度/秒

// ==================== 游戏状态 ====================
let canvasWidth = 800;
let canvasHeight = 600;
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let expOrbs = [];
let orbitBalls = [];
let keys = {};
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let shootTimer = 0;
let waveTimer = 0;
let survivalTimer = 0;
let animFrameId = null;
let isPaused = false;
let isGameOver = false;
let gameStarted = false;

// ==================== 玩家属性（可被升级修改） ====================
let playerAttrs = {
  speed: PLAYER_SPEED,
  bulletDamage: 25,
  shootCooldown: SHOOT_COOLDOWN,
  multiShot: 1,
  pierceCount: 0,
  orbitBallCount: 0,
  hpRegen: 0,
  magnetRange: EXP_PICKUP_RANGE,
  rearShot: false,
  bulletSize: 1, // 子弹大小倍率
  chainLightning: 0, // 闪电链伤害
  frostSlow: 0, // 减速比例
  critChance: 0, // 暴击率 0-1
  critMultiplier: 1.5, // 暴击倍率
  lifesteal: 0, // 吸血比例
  ricochetCount: 0, // 弹射次数
  xpMultiplier: 1, // 经验倍率
  thornsDamage: 0, // 荆棘光环伤害/秒
  thornsRange: 0, // 荆棘光环范围
  dashCooldown: 0, // 冲刺冷却时间（0=无冲刺）
  dashSpeed: 0, // 冲刺速度倍率
  dashDuration: 0, // 冲刺持续时间
};
let dashTimer = 0;
let dashActive = false;
let dashActiveTimer = 0;

// ==================== 升级池 ====================
const ALL_UPGRADES = [
  {
    id: "multiShot",
    name: "多重射击",
    description: "每次射击额外发射 2 颗子弹",
    icon: "🔫",
    maxLevel: 3,
    apply() {
      playerAttrs.multiShot = Math.min(playerAttrs.multiShot + 2, 7);
    },
  },
  {
    id: "speedBoost",
    name: "移速提升",
    description: "移动速度 +15%",
    icon: "👟",
    maxLevel: 5,
    apply() {
      playerAttrs.speed += PLAYER_SPEED * 0.15;
    },
  },
  {
    id: "fireRate",
    name: "射击加速",
    description: "射击间隔 -20%",
    icon: "⏩",
    maxLevel: 4,
    apply() {
      playerAttrs.shootCooldown *= 0.8;
    },
  },
  {
    id: "orbitBalls",
    name: "环绕火球",
    description: "获得 2 颗环绕火球，触碰敌人造成伤害",
    icon: "🔥",
    maxLevel: 4,
    apply() {
      playerAttrs.orbitBallCount += 2;
      const angleStep = (Math.PI * 2) / playerAttrs.orbitBallCount;
      orbitBalls = [];
      for (let i = 0; i < playerAttrs.orbitBallCount; i++) {
        orbitBalls.push({ angle: angleStep * i });
      }
    },
  },
  {
    id: "hpRegen",
    name: "生命回复",
    description: "每秒回复 3 点生命",
    icon: "💚",
    maxLevel: 5,
    apply() {
      playerAttrs.hpRegen += 3;
    },
  },
  {
    id: "damageBoost",
    name: "伤害提升",
    description: "子弹伤害 +30%",
    icon: "💥",
    maxLevel: 5,
    apply() {
      playerAttrs.bulletDamage *= 1.3;
    },
  },
  {
    id: "pierce",
    name: "穿透子弹",
    description: "子弹可穿透 1 个敌人",
    icon: "🔮",
    maxLevel: 3,
    apply() {
      playerAttrs.pierceCount += 1;
    },
  },
  {
    id: "magnet",
    name: "磁铁吸引",
    description: "经验拾取范围 +40%",
    icon: "🧲",
    maxLevel: 4,
    apply() {
      playerAttrs.magnetRange += EXP_PICKUP_RANGE * 0.4;
    },
  },
  {
    id: "maxHp",
    name: "生命上限",
    description: "最大生命 +25，并回复等量生命",
    icon: "❤️",
    maxLevel: 5,
    apply() {
      maxHp.value += 25;
      hp.value = Math.min(hp.value + 25, maxHp.value);
    },
  },
  {
    id: "rearShot",
    name: "后方射击",
    description: "同时向后方发射子弹",
    icon: "↩️",
    maxLevel: 1,
    apply() {
      playerAttrs.rearShot = true;
    },
  },
  {
    id: "enhancedFirepower",
    name: "强化火力",
    description: "子弹体积 +40%，伤害 +25%，射速 +10%",
    icon: "💣",
    maxLevel: 5,
    apply() {
      playerAttrs.bulletSize += 0.4;
      playerAttrs.bulletDamage *= 1.25;
      playerAttrs.shootCooldown *= 0.9;
    },
  },
  {
    id: "chainLightning",
    name: "闪电链",
    description: "击杀敌人时释放闪电，连锁伤害附近 3 个敌人",
    icon: "⚡",
    maxLevel: 4,
    apply() {
      playerAttrs.chainLightning += 25;
    },
  },
  {
    id: "frostBullets",
    name: "冰霜子弹",
    description: "子弹命中使敌人减速 30%，持续 1.5 秒",
    icon: "❄️",
    maxLevel: 3,
    apply() {
      playerAttrs.frostSlow = Math.min(playerAttrs.frostSlow + 0.3, 0.7);
    },
  },
  {
    id: "criticalStrike",
    name: "暴击几率",
    description: "子弹有 15% 几率造成 2 倍伤害",
    icon: "💢",
    maxLevel: 5,
    apply() {
      playerAttrs.critChance = Math.min(playerAttrs.critChance + 0.15, 0.75);
      if (playerAttrs.critChance > 0.3) playerAttrs.critMultiplier = 2.0;
    },
  },
  {
    id: "lifesteal",
    name: "生命偷取",
    description: "击杀敌人回复其最大生命 10% 的血量",
    icon: "🩸",
    maxLevel: 4,
    apply() {
      playerAttrs.lifesteal += 0.1;
    },
  },
  {
    id: "ricochet",
    name: "弹射子弹",
    description: "子弹命中后弹射到附近敌人（最多 2 次）",
    icon: "🔄",
    maxLevel: 3,
    apply() {
      playerAttrs.ricochetCount += 2;
    },
  },
  {
    id: "xpBoost",
    name: "经验加成",
    description: "经验获取量 +50%",
    icon: "📈",
    maxLevel: 5,
    apply() {
      playerAttrs.xpMultiplier += 0.5;
      // 立即补偿部分经验
      exp.value = Math.floor(exp.value * 1.2);
    },
  },
  {
    id: "thornsAura",
    name: "荆棘光环",
    description: "对附近敌人造成每秒 20 点伤害",
    icon: "🌿",
    maxLevel: 4,
    apply() {
      playerAttrs.thornsDamage += 20;
      playerAttrs.thornsRange = Math.max(playerAttrs.thornsRange, 90);
    },
  },
  {
    id: "dash",
    name: "战术冲刺",
    description: "每 8 秒自动触发冲刺，移速 +80% 持续 0.6 秒",
    icon: "💨",
    maxLevel: 4,
    apply() {
      if (playerAttrs.dashCooldown === 0) {
        playerAttrs.dashCooldown = 8;
        playerAttrs.dashSpeed = 1.8;
        playerAttrs.dashDuration = 0.6;
        dashTimer = 0;
      } else {
        playerAttrs.dashCooldown = Math.max(3, playerAttrs.dashCooldown - 1.5);
        playerAttrs.dashSpeed += 0.3;
        playerAttrs.dashDuration += 0.15;
      }
    },
  },
];

function getUpgradeLevel(upgradeId) {
  if (upgradeId === "orbitBalls") return playerAttrs.orbitBallCount / 2;
  if (upgradeId === "multiShot") return (playerAttrs.multiShot - 1) / 2;
  if (upgradeId === "speedBoost") return Math.round((playerAttrs.speed - PLAYER_SPEED) / (PLAYER_SPEED * 0.15));
  if (upgradeId === "fireRate") {
    let lvl = 0;
    let cd = SHOOT_COOLDOWN;
    while (cd > playerAttrs.shootCooldown + 0.001) {
      cd *= 0.8;
      lvl++;
    }
    return Math.min(lvl, 4);
  }
  if (upgradeId === "hpRegen") return Math.round(playerAttrs.hpRegen / 3);
  if (upgradeId === "damageBoost") {
    let lvl = 0;
    let dmg = 25;
    while (dmg < playerAttrs.bulletDamage - 0.01) {
      dmg *= 1.3;
      lvl++;
    }
    return Math.min(lvl, 5);
  }
  if (upgradeId === "pierceCount") return playerAttrs.pierceCount;
  if (upgradeId === "magnet") return Math.round((playerAttrs.magnetRange - EXP_PICKUP_RANGE) / (EXP_PICKUP_RANGE * 0.4));
  if (upgradeId === "maxHp") return Math.round((maxHp.value - 100) / 25);
  if (upgradeId === "rearShot") return playerAttrs.rearShot ? 1 : 0;
  if (upgradeId === "enhancedFirepower") return Math.round((playerAttrs.bulletSize - 1) / 0.4);
  if (upgradeId === "chainLightning") return Math.round(playerAttrs.chainLightning / 25);
  if (upgradeId === "frostBullets") return Math.round(playerAttrs.frostSlow / 0.3);
  if (upgradeId === "criticalStrike") return Math.round(playerAttrs.critChance / 0.15);
  if (upgradeId === "lifesteal") return Math.round(playerAttrs.lifesteal / 0.1);
  if (upgradeId === "ricochet") return playerAttrs.ricochetCount / 2;
  if (upgradeId === "xpBoost") return Math.round((playerAttrs.xpMultiplier - 1) / 0.5);
  if (upgradeId === "thornsAura") return Math.round(playerAttrs.thornsDamage / 20);
  if (upgradeId === "dash") {
    if (playerAttrs.dashCooldown === 0) return 0;
    return Math.round((8 - playerAttrs.dashCooldown) / 1.5) + 1;
  }
  return 0;
}

// 海克斯 Buff 显示列表
function buildActiveBuffs() {
  const buffs = [];
  for (const u of ALL_UPGRADES) {
    const lv = getUpgradeLevel(u.id);
    if (lv > 0) {
      buffs.push({ icon: u.icon, name: u.name, level: lv, maxLevel: u.maxLevel });
    }
  }
  return buffs;
}
const activeBuffs = ref([]);

// ==================== 工具函数 ====================
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 30;
  switch (side) {
    case 0:
      x = randRange(-margin, canvasWidth + margin);
      y = -margin;
      break;
    case 1:
      x = canvasWidth + margin;
      y = randRange(-margin, canvasHeight + margin);
      break;
    case 2:
      x = randRange(-margin, canvasWidth + margin);
      y = canvasHeight + margin;
      break;
    case 3:
      x = -margin;
      y = randRange(-margin, canvasHeight + margin);
      break;
  }
  const baseHp = 30 + Math.floor(survivalTimer / 10) * 10;
  const baseSpeed = 60 + Math.min(survivalTimer * 2, 100);
  return {
    x,
    y,
    hp: baseHp,
    maxHp: baseHp,
    speed: baseSpeed + randRange(-20, 20),
    radius: 14 + randRange(-2, 4),
    color: `hsl(${randRange(0, 20)}, 70%, 45%)`,
    damageFlash: 0,
    slowTimer: 0,
    slowAmount: 0,
  };
}

function spawnExpOrb(x, y) {
  expOrbs.push({
    x: x + randRange(-10, 10),
    y: y + randRange(-10, 10),
    radius: 5,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(80, 250);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
      radius: randRange(2, 5),
      color,
    });
  }
}

// ==================== 升级系统 ====================
function rollUpgrades() {
  const available = ALL_UPGRADES.filter((u) => {
    const curLvl = getUpgradeLevel(u.id);
    return curLvl < u.maxLevel;
  });
  // 随机洗牌取 3 个
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

function triggerUpgrade() {
  const options = rollUpgrades();
  if (options.length === 0) {
    // 没有可升级项，直接回复一些血量
    hp.value = Math.min(hp.value + 20, maxHp.value);
    return;
  }
  upgradeOptions.value = options;
  showUpgradePanel.value = true;
  isPaused = true;
}

function selectUpgrade(upgrade) {
  upgrade.apply();
  activeBuffs.value = buildActiveBuffs();
  showUpgradePanel.value = false;
  isPaused = false;
  // 升级后增加经验需求
  expToLevel.value = Math.floor(expToLevel.value * 1.35);
  exp.value = 0;
  level.value++;
}

// ==================== 射击逻辑 ====================
function shoot() {
  if (!player || isGameOver || isPaused) return;
  const nearest = findNearestEnemy();
  let baseAngle;
  if (nearest) {
    baseAngle = angleTo(player, nearest);
  } else {
    baseAngle = angleTo(player, { x: mouseX, y: mouseY });
  }

  const spreadCount = playerAttrs.multiShot;
  const spreadAngle = 0.12; // 扩散弧度

  for (let i = 0; i < spreadCount; i++) {
    const offsetAngle = (i - (spreadCount - 1) / 2) * spreadAngle;
    const a = baseAngle + offsetAngle;
    // 暴击判定
    const isCrit = Math.random() < playerAttrs.critChance;
    const dmg = isCrit ? playerAttrs.bulletDamage * playerAttrs.critMultiplier : playerAttrs.bulletDamage;
    bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * BULLET_SPEED,
      vy: Math.sin(a) * BULLET_SPEED,
      damage: dmg,
      pierceLeft: playerAttrs.pierceCount,
      radius: BULLET_RADIUS * playerAttrs.bulletSize,
      ricochetLeft: playerAttrs.ricochetCount,
      isCrit,
      applyFrost: playerAttrs.frostSlow > 0,
    });
  }

  // 后方射击
  if (playerAttrs.rearShot) {
    const rearAngle = baseAngle + Math.PI;
    const isCrit = Math.random() < playerAttrs.critChance;
    const dmg = isCrit ? playerAttrs.bulletDamage * playerAttrs.critMultiplier : playerAttrs.bulletDamage;
    bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(rearAngle) * BULLET_SPEED,
      vy: Math.sin(rearAngle) * BULLET_SPEED,
      damage: dmg,
      pierceLeft: playerAttrs.pierceCount,
      radius: BULLET_RADIUS * playerAttrs.bulletSize,
      ricochetLeft: playerAttrs.ricochetCount,
      isCrit,
      applyFrost: playerAttrs.frostSlow > 0,
    });
  }
}

function findNearestEnemy() {
  if (!player || enemies.length === 0) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const e of enemies) {
    const d = dist(player, e);
    if (d < minDist) {
      minDist = d;
      nearest = e;
    }
  }
  return nearest;
}

function findNearestEnemyToBullet(bullet) {
  let nearest = null;
  let minDist = Infinity;
  for (const e of enemies) {
    const d = Math.sqrt((bullet.x - e.x) ** 2 + (bullet.y - e.y) ** 2);
    if (d < minDist && d < BULLET_RADIUS + e.radius) {
      minDist = d;
      nearest = e;
    }
  }
  return nearest;
}

// ==================== 游戏循环 ====================
function resetGame() {
  player = { x: canvasWidth / 2, y: canvasHeight / 2 };
  enemies = [];
  bullets = [];
  particles = [];
  expOrbs = [];
  orbitBalls = [];
  hp.value = maxHp.value;
  exp.value = 0;
  expToLevel.value = 20;
  level.value = 1;
  survivalTimer = 0;
  survivalTime.value = 0;
  killCount.value = 0;
  shootTimer = 0;
  waveTimer = 0;
  isPaused = false;
  isGameOver = false;
  gameStarted = true;

  playerAttrs = {
    speed: PLAYER_SPEED,
    bulletDamage: 25,
    shootCooldown: SHOOT_COOLDOWN,
    multiShot: 1,
    pierceCount: 0,
    orbitBallCount: 0,
    hpRegen: 0,
    magnetRange: EXP_PICKUP_RANGE,
    rearShot: false,
    bulletSize: 1,
    chainLightning: 0,
    frostSlow: 0,
    critChance: 0,
    critMultiplier: 1.5,
    lifesteal: 0,
    ricochetCount: 0,
    xpMultiplier: 1,
    thornsDamage: 0,
    thornsRange: 0,
    dashCooldown: 0,
    dashSpeed: 0,
    dashDuration: 0,
  };
  dashTimer = 0;
  dashActive = false;
  dashActiveTimer = 0;
}

function gameLoop(dt) {
  if (isGameOver || isPaused) return;

  // dt 限制防止标签页切换后 deltaTime 爆炸
  const safeDt = Math.min(dt, 0.1);

  updatePlayer(safeDt);
  updateEnemies(safeDt);
  updateBullets(safeDt);
  updateParticles(safeDt);
  updateExpOrbs(safeDt);
  updateOrbitBalls(safeDt);
  updateWaves(safeDt);
  updateTimers(safeDt);
  checkCollisions();
}

function updatePlayer(dt) {
  if (!player) return;
  let dx = 0,
    dy = 0;
  if (keys["w"] || keys["W"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["S"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["A"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["D"] || keys["arrowright"]) dx += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  player.x += dx * playerAttrs.speed * (dashActive ? playerAttrs.dashSpeed : 1) * dt;
  player.y += dy * playerAttrs.speed * (dashActive ? playerAttrs.dashSpeed : 1) * dt;

  // 限制在画布内
  player.x = Math.max(PLAYER_RADIUS, Math.min(canvasWidth - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvasHeight - PLAYER_RADIUS, player.y));

  // 射击
  if (mouseDown && shootTimer <= 0) {
    shoot();
    shootTimer = playerAttrs.shootCooldown;
  }
  if (shootTimer > 0) shootTimer -= dt;

  // 生命回复
  if (playerAttrs.hpRegen > 0) {
    hp.value = Math.min(hp.value + playerAttrs.hpRegen * dt, maxHp.value);
  }

  // 冲刺机制
  if (playerAttrs.dashCooldown > 0) {
    if (!dashActive) {
      dashTimer += dt;
      if (dashTimer >= playerAttrs.dashCooldown) {
        dashActive = true;
        dashActiveTimer = playerAttrs.dashDuration;
        dashTimer = 0;
      }
    }
    if (dashActive) {
      dashActiveTimer -= dt;
      if (dashActiveTimer <= 0) dashActive = false;
    }
  }
}

function updateEnemies(dt) {
  if (!player) return;
  for (const enemy of enemies) {
    const a = angleTo(enemy, player);
    const speedMult = enemy.slowTimer > 0 ? 1 - enemy.slowAmount : 1;
    enemy.x += Math.cos(a) * enemy.speed * speedMult * dt;
    enemy.y += Math.sin(a) * enemy.speed * speedMult * dt;
    if (enemy.damageFlash > 0) enemy.damageFlash -= dt;
    if (enemy.slowTimer > 0) enemy.slowTimer -= dt;
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // 超出边界移除
    if (b.x < -50 || b.x > canvasWidth + 50 || b.y < -50 || b.y > canvasHeight + 50) {
      bullets.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateExpOrbs(dt) {
  if (!player) return;
  for (let i = expOrbs.length - 1; i >= 0; i--) {
    const orb = expOrbs[i];
    orb.pulse += dt * 4;
    // 磁铁效果：在拾取范围内自动吸引
    const d = dist(player, orb);
    if (d < playerAttrs.magnetRange) {
      const a = angleTo(orb, player);
      const attractSpeed = 200;
      orb.x += Math.cos(a) * attractSpeed * dt;
      orb.y += Math.sin(a) * attractSpeed * dt;
    }
    // 碰到玩家就拾取
    if (d < PLAYER_RADIUS + orb.radius) {
      expOrbs.splice(i, 1);
      exp.value += playerAttrs.xpMultiplier;
      if (exp.value >= expToLevel.value) {
        triggerUpgrade();
      }
    }
  }
}

function updateOrbitBalls(dt) {
  if (!player || orbitBalls.length === 0) return;
  for (const ball of orbitBalls) {
    ball.angle += ORBIT_SPEED * dt;
  }
}

function updateWaves(dt) {
  waveTimer -= dt;
  if (waveTimer <= 0) {
    // 随存活时间增加敌人生成数量和频率
    const enemyCount = 1 + Math.floor(survivalTimer / 15);
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(spawnEnemy());
    }
    waveTimer = Math.max(0.4, 2.0 - survivalTimer * 0.02);
  }
}

function updateTimers(dt) {
  survivalTimer += dt;
  survivalTime.value = Math.floor(survivalTimer);
}

function checkCollisions() {
  if (!player || isGameOver) return;

  // 荆棘光环：对附近敌人持续造成伤害
  if (playerAttrs.thornsDamage > 0) {
    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const e = enemies[eIdx];
      const d = dist(player, e);
      if (d < playerAttrs.thornsRange + e.radius) {
        e.hp -= playerAttrs.thornsDamage * 0.016;
        e.damageFlash = 0.06;
        if (e.hp <= 0) {
          killEnemy(e, eIdx);
        }
      }
    }
  }

  // 子弹 vs 敌人
  for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
    const b = bullets[bIdx];
    let bulletHit = false;
    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const e = enemies[eIdx];
      if (e.hp <= 0) continue;
      const d = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
      if (d < b.radius + e.radius) {
        e.hp -= b.damage;
        e.damageFlash = 0.1;

        // 冰霜减速
        if (b.applyFrost) {
          e.slowTimer = 1.5;
          e.slowAmount = playerAttrs.frostSlow;
        }

        // 暴击特效
        if (b.isCrit) {
          spawnParticles(b.x, b.y, 8, "#ffff00");
        } else {
          spawnParticles(b.x, b.y, 3, "#ff6644");
        }

        if (e.hp <= 0) {
          // 闪电链
          if (playerAttrs.chainLightning > 0) {
            triggerChainLightning(e);
          }
          // 吸血
          if (playerAttrs.lifesteal > 0) {
            hp.value = Math.min(hp.value + e.maxHp * playerAttrs.lifesteal, maxHp.value);
          }
          killEnemy(e, eIdx);

          // 弹射
          if (b.ricochetLeft > 0) {
            ricochetBullet(b, e);
          }
        }

        if (b.pierceLeft <= 0 && b.ricochetLeft <= 0) {
          bulletHit = true;
        } else {
          if (b.pierceLeft > 0) b.pierceLeft--;
        }
        if (bulletHit) break;
      }
    }
    if (bulletHit) {
      bullets.splice(bIdx, 1);
    }
  }

  // 环绕火球 vs 敌人
  if (orbitBalls.length > 0) {
    for (const ball of orbitBalls) {
      const bx = player.x + Math.cos(ball.angle) * ORBIT_RADIUS;
      const by = player.y + Math.sin(ball.angle) * ORBIT_RADIUS;
      for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = enemies[eIdx];
        if (e.hp <= 0) continue;
        const d = Math.sqrt((bx - e.x) ** 2 + (by - e.y) ** 2);
        if (d < 16 + e.radius) {
          e.hp -= 15;
          e.damageFlash = 0.1;
          spawnParticles(bx, by, 3, "#ffaa00");
          if (e.hp <= 0) {
            if (playerAttrs.chainLightning > 0) triggerChainLightning(e);
            if (playerAttrs.lifesteal > 0) hp.value = Math.min(hp.value + e.maxHp * playerAttrs.lifesteal, maxHp.value);
            killEnemy(e, eIdx);
          }
        }
      }
    }
  }

  // 敌人 vs 玩家
  for (const e of enemies) {
    const d = dist(player, e);
    if (d < PLAYER_RADIUS + e.radius) {
      hp.value -= 20;
      spawnParticles(player.x, player.y, 8, "#ff0000");
      // 击退敌人
      const a = angleTo(player, e);
      e.x = player.x + Math.cos(a) * (PLAYER_RADIUS + e.radius + 10);
      e.y = player.y + Math.sin(a) * (PLAYER_RADIUS + e.radius + 10);
      if (hp.value <= 0) {
        hp.value = 0;
        isGameOver = true;
        spawnParticles(player.x, player.y, 40, "#ff3333");
      }
    }
  }
}

// 击杀敌人处理
function killEnemy(enemy, idx) {
  spawnParticles(enemy.x, enemy.y, 10, enemy.color);
  spawnExpOrb(enemy.x, enemy.y);
  if (Math.random() < 0.3) spawnExpOrb(enemy.x, enemy.y);
  killCount.value++;
  enemies.splice(idx, 1);
}

// 闪电链
function triggerChainLightning(source) {
  let chainTargets = [];
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = Math.sqrt((source.x - e.x) ** 2 + (source.y - e.y) ** 2);
    if (d < 200) chainTargets.push({ enemy: e, dist: d });
  }
  chainTargets.sort((a, b) => a.dist - b.dist);
  const targets = chainTargets.slice(0, 3);
  for (const t of targets) {
    t.enemy.hp -= playerAttrs.chainLightning;
    t.enemy.damageFlash = 0.15;
    spawnParticles(t.enemy.x, t.enemy.y, 4, "#aaddff");
  }
  // 清理被闪电击杀的敌人
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      if (playerAttrs.lifesteal > 0) hp.value = Math.min(hp.value + enemies[i].maxHp * playerAttrs.lifesteal, maxHp.value);
      killEnemy(enemies[i], i);
    }
  }
}

// 弹射子弹
function ricochetBullet(bullet, hitEnemy) {
  let nearest = null;
  let minDist = 150;
  for (const e of enemies) {
    if (e.hp <= 0 || e === hitEnemy) continue;
    const d = Math.sqrt((hitEnemy.x - e.x) ** 2 + (hitEnemy.y - e.y) ** 2);
    if (d < minDist) {
      minDist = d;
      nearest = e;
    }
  }
  if (nearest) {
    const a = Math.atan2(nearest.y - hitEnemy.y, nearest.x - hitEnemy.x);
    bullets.push({
      x: hitEnemy.x,
      y: hitEnemy.y,
      vx: Math.cos(a) * BULLET_SPEED * 0.85,
      vy: Math.sin(a) * BULLET_SPEED * 0.85,
      damage: bullet.damage * 0.7,
      pierceLeft: 0,
      radius: bullet.radius * 0.8,
      ricochetLeft: bullet.ricochetLeft - 1,
      isCrit: false,
      applyFrost: bullet.applyFrost,
    });
  }
}

// ==================== 渲染 ====================
function render(ctx) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 背景网格
  drawGrid(ctx);

  // 经验球
  drawExpOrbs(ctx);

  // 粒子
  drawParticles(ctx);

  // 敌人
  drawEnemies(ctx);

  // 环绕火球
  drawOrbitBalls(ctx);

  // 子弹
  drawBullets(ctx);

  // 玩家
  drawPlayer(ctx);
}

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x <= canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

function drawPlayer(ctx) {
  if (!player) return;

  // 荆棘光环
  if (playerAttrs.thornsRange > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerAttrs.thornsRange, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100, 255, 100, 0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 冲刺特效
  if (dashActive) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS + 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 100, 0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 光环
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS + 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(100, 180, 255, 0.2)";
  ctx.fill();

  // 主体
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(player.x - 4, player.y - 4, 2, player.x, player.y, PLAYER_RADIUS);
  grad.addColorStop(0, "#88ccff");
  grad.addColorStop(1, "#2266cc");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#aaddff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 准星指示线
  const nearest = findNearestEnemy();
  if (nearest) {
    const a = angleTo(player, nearest);
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(a) * (PLAYER_RADIUS + 4), player.y + Math.sin(a) * (PLAYER_RADIUS + 4));
    ctx.lineTo(player.x + Math.cos(a) * (PLAYER_RADIUS + 14), player.y + Math.sin(a) * (PLAYER_RADIUS + 14));
    ctx.strokeStyle = "rgba(255, 255, 100, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawEnemies(ctx) {
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    let fillColor = e.damageFlash > 0 ? "#ffffff" : e.color;
    // 冰霜减速时敌人偏蓝
    if (e.slowTimer > 0 && e.damageFlash <= 0) {
      fillColor = "#88aacc";
    }
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 减速冰晶效果
    if (e.slowTimer > 0) {
      ctx.strokeStyle = "rgba(150, 200, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 血条
    if (e.hp < e.maxHp) {
      const barW = e.radius * 2;
      const barH = 4;
      const barY = e.y - e.radius - 8;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(e.x - barW / 2, barY, barW, barH);
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(e.x - barW / 2, barY, barW * (e.hp / e.maxHp), barH);
    }

    // 眼睛（敌人面朝玩家方向的小白点）
    if (player) {
      const a = angleTo(e, player);
      const eyeX = e.x + Math.cos(a) * e.radius * 0.4;
      const eyeY = e.y + Math.sin(a) * e.radius * 0.4;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
}

function drawBullets(ctx) {
  for (const b of bullets) {
    const r = b.radius || BULLET_RADIUS;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(b.x, b.y, r * 0.2, b.x, b.y, r);
    if (b.isCrit) {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#ffcc00");
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 8;
    } else {
      grad.addColorStop(0, "#ffff88");
      grad.addColorStop(1, "#ff8800");
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
    if (p.color.startsWith("#")) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawExpOrbs(ctx) {
  for (const orb of expOrbs) {
    const scale = 1 + Math.sin(orb.pulse) * 0.2;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#44ff88";
    ctx.fill();
    ctx.strokeStyle = "#88ffbb";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawOrbitBalls(ctx) {
  if (!player) return;
  for (const ball of orbitBalls) {
    const bx = player.x + Math.cos(ball.angle) * ORBIT_RADIUS;
    const by = player.y + Math.sin(ball.angle) * ORBIT_RADIUS;
    // 光晕
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 150, 30, 0.3)";
    ctx.fill();
    // 主体
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 8);
    grad.addColorStop(0, "#ffff66");
    grad.addColorStop(1, "#ff6600");
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawGameOver(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("游戏结束", canvasWidth / 2, canvasHeight / 2 - 20);
  ctx.font = "20px sans-serif";
  ctx.fillText("按 R 键重新开始", canvasWidth / 2, canvasHeight / 2 + 30);
  ctx.fillText(`存活时间: ${survivalTime.value}秒 | 击杀: ${killCount.value}`, canvasWidth / 2, canvasHeight / 2 + 60);
  ctx.textAlign = "start";
}

function drawStartScreen(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚔️ 肉鸽生存射击 ⚔️", canvasWidth / 2, canvasHeight / 2 - 40);
  ctx.font = "18px sans-serif";
  ctx.fillText("WASD 移动 | 鼠标左键射击", canvasWidth / 2, canvasHeight / 2 + 10);
  ctx.fillText("击杀敌人 → 收集经验 → 升级变强", canvasWidth / 2, canvasHeight / 2 + 40);
  ctx.fillStyle = "#ffcc00";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("点击开始游戏", canvasWidth / 2, canvasHeight / 2 + 90);
  ctx.textAlign = "start";
}

// ==================== 主循环 ====================
let lastTime = 0;

function mainLoop(timestamp) {
  animFrameId = requestAnimationFrame(mainLoop);

  if (lastTime === 0) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (!gameStarted) {
    drawStartScreen(ctx);
    return;
  }

  gameLoop(dt);
  render(ctx);

  if (isGameOver) {
    drawGameOver(ctx);
  }
}

// ==================== 事件处理 ====================
function handleKeyDown(e) {
  keys[e.key] = true;
  if (e.key === "r" || e.key === "R") {
    if (isGameOver) resetGame();
  }
  // 防止方向键滚动页面
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
}

function handleKeyUp(e) {
  keys[e.key] = false;
}

function handleMouseMove(e) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
}

function handleMouseDown(e) {
  if (e.button === 0) {
    mouseDown = true;
    if (!gameStarted) {
      resetGame();
    }
  }
}

function handleMouseUp(e) {
  if (e.button === 0) mouseDown = false;
}

function handleCanvasClick() {
  canvasRef.value?.focus();
  if (!gameStarted) resetGame();
}

function handleResize() {
  if (!gameContainerRef.value || !canvasRef.value) return;
  const container = gameContainerRef.value;
  const rect = container.getBoundingClientRect();
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  const canvas = canvasRef.value;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  if (player && !gameStarted) {
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await nextTick();
  handleResize();
  canvasRef.value?.focus();
  lastTime = 0;
  animFrameId = requestAnimationFrame(mainLoop);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mousedown", handleMouseDown);
  window.removeEventListener("mouseup", handleMouseUp);
  window.removeEventListener("resize", handleResize);
});

// 暴露给 template 的方法
function handleUpgradeClick(upgrade) {
  selectUpgrade(upgrade);
  nextTick(() => canvasRef.value?.focus());
}
</script>

<template>
  <div ref="gameContainerRef" class="rouge-game-container">
    <!-- HUD 覆盖层 -->
    <div v-if="gameStarted" class="game-hud">
      <!-- 左上角：血量条 -->
      <div class="hud-hp">
        <div class="hud-label">❤️ HP</div>
        <div class="hp-bar-bg">
          <div class="hp-bar-fill" :style="{ width: Math.max(0, (hp / maxHp) * 100) + '%' }"></div>
        </div>
        <span class="hp-text">{{ Math.max(0, Math.ceil(hp)) }} / {{ maxHp }}</span>
      </div>

      <!-- 经验条 -->
      <div class="hud-exp">
        <div class="hud-label">⭐ Lv.{{ level }}</div>
        <div class="exp-bar-bg">
          <div class="exp-bar-fill" :style="{ width: Math.min(100, (exp / expToLevel) * 100) + '%' }"></div>
        </div>
        <span class="exp-text">{{ exp }} / {{ expToLevel }}</span>
      </div>

      <!-- 存活时间 -->
      <div class="hud-time">⏱ {{ survivalTime }}s</div>

      <!-- 击杀数 -->
      <div class="hud-kills">💀 {{ killCount }}</div>

      <!-- 海克斯 Buff 栏 -->
      <div v-if="activeBuffs.length > 0" class="hud-buffs">
        <div v-for="buff in activeBuffs" :key="buff.name" class="buff-badge" :title="buff.name + ' Lv.' + buff.level + '/' + buff.maxLevel">
          <span class="buff-icon">{{ buff.icon }}</span>
          <span class="buff-lv">{{ buff.level }}</span>
        </div>
      </div>
    </div>

    <!-- 升级选择面板 -->
    <Transition name="panel">
      <div v-if="showUpgradePanel" class="upgrade-overlay">
        <div class="upgrade-panel">
          <h2 class="upgrade-title">🎴 选择升级！</h2>
          <div class="upgrade-options">
            <div v-for="upgrade in upgradeOptions" :key="upgrade.id" class="upgrade-card" @click="handleUpgradeClick(upgrade)">
              <div class="upgrade-icon">{{ upgrade.icon }}</div>
              <div class="upgrade-name">{{ upgrade.name }}</div>
              <div class="upgrade-desc">{{ upgrade.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Canvas 游戏画布 -->
    <canvas ref="canvasRef" class="game-canvas" tabindex="0" @click="handleCanvasClick" @contextmenu.prevent></canvas>
  </div>
</template>

<style scoped>
/* ==================== 容器与 Canvas ==================== */
.rouge-game-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a0a14;
  user-select: none;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  cursor: crosshair;
}

/* ==================== HUD ==================== */
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 10;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.hud-hp,
.hud-exp {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hud-label {
  font-size: 13px;
  font-weight: bold;
  color: #ddd;
  min-width: 55px;
}

.hp-bar-bg,
.exp-bar-bg {
  width: 140px;
  height: 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.hp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff3344, #ff6677);
  border-radius: 7px;
  transition: width 0.2s ease;
}

.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #44aaff, #66ccff);
  border-radius: 7px;
  transition: width 0.2s ease;
}

.hp-text,
.exp-text {
  font-size: 12px;
  color: #bbb;
  font-variant-numeric: tabular-nums;
}

.hud-time,
.hud-kills {
  font-size: 14px;
  font-weight: bold;
  color: #eee;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}

/* ==================== 升级面板 ==================== */
.upgrade-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.upgrade-panel {
  background: linear-gradient(145deg, #1a1a3e, #0d0d28);
  border: 2px solid rgba(100, 140, 255, 0.4);
  border-radius: 18px;
  padding: 28px 32px;
  min-width: 420px;
  max-width: 520px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(60, 100, 255, 0.15);
}

.upgrade-title {
  text-align: center;
  color: #fff;
  font-size: 24px;
  margin: 0 0 20px 0;
  letter-spacing: 2px;
}

.upgrade-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-card:hover {
  background: rgba(100, 140, 255, 0.15);
  border-color: rgba(100, 180, 255, 0.5);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(60, 100, 255, 0.2);
}

.upgrade-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.upgrade-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
}

.upgrade-desc {
  font-size: 13px;
  color: #aaa;
  flex: 1;
}

/* ==================== 过渡动画 ==================== */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s ease;
}
.panel-enter-active .upgrade-panel,
.panel-leave-active .upgrade-panel {
  transition: transform 0.25s ease;
}
.panel-enter-from {
  opacity: 0;
}
.panel-enter-from .upgrade-panel {
  transform: scale(0.85);
}
.panel-leave-to {
  opacity: 0;
}
.panel-leave-to .upgrade-panel {
  transform: scale(0.85);
}
</style>
