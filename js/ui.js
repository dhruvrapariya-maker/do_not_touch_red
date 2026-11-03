/**
 * UI / UX & Viral Features Controller for "DON'T TOUCH THE RED"
 * Handles screens, dialogs, roasts, brag card generation, and notifications.
 */

const FUNNY_ROASTS = [
  "You touched the red. The ONE rule. You literally had ONE job.",
  "Did the red obstacle offend you, or did you just want to hug it?",
  "My grandma dodges faster than that, and she's playing on a toaster.",
  "Was that lag, or are your reflexes currently buffering?",
  "The red obstacle didn't even move and you still ran into it.",
  "Near-miss? More like near-hit, immediately followed by actual hit.",
  "Blink and you missed it. Well, actually, you didn't miss it at all.",
  "Legend has it that nobody has ever touched red that hard.",
  "Rumor has it the red obstacle felt bad for you.",
  "Try playing with your eyes open next round!",
  "Score: Not enough. Respect: 0. Press Restart to reclaim dignity.",
  "Speed was at level 1 and you already surrendered.",
  "A glowing golden coin was right there and you chose death instead.",
  "Gravity called: it wants its collision back.",
  "The red obstacle sends its warmest regards.",
  "Are your fingers okay, or did they go on strike?",
  "You survived almost as long as an ice cube in a volcano.",
  "Warning: Touching red is scientifically proven to end your run.",
  "You zigged when you definitely, unquestionably should have zagged.",
  "At least you looked cool for the first 4 seconds."
];

const MOTIVATIONAL_CHALLENGES = [
  "Can you beat your best score?",
  "Your friend's score is waiting to be crushed!",
  "One more run. You were so close to the next level!",
  "Just 15 more seconds to reach the leaderboard!",
  "Dare to beat your daily record today?"
];

class UIManager {
  constructor() {
    this.currentScreen = 'start'; // 'start', 'playing', 'gameover', 'paused'
    this.toastTimeout = null;
    this.initElements();
    this.bindEvents();
    this.updateDailyBanner();
  }

