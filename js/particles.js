/**
 * Particle and Visual FX Engine for "DON'T TOUCH THE RED"
 * High performance, zero allocation where possible, canvas rendered effects.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.bgMotes = [];
    this.initBgMotes(60);
  }

  initBgMotes(count) {
    this.bgMotes = [];
    for (let i = 0; i < count; i++) {
      this.bgMotes.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 2,
        speedY: 0.05 + Math.random() * 0.15,
        speedX: (Math.random() - 0.5) * 0.05,
        alpha: 0.1 + Math.random() * 0.35,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff0055'
      });
    }
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  // --- PARTICLE EMITTERS ---

  emitPlayerTrail(x, y, radius, color) {
    if (Math.random() > 0.6) return; // Throttled for performance & aesthetic
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: radius * (0.4 + Math.random() * 0.4),
      color: color,
      alpha: 0.6,
      decay: 0.035,
      shape: 'circle'
    });
  }

  emitNearMissSparks(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color: '#00f3ff',
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03,
        shape: 'spark'
      });
    }
  }

  emitCoinSparkles(x, y, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#ffd700' : '#ffffff',
        alpha: 1,
        decay: 0.025 + Math.random() * 0.02,
        shape: 'star'
      });
    }
  }

  emitExplosion(x, y, count = 45) {
    // Red hazard shrapnel
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#ff003c' : '#ff7700',
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        shape: 'spark'
      });
    }

    // Cyan player bits
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: '#00f3ff',
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        shape: 'circle'
      });
    }

    // Shockwave ring
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 130,
      width: 4,
      color: '#ff003c',
      alpha: 1,
      speed: 7
    });
  }

  emitShockwave(x, y, maxRadius = 100, color = '#ffd700') {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: maxRadius,
      width: 3,
      color: color,
      alpha: 1,
      speed: 6
    });
  }

  addFloatingText(x, y, text, color = '#ffffff', size = 16, subtext = '') {
    this.floatingTexts.push({
      x: x,
      y: y,
      vy: -1.4,
      text: text,
      subtext: subtext,
      color: color,
      size: size,
      scale: 1.4,
      alpha: 1,
      decay: 0.022
    });
  }

  // --- UPDATE & RENDER ---

  update(dt, width, height) {
    // 1. Background motes
    this.bgMotes.forEach(mote => {
      mote.y -= mote.speedY * dt * 30;
      mote.x += mote.speedX * dt * 30;
      if (mote.y < 0) mote.y = 1;
      if (mote.x < 0) mote.x = 1;
      if (mote.x > 1) mote.x = 0;
    });

    // 2. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt * 60;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay * dt * 60;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 4. Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      if (ft.scale > 1) {
        ft.scale -= 0.04 * dt * 60;
      }
      ft.alpha -= ft.decay * dt * 60;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  drawBackground(ctx, width, height) {
    // Cyber grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Floating dust motes
    this.bgMotes.forEach(m => {
      const px = m.x * width;
      const py = m.y * height;
      ctx.fillStyle = m.color;
      ctx.globalAlpha = m.alpha;
      ctx.beginPath();
      ctx.arc(px, py, m.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawShockwaves(ctx) {
    ctx.save();
    this.shockwaves.forEach(sw => {
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.width;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, Math.max(1, sw.radius), 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'star') {
        // Draw 4-point sparkle star
        const r = Math.max(0.5, p.radius);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - r);
        ctx.lineTo(p.x + r * 0.3, p.y);
        ctx.lineTo(p.x + r, p.y);
        ctx.lineTo(p.x + r * 0.3, p.y + r * 0.3);
        ctx.lineTo(p.x, p.y + r);
        ctx.lineTo(p.x - r * 0.3, p.y + r * 0.3);
        ctx.lineTo(p.x - r, p.y);
        ctx.lineTo(p.x - r * 0.3, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  drawFloatingTexts(ctx) {
    ctx.save();
    this.floatingTexts.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.font = `bold ${Math.round(ft.size * ft.scale)}px 'Orbitron', 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);

      if (ft.subtext) {
        ctx.font = `bold ${Math.round(ft.size * 0.65 * ft.scale)}px 'Orbitron', sans-serif`;
        ctx.fillText(ft.subtext, ft.x, ft.y + ft.size);
      }
    });
    ctx.restore();
  }
}

// Global instance
window.particleSystem = new ParticleSystem();
