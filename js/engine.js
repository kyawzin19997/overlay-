/* =========================================================================
   Bangkok Christ Church — Broadcast Graphics Engine
   State Machine, SVG Cutout Generator, Dual Renderers & Ticker Animation
   ========================================================================= */

// Runtime State
let config = { ...DEFAULT_CONFIG, frameSettings: {} };
if (!Array.isArray(config.frameAnnouncementsList) || !config.frameAnnouncementsList.length) {
  config.frameAnnouncementsList = [
    { title: 'Sunday Worship Service', details: 'Every Sunday at 10:00 AM • Sanctuary & Online' },
    { title: 'Wednesday Prayer & Bible Study', details: 'Every Wednesday at 7:00 PM • Fellowship Hall' },
    { title: 'Youth & Young Adults Fellowship', details: 'Fridays at 6:30 PM • Welcome Center' },
    { title: 'Online Tithes & Offerings', details: 'Transfer via PromptPay or visit bcc.church/give' }
  ];
}

let cues = DEFAULT_CUES.map(c => ({ ...c }));
let marqueePresets = DEFAULT_MARQUEE_PRESETS.map(m => ({ ...m }));

// Staged Preview State (for Studio Testing)
let stagedCueId = null;
let stagedConfig = { ...config };
let stagedFrameId = 'main-cam';

// Animation State Machine: 'IDLE' | 'ENTERING' | 'ACTIVE' | 'EXITING'
let animState = 'IDLE';
let isOnAir = false;
let activeCueId = null;
let activeMarqueeId = 'mq1';
let isOverlayOnly = false;
let overlayTarget = 'overlay'; // 'overlay' | 'frame'
let previewTarget = 'overlay'; // 'overlay' | 'frame'
let activeFrameId = 'main-cam';
let syncRev = 0;

let remainingDurationSec = 0;
let durationInterval = null;
let autoHideTimer = null;
let swapTimer = null;
let countdownLoopTimer = null;
let bus = null;
let lastMarqueeKey = '';
let lastCountdownFormatted = '';

/* Utility Helpers */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgbString(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el || isOverlayOnly) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2000);
}

function getFrameDef(id) {
  return FRAME_DEFS.find(f => f.id === id) || FRAME_DEFS[0];
}

function getFrameDefaultSettings(id) {
  return {
    ...FRAME_BASE_DEFAULTS,
    ...(FRAME_SPECIFIC_DEFAULTS[id] || { headerBadge: 'LIVE', panelTitle: '' })
  };
}

function getFrameSettings(id) {
  const saved = (config.frameSettings && config.frameSettings[id]) || {};
  return { ...getFrameDefaultSettings(id), ...saved };
}

function isFrameCustomized(id) {
  const saved = config.frameSettings && config.frameSettings[id];
  if (!saved) return false;
  const defs = getFrameDefaultSettings(id);
  return Object.keys(defs).some(k => saved[k] !== undefined && saved[k] !== defs[k]);
}

function getTransformedCutouts(def, fs) {
  const r = Math.max(0, Number(fs.cornerRadius ?? 14));
  return def.cutouts.map(c => ({
    ...c,
    x: fs.mirror ? (1920 - c.x - c.w) : c.x,
    r
  }));
}

function getDynamicFrameHint(def, fs) {
  const cuts = getTransformedCutouts(def, fs);
  if (!cuts.length) return 'No camera cutout (Full graphics)';
  if (cuts.length >= 2) {
    return `1: ${cuts[0].w}×${cuts[0].h} @ (${cuts[0].x},${cuts[0].y}) • 2: ${cuts[1].w}×${cuts[1].h} @ (${cuts[1].x},${cuts[1].y})`;
  }
  return `Camera Cutout: ${cuts[0].w}×${cuts[0].h} @ (${cuts[0].x},${cuts[0].y})`;
}