  initElements() {
    // Screens
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameHud = document.getElementById('gameHud');

    // Modals
    this.leaderboardModal = document.getElementById('leaderboardModal');
    this.achievementsModal = document.getElementById('achievementsModal');
    this.skinsModal = document.getElementById('skinsModal');
    this.settingsModal = document.getElementById('settingsModal');
    this.bragModal = document.getElementById('bragModal');

    // HUD Elements
    this.hudScore = document.getElementById('hudScore');
    this.hudHighScore = document.getElementById('hudHighScore');
    this.hudCoins = document.getElementById('hudCoins');
    this.hudLevel = document.getElementById('hudLevel');
    this.hudFeverBar = document.getElementById('hudFeverBar');

    // Game Over Elements
    this.goScore = document.getElementById('goScore');
    this.goHighScore = document.getElementById('goHighScore');
    this.goTime = document.getElementById('goTime');
    this.goCoins = document.getElementById('goCoins');
    this.goNearMisses = document.getElementById('goNearMisses');
    this.goRoast = document.getElementById('goRoast');
    this.goMotivation = document.getElementById('goMotivation');
    this.goNewRecordBadge = document.getElementById('goNewRecordBadge');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Buttons in Start Screen
    document.getElementById('btnStartGame')?.addEventListener('click', () => {
      this.playSoundClick();
      window.gameEngine.startGame(false);
    });

    document.getElementById('btnDailyChallenge')?.addEventListener('click', () => {
      this.playSoundClick();
      window.gameEngine.startGame(true);
    });

    document.getElementById('btnOpenLeaderboard')?.addEventListener('click', () => {
      this.openModal(this.leaderboardModal);
      this.renderLeaderboard();
    });

    document.getElementById('btnOpenAchievements')?.addEventListener('click', () => {
      this.openModal(this.achievementsModal);
      this.renderAchievements();
    });

    document.getElementById('btnOpenSkins')?.addEventListener('click', () => {
      this.openModal(this.skinsModal);
      this.renderSkins();
    });

    document.getElementById('btnOpenSettings')?.addEventListener('click', () => {
      this.openModal(this.settingsModal);
      this.populateSettings();
    });

    // Buttons in Game Over Screen
    document.getElementById('btnRestart')?.addEventListener('click', () => {
      this.playSoundClick();
      window.gameEngine.restartGame();
    });

    document.getElementById('btnShareScore')?.addEventListener('click', () => {
      this.handleShareScore();
    });

    document.getElementById('btnBragCard')?.addEventListener('click', () => {
      this.generateAndShowBragCard();
    });

    document.getElementById('btnGoHome')?.addEventListener('click', () => {
      this.showScreen('start');
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.playSoundClick();
        const modal = e.target.closest('.modal-overlay');
        if (modal) this.closeModal(modal);
      });
    });

    // Close modals clicking on backdrop
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });

    // HUD controls
    document.getElementById('btnToggleMute')?.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      this.updateMuteButton(isMuted);
    });

    document.getElementById('btnPause')?.addEventListener('click', () => {
      window.gameEngine.togglePause();
    });

    document.getElementById('btnResume')?.addEventListener('click', () => {
      window.gameEngine.togglePause();
    });

    document.getElementById('btnQuitToMenu')?.addEventListener('click', () => {
      window.gameEngine.quitToMenu();
    });
  }

  playSoundClick() {
    if (window.soundEngine) window.soundEngine.playClick();
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    this.startScreen.classList.toggle('active', screenName === 'start');
    this.gameOverScreen.classList.toggle('active', screenName === 'gameover');
    this.pauseOverlay.classList.toggle('active', screenName === 'paused');
    this.gameHud.classList.toggle('active', screenName === 'playing' || screenName === 'paused');

    if (screenName === 'start') {
      this.updateStartScreenStats();
      this.updateDailyBanner();
    }
  }

  updateMuteButton(isMuted) {
    const btn = document.getElementById('btnToggleMute');
    if (btn) {
      btn.innerHTML = isMuted ? '🔇' : '🔊';
      btn.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
    }
  }

  updateStartScreenStats() {
    const storage = window.dttrStorage;
    const startHighScore = document.getElementById('startHighScore');
    const startCoins = document.getElementById('startCoins');
    if (startHighScore) startHighScore.textContent = storage.highScore.toLocaleString();
    if (startCoins) startCoins.textContent = storage.coins.toLocaleString();
    this.updateMuteButton(window.soundEngine.isMuted);
  }

  updateDailyBanner() {
    const dailyInfo = window.dttrStorage.getDailyInfo();
    const dailyDateEl = document.getElementById('dailyDate');
    const dailyStatusEl = document.getElementById('dailyStatus');
    if (dailyDateEl) {
      const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      dailyDateEl.textContent = today;
    }
    if (dailyStatusEl) {
      if (dailyInfo.bestScore > 0) {
        dailyStatusEl.textContent = `Today's Record: ${dailyInfo.bestScore.toLocaleString()} pts`;
      } else {
        dailyStatusEl.textContent = 'Unplayed Today! 2x Coin Bonus';
      }
    }
  }

  updateHud(data) {
    // data: { score, highScore, coins, level, feverPercent }
    if (this.hudScore) this.hudScore.textContent = data.score.toLocaleString();
    if (this.hudHighScore) this.hudHighScore.textContent = data.highScore.toLocaleString();
    if (this.hudCoins) this.hudCoins.textContent = data.coins;
    if (this.hudLevel) this.hudLevel.textContent = `LVL ${data.level}`;
    if (this.hudFeverBar) {
      this.hudFeverBar.style.width = `${Math.min(100, Math.max(0, data.feverPercent))}%`;
      this.hudFeverBar.parentElement.classList.toggle('fever-ready', data.feverPercent >= 100);
    }
  }

  showGameOver(runData, isNewRecord) {
    this.showScreen('gameover');

    this.goScore.textContent = runData.score.toLocaleString();
    this.goHighScore.textContent = window.dttrStorage.highScore.toLocaleString();
    this.goTime.textContent = `${runData.time.toFixed(1)}s`;
    this.goCoins.textContent = runData.coins;
    this.goNearMisses.textContent = runData.nearMisses;

    // Show/hide glowing new record badge
    this.goNewRecordBadge.classList.toggle('hidden', !isNewRecord);

    // Random funny roast
    const roast = FUNNY_ROASTS[Math.floor(Math.random() * FUNNY_ROASTS.length)];
    this.goRoast.textContent = `"${roast}"`;

    // Motivational prompt
    const motivation = MOTIVATIONAL_CHALLENGES[Math.floor(Math.random() * MOTIVATIONAL_CHALLENGES.length)];
    this.goMotivation.textContent = motivation;

    this.lastRunData = runData;
  }

  // --- MODALS & MENUS ---

  openModal(modal) {
    this.playSoundClick();
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
    }
  }

  renderLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;
    const entries = window.dttrStorage.leaderboard;

    if (entries.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No games recorded yet. Dodge some red!</div>`;
      return;
    }

    let html = `
      <div class="leaderboard-table">
        <div class="lb-header">
          <span>Rank</span>
          <span>Score</span>
          <span>Time</span>
          <span>Coins</span>
          <span>Date</span>
        </div>
    `;

    entries.forEach((e, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
      html += `
        <div class="lb-row ${idx === 0 ? 'lb-first' : ''}">
          <span class="lb-rank">${medal}</span>
          <span class="lb-score">${e.score.toLocaleString()}</span>
          <span class="lb-time">${e.time}s</span>
          <span class="lb-coins">🪙 ${e.coins}</span>
          <span class="lb-date">${e.date}</span>
        </div>
      `;
    });

    html += `</div>`;
    listEl.innerHTML = html;
  }

  renderAchievements() {
    const gridEl = document.getElementById('achievementsGrid');
    if (!gridEl) return;
    const unlocked = window.dttrStorage.achievements;
    const list = window.ACHIEVEMENTS_LIST;

    let html = '';
    list.forEach(ach => {
      const isUnlocked = !!unlocked[ach.id];
      html += `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-title">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          <div class="ach-status">${isUnlocked ? '✅' : '🔒'}</div>
        </div>
      `;
    });

    gridEl.innerHTML = html;
  }

  renderSkins() {
    const gridEl = document.getElementById('skinsGrid');
    if (!gridEl) return;
    const unlocked = window.dttrStorage.unlockedSkins;
    const current = window.dttrStorage.selectedSkin;
    const skins = window.SKINS_LIST;

    let html = '';
    skins.forEach(skin => {
      const isUnlocked = unlocked.includes(skin.id);
      const isSelected = current === skin.id;

      html += `
        <div class="skin-card ${isSelected ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'}" data-skin-id="${skin.id}">
          <div class="skin-ball-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f)' : skin.color}; box-shadow: 0 0 15px ${skin.glow};"></div>
          <div class="skin-name">${skin.name}</div>
          <div class="skin-condition">${isUnlocked ? (isSelected ? 'EQUIPPED' : 'TAP TO EQUIP') : skin.unlock}</div>
        </div>
      `;
    });

    gridEl.innerHTML = html;

    // Attach click events
    gridEl.querySelectorAll('.skin-card.unlocked').forEach(card => {
      card.addEventListener('click', () => {
        const skinId = card.getAttribute('data-skin-id');
        window.dttrStorage.selectSkin(skinId);
        this.playSoundClick();
        this.renderSkins();
      });
    });
  }

  populateSettings() {
    const s = window.dttrStorage.settings;
    const soundToggle = document.getElementById('settingSound');
    const controlSelect = document.getElementById('settingControl');
    const shakeToggle = document.getElementById('settingShake');

    if (soundToggle) soundToggle.checked = s.soundEnabled;
    if (controlSelect) controlSelect.value = s.controlMode;
    if (shakeToggle) shakeToggle.checked = s.screenShake;

    soundToggle?.onchange?.(null);
    soundToggle?.addEventListener('change', (e) => {
      window.dttrStorage.saveSettings({ soundEnabled: e.target.checked });
      window.soundEngine.setMuted(!e.target.checked);
      this.updateMuteButton(!e.target.checked);
    });

    controlSelect?.addEventListener('change', (e) => {
      window.dttrStorage.saveSettings({ controlMode: e.target.value });
    });

    shakeToggle?.addEventListener('change', (e) => {
      window.dttrStorage.saveSettings({ screenShake: e.target.checked });
    });
  }

  showAchievementToast(ach) {
    if (window.soundEngine) window.soundEngine.playAchievement();
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${ach.icon}</div>
      <div class="toast-body">
        <div class="toast-badge">ACHIEVEMENT UNLOCKED</div>
        <div class="toast-name">${ach.name}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // --- VIRAL SHARING & BRAG CARD ---

  handleShareScore() {
    const run = this.lastRunData || { score: window.dttrStorage.highScore, time: 25, coins: 5 };
    const shareText = `🔴 DON'T TOUCH THE RED 🔴\nI survived ${run.time.toFixed(1)}s and scored ${run.score.toLocaleString()} points!\nCan you beat my score? Play free right now:`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: "DON'T TOUCH THE RED",
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      // Fallback copy to clipboard
      navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`).then(() => {
        alert('Score & Challenge link copied to clipboard! Paste it to challenge your friends!');
      }).catch(() => {
        alert(shareText);
      });
    }
  }

  generateAndShowBragCard() {
    const run = this.lastRunData || { score: 1000, time: 20, coins: 8, nearMisses: 3 };
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Cyberpunk dark background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, 800, 450);

    // Glowing border
    ctx.strokeStyle = '#ff003c';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 780, 430);

    // Inner subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < 780; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 430);
      ctx.stroke();
    }
    for (let y = 20; y < 430; y += 40) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(780, y);
      ctx.stroke();
    }

    // Title Banner
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 15;
    ctx.font = '900 36px Orbitron, Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("DON'T TOUCH THE RED", 400, 70);

    // Subtitle
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText("OFFICIAL SURVIVAL RECORD", 400, 105);

    // Score Display Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(160, 130, 480, 120);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(160, 130, 480, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px Orbitron, sans-serif';
    ctx.fillText(run.score.toLocaleString(), 400, 200);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText("POINTS EARNED", 400, 232);

    // Stats row
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillText(`⏱️ SURVIVAL: ${run.time.toFixed(1)}s`, 250, 290);
    ctx.fillText(`🪙 COINS: ${run.coins}`, 400, 290);
    ctx.fillText(`⚡ NEAR MISSES: ${run.nearMisses}`, 560, 290);

    // Challenge Callout
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillText("CAN YOU SURVIVE LONGER?", 400, 355);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Orbitron, sans-serif';
    ctx.fillText("Play for free in your browser • No install required", 400, 395);

    // Render image into brag card modal
    const imgDataUrl = canvas.toDataURL('image/png');
    const imgContainer = document.getElementById('bragCardImgContainer');
    if (imgContainer) {
      imgContainer.innerHTML = `<img src="${imgDataUrl}" alt="Brag Card" style="width: 100%; max-width: 600px; border-radius: 8px; border: 1px solid #00f3ff;">`;
    }

    const downloadBtn = document.getElementById('btnDownloadBragCard');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = imgDataUrl;
        a.download = `DontTouchTheRed_Score_${run.score}.png`;
        a.click();
      };
    }

    this.openModal(this.bragModal);
  }
}

// Global instance
window.uiManager = new UIManager();
