/**
 * Core Game Engine for "DON'T TOUCH THE RED"
 * Handles game loop, responsive canvas scaling, input smoothing,
 * collision resolution, state machine, and screen shake.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Display dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Max DPR 2 for performance

    // State machine
    this.state = 'start'; // 'start', 'playing', 'paused', 'gameover'
    this.isDaily = false;
    this.isPaused = false;

    // Timing
    this.lastTime = 0;
    this.timeScale = 1.0;
    this.slowMoTimer = 0;

    // Player Object
    this.player = {
      x: this.width * 0.5,
      y: this.height * 0.7,
      targetX: this.width * 0.5,
      targetY: this.height * 0.7,
      vx: 0,
      vy: 0,
      radius: 13,
      speed: 460, // For keyboard movement
      trail: [],
      hue: 180
    };

    // Keyboard state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Game Session Stats
    this.score = 0;
    this.survivalTime = 0;
    this.coinsCollected = 0;
    this.nearMisses = 0;
    this.hazardLevel = 1;
    this.speedMultiplier = 1.0;
    this.nextLevelTime = 10;

    // Fever / Adrenaline Gauge (0 to 100)
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimer = 0;
    this.feversTriggered = 0;

    // Screen Shake
    this.shakeIntensity = 0;

    // Input touch tracking
    this.touchActive = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchPlayerStartX = 0;
    this.touchPlayerStartY = 0;

    // Setup
    this.initCanvasSize();
    this.bindInputs();
    this.initLoop();
  }

  initCanvasSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindInputs() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      if (this.state === 'start') {
        this.player.x = this.width * 0.5;
        this.player.y = this.height * 0.7;
      }
    });

    // --- MOUSE & POINTER INPUT ---
    const handlePointer = (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, e.clientX));
      this.player.targetY = Math.max(this.player.radius, Math.min(this.height - this.player.radius, e.clientY));
    };

    window.addEventListener('mousemove', handlePointer);
    window.addEventListener('pointerdown', (e) => {
      if (window.soundEngine && !window.soundEngine.initialized) {
        window.soundEngine.init();
      }
      handlePointer(e);
    });

    // --- TOUCH / MOBILE INPUT ---
    const handleTouch = (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;

      const controlMode = window.dttrStorage.settings.controlMode || 'offset';

      if (controlMode === 'offset') {
        // Offset touch ~45px upwards so thumb doesn't cover ball
        const offsetY = 45;
        this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, touch.clientX));
        this.player.targetY = Math.max(this.player.radius, Math.min(this.height - this.player.radius, touch.clientY - offsetY));
      } else if (controlMode === 'relative') {
        if (!this.touchActive) {
          this.touchActive = true;
          this.touchStartX = touch.clientX;
          this.touchStartY = touch.clientY;
          this.touchPlayerStartX = this.player.x;
          this.touchPlayerStartY = this.player.y;
        } else {
          const dx = touch.clientX - this.touchStartX;
          const dy = touch.clientY - this.touchStartY;
          this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.touchPlayerStartX + dx));
          this.player.targetY = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.touchPlayerStartY + dy));
        }
      } else {
        // Direct
        this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, touch.clientX));
        this.player.targetY = Math.max(this.player.radius, Math.min(this.height - this.player.radius, touch.clientY));
      }
    };

    window.addEventListener('touchstart', (e) => {
      if (window.soundEngine && !window.soundEngine.initialized) {
        window.soundEngine.init();
      }
      this.touchActive = false;
      handleTouch(e);
    }, { passive: false });

    window.addEventListener('touchmove', handleTouch, { passive: false });
    window.addEventListener('touchend', () => {
      this.touchActive = false;
    });

    // --- KEYBOARD INPUT (WASD / ARROWS) ---
    window.addEventListener('keydown', (e) => {
      if (window.soundEngine && !window.soundEngine.initialized) {
        window.soundEngine.init();
      }

      // Quick restart via Space or R when Game Over
      if (this.state === 'gameover' && (e.code === 'Space' || e.key === 'r' || e.key === 'R' || e.code === 'Enter')) {
        this.restartGame();
        return;
      }

      // Quick start via Space from Start Screen
      if (this.state === 'start' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startGame(false);
        return;
      }

      // Pause toggle
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing' || this.state === 'paused') {
          this.togglePause();
        }
        return;
      }

      if (e.code === 'KeyW' || e.key === 'ArrowUp') this.keys.up = true;
      if (e.code === 'KeyS' || e.key === 'ArrowDown') this.keys.down = true;
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.key === 'ArrowUp') this.keys.up = false;
      if (e.code === 'KeyS' || e.key === 'ArrowDown') this.keys.down = false;
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') this.keys.right = false;
    });

    // Initialize sound on first user click anywhere
    window.addEventListener('pointerdown', () => {
      if (window.soundEngine && !window.soundEngine.initialized) {
        window.soundEngine.init();
      }
    }, { once: true });
  }

  // --- STATE CONTROLLERS ---

  startGame(isDaily = false) {
    this.isDaily = isDaily;
    this.state = 'playing';
    this.isPaused = false;
    this.score = 0;
    this.survivalTime = 0;
    this.coinsCollected = 0;
    this.nearMisses = 0;
    this.hazardLevel = 1;
    this.speedMultiplier = isDaily ? 1.3 : 1.0; // Daily challenge modifier: +30% starting speed!
    this.nextLevelTime = 9;
    this.feverGauge = 0;
    this.isFever = false;
    this.feverTimer = 0;
    this.feversTriggered = 0;
    this.shakeIntensity = 0;
    this.slowMoTimer = 0;
    this.timeScale = 1.0;

    // Reset player position to screen center
    this.player.x = this.width * 0.5;
    this.player.y = this.height * 0.65;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.trail = [];

    // Clear previous entities
    window.obstacleManager.clear();
    window.particleSystem.clear();

    // Daily notification
    if (isDaily) {
      window.particleSystem.addFloatingText(this.width * 0.5, this.height * 0.35, '⚡ DAILY CHALLENGE ⚡', '#ffd700', 22, 'SPEED BOOST + DOUBLE COINS');
    }

    window.uiManager.showScreen('playing');
    window.uiManager.updateHud({
      score: 0,
      highScore: window.dttrStorage.highScore,
      coins: this.coinsCollected,
      level: this.hazardLevel,
      feverPercent: 0
    });
  }

  restartGame() {
    this.startGame(this.isDaily);
  }

  togglePause() {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this.isPaused = !this.isPaused;
    this.state = this.isPaused ? 'paused' : 'playing';
    window.uiManager.showScreen(this.isPaused ? 'paused' : 'playing');
  }

  quitToMenu() {
    this.state = 'start';
    this.isPaused = false;
    window.obstacleManager.clear();
    window.particleSystem.clear();
    window.uiManager.showScreen('start');
  }

  // --- GAME OVER ---

  triggerGameOver() {
    this.state = 'gameover';
    this.shakeIntensity = 22; // Violent death shake

    // Audio & Visual explosion
    if (window.soundEngine) window.soundEngine.playDeath();
    if (window.particleSystem) {
      window.particleSystem.emitExplosion(this.player.x, this.player.y, 65);
    }

    // Record game in storage
    const runData = {
      score: Math.floor(this.score),
      time: this.survivalTime,
      coins: this.coinsCollected,
      nearMisses: this.nearMisses,
      level: this.hazardLevel,
      feversTriggered: this.feversTriggered,
      isDaily: this.isDaily
    };

    if (this.isDaily) {
      window.dttrStorage.saveDailyScore(runData.score);
    }

    const { isNewRecord, unlockedAchievements } = window.dttrStorage.recordGame(runData);

    // Show achievement popups if any
    unlockedAchievements.forEach((ach, index) => {
      setTimeout(() => {
        window.uiManager.showAchievementToast(ach);
      }, 500 + index * 1200);
    });

    // Delay slight moment for explosion punch before showing game over UI
    setTimeout(() => {
      window.uiManager.showGameOver(runData, isNewRecord);
    }, 700);
  }

  // --- REWARDS & BONUSES ---

  addNearMiss() {
    this.nearMisses++;
    const bonus = 50 * this.hazardLevel;
    this.score += bonus;
    this.shakeIntensity = Math.max(this.shakeIntensity, 5);

    // Audio & Particles
    if (window.soundEngine) window.soundEngine.playNearMiss();
    if (window.particleSystem) {
      window.particleSystem.emitNearMissSparks(this.player.x, this.player.y, 14);
      window.particleSystem.addFloatingText(this.player.x, this.player.y - 20, `+${bonus} NEAR MISS!`, '#00f3ff', 15);
    }

    // Micro slow-mo effect
    this.slowMoTimer = 0.06;

    // Fill fever gauge (+18%)
    this.fillFever(18);
  }

  collectCoin(coin) {
    this.coinsCollected++;
    const bonus = (this.isDaily ? 200 : 100) * (this.isFever ? 3 : 1);
    this.score += bonus;
    window.dttrStorage.addCoins(this.isDaily ? 2 : 1);

    if (window.soundEngine) window.soundEngine.playCoin();
    if (window.particleSystem) {
      window.particleSystem.emitCoinSparkles(coin.x, coin.y, 16);
      window.particleSystem.addFloatingText(coin.x, coin.y - 18, `+${bonus}`, '#ffd700', 16);
    }

    // Fill fever gauge (+22%)
    this.fillFever(22);
  }

  fillFever(amount) {
    if (this.isFever) return;
    this.feverGauge = Math.min(100, this.feverGauge + amount);
    if (this.feverGauge >= 100) {
      this.activateFeverMode();
    }
  }

  activateFeverMode() {
    this.isFever = true;
    this.feversTriggered++;
    this.feverTimer = 5.5; // 5.5 seconds fever mode
    this.shakeIntensity = 10;

    if (window.soundEngine) window.soundEngine.playFever();
    if (window.particleSystem) {
      window.particleSystem.emitShockwave(this.player.x, this.player.y, 160, '#ffd700');
      window.particleSystem.addFloatingText(this.width * 0.5, this.height * 0.4, '🔥 GOLDEN FEVER! 🔥', '#ffd700', 24, '3X SCORE • HAZARDS VAPORIZE');
    }
  }

  // --- MAIN LOOP ---

  initLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      // Handle Slow-Mo
      if (this.slowMoTimer > 0) {
        this.slowMoTimer -= rawDt;
        this.timeScale = 0.35;
      } else {
        this.timeScale = 1.0;
      }

      const dt = rawDt * this.timeScale;

      this.update(dt, rawDt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt, rawDt) {
    // Background dust particles always animate
    window.particleSystem.update(rawDt, this.width, this.height);

    if (this.state !== 'playing' || this.isPaused) return;

    // 1. Survival time & Score
    this.survivalTime += dt;
    this.score += 15 * dt * (this.isFever ? 3 : 1) * this.hazardLevel;

    // 2. Hazard Progression / Level Up
    if (this.survivalTime >= this.nextLevelTime) {
      this.hazardLevel++;
      this.speedMultiplier += 0.18;
      this.nextLevelTime += 10 + this.hazardLevel * 2;

      if (window.soundEngine) window.soundEngine.playLevelUp();
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(this.player.x, this.player.y, 140, '#00f3ff');
        window.particleSystem.addFloatingText(this.width * 0.5, this.height * 0.4, `LEVEL ${this.hazardLevel}!`, '#00f3ff', 24, 'SPEED INCREASED');
      }
    }

    // 3. Fever Timer
    if (this.isFever) {
      this.feverTimer -= dt;
      this.feverGauge = (this.feverTimer / 5.5) * 100;
      if (this.feverTimer <= 0) {
        this.isFever = false;
        this.feverGauge = 0;
      }
    }

    // 4. Player Movement & Smoothing
    // Apply keyboard velocity if keys active
    let kx = 0;
    let ky = 0;
    if (this.keys.up) ky -= 1;
    if (this.keys.down) ky += 1;
    if (this.keys.left) kx -= 1;
    if (this.keys.right) kx += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      const moveDist = this.player.speed * dt;
      this.player.targetX += (kx / len) * moveDist;
      this.player.targetY += (ky / len) * moveDist;
      this.player.targetX = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.targetX));
      this.player.targetY = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.targetY));
    }

    // Smooth lerp towards target
    const lerpFactor = 0.28;
    this.player.x += (this.player.targetX - this.player.x) * lerpFactor;
    this.player.y += (this.player.targetY - this.player.y) * lerpFactor;

    // Trail particle
    const skin = this.getActiveSkin();
    const trailColor = skin.color === 'rainbow' ? `hsl(${(Date.now() / 8) % 360}, 100%, 60%)` : skin.color;
    window.particleSystem.emitPlayerTrail(this.player.x, this.player.y, this.player.radius, trailColor);

    // 5. Update Obstacles & Coins
    window.obstacleManager.update(dt, this.width, this.height, this.player, this.speedMultiplier, this.isFever);

    // 6. Check Coins
    const collected = window.obstacleManager.checkCoinCollection(this.player);
    collected.forEach(c => this.collectCoin(c));

    // 7. Check Collisions & Near Misses
    const { collided, nearMissTriggered } = window.obstacleManager.checkCollisions(this.player, this.isFever);

    if (collided) {
      this.triggerGameOver();
      return;
    }

    if (nearMissTriggered) {
      this.addNearMiss();
    }

    // 8. Update HUD
    window.uiManager.updateHud({
      score: Math.floor(this.score),
      highScore: Math.max(window.dttrStorage.highScore, Math.floor(this.score)),
      coins: this.coinsCollected,
      level: this.hazardLevel,
      feverPercent: this.feverGauge
    });

    // 9. Screen Shake Decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= dt * 30;
      if (this.shakeIntensity < 0) this.shakeIntensity = 0;
    }
  }

  getActiveSkin() {
    const skinId = window.dttrStorage.selectedSkin;
    return window.SKINS_LIST.find(s => s.id === skinId) || window.SKINS_LIST[0];
  }

  // --- RENDER ENGINE ---

  render() {
    this.ctx.save();

    // Screen shake application
    if (this.shakeIntensity > 0 && window.dttrStorage.settings.screenShake) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
    }

    // Clear Canvas
    this.ctx.fillStyle = '#080811';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Cyber Background
    window.particleSystem.drawBackground(this.ctx, this.width, this.height);

    // Draw Obstacles & Coins
    window.obstacleManager.draw(this.ctx, this.width, this.height, this.isFever);

    // Draw Shockwaves & Particles
    window.particleSystem.drawShockwaves(this.ctx);
    window.particleSystem.drawParticles(this.ctx);

    // Draw Player Ball (if alive or in start menu)
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'start') {
      this.drawPlayer(this.ctx);
    }

    // Draw Floating Texts
    window.particleSystem.drawFloatingTexts(this.ctx);

    // Fever Screen Vignette
    if (this.isFever) {
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      this.ctx.lineWidth = 12;
      this.ctx.strokeRect(0, 0, this.width, this.height);
    }

    this.ctx.restore();
  }

  drawPlayer(ctx) {
    ctx.save();
    const skin = this.getActiveSkin();
    let ballColor = skin.color;
    let glowColor = skin.glow;

    if (ballColor === 'rainbow') {
      const hue = (Date.now() / 6) % 360;
      ballColor = `hsl(${hue}, 100%, 55%)`;
      glowColor = `hsl(${hue}, 100%, 75%)`;
    }

    const x = this.player.x;
    const y = this.player.y;
    const r = this.player.radius;

    // Dynamic torch ambient glow around player
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 35;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outer bloom aura
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;

    // Outer Player Ball
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Bright Core Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
  window.uiManager.showScreen('start');
});