/* Persistence & State Sync */
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('bcc_cg_lite_v3');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.config) {
      config = {
        ...DEFAULT_CONFIG,
        ...parsed.config,
        frameSettings: { ...parsed.config.frameSettings }
      };
      if (!Array.isArray(config.frameAnnouncementsList) || !config.frameAnnouncementsList.length) {
        config.frameAnnouncementsList = [
          { title: 'Sunday Worship Service', details: 'Every Sunday at 10:00 AM • Sanctuary & Online' },
          { title: 'Wednesday Prayer & Bible Study', details: 'Every Wednesday at 7:00 PM • Fellowship Hall' }
        ];
      }
      stagedConfig = { ...config };
    }
    if (Array.isArray(parsed.cues) && parsed.cues.length) cues = parsed.cues;
    if (Array.isArray(parsed.marqueePresets) && parsed.marqueePresets.length) marqueePresets = parsed.marqueePresets;
    if (parsed.activeFrameId && FRAME_DEFS.some(f => f.id === parsed.activeFrameId)) {
      activeFrameId = parsed.activeFrameId;
      stagedFrameId = parsed.activeFrameId;
    }
    if (typeof parsed.isOnAir === 'boolean') isOnAir = parsed.isOnAir;
    if (parsed.activeCueId) activeCueId = parsed.activeCueId;
    return true;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return false;
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      config,
      cues,
      marqueePresets,
      activeFrameId,
      isOnAir,
      activeCueId,
      timestamp: Date.now()
    }));
  } catch (_) {}
}

function initSyncChannel() {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    bus = new BroadcastChannel(CHANNEL_NAME);
    bus.onmessage = (evt) => {
      const msg = evt.data;
      if (!msg || typeof msg !== 'object') return;
      handleBusMessage(msg);
    };
  } catch (e) {
    console.warn('BroadcastChannel initialization failed, running standalone:', e);
  }
}

function broadcastState(actionType, extraLiveState) {
  syncRev++;
  persistState();
  if (bus) {
    try {
      bus.postMessage({
        type: actionType || 'SYNC',
        syncRev,
        config,
        activeFrameId,
        isOnAir: (extraLiveState !== undefined) ? extraLiveState : isOnAir,
        activeCueId,
        cues,
        marqueePresets,
        timestamp: Date.now()
      });
    } catch (_) {}
  }
  updateSyncStatus('Synced');
}

function handleBusMessage(msg) {
  if (msg.config) {
    config = { ...DEFAULT_CONFIG, ...msg.config };
    stagedConfig = { ...config };
  }
  if (msg.activeFrameId && FRAME_DEFS.some(f => f.id === msg.activeFrameId)) {
    activeFrameId = msg.activeFrameId;
  }
  if (Array.isArray(msg.cues)) cues = msg.cues;
  if (Array.isArray(msg.marqueePresets)) marqueePresets = msg.marqueePresets;
  if (typeof msg.isOnAir === 'boolean') {
    if (msg.isOnAir !== isOnAir) {
      msg.isOnAir ? playIntro() : playOutro();
    }
  }
  if (msg.activeCueId !== undefined) activeCueId = msg.activeCueId;

  if (typeof populateAllInputs === 'function') populateAllInputs();
  if (typeof renderCues === 'function') renderCues();
  if (typeof renderMarqueePresets === 'function') renderMarqueePresets();
  if (typeof renderFrameSelectorGrid === 'function') renderFrameSelectorGrid();
  if (typeof renderFrameContextEditor === 'function') renderFrameContextEditor(activeFrameId);
  if (typeof renderDeckView === 'function') renderDeckView();
  if (typeof renderDockView === 'function') renderDockView();
  if (typeof renderFeedView === 'function') renderFeedView();

  renderLowerThirdCanvas();
  renderActiveFrame();
  updateSyncStatus('Remote Updated');
}

function updateSyncStatus(text) {
  const el = document.getElementById('sync-status-text');
  if (!el) return;
  el.textContent = text;
  clearTimeout(el._syncTimer);
  el._syncTimer = setTimeout(() => {
    el.textContent = 'Live Ready';
  }, 2500);
}

/* =========================================================================
   ANIMATION & STATE MACHINE CONTROLLERS
   ========================================================================= */
function triggerShow() {
  if (animState === 'ENTERING' || (animState === 'ACTIVE' && isOnAir)) return;
  clearTimeout(autoHideTimer);
  clearTimeout(swapTimer);
  isOnAir = true;
  playIntro();
  startDurationTimer();
  broadcastState('SHOW', true);
}

function triggerHide() {
  if (!isOnAir && animState === 'IDLE') return;
  clearTimeout(autoHideTimer);
  clearTimeout(swapTimer);
  stopDurationTimer();
  isOnAir = false;
  activeCueId = null;
  playOutro();
  broadcastState('HIDE', false);
}

