/**
 * Storage Manager for "DON'T TOUCH THE RED"
 * Handles persistent game data, achievements, leaderboard, skins, and settings.
 */

const STORAGE_KEYS = {
  HIGH_SCORE: 'dttr_high_score',
  COINS: 'dttr_coins_total',
  STATS: 'dttr_lifetime_stats',
  ACHIEVEMENTS: 'dttr_achievements',
  SKINS: 'dttr_skins',
  SELECTED_SKIN: 'dttr_selected_skin',
  LEADERBOARD: 'dttr_leaderboard',
  DAILY: 'dttr_daily_challenge',
  SETTINGS: 'dttr_settings'
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  sfxVolume: 0.8,
  controlMode: 'offset', // 'offset' (smart touch offset), 'direct', or 'relative'
  particleQuality: 'high', // 'high', 'medium', 'low'
  screenShake: true
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  totalTime: 0,
  totalCoins: 0,
  totalNearMisses: 0,
  highestLevel: 1,
  highestScore: 0
};

const ACHIEVEMENTS_LIST = [
  { id: 'first_dodge', name: 'First Dodge', desc: 'Survive for at least 10 seconds', icon: '⏱️', goal: 10, type: 'time' },
  { id: 'reflex_master', name: 'Reflex Master', desc: 'Survive for 30 seconds', icon: '⚡', goal: 30, type: 'time' },
  { id: 'zen_survivor', name: 'Zen Survivor', desc: 'Survive for 60 seconds without blinking', icon: '🧘', goal: 60, type: 'time' },
  { id: 'coin_collector', name: 'Treasure Hunter', desc: 'Collect 15 coins in a single run', icon: '🪙', goal: 15, type: 'run_coins' },
  { id: 'daredevil', name: 'Daredevil', desc: 'Perform 8 near-misses in a single run', icon: '🔥', goal: 8, type: 'run_near_misses' },
  { id: 'adrenaline_junkie', name: 'Adrenaline Rush', desc: 'Trigger Golden Fever mode', icon: '🌟', goal: 1, type: 'fever' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach Hazard Level 5', icon: '🚀', goal: 5, type: 'level' },
  { id: 'coin_hoarder', name: 'Coin Hoarder', desc: 'Amass 100 total collected coins', icon: '💰', goal: 100, type: 'total_coins' },
  { id: 'untouchable', name: 'Untouchable', desc: 'Score 2,500 points in one run', icon: '👑', goal: 2500, type: 'score' },
  { id: 'daily_warrior', name: 'Daily Contender', desc: 'Play today\'s Daily Challenge', icon: '📅', goal: 1, type: 'daily' }
];

const SKINS_LIST = [
  { id: 'cyan', name: 'Neon Cyan', color: '#00f3ff', glow: '#00c3ff', unlock: 'Default unlocked' },
  { id: 'amber', name: 'Solar Flare', color: '#ffaa00', glow: '#ff7700', unlock: 'Collect 30 total coins', reqCoins: 30 },
  { id: 'toxic', name: 'Toxic Ghost', color: '#39ff14', glow: '#00ff66', unlock: 'Get 15 Near-Misses total', reqNearMisses: 15 },
  { id: 'pink', name: 'Cyber Magenta', color: '#ff00aa', glow: '#ff0077', unlock: 'Reach a score of 1,500', reqScore: 1500 },
  { id: 'amethyst', name: 'Amethyst Void', color: '#bf55ec', glow: '#9b59b6', unlock: 'Reach Hazard Level 4', reqLevel: 4 },
  { id: 'rainbow', name: 'Rainbow Prism', color: 'rainbow', glow: '#ffffff', unlock: 'Unlock 5 Achievements', reqAchievements: 5 }
];

class StorageManager {
  constructor() {
    this.highScore = this.getNumber(STORAGE_KEYS.HIGH_SCORE, 0);
    this.coins = this.getNumber(STORAGE_KEYS.COINS, 0);
    this.stats = this.getObject(STORAGE_KEYS.STATS, DEFAULT_STATS);
    this.achievements = this.getObject(STORAGE_KEYS.ACHIEVEMENTS, {});
    this.unlockedSkins = this.getObject(STORAGE_KEYS.SKINS, ['cyan']);
    this.selectedSkin = this.getString(STORAGE_KEYS.SELECTED_SKIN, 'cyan');
    this.leaderboard = this.getObject(STORAGE_KEYS.LEADERBOARD, []);
    this.settings = this.getObject(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  getString(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  setString(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  getNumber(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? Number(val) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  setNumber(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {}
  }

  getObject(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  setObject(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      this.setNumber(STORAGE_KEYS.HIGH_SCORE, score);
      return true; // New record!
    }
    return false;
  }

  addCoins(amount) {
    this.coins += amount;
    this.stats.totalCoins += amount;
    this.setNumber(STORAGE_KEYS.COINS, this.coins);
    this.saveStats();
    this.checkSkinUnlocks();
  }

  recordGame(runData) {
    // runData: { score, time, coins, nearMisses, level, isDaily, mode }
    this.stats.gamesPlayed++;
    this.stats.totalTime += Math.floor(runData.time);
    this.stats.totalNearMisses += runData.nearMisses;
    if (runData.level > this.stats.highestLevel) {
      this.stats.highestLevel = runData.level;
    }
    if (runData.score > this.stats.highestScore) {
      this.stats.highestScore = runData.score;
    }
    this.saveStats();

    // Add to leaderboard
    const newEntry = {
      score: runData.score,
      time: Math.floor(runData.time * 10) / 10,
      coins: runData.coins,
      nearMisses: runData.nearMisses,
      level: runData.level,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      isDaily: !!runData.isDaily
    };

    this.leaderboard.push(newEntry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 5); // Keep top 5
    this.setObject(STORAGE_KEYS.LEADERBOARD, this.leaderboard);

    // Check unlocks
    const unlockedAchievements = this.checkAchievements(runData);
    this.checkSkinUnlocks();

    return {
      isNewRecord: this.saveHighScore(runData.score),
      unlockedAchievements
    };
  }

  checkAchievements(runData) {
    const newlyUnlocked = [];
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (this.achievements[ach.id]) return; // Already unlocked

      let unlock = false;
      if (ach.type === 'time' && runData.time >= ach.goal) unlock = true;
      if (ach.type === 'run_coins' && runData.coins >= ach.goal) unlock = true;
      if (ach.type === 'run_near_misses' && runData.nearMisses >= ach.goal) unlock = true;
      if (ach.type === 'score' && runData.score >= ach.goal) unlock = true;
      if (ach.type === 'level' && runData.level >= ach.goal) unlock = true;
      if (ach.type === 'fever' && runData.feversTriggered >= ach.goal) unlock = true;
      if (ach.type === 'total_coins' && this.stats.totalCoins >= ach.goal) unlock = true;
      if (ach.type === 'daily' && runData.isDaily) unlock = true;

      if (unlock) {
        this.achievements[ach.id] = {
          unlockedAt: new Date().toISOString()
        };
        newlyUnlocked.push(ach);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.setObject(STORAGE_KEYS.ACHIEVEMENTS, this.achievements);
    }
    return newlyUnlocked;
  }

  checkSkinUnlocks() {
    const unlockedCount = Object.keys(this.achievements).length;
    let modified = false;

    SKINS_LIST.forEach(skin => {
      if (this.unlockedSkins.includes(skin.id)) return;

      let unlock = false;
      if (skin.reqCoins && this.stats.totalCoins >= skin.reqCoins) unlock = true;
      if (skin.reqNearMisses && this.stats.totalNearMisses >= skin.reqNearMisses) unlock = true;
      if (skin.reqScore && this.highScore >= skin.reqScore) unlock = true;
      if (skin.reqLevel && this.stats.highestLevel >= skin.reqLevel) unlock = true;
      if (skin.reqAchievements && unlockedCount >= skin.reqAchievements) unlock = true;

      if (unlock) {
        this.unlockedSkins.push(skin.id);
        modified = true;
      }
    });

    if (modified) {
      this.setObject(STORAGE_KEYS.SKINS, this.unlockedSkins);
    }
  }

  selectSkin(skinId) {
    if (this.unlockedSkins.includes(skinId)) {
      this.selectedSkin = skinId;
      this.setString(STORAGE_KEYS.SELECTED_SKIN, skinId);
      return true;
    }
    return false;
  }

  saveStats() {
    this.setObject(STORAGE_KEYS.STATS, this.stats);
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.setObject(STORAGE_KEYS.SETTINGS, this.settings);
  }

  getDailyInfo() {
    const today = new Date().toISOString().slice(0, 10);
    const dailyData = this.getObject(STORAGE_KEYS.DAILY, {});
    if (dailyData.date !== today) {
      return {
        date: today,
        bestScore: 0,
        played: false
      };
    }
    return dailyData;
  }

  saveDailyScore(score) {
    const today = new Date().toISOString().slice(0, 10);
    const dailyData = this.getDailyInfo();
    dailyData.date = today;
    dailyData.played = true;
    if (score > dailyData.bestScore) {
      dailyData.bestScore = score;
    }
    this.setObject(STORAGE_KEYS.DAILY, dailyData);
  }
}

// Global instance
window.dttrStorage = new StorageManager();
window.ACHIEVEMENTS_LIST = ACHIEVEMENTS_LIST;
window.SKINS_LIST = SKINS_LIST;
