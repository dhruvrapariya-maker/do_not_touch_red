/**
 * Obstacle and Hazard Engine for "DON'T TOUCH THE RED"
 * Implements diverse hazard patterns, fair hitboxes, and near-miss tracking.
 */

class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.coins = [];
    this.nearMissThreshold = 22; // Pixels beyond player radius
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.patternTimer = 0;
    this.currentPattern = 'mixed';
  }

  clear() {
    this.obstacles = [];
    this.coins = [];
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.patternTimer = 0;
  }

  // --- SPAWNERS ---

  spawnFallingBar(width, height, speedMultiplier) {
    const isHorizontal = Math.random() > 0.4;
    const barThickness = 16;
    const gapSize = Math.max(90, Math.min(140, (isHorizontal ? width : height) * 0.28));

    if (isHorizontal) {
      // Horizontal bar moving down
      const gapX = Math.random() * (width - gapSize - 40) + 20;
      const speed = (110 + Math.random() * 40) * speedMultiplier;

      // Left segment
      this.obstacles.push({
        type: 'rect',
        x: 0,
        y: -barThickness,
        w: gapX,
        h: barThickness,
        vx: 0,
        vy: speed,
        color: '#ff003c',
        nearMissed: false
      });

      // Right segment
      this.obstacles.push({
        type: 'rect',
        x: gapX + gapSize,
        y: -barThickness,
        w: width - (gapX + gapSize),
        h: barThickness,
        vx: 0,
        vy: speed,
        color: '#ff003c',
        nearMissed: false
      });
    } else {
      // Vertical bar moving sideways
      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -barThickness : width;
      const speed = (fromLeft ? 1 : -1) * (110 + Math.random() * 40) * speedMultiplier;
      const gapY = Math.random() * (height - gapSize - 40) + 20;

      // Top segment
      this.obstacles.push({
        type: 'rect',
        x: startX,
        y: 0,
        w: barThickness,
        h: gapY,
        vx: speed,
        vy: 0,
        color: '#ff003c',
        nearMissed: false
      });

      // Bottom segment
      this.obstacles.push({
        type: 'rect',
        x: startX,
        y: gapY + gapSize,
        w: barThickness,
        h: height - (gapY + gapSize),
        vx: speed,
        vy: 0,
        color: '#ff003c',
        nearMissed: false
      });
    }
  }

  spawnBouncingOrb(width, height, speedMultiplier) {
    const radius = 14 + Math.random() * 8;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * width; y = -radius; }
    else if (side === 1) { x = width + radius; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = height + radius; }
    else { x = -radius; y = Math.random() * height; }

    const speed = (130 + Math.random() * 70) * speedMultiplier;
    const targetX = width * 0.5 + (Math.random() - 0.5) * (width * 0.6);
    const targetY = height * 0.5 + (Math.random() - 0.5) * (height * 0.6);
    const angle = Math.atan2(targetY - y, targetX - x);

    this.obstacles.push({
      type: 'orb',
      x: x,
      y: y,
      radius: radius,
      baseRadius: radius,
      pulsePhase: Math.random() * Math.PI * 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      bounces: 3, // Bounces off walls up to 3 times
      color: '#ff003c',
      nearMissed: false
    });
  }

  spawnHomingChaser(width, height, playerX, playerY, speedMultiplier) {
    // Only max 2 chasers active at once
    const activeChasers = this.obstacles.filter(o => o.type === 'chaser').length;
    if (activeChasers >= 2) return;

    // Spawn from edge furthest from player
    const spawnFromTop = playerY > height * 0.5;
    const x = Math.random() * width;
    const y = spawnFromTop ? -20 : height + 20;

    this.obstacles.push({
      type: 'chaser',
      x: x,
      y: y,
      radius: 12,
      maxSpeed: (115 + Math.random() * 30) * speedMultiplier,
      vx: 0,
      vy: 0,
      color: '#ff0055',
      lifetime: 9, // Despawns after 9 seconds
      nearMissed: false
    });
  }

  spawnRotatingBlade(width, height, speedMultiplier) {
    const isCenter = Math.random() > 0.4;
    const x = isCenter ? width * 0.5 + (Math.random() - 0.5) * (width * 0.4) : (Math.random() > 0.5 ? -40 : width + 40);
    const y = isCenter ? height * 0.5 + (Math.random() - 0.5) * (height * 0.4) : (Math.random() * height);
    const length = 110 + Math.random() * 60;

    this.obstacles.push({
      type: 'blade',
      x: x,
      y: y,
      length: length,
      angle: Math.random() * Math.PI,
      rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.6 + Math.random() * 1.4) * speedMultiplier,
      vx: isCenter ? (Math.random() - 0.5) * 20 : (x < 0 ? 30 : -30) * speedMultiplier,
      vy: (Math.random() - 0.5) * 20,
      lifetime: 10,
      color: '#ff1744',
      nearMissed: false
    });
  }

  spawnLaserSweeper(width, height) {
    const isHorizontal = Math.random() > 0.5;
    const pos = isHorizontal ? Math.random() * (height - 80) + 40 : Math.random() * (width - 80) + 40;

    // Audio warning cue
    if (window.soundEngine) {
      window.soundEngine.playWarning();
    }

    this.obstacles.push({
      type: 'laser',
      isHorizontal: isHorizontal,
      pos: pos,
      warningDuration: 1.1, // Telegraph warning duration in seconds
      activeDuration: 0.8, // Active deadly beam duration
      timer: 0,
      state: 'warning', // 'warning', 'active', 'fading'
      nearMissed: false
    });
  }

  spawnCoin(width, height) {
    const margin = 50;
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);

    this.coins.push({
      x: x,
      y: y,
      radius: 11,
      spinAngle: Math.random() * Math.PI * 2,
      pulse: 0,
      lifetime: 12, // Coins last 12s before despawning
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15
    });
  }

  // --- UPDATE ENGINE ---

  update(dt, width, height, player, speedMultiplier, isFever) {
    const activeSpeed = isFever ? speedMultiplier * 0.45 : speedMultiplier; // Slowed in fever mode

    // 1. Spawning Timers
    this.spawnTimer += dt;
    this.coinTimer += dt;

    // Base obstacle spawn rate scales with speed multiplier
    const spawnInterval = Math.max(0.65, 1.8 / Math.pow(speedMultiplier, 0.7));
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;

      // Select hazard based on progression
      const roll = Math.random();
      if (roll < 0.38) {
        this.spawnFallingBar(width, height, activeSpeed);
      } else if (roll < 0.68) {
        this.spawnBouncingOrb(width, height, activeSpeed);
      } else if (roll < 0.85) {
        this.spawnRotatingBlade(width, height, activeSpeed);
      } else if (roll < 0.94 && speedMultiplier >= 1.25) {
        this.spawnLaserSweeper(width, height);
      } else if (speedMultiplier >= 1.4) {
        this.spawnHomingChaser(width, height, player.x, player.y, activeSpeed);
      } else {
        this.spawnBouncingOrb(width, height, activeSpeed);
      }
    }

    // Coin Spawner (every 3-5 seconds, max 4 coins on screen)
    if (this.coinTimer >= 3.2 && this.coins.length < 4) {
      this.coinTimer = 0;
      this.spawnCoin(width, height);
    }

    // 2. Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.type === 'rect') {
        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;
        // Cull offscreen
        if (obs.y > height + 60 || obs.y < -60 || obs.x > width + 60 || obs.x < -60) {
          this.obstacles.splice(i, 1);
          continue;
        }
      } else if (obs.type === 'orb') {
        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;
        obs.pulsePhase += dt * 5;
        obs.radius = obs.baseRadius + Math.sin(obs.pulsePhase) * 2;

        // Bounce off walls
        if (obs.bounces > 0) {
          if (obs.x - obs.radius < 0 && obs.vx < 0) {
            obs.vx *= -1;
            obs.bounces--;
          } else if (obs.x + obs.radius > width && obs.vx > 0) {
            obs.vx *= -1;
            obs.bounces--;
          }
          if (obs.y - obs.radius < 0 && obs.vy < 0) {
            obs.vy *= -1;
            obs.bounces--;
          } else if (obs.y + obs.radius > height && obs.vy > 0) {
            obs.vy *= -1;
            obs.bounces--;
          }
        } else {
          // Cull after out of bounces and offscreen
          if (obs.x < -100 || obs.x > width + 100 || obs.y < -100 || obs.y > height + 100) {
            this.obstacles.splice(i, 1);
            continue;
          }
        }
      } else if (obs.type === 'chaser') {
        // Track player gently
        const angle = Math.atan2(player.y - obs.y, player.x - obs.x);
        const accel = 120 * dt;
        obs.vx += Math.cos(angle) * accel;
        obs.vy += Math.sin(angle) * accel;

        // Drag / max speed clamp
        const currentSpeed = Math.hypot(obs.vx, obs.vy);
        if (currentSpeed > obs.maxSpeed) {
          obs.vx = (obs.vx / currentSpeed) * obs.maxSpeed;
          obs.vy = (obs.vy / currentSpeed) * obs.maxSpeed;
        }

        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;

        obs.lifetime -= dt;
        if (obs.lifetime <= 0) {
          if (window.particleSystem) {
            window.particleSystem.emitExplosion(obs.x, obs.y, 10);
          }
          this.obstacles.splice(i, 1);
          continue;
        }
      } else if (obs.type === 'blade') {
        obs.x += obs.vx * dt;
        obs.y += obs.vy * dt;
        obs.angle += obs.rotSpeed * dt;
        obs.lifetime -= dt;

        if (obs.lifetime <= 0) {
          this.obstacles.splice(i, 1);
          continue;
        }
      } else if (obs.type === 'laser') {
        obs.timer += dt;
        if (obs.state === 'warning') {
          if (obs.timer >= obs.warningDuration) {
            obs.state = 'active';
            obs.timer = 0;
            // Play shockwave or spark along the line
            if (window.particleSystem) {
              const cx = obs.isHorizontal ? width * 0.5 : obs.pos;
              const cy = obs.isHorizontal ? obs.pos : height * 0.5;
              window.particleSystem.emitShockwave(cx, cy, 70, '#ff003c');
            }
          }
        } else if (obs.state === 'active') {
          if (obs.timer >= obs.activeDuration) {
            this.obstacles.splice(i, 1);
            continue;
          }
        }
      }
    }

    // 3. Update Coins (Magnetic pull towards player!)
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.spinAngle += dt * 4;
      coin.pulse += dt * 3;
      coin.lifetime -= dt;

      // Magnetic attraction if within 85px
      const distToPlayer = Math.hypot(player.x - coin.x, player.y - coin.y);
      if (distToPlayer < 90) {
        const pullFactor = (1 - distToPlayer / 90) * 280 * dt;
        const angle = Math.atan2(player.y - coin.y, player.x - coin.x);
        coin.vx += Math.cos(angle) * pullFactor;
        coin.vy += Math.sin(angle) * pullFactor;
      }

      coin.x += coin.vx * dt;
      coin.y += coin.vy * dt;
      coin.vx *= 0.95;
      coin.vy *= 0.95;

      // Keep inside bounds
      coin.x = Math.max(coin.radius, Math.min(width - coin.radius, coin.x));
      coin.y = Math.max(coin.radius, Math.min(height - coin.radius, coin.y));

      if (coin.lifetime <= 0) {
        this.coins.splice(i, 1);
      }
    }
  }

  // --- COLLISION & NEAR-MISS DETECTION ---

  checkCollisions(player, isFever) {
    let collided = false;
    let nearMissTriggered = false;

    // If fever mode is active, obstacles don't kill player; they vaporize into bonus sparks!
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const hitResult = this.testHitAndProximity(player, obs);

      if (hitResult.hit) {
        if (isFever) {
          // Vaporize obstacle in fever mode!
          if (window.particleSystem) {
            window.particleSystem.emitExplosion(player.x, player.y, 20);
            window.particleSystem.addFloatingText(player.x, player.y - 15, '+150 SMASH!', '#ffd700', 16);
          }
          if (window.soundEngine) {
            window.soundEngine.playCoin();
          }
          this.obstacles.splice(i, 1);
          continue;
        } else {
          collided = true;
          break;
        }
      } else if (hitResult.nearMiss && !obs.nearMissed && !isFever) {
        obs.nearMissed = true;
        nearMissTriggered = true;
      }
    }

    return { collided, nearMissTriggered };
  }

  checkCoinCollection(player) {
    const collected = [];
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const dist = Math.hypot(player.x - coin.x, player.y - coin.y);
      if (dist < player.radius + coin.radius + 2) {
        collected.push(coin);
        this.coins.splice(i, 1);
      }
    }
    return collected;
  }

  testHitAndProximity(player, obs) {
    const hitRadius = player.radius;
    const proxRadius = player.radius + this.nearMissThreshold;

    if (obs.type === 'rect') {
      // Circle to AABB
      const closestX = Math.max(obs.x, Math.min(player.x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(player.y, obs.y + obs.h));
      const dist = Math.hypot(player.x - closestX, player.y - closestY);

      return {
        hit: dist < hitRadius,
        nearMiss: dist < proxRadius
      };
    } else if (obs.type === 'orb' || obs.type === 'chaser') {
      const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
      return {
        hit: dist < hitRadius + obs.radius,
        nearMiss: dist < proxRadius + obs.radius
      };
    } else if (obs.type === 'blade') {
      // Line segment collision: blade centered at obs.x, obs.y with angle and length
      const halfLen = obs.length * 0.5;
      const x1 = obs.x - Math.cos(obs.angle) * halfLen;
      const y1 = obs.y - Math.sin(obs.angle) * halfLen;
      const x2 = obs.x + Math.cos(obs.angle) * halfLen;
      const y2 = obs.y + Math.sin(obs.angle) * halfLen;

      const dist = this.distToSegment(player.x, player.y, x1, y1, x2, y2);
      const bladeThickness = 4;
      return {
        hit: dist < hitRadius + bladeThickness,
        nearMiss: dist < proxRadius + bladeThickness
      };
    } else if (obs.type === 'laser') {
      if (obs.state !== 'active') return { hit: false, nearMiss: false };
      const beamHalfWidth = 12;
      const dist = obs.isHorizontal ? Math.abs(player.y - obs.pos) : Math.abs(player.x - obs.pos);

      return {
        hit: dist < hitRadius + beamHalfWidth,
        nearMiss: dist < proxRadius + beamHalfWidth
      };
    }

    return { hit: false, nearMiss: false };
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // --- RENDERING ---

  draw(ctx, width, height, isFever) {
    // 1. Draw Coins
    this.coins.forEach(coin => {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      const scaleX = Math.cos(coin.spinAngle);

      // Outer glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;

      // Golden coin disc
      ctx.scale(scaleX, 1);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner rim & star
      ctx.strokeStyle = '#fff176';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ff8f00';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 2. Draw Obstacles
    this.obstacles.forEach(obs => {
      ctx.save();

      // In Fever mode, hazard obstacles turn to glowing gold/sparkly
      const hazardColor = isFever ? '#ffd700' : (obs.color || '#ff003c');
      ctx.shadowColor = hazardColor;
      ctx.shadowBlur = 12;

      if (obs.type === 'rect') {
        ctx.fillStyle = hazardColor;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4) : ctx.rect(obs.x, obs.y, obs.w, obs.h);
        ctx.fill();

        // Inner glowing core line
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        if (obs.w > obs.h) {
          ctx.fillRect(obs.x + 2, obs.y + obs.h * 0.35, obs.w - 4, obs.h * 0.3);
        } else {
          ctx.fillRect(obs.x + obs.w * 0.35, obs.y + 2, obs.w * 0.3, obs.h - 4);
        }
      } else if (obs.type === 'orb') {
        // Red glowing energy orb
        const grad = ctx.createRadialGradient(obs.x, obs.y, 1, obs.x, obs.y, obs.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, hazardColor);
        grad.addColorStop(1, '#8b0000');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer aura ring
        ctx.strokeStyle = hazardColor;
        ctx.globalAlpha = 0.5 + Math.sin(obs.pulsePhase) * 0.3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obs.type === 'chaser') {
        // Drone diamond / eye shape
        ctx.fillStyle = hazardColor;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Menacing glowing eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trailing spikes / tendrils
        ctx.strokeStyle = hazardColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x - obs.vx * 0.1, obs.y - obs.vy * 0.1);
        ctx.lineTo(obs.x - obs.vx * 0.3, obs.y - obs.vy * 0.3);
        ctx.stroke();
      } else if (obs.type === 'blade') {
        // Rotating laser blade
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle);

        ctx.strokeStyle = hazardColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-obs.length * 0.5, 0);
        ctx.lineTo(obs.length * 0.5, 0);
        ctx.stroke();

        // Bright core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center hub
        ctx.fillStyle = hazardColor;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'laser') {
        if (obs.state === 'warning') {
          // Warning dashed flickering laser
          const flicker = Math.sin(obs.timer * 25) > 0 ? 0.8 : 0.25;
          ctx.strokeStyle = `rgba(255, 0, 60, ${flicker})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          if (obs.isHorizontal) {
            ctx.moveTo(0, obs.pos);
            ctx.lineTo(width, obs.pos);
          } else {
            ctx.moveTo(obs.pos, 0);
            ctx.lineTo(obs.pos, height);
          }
          ctx.stroke();
        } else if (obs.state === 'active') {
          // Deadly blazing laser beam!
          ctx.strokeStyle = hazardColor;
          ctx.lineWidth = 24;
          ctx.shadowBlur = 25;
          ctx.beginPath();
          if (obs.isHorizontal) {
            ctx.moveTo(0, obs.pos);
            ctx.lineTo(width, obs.pos);
          } else {
            ctx.moveTo(obs.pos, 0);
            ctx.lineTo(obs.pos, height);
          }
          ctx.stroke();

          // Blinding white core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 8;
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }
}

// Global instance
window.obstacleManager = new ObstacleManager();