function triggerSwapLive(durationSec) {
  clearTimeout(swapTimer);
  if (!isOnAir) {
    triggerShow();
    if (durationSec) remainingDurationSec = durationSec;
    return;
  }
  animState = 'EXITING';
  setProgramLowerThirdClasses('is-exiting', true);
  swapTimer = setTimeout(() => {
    renderLowerThirdCanvas();
    setProgramLowerThirdClasses('is-exiting', false);
    setProgramLowerThirdClasses('is-active', true);
    animState = 'ACTIVE';
    if (durationSec || (config.autoHide && config.durationSec)) {
      startDurationTimer(durationSec || config.durationSec);
    }
    broadcastState('SWAP', true);
  }, 320);
}

function playIntro() {
  animState = 'ENTERING';
  isOnAir = true;
  updateTallyUI(true);
  const progLt = document.getElementById('cg-lt') || document.querySelector('.cg-lt-program');
  if (progLt) {
    progLt.classList.remove('is-exiting');
    progLt.classList.add('is-active');
  }
  setTimeout(() => {
    animState = 'ACTIVE';
    updateTallyUI(true);
  }, 450);
}

function playOutro() {
  animState = 'EXITING';
  isOnAir = false;
  updateTallyUI(false);
  const progLt = document.getElementById('cg-lt') || document.querySelector('.cg-lt-program');
  if (progLt) {
    progLt.classList.add('is-exiting');
    progLt.classList.remove('is-active');
  }
  setTimeout(() => {
    animState = 'IDLE';
    if (progLt) progLt.classList.remove('is-exiting');
    updateTallyUI(false);
    if (typeof renderCues === 'function') renderCues();
  }, 380);
}

function setProgramLowerThirdClasses(cls, add) {
  const el = document.getElementById('cg-lt');
  if (el) {
    if (add) el.classList.add(cls);
    else el.classList.remove(cls);
  }
}

function clearAllGraphics() {
  triggerHide();
  config.showTicker = false;
  const chk = document.getElementById('ctrl-show-ticker');
  if (chk) chk.checked = false;
  renderLowerThirdCanvas();
  renderActiveFrame();
  broadcastState('CLEAR_ALL', false);
  showToast('EMERGENCY CLEAR: All overlays removed');
}

/* Duration Countdown & Tally UI */
function startDurationTimer(customSec) {
  stopDurationTimer();
  const dur = customSec !== undefined ? customSec : (config.autoHide ? config.durationSec : 0);
  if (!dur || dur <= 0) {
    remainingDurationSec = 0;
    updateTallyUI(true);
    return;
  }
  remainingDurationSec = dur;
  updateTallyUI(true);
  durationInterval = setInterval(() => {
    remainingDurationSec--;
    if (remainingDurationSec <= 0) {
      stopDurationTimer();
      triggerHide();
    } else {
      updateTallyUI(true);
    }
  }, 1000);
}

function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
  remainingDurationSec = 0;
}

function updateTallyUI(live) {
  const pill = document.getElementById('tally-pill');
  const dot = document.getElementById('tally-dot');
  const text = document.getElementById('tally-text');
  const timer = document.getElementById('tally-timer');
  if (pill && dot && text && timer) {
    if (live) {
      pill.className = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-500 text-[11px] font-bold tracking-wider text-red-200 shadow-sm';
      dot.className = 'w-2 h-2 rounded-full bg-red-500 animate-pulse';
      text.textContent = 'ON AIR';
      timer.textContent = remainingDurationSec > 0 ? `(${remainingDurationSec}s)` : '';
    } else {
      pill.className = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-bold tracking-wider text-zinc-400';
      dot.className = 'w-2 h-2 rounded-full bg-zinc-600';
      text.textContent = 'STANDBY';
      timer.textContent = '';
    }
  }

  const dockPill = document.getElementById('dock-tally-pill');
  const dockText = document.getElementById('dock-tally-text');
  const dockTimer = document.getElementById('dock-tally-timer');
  if (dockPill && dockText && dockTimer) {
    if (live) {
      dockPill.className = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-950/90 border border-red-500 text-[10px] font-bold text-red-200';
      dockText.textContent = 'ON AIR';
      dockTimer.textContent = remainingDurationSec > 0 ? `(${remainingDurationSec}s)` : '';
    } else {
      dockPill.className = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400';
      dockText.textContent = 'STANDBY';
      dockTimer.textContent = '';
    }
  }
}

