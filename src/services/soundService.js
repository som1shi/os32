const STORAGE_KEY = 'os32.sound';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return { enabled: true, volume: 0.4 };
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (_) { }
}

let prefs = loadPrefs();
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function note(frequency, startTime, duration, type = 'sine', gainVal = 0.18) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainVal * prefs.volume, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

const sounds = {
  startup() {
    const ac = getCtx();
    const t = ac.currentTime + 0.1;
    note(261.63, t, 0.18, 'sine', 0.15);
    note(329.63, t + 0.20, 0.18, 'sine', 0.15);
    note(392.00, t + 0.40, 0.18, 'sine', 0.15);
    note(523.25, t + 0.60, 0.40, 'sine', 0.18);
  },

  windowOpen() {
    const ac = getCtx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.10);
    gain.gain.setValueAtTime(0.12 * prefs.volume, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.12);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  },

  windowClose() {
    const ac = getCtx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.10);
    gain.gain.setValueAtTime(0.12 * prefs.volume, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.12);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  },

  windowMinimize() {
    const ac = getCtx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
    gain.gain.setValueAtTime(0.10 * prefs.volume, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.09);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.10);
  },

  error() {
    const ac = getCtx();
    const t = ac.currentTime;
    [0, 0.18].forEach(offset => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t + offset);
      gain.gain.setValueAtTime(0.08 * prefs.volume, t + offset);
      gain.gain.linearRampToValueAtTime(0, t + offset + 0.14);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.15);
    });
  },

  notify() {
    const ac = getCtx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.14 * prefs.volume, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.28);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.30);
  },

  click() {
    const ac = getCtx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    gain.gain.setValueAtTime(0.08 * prefs.volume, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.04);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  },
};

const soundService = {
  play(event) {
    if (!prefs.enabled) return;
    try {
      if (sounds[event]) sounds[event]();
    } catch (e) {
      console.warn('soundService:', e);
    }
  },

  setEnabled(val) {
    prefs.enabled = Boolean(val);
    savePrefs(prefs);
  },

  setVolume(val) {
    prefs.volume = Math.max(0, Math.min(1, val));
    savePrefs(prefs);
  },

  isEnabled() {
    return prefs.enabled;
  },

  getVolume() {
    return prefs.volume;
  },

  toggle() {
    this.setEnabled(!prefs.enabled);
    return prefs.enabled;
  },
};

export default soundService;