/* =========================================================================
   CANVAS RENDERERS (Dual Instance for Preview & Program)
   ========================================================================= */
function renderAllCanvases() {
  // 1. Program Canvas (Live On Air Output)
  renderCanvasInstance({
    prefix: 'program',
    cfg: config,
    isLive: true
  });

  // 2. Preview Canvas (Staged / Testing Output)
  renderCanvasInstance({
    prefix: 'preview',
    cfg: stagedConfig,
    isLive: false
  });
}

function renderCanvasInstance({ prefix, cfg, isLive }) {
  const canvas = document.getElementById(`${prefix}-cg-canvas`) || document.getElementById('cg-canvas');
  const lt = document.getElementById(`${prefix}-cg-lt`) || document.getElementById('cg-lt');
  if (!canvas || !lt) return;

  canvas.dataset.theme = cfg.theme || 'bcc-crimson';
  canvas.style.setProperty('--bg-opacity', cfg.bgOpacity || 0.94);
  canvas.style.setProperty('--lt-scale', cfg.scale || 1.0);
  canvas.classList.toggle('has-marquee', !!cfg.showTicker);

  lt.classList.toggle('cg-lt-program', isLive);
  lt.classList.toggle('cg-lt-preview', !isLive);

  // In Preview stage, show content immediately for live inspection
  if (!isLive) {
    lt.classList.add('is-active');
    lt.classList.remove('is-exiting');
  }

  // Animation style
  lt.classList.remove('style-modern-slide', 'style-minimal-fade', 'style-elegant-reveal', 'style-classic-bar');
  lt.classList.add(`style-${cfg.animStyle || 'modern-slide'}`);

  // Mode
  lt.classList.remove('mode-speaker', 'mode-sermon', 'mode-scripture', 'mode-announcement');
  lt.classList.add(`mode-${cfg.mode || 'speaker'}`);

  // Text contents
  const catEl = canvas.querySelector('.cg-cat');
  if (catEl) catEl.textContent = cfg.category || 'SPEAKER';

  const priEl = canvas.querySelector('.cg-primary');
  if (priEl) priEl.textContent = cfg.primary || '';

  const secEl = canvas.querySelector('.cg-secondary');
  if (secEl) secEl.textContent = cfg.secondary || '';

  const churchEl = canvas.querySelector('.cg-church');
  const lineEl = canvas.querySelector('.cg-meta-line');
  const liveChurch = canvas.querySelector('.cg-live-church');
  if (cfg.churchName) {
    if (churchEl) { churchEl.textContent = cfg.churchName; churchEl.style.display = 'inline'; }
    if (lineEl) lineEl.style.display = 'inline-block';
    if (liveChurch) liveChurch.textContent = cfg.churchName;
  } else {
    if (churchEl) churchEl.style.display = 'none';
    if (lineEl) lineEl.style.display = 'none';
    if (liveChurch) liveChurch.textContent = 'LIVE';
  }

  const badgeEl = canvas.querySelector('.cg-badge');
  if (badgeEl) {
    if (cfg.badge) {
      badgeEl.textContent = cfg.badge;
      badgeEl.classList.add('has-badge');
    } else {
      badgeEl.classList.remove('has-badge');
    }
  }

  // Logo
  const logoSlot = canvas.querySelector('.cg-logo-slot');
  const logoImg = canvas.querySelector('.cg-logo-img');
  const defLogo = canvas.querySelector('.cg-default-logo');
  if (logoSlot) logoSlot.classList.toggle('hidden-slot', !cfg.showLogo);
  if (logoImg && defLogo) {
    if (cfg.customLogo) {
      if (logoImg.getAttribute('src') !== cfg.customLogo) logoImg.src = cfg.customLogo;
      logoImg.classList.remove('hidden');
      defLogo.classList.add('hidden');
    } else {
      logoImg.classList.add('hidden');
      defLogo.classList.remove('hidden');
    }
  }

  // Live Bug
  const liveBug = canvas.querySelector('.cg-live-bug');
  if (liveBug) liveBug.classList.toggle('is-visible', !!cfg.showLive);

  // Marquee rendering
  renderMarqueeInstance(canvas, cfg);
}

function renderLowerThirdCanvas() {
  renderAllCanvases();
}

/* =========================================================================
   SCROLLING NEWS TICKER (Diffed & Smooth Animation)
   ========================================================================= */
function renderMarqueeInstance(canvas, cfg) {
  const bar = canvas.querySelector('.cg-marquee');
  const tagEl = canvas.querySelector('.cg-marquee-tag span:last-child');
  const track = canvas.querySelector('.cg-marquee-track');
  if (!bar || !track) return;

  bar.classList.toggle('is-visible', !!cfg.showTicker);
  bar.classList.toggle('is-paused', !!cfg.tickerPaused);
  bar.style.setProperty('--marquee-duration', `${cfg.marqueeSpeed || 32}s`);
  if (tagEl) tagEl.textContent = cfg.marqueeTag || 'CHURCH NEWS';

  const key = String(cfg.marqueeText || '').trim();
  if (key === track.dataset.lastKey && track.innerHTML) return;
  track.dataset.lastKey = key;

  const messages = key
    .split('|')
    .map(m => m.trim())
    .filter(Boolean);

  if (!messages.length) {
    track.innerHTML = '<span class="cg-marquee-item">Welcome to Bangkok Christ Church</span>';
    return;
  }

  const itemsHtml = messages.map(m => `
    <span class="cg-marquee-item">
      <span>${esc(m)}</span>
      <span class="cg-marquee-sep">✦</span>
    </span>
  `).join('');

  track.innerHTML = itemsHtml + itemsHtml; // duplicate for continuous loop
}

function toggleTickerPause() {
  config.tickerPaused = !config.tickerPaused;
  stagedConfig.tickerPaused = config.tickerPaused;
  renderLowerThirdCanvas();
  broadcastState('SYNC', isOnAir);
  showToast(config.tickerPaused ? 'Ticker Paused' : 'Ticker Resumed');
}

/* Structured Announcements Parsing */
function parseAnnouncements() {
  if (Array.isArray(config.frameAnnouncementsList) && config.frameAnnouncementsList.length) {
    return config.frameAnnouncementsList.filter(a => a.title || a.details).slice(0, 5);
  }
  const lines = String(config.frameAnnouncements || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!lines.length) {
    return [{ title: 'Sunday Worship Service', details: 'Every Sunday at 10:00 AM • Sanctuary & Online' }];
  }
  return lines.map(line => {
    const idx = line.indexOf('|');
    if (idx === -1) return { title: line, details: '' };
    return {
      title: line.slice(0, idx).trim(),
      details: line.slice(idx + 1).trim()
    };
  });
}

/* Countdown Engine */
function formatRemainingCountdown() {
  let secs = 0;
  if (config.countdownMode === 'duration') {
    if (config.countdownRunning && config.countdownEndTs > 0) {
      const diff = Math.max(0, Math.floor((config.countdownEndTs - Date.now()) / 1000));
      secs = diff;
      config.countdownRemainingSec = diff;
      if (diff === 0) config.countdownRunning = false;
    } else {
      secs = config.countdownRemainingSec || (config.countdownMinutes * 60) || 300;
    }
  } else {
    const now = new Date();
    const [targetH, targetM] = (config.countdownTargetTime || '10:00').split(':').map(Number);
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetH, targetM, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  }

  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
}

function startCountdownLoop() {
  if (countdownLoopTimer) clearInterval(countdownLoopTimer);
  countdownLoopTimer = setInterval(() => {
    const formatted = formatRemainingCountdown();
    const readout = document.getElementById('ctrl-cd-readout');
    if (readout) readout.textContent = formatted;

    const displays = document.querySelectorAll('.fr-countdown-digits');
    displays.forEach(d => {
      d.textContent = formatted;
    });
  }, 1000);
}

// CommonJS export fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    config, stagedConfig, cues, marqueePresets, activeFrameId, stagedFrameId,
    esc, hexToRgbString, showToast, getFrameDef, getFrameSettings, isFrameCustomized,
    getTransformedCutouts, getDynamicFrameHint, loadSavedState, persistState,
    broadcastState, initSyncChannel, triggerShow, triggerHide, triggerSwapLive,
    clearAllGraphics, renderAllCanvases, renderCanvasInstance, renderLowerThirdCanvas,
    renderMarqueeInstance, toggleTickerPause, parseAnnouncements,
    formatRemainingCountdown, startCountdownLoop
  };
}
