module.exports = `
    /* =========================================================================
       2. RUNTIME STATE & BROADCAST SYNCHRONIZATION
       ========================================================================= */
    let config = { ...DEFAULT_CONFIG, frameSettings: {} };
    let cues = DEFAULT_CUES.map(c => ({ ...c }));
    let marqueePresets = DEFAULT_MARQUEE_PRESETS.map(m => ({ ...m }));
    
    // Animation State Machine: 'IDLE' | 'ENTERING' | 'ACTIVE' | 'EXITING'
    let animState = 'IDLE';
    let isOnAir = false;
    let activeCueId = null;
    let previewCueId = null;
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
      const m = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(String(hex || '').trim());
      if (!m) return null;
      return \`\${parseInt(m[1], 16)}, \${parseInt(m[2], 16)}, \${parseInt(m[3], 16)}\`;
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
            frameSettings: parsed.config.frameSettings ? { ...parsed.config.frameSettings } : {}
          };
        }
        if (Array.isArray(parsed.cues) && parsed.cues.length) cues = parsed.cues;
        if (Array.isArray(parsed.marqueePresets) && parsed.marqueePresets.length) marqueePresets = parsed.marqueePresets;
        if (typeof parsed.onAir === 'boolean') isOnAir = parsed.onAir;
        if (parsed.activeCueId) activeCueId = parsed.activeCueId;
        if (parsed.activeFrameId) activeFrameId = parsed.activeFrameId;
        if (typeof parsed.rev === 'number') syncRev = parsed.rev;
        return true;
      } catch (_) {
        return false;
      }
    }

    function broadcastState(cmd, onAirState) {
      syncRev += 1;
      const payload = {
        cmd: cmd || 'SYNC',
        rev: syncRev,
        config,
        cues,
        marqueePresets,
        onAir: (typeof onAirState === 'boolean') ? onAirState : isOnAir,
        activeCueId,
        previewCueId,
        activeFrameId,
        activeMarqueeId,
        ts: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (_) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...payload,
            config: { ...config, customLogo: '' }
          }));
        } catch (__) {}
      }

      if (bus) {
        try { bus.postMessage(payload); } catch (_) {}
      }
    }

    function initSyncChannel() {
      if ('BroadcastChannel' in window) {
        try {
          bus = new BroadcastChannel(CHANNEL_NAME);
          bus.onmessage = (e) => {
            const msg = e.data;
            if (!msg) return;
            if (msg.type === 'HELLO_FROM_OBS') {
              if (bus) {
                bus.postMessage({
                  cmd: 'SYNC',
                  rev: syncRev,
                  config,
                  cues,
                  marqueePresets,
                  onAir: isOnAir,
                  activeCueId,
                  previewCueId,
                  activeFrameId
                });
              }
              const syncEl = document.getElementById('sync-status-text');
              if (syncEl) syncEl.textContent = 'OBS Linked';
              return;
            }
            if (msg.cmd) {
              applyIncomingPayload(msg);
            }
          };
        } catch (_) {}
      }

      window.addEventListener('storage', (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.config) applyIncomingPayload(parsed);
        } catch (_) {}
      });

      // Regular check fallback
      setInterval(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (parsed && parsed.rev && parsed.rev > syncRev) {
            applyIncomingPayload(parsed);
          }
        } catch (_) {}
      }, 600);
    }

    function applyIncomingPayload(msg) {
      if (typeof msg.rev === 'number' && msg.rev < syncRev) return;
      if (typeof msg.rev === 'number') syncRev = msg.rev;

      if (msg.config) {
        config = {
          ...DEFAULT_CONFIG,
          ...msg.config,
          frameSettings: msg.config.frameSettings ? { ...msg.config.frameSettings } : {}
        };
      }
      if (Array.isArray(msg.cues)) cues = msg.cues;
      if (Array.isArray(msg.marqueePresets)) marqueePresets = msg.marqueePresets;
      if (msg.activeFrameId) activeFrameId = msg.activeFrameId;
      if (msg.activeCueId !== undefined) activeCueId = msg.activeCueId;
      if (msg.previewCueId !== undefined) previewCueId = msg.previewCueId;

      const cmd = msg.cmd || 'SYNC';

      if (cmd === 'CLEAR_ALL') {
        executeClearAllGraphics();
      } else if (cmd === 'SWAP') {
        playCrossSwap();
      } else if (cmd === 'SHOW') {
        renderLowerThirdCanvas();
        playIntro();
      } else if (cmd === 'HIDE') {
        renderLowerThirdCanvas();
        playOutro();
      } else {
        renderLowerThirdCanvas();
        if (msg.onAir && !isOnAir) playIntro();
        else if (msg.onAir === false && isOnAir) playOutro();
      }

      renderActiveFrame();

      if (!isOverlayOnly) {
        populateAllInputs();
        renderCues();
        renderMarqueePresets();
        renderFrameSelectorGrid();
        updateSelectedFrameUrlBox();
        renderDeckView();
        renderFeedView();
      }
    }

    /* =========================================================================
       3. BULLETPROOF LOWER-THIRD ANIMATION STATE MACHINE
       ========================================================================= */
    function clearLowerThirdTimers() {
      if (swapTimer) { clearTimeout(swapTimer); swapTimer = null; }
      if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
      if (durationInterval) { clearInterval(durationInterval); durationInterval = null; }
      remainingDurationSec = 0;
      updateTallyUI();
    }

    function playIntro(customDuration) {
      clearLowerThirdTimers();
      const lt = document.getElementById('cg-lt');
      if (!lt) return;

      animState = 'ENTERING';
      lt.classList.remove('is-exiting');
      void lt.offsetWidth; // Force reflow
      lt.classList.add('is-active');

      isOnAir = true;
      animState = 'ACTIVE';
      updateTallyUI();

      // Duration auto-hide handling
      const dur = customDuration !== undefined ? customDuration : (config.autoHide ? config.durationSec : 0);
      if (dur > 0) {
        startDurationCountdown(dur);
      }
    }

    function playOutro() {
      clearLowerThirdTimers();
      const lt = document.getElementById('cg-lt');
      if (lt && lt.classList.contains('is-active')) {
        animState = 'EXITING';
        lt.classList.remove('is-active');
        lt.classList.add('is-exiting');
        setTimeout(() => {
          lt.classList.remove('is-exiting');
          animState = 'IDLE';
        }, 360);
      } else {
        animState = 'IDLE';
      }
      isOnAir = false;
      activeCueId = null;
      updateTallyUI();
    }

    function playCrossSwap(customDuration) {
      clearLowerThirdTimers();
      const lt = document.getElementById('cg-lt');
      if (!lt) return;

      if (isOnAir) {
        animState = 'EXITING';
        lt.classList.remove('is-active');
        lt.classList.add('is-exiting');
        swapTimer = setTimeout(() => {
          swapTimer = null;
          renderLowerThirdCanvas();
          lt.classList.remove('is-exiting');
          void lt.offsetWidth;
          lt.classList.add('is-active');
          animState = 'ACTIVE';
          isOnAir = true;
          updateTallyUI();
          const dur = customDuration !== undefined ? customDuration : (config.autoHide ? config.durationSec : 0);
          if (dur > 0) startDurationCountdown(dur);
        }, 340);
      } else {
        renderLowerThirdCanvas();
        playIntro(customDuration);
      }
    }

    function startDurationCountdown(seconds) {
      remainingDurationSec = Math.max(1, parseInt(seconds, 10));
      updateTallyUI();

      durationInterval = setInterval(() => {
        remainingDurationSec -= 1;
        updateTallyUI();
        if (remainingDurationSec <= 0) {
          clearInterval(durationInterval);
          durationInterval = null;
          triggerHide();
        }
      }, 1000);
    }

    function triggerShow(duration) {
      renderLowerThirdCanvas();
      playIntro(duration);
      broadcastState('SHOW', true);
    }

    function triggerHide() {
      playOutro();
      broadcastState('HIDE', false);
    }

    function triggerSwapLive(duration) {
      playCrossSwap(duration);
      broadcastState('SWAP', true);
    }

    function clearAllGraphics() {
      executeClearAllGraphics();
      broadcastState('CLEAR_ALL', false);
      showToast('Emergency: Cleared All Graphics');
    }

    function executeClearAllGraphics() {
      playOutro();
      config.showTicker = false;
      const bar = document.getElementById('cg-marquee');
      if (bar) bar.classList.remove('is-visible');
      const tickerBox = document.getElementById('ctrl-show-ticker');
      if (tickerBox) tickerBox.checked = false;
      renderLowerThirdCanvas();
      updateTallyUI();
    }

    function updateTallyUI() {
      const pill = document.getElementById('tally-pill');
      const dot = document.getElementById('tally-dot');
      const text = document.getElementById('tally-text');
      const timer = document.getElementById('tally-timer');
      if (!pill || !text || !dot) return;

      if (isOnAir) {
        pill.className = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-500/80 text-[11px] font-bold tracking-wider text-red-100 shadow-sm';
        dot.className = 'w-2 h-2 rounded-full bg-red-500 animate-pulse';
        text.textContent = \`ON AIR • \${(config.mode || 'GRAPHIC').toUpperCase()}\`;
        if (timer) {
          timer.textContent = remainingDurationSec > 0 ? \`(\${remainingDurationSec}s)\` : '';
        }
      } else {
        pill.className = 'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-bold tracking-wider text-zinc-400';
        dot.className = 'w-2 h-2 rounded-full bg-zinc-600';
        text.textContent = 'STANDBY';
        if (timer) timer.textContent = '';
      }

      // Update Deck and Feed views
      if (!isOverlayOnly) {
        renderDeckView();
        renderFeedView();
      }
    }

    /* =========================================================================
       4. LOWER-THIRD RENDERER & LOGO MARKUP
       ========================================================================= */
    function getLogoMarkup(sizePx, showFlag) {
      const visible = (typeof showFlag === 'boolean') ? showFlag : config.showLogo;
      if (!visible) return '';
      if (config.customLogo) {
        return \`<img src="\${config.customLogo}" alt="Logo" style="width:\${sizePx}px;height:\${sizePx}px;object-fit:contain;border-radius:8px;background:#fff;padding:3px;box-shadow:0 6px 18px rgba(0,0,0,0.3);flex-shrink:0;" />\`;
      }
      return \`
        <div style="width:\${sizePx}px;height:\${sizePx}px;background:#fff;border-radius:8px;padding:3px;box-shadow:0 6px 18px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
            <rect x="52" y="14" width="16" height="92" rx="4" fill="#9E1B1E" stroke="#111" stroke-width="3.2"/>
            <rect x="20" y="38" width="80" height="16" rx="4" fill="#9E1B1E" stroke="#111" stroke-width="3.2"/>
            <path d="M41 46 C46 39, 53 41, 56 49 C58 35, 68 26, 75 24 C71 34, 73 42, 80 34 C76 45, 73 53, 68 58 C73 61, 74 66, 71 69 C63 63, 53 60, 49 52 L41 46 Z" fill="#FFFFFF" stroke="#111" stroke-width="3.2" stroke-linejoin="round"/>
          </svg>
        </div>
      \`;
    }

    function renderLowerThirdCanvas() {
      const canvas = document.getElementById('cg-canvas');
      const lt = document.getElementById('cg-lt');
      if (!canvas || !lt) return;

      canvas.dataset.theme = config.theme;
      canvas.style.setProperty('--bg-opacity', config.bgOpacity);
      canvas.style.setProperty('--lt-scale', config.scale);
      canvas.classList.toggle('has-marquee', !!config.showTicker);

      // Animation Style class
      lt.classList.remove('style-modern-slide', 'style-minimal-fade', 'style-elegant-reveal', 'style-classic-bar');
      lt.classList.add(\`style-\${config.animStyle || 'modern-slide'}\`);

      // Mode class
      lt.classList.remove('mode-speaker', 'mode-sermon', 'mode-scripture', 'mode-announcement');
      lt.classList.add(\`mode-\${config.mode}\`);

      document.getElementById('cg-cat').textContent = config.category || 'LIVE';
      document.getElementById('cg-primary').textContent = config.primary || '';
      document.getElementById('cg-secondary').textContent = config.secondary || '';

      const churchEl = document.getElementById('cg-church');
      const lineEl = document.getElementById('cg-meta-line');
      const liveChurch = document.getElementById('cg-live-church');
      if (config.churchName) {
        churchEl.textContent = config.churchName;
        churchEl.style.display = 'inline';
        lineEl.style.display = 'inline-block';
        if (liveChurch) liveChurch.textContent = config.churchName;
      } else {
        churchEl.style.display = 'none';
        lineEl.style.display = 'none';
        if (liveChurch) liveChurch.textContent = 'LIVE';
      }

      const badgeEl = document.getElementById('cg-badge');
      if (config.badge) {
        badgeEl.textContent = config.badge;
        badgeEl.classList.add('has-badge');
      } else {
        badgeEl.classList.remove('has-badge');
      }

      // Logo handling
      const logoSlot = document.getElementById('cg-logo-slot');
      const logoImg = document.getElementById('cg-logo-img');
      const defLogo = document.getElementById('cg-default-logo');
      logoSlot.classList.toggle('hidden-slot', !config.showLogo);
      if (config.customLogo) {
        if (logoImg.getAttribute('src') !== config.customLogo) logoImg.src = config.customLogo;
        logoImg.classList.remove('hidden');
        defLogo.classList.add('hidden');
      } else {
        logoImg.classList.add('hidden');
        defLogo.classList.remove('hidden');
      }

      // Live Bug
      const liveBug = document.getElementById('cg-live-bug');
      if (liveBug) liveBug.classList.toggle('is-visible', !!config.showLive);

      // Render Marquee with diffing
      renderMarquee();
    }

    /* =========================================================================
       5. SCROLLING MARQUEE RENDERER (Zero-Glitch Diffed)
       ========================================================================= */
    function renderMarquee() {
      const bar = document.getElementById('cg-marquee');
      const tagEl = document.getElementById('cg-marquee-tag');
      const track = document.getElementById('cg-marquee-track');
      if (!bar || !tagEl || !track) return;

      bar.classList.toggle('is-visible', !!config.showTicker);
      bar.classList.toggle('is-paused', !!config.tickerPaused);
      bar.style.setProperty('--marquee-duration', \`\${config.marqueeSpeed || 32}s\`);
      tagEl.textContent = config.marqueeTag || 'CHURCH NEWS';

      const key = String(config.marqueeText || '').trim();
      if (key === lastMarqueeKey && track.innerHTML) return;
      lastMarqueeKey = key;

      const items = key.split('|').map(s => s.trim()).filter(Boolean);
      if (!items.length) items.push('Welcome to Bangkok Christ Church • John 14:6');

      const joinedLen = items.join('   ').length;
      const repeats = Math.max(1, Math.ceil(150 / Math.max(1, joinedLen)));
      let halfHtml = '';
      for (let i = 0; i < repeats; i++) {
        halfHtml += items
          .map(txt => \`<span class="cg-marquee-item"><span class="cg-marquee-sep"></span>\${esc(txt)}</span>\`)
          .join('');
      }
      track.innerHTML = halfHtml + halfHtml;
    }

    function toggleTickerPause() {
      config.tickerPaused = !config.tickerPaused;
      const bar = document.getElementById('cg-marquee');
      if (bar) bar.classList.toggle('is-paused', !!config.tickerPaused);
      broadcastState('SYNC', isOnAir);
      showToast(config.tickerPaused ? 'Marquee Paused' : 'Marquee Resumed');
    }

    /* =========================================================================
       6. 12 READY-MADE OBS FRAMES RENDERER ENGINE
       ========================================================================= */
    function getRemainingCountdownSeconds() {
      if (config.countdownMode === 'target') {
        const parts = String(config.countdownTargetTime || '10:00').split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return 0;

        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
        const diffMs = target.getTime() - now.getTime();
        return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
      }

      if (config.countdownRunning && config.countdownEndTs > 0) {
        return Math.max(0, Math.ceil((config.countdownEndTs - Date.now()) / 1000));
      }
      return Math.max(0, config.countdownRemainingSec || 0);
    }

    function formatRemainingCountdown() {
      const sec = getRemainingCountdownSeconds();
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = sec % 60;
      if (hrs > 0) {
        return \`\${String(hrs).padStart(2, '0')}:\${String(mins).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
      }
      return \`\${String(mins).padStart(2, '0')}:\${String(secs).padStart(2, '0')}\`;
    }

    function parseAnnouncements() {
      const lines = String(config.frameAnnouncements || '')
        .split('\\n')
        .map(l => l.trim())
        .filter(Boolean)
        .slice(0, 5);
      if (!lines.length) {
        return [{ title: 'Sunday Worship Service', detail: 'Every Sunday at 10:00 AM • Bangkok Christ Church' }];
      }
      return lines.map(line => {
        const idx = line.indexOf('|');
        if (idx === -1) return { title: line, detail: '' };
        return {
          title: line.slice(0, idx).trim(),
          detail: line.slice(idx + 1).trim()
        };
      });
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
        return \`1: \${cuts[0].w}×\${cuts[0].h} @ (\${cuts[0].x},\${cuts[0].y}) • 2: \${cuts[1].w}×\${cuts[1].h} @ (\${cuts[1].x},\${cuts[1].y})\`;
      }
      const c = cuts[0];
      return \`Cutout: \${c.w}×\${c.h} @ (\${c.x},\${c.y})\`;
    }

    function buildSvgMatteMask(cutouts, palette, fs) {
      const maskId = \`cut-mask-\${activeFrameId}\`;
      const gradId = \`matte-grad-\${activeFrameId}\`;
      const bw = Math.max(0, Number(fs.borderWidth ?? 3));
      const matteOp = Math.min(1, Math.max(0.4, Number(fs.matteOpacity ?? 1)));

      const holes = cutouts
        .map(c => \`<rect x="\${c.x}" y="\${c.y}" width="\${c.w}" height="\${c.h}" rx="\${c.r}" ry="\${c.r}" fill="black" />\`)
        .join('');

      const frames = bw > 0 ? cutouts
        .map(c => \`
          <rect x="\${c.x}" y="\${c.y}" width="\${c.w}" height="\${c.h}" rx="\${c.r}" ry="\${c.r}"
                fill="none" stroke="\${palette.accent}" stroke-width="\${bw}" stroke-opacity="0.92" />
          <rect x="\${c.x + bw}" y="\${c.y + bw}" width="\${Math.max(0, c.w - bw * 2)}" height="\${Math.max(0, c.h - bw * 2)}" rx="\${Math.max(2, c.r - bw)}" ry="\${Math.max(2, c.r - bw)}"
                fill="none" stroke="\${palette.border}" stroke-width="1" />
        \`).join('') : '';

      return \`
        <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0;display:block;">
          <defs>
            <linearGradient id="\${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="\${palette.bgStart}" />
              <stop offset="100%" stop-color="\${palette.bgEnd}" />
            </linearGradient>
            <mask id="\${maskId}">
              <rect x="0" y="0" width="1920" height="1080" fill="white" />
              \${holes}
            </mask>
          </defs>
          <rect x="0" y="0" width="1920" height="1080" fill="url(#\${gradId})" fill-opacity="\${matteOp}" mask="url(#\${maskId})" />
          <rect x="0" y="0" width="1920" height="4" fill="\${palette.accent}" mask="url(#\${maskId})" />
          \${frames}
        </svg>
      \`;
    }

    function buildFrameHeader(rightBadgeText, fs) {
      if (!fs.showHeader) return '';
      const ts = Number(fs.textScale || 1);
      const sz = (n) => Math.round(n * ts);
      const showLive = fs.showLive && config.showLive;
      return \`
        <div class="fr-header">
          <div class="fr-brand">
            \${getLogoMarkup(56, fs.showLogo)}
            <div>
              <div class="fr-brand-title" style="font-size:\${sz(24)}px;">\${esc(config.churchName || 'BANGKOK CHRIST CHURCH')}</div>
              <div class="fr-brand-sub" style="font-size:\${sz(13)}px;">\${esc(config.badge || 'JOHN 14:6')} • LIVE BROADCAST</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            \${rightBadgeText ? \`
              <div style="padding:8px 16px;border-radius:6px;background:rgba(var(--accent-rgb),0.18);border:1px solid rgba(var(--accent-rgb),0.48);font-family:'Montserrat',sans-serif;font-size:\${sz(13)}px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:rgb(var(--text-rgb));">
                \${esc(rightBadgeText)}
              </div>
            \` : ''}
            \${showLive ? \`
              <div class="fr-live-pill" style="font-size:\${sz(14)}px;">
                <span class="cg-live-dot"></span>
                <span>LIVE</span>
              </div>
            \` : ''}
          </div>
        </div>
      \`;
    }

    function renderActiveFrame() {
      const container = document.getElementById('frame-canvas');
      if (!container) return;

      const def = getFrameDef(activeFrameId);
      const fs = getFrameSettings(def.id);
      const effectiveTheme = fs.theme === 'inherit' ? config.theme : fs.theme;
      const basePalette = THEME_PALETTES[effectiveTheme] || THEME_PALETTES['bcc-crimson'];
      const customRgb = fs.customAccent ? hexToRgbString(fs.customAccent) : null;
      const palette = customRgb
        ? { ...basePalette, accent: fs.customAccent, accentSoft: \`rgba(\${customRgb}, 0.38)\` }
        : basePalette;

      const ts = Number(fs.textScale || 1);
      const sz = (n) => Math.round(n * ts);
      const r = Math.max(0, Number(fs.cornerRadius ?? 14));
      const radiusStyle = \`border-radius:\${r}px;\`;
      const cutouts = getTransformedCutouts(def, fs);
      const posX = (x, w) => (fs.mirror ? (1920 - x - w) : x);

      container.dataset.theme = effectiveTheme;
      if (customRgb) {
        container.style.setProperty('--accent-rgb', customRgb);
      } else {
        container.style.removeProperty('--accent-rgb');
      }

      // Studio Mock Guide
      const mockLayer = document.getElementById('preview-mock-layer');
      if (mockLayer) {
        if (!isOverlayOnly && previewTarget === 'frame' && cutouts.length) {
          mockLayer.classList.remove('hidden');
          mockLayer.innerHTML = cutouts.map(c => \`
            <div style="position:absolute;left:\${c.x}px;top:\${c.y}px;width:\${c.w}px;height:\${c.h}px;border-radius:\${c.r}px;display:flex;align-items:center;justify-content:center;">
              <div style="padding:12px 24px;border-radius:10px;background:rgba(0,0,0,0.5);border:2px dashed rgba(255,255,255,0.35);color:rgba(255,255,255,0.85);font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
                \${esc(c.label)}
              </div>
            </div>
          \`).join('');
        } else {
          mockLayer.classList.add('hidden');
          mockLayer.innerHTML = '';
        }
      }

      let innerHtml = buildSvgMatteMask(cutouts, palette, fs);

      // Frame 1: main-cam
      if (def.id === 'main-cam') {
        const showLive = fs.showLive && config.showLive;
        const leftBadge = fs.mirror ? 'right:52px;' : 'left:52px;';
        const rightBadge = fs.mirror ? 'left:52px;' : 'right:52px;';
        innerHtml += \`
          \${showLive ? \`
            <div class="fr-live-pill" style="position:absolute;top:48px;\${leftBadge}font-size:\${sz(14)}px;">
              <span class="cg-live-dot"></span>
              <span>\${esc(fs.headerBadge || 'LIVE')}</span>
              <span style="color:rgb(var(--muted-rgb));font-weight:600;padding-left:10px;border-left:1px solid rgba(var(--text-rgb),0.2);">\${esc(config.churchName)}</span>
            </div>
          \` : ''}
          \${fs.showHeader ? \`
            <div style="position:absolute;top:44px;\${rightBadge}display:flex;align-items:center;gap:14px;padding:10px 18px;border-radius:10px;background:rgba(var(--primary-rgb),0.85);border:1px solid rgba(var(--text-rgb),0.14);">
              \${getLogoMarkup(44, fs.showLogo)}
              <div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(14)}px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgb(var(--text-rgb));">\${esc(config.churchName)}</div>
                <div style="font-size:\${sz(11)}px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgb(var(--accent-rgb));">\${esc(config.badge || 'JOHN 14:6')}</div>
              </div>
            </div>
          \` : ''}
          \${fs.showInfoBar ? \`
            <div style="position:absolute;left:52px;right:52px;bottom:48px;display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-radius:10px;background:rgba(var(--primary-rgb),0.85);border:1px solid rgba(var(--text-rgb),0.12);border-left:5px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(11)}px;">\${esc(config.category || 'LIVE')}</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(22)}px;font-weight:800;color:rgb(var(--text-rgb));">\${esc(config.primary)}</div>
              </div>
              <div style="font-size:\${sz(16)}px;color:rgb(var(--muted-rgb));font-weight:500;">\${esc(config.secondary)}</div>
            </div>
          \` : ''}
        \`;
      }

      // Frame 2: pastor-info
      else if (def.id === 'pastor-info') {
        const camLeft = posX(48, 1152);
        const cardLeft = posX(1236, 636);
        innerHtml += buildFrameHeader(fs.headerBadge || 'SUNDAY MESSAGE', fs);
        innerHtml += \`
          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${camLeft}px;top:834px;width:1152px;height:190px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(13)}px;">\${esc(config.category || "TODAY'S MESSAGE")}</div>
                <div class="fr-title-lg" style="font-size:\${sz(32)}px;margin-top:6px;">\${esc(config.primary)}</div>
                <div class="fr-sub-md" style="font-size:\${sz(19)}px;margin-top:4px;">\${esc(config.secondary)}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${cardLeft}px;top:156px;width:636px;height:868px;\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:42px 36px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:20px;flex:1;justify-content:center;">
              \${getLogoMarkup(96, fs.showLogo)}
              <div>
                <div class="fr-section-tag">\${esc(fs.panelTitle || 'SENIOR PASTOR')}</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(32)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:6px;">
                  \${esc(config.primary || 'Pastor John Smith')}
                </div>
                <div style="font-size:\${sz(18)}px;color:rgb(var(--muted-rgb));margin-top:4px;">
                  \${esc(config.secondary || 'Bangkok Christ Church')}
                </div>
              </div>
              <div style="width:64px;height:3px;background:rgb(var(--accent-rgb));border-radius:2px;"></div>
              <div style="padding:14px 20px;border-radius:10px;background:rgba(var(--primary-rgb),0.5);border:1px solid rgba(var(--text-rgb),0.1);width:100%;">
                <div class="fr-section-tag" style="font-size:\${sz(11)}px;">KEY SCRIPTURE</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(20)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:4px;">
                  \${esc(config.frameVerseRef || 'John 14:6')}
                </div>
              </div>
            </div>
            <div style="padding:18px 32px;background:rgba(var(--primary-rgb),0.5);border-top:1px solid rgba(var(--text-rgb),0.08);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgb(var(--muted-rgb));">\${esc(config.churchName)}</span>
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;color:rgb(var(--accent-rgb));">\${esc(config.badge || 'JOHN 14:6')}</span>
            </div>
          </div>
        \`;
      }

      // Frame 3: cam-bible
      else if (def.id === 'cam-bible') {
        const camLeft = posX(48, 1152);
        const cardLeft = posX(1236, 636);
        const cleanVerse = config.frameVerseText.replace(/^[“"]|[”"]$/g, '');
        const baseVersePx = cleanVerse.length > 180 ? 25 : cleanVerse.length > 110 ? 29 : 34;
        innerHtml += buildFrameHeader(fs.headerBadge || 'SCRIPTURE READING', fs);
        innerHtml += \`
          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${camLeft}px;top:834px;width:1152px;height:190px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(13)}px;">\${esc(config.category || 'SPEAKER')}</div>
                <div class="fr-title-lg" style="font-size:\${sz(32)}px;margin-top:6px;">\${esc(config.primary)}</div>
                <div class="fr-sub-md" style="font-size:\${sz(19)}px;margin-top:4px;">\${esc(config.secondary)}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${cardLeft}px;top:156px;width:636px;height:868px;\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:34px 40px 20px;border-bottom:1px solid rgba(var(--text-rgb),0.10);display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(12)}px;">\${esc(fs.panelTitle || 'HOLY BIBLE')}</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(30)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:6px;">\${esc(config.frameVerseRef || 'John 14:6')}</div>
              </div>
              \${config.frameVerseVer ? \`
                <div style="padding:6px 12px;border-radius:6px;background:rgba(var(--accent-rgb),0.22);border:1px solid rgba(var(--accent-rgb),0.5);font-family:'Montserrat',sans-serif;font-size:\${sz(14)}px;font-weight:800;letter-spacing:0.12em;color:rgb(var(--text-rgb));">
                  \${esc(config.frameVerseVer)}
                </div>
              \` : ''}
            </div>
            <div style="padding:40px;flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;">
              <div style="font-family:Georgia,serif;font-size:78px;line-height:0.5;color:rgba(var(--accent-rgb),0.55);">“</div>
              <div class="fr-verse-text" style="font-size:\${sz(baseVersePx)}px;">
                \${esc(cleanVerse)}
              </div>
            </div>
            <div style="padding:20px 40px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--text-rgb),0.08);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgb(var(--muted-rgb));">\${esc(config.churchName)}</span>
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;color:rgb(var(--accent-rgb));">SCRIPTURE</span>
            </div>
          </div>
        \`;
      }

      // Frame 4: cam-announce
      else if (def.id === 'cam-announce') {
        const items = parseAnnouncements();
        const camLeft = posX(48, 1216);
        const panelLeft = posX(1296, 576);
        innerHtml += buildFrameHeader(fs.headerBadge || 'CHURCH ANNOUNCEMENTS', fs);
        innerHtml += \`
          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${camLeft}px;top:862px;width:1216px;height:168px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(13)}px;">\${esc(config.category || 'WORSHIP SERVICE')}</div>
                <div class="fr-title-lg" style="font-size:\${sz(32)}px;margin-top:6px;">\${esc(config.primary)}</div>
                <div class="fr-sub-md" style="font-size:\${sz(19)}px;margin-top:4px;">\${esc(config.secondary)}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${panelLeft}px;top:148px;width:576px;height:882px;\${radiusStyle}display:flex;flex-direction:column;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:26px 30px 16px;border-bottom:1px solid rgba(var(--text-rgb),0.10);">
              <div class="fr-section-tag" style="font-size:\${sz(12)}px;">UPCOMING EVENTS</div>
              <div class="fr-title-lg" style="font-size:\${sz(28)}px;margin-top:6px;">\${esc(fs.panelTitle || 'Church News')}</div>
            </div>
            <div style="padding:20px 26px;display:flex;flex-direction:column;gap:14px;flex:1;overflow:hidden;">
              \${items.map(it => \`
                <div class="fr-announce-item">
                  <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(18)}px;font-weight:700;color:rgb(var(--text-rgb));line-height:1.3;">\${esc(it.title)}</div>
                  \${it.detail ? \`<div style="font-size:\${sz(15)}px;color:rgb(var(--muted-rgb));margin-top:4px;line-height:1.4;">\${esc(it.detail)}</div>\` : ''}
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      // Frame 5: cam-slides
      else if (def.id === 'cam-slides') {
        const slidesLeft = posX(48, 1216);
        const sideLeft = posX(1296, 576);
        innerHtml += buildFrameHeader(fs.headerBadge || config.frameSlideTag || 'SERMON SLIDES', fs);
        innerHtml += \`
          <div class="fr-window-tag" style="left:\${slidesLeft + 18}px;top:164px;">
            <span style="width:7px;height:7px;border-radius:50%;background:rgb(var(--accent-rgb));"></span>
            <span>\${esc(config.frameSlideTag || 'SERMON SLIDES')}</span>
          </div>

          <div class="fr-window-tag" style="left:\${sideLeft + 16}px;top:164px;">
            <span class="cg-live-dot" style="width:7px;height:7px;"></span>
            <span>\${esc(fs.panelTitle || 'LIVE SPEAKER')}</span>
          </div>

          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${slidesLeft}px;top:862px;width:1216px;height:168px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(13)}px;">\${esc(config.category || "TODAY'S MESSAGE")}</div>
                <div class="fr-title-lg" style="font-size:\${sz(32)}px;margin-top:6px;">\${esc(config.primary)}</div>
                <div class="fr-sub-md" style="font-size:\${sz(19)}px;margin-top:4px;">\${esc(config.secondary)}</div>
              </div>
              <div style="text-align:right;">
                <div class="fr-section-tag" style="font-size:\${sz(12)}px;">KEY SCRIPTURE</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(22)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:6px;">\${esc(config.frameVerseRef || 'John 14:6')}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${sideLeft}px;top:502px;width:576px;height:528px;\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:28px 30px;display:flex;flex-direction:column;gap:16px;flex:1;">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(12)}px;">SCRIPTURE FOCUS</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(22)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:4px;">
                  \${esc(config.frameVerseRef)} <span style="color:rgb(var(--accent-rgb));font-size:\${sz(15)}px;">\${esc(config.frameVerseVer)}</span>
                </div>
              </div>
              <div class="fr-verse-text" style="font-size:\${sz(22)}px;">
                “\${esc(config.frameVerseText.replace(/^[“"]|[”"]$/g, ''))}”
              </div>
            </div>
            <div style="padding:18px 30px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--text-rgb),0.08);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgb(var(--muted-rgb));">\${esc(config.churchName)}</span>
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;color:rgb(var(--accent-rgb));">\${esc(config.badge || 'JOHN 14:6')}</span>
            </div>
          </div>
        \`;
      }

      // Frame 6: cam-pip
      else if (def.id === 'cam-pip') {
        innerHtml += \`
          <div class="fr-window-tag" style="left:48px;top:48px;">
            <span class="cg-live-dot" style="width:7px;height:7px;"></span>
            <span>\${esc(fs.headerBadge || 'LIVE')}</span>
            <span style="color:rgb(var(--muted-rgb));margin-left:6px;">\${esc(config.churchName)}</span>
          </div>
          <div class="fr-window-tag" style="left:1530px;top:856px;">
            <span>\${esc(fs.panelTitle || 'SANCTUARY')}</span>
          </div>
        \`;
      }

      // Frame 7: worship
      else if (def.id === 'worship') {
        innerHtml += buildFrameHeader(fs.headerBadge || 'WORSHIP & PRAISE', fs);
        innerHtml += \`
          <div class="fr-card" style="position:absolute;left:48px;top:852px;width:1824px;height:186px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-left:7px solid rgb(var(--accent-rgb));">
            <div style="display:flex;align-items:center;gap:24px;">
              \${getLogoMarkup(68, fs.showLogo)}
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(12)}px;">\${esc(fs.panelTitle || 'CURRENT SONG')}</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(30)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:4px;">
                  \${esc(config.frameSongTitle || 'Amazing Grace')}
                </div>
                <div style="font-size:\${sz(16)}px;color:rgb(var(--muted-rgb));margin-top:4px;">
                  \${esc(config.frameSongDetails || 'Worship Team • Bangkok Christ Church')}
                </div>
              </div>
            </div>
            <div style="text-align:right;">
              <span style="padding:10px 22px;border-radius:8px;background:rgba(var(--accent-rgb),0.2);border:1px solid rgba(var(--accent-rgb),0.5);font-family:'Montserrat',sans-serif;font-size:\${sz(14)}px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:rgb(var(--text-rgb));">
                \${esc(config.badge || 'JOHN 14:6')}
              </span>
            </div>
          </div>
        \`;
      }

      // Frame 8: prayer
      else if (def.id === 'prayer') {
        const camLeft = posX(48, 1152);
        const cardLeft = posX(1236, 636);
        innerHtml += buildFrameHeader(fs.headerBadge || 'INTERCESSORY PRAYER', fs);
        innerHtml += \`
          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${camLeft}px;top:834px;width:1152px;height:190px;\${radiusStyle}display:flex;align-items:center;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag" style="font-size:\${sz(13)}px;">LET US PRAY TOGETHER</div>
                <div class="fr-title-lg" style="font-size:\${sz(30)}px;margin-top:6px;">\${esc(config.primary || 'Prayer for Healing and Hope')}</div>
                <div class="fr-sub-md" style="font-size:\${sz(18)}px;margin-top:4px;">\${esc(config.secondary || 'Philippians 4:6-7')}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${cardLeft}px;top:156px;width:636px;height:868px;\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:36px;display:flex;flex-direction:column;gap:20px;flex:1;justify-content:center;">
              <div class="fr-section-tag">\${esc(fs.panelTitle || 'PRAYER PETITIONS')}</div>
              <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(28)}px;font-weight:800;color:rgb(var(--text-rgb));line-height:1.3;">
                \${esc(config.framePrayerTitle || 'Prayer for Our Church and City')}
              </div>
              <div class="fr-verse-text" style="font-size:\${sz(22)}px;color:rgb(var(--muted-rgb));">
                \${esc(config.framePrayerDetails || 'Heavenly Father, we lift up all individuals and families in need of your peace, healing, and guidance.')}
              </div>
            </div>
            <div style="padding:20px 36px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--text-rgb),0.08);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;color:rgb(var(--muted-rgb));">\${esc(config.churchName)}</span>
              <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;color:rgb(var(--accent-rgb));">AMEN</span>
            </div>
          </div>
        \`;
      }

      // Frame 9: interview
      else if (def.id === 'interview') {
        const hostInfo = (config.frameInterviewHost || 'Pastor John Smith | Host').split('|');
        const guestInfo = (config.frameInterviewGuest || 'Dr. David Lee | Visiting Missionary').split('|');
        innerHtml += buildFrameHeader(fs.headerBadge || 'CONVERSATION & DIALOGUE', fs);
        innerHtml += \`
          <div class="fr-card" style="position:absolute;left:48px;top:862px;width:912px;height:168px;\${radiusStyle}display:flex;align-items:center;padding:0 30px;border-left:6px solid rgb(var(--accent-rgb));">
            <div>
              <div class="fr-section-tag">\${esc(hostInfo[1] ? hostInfo[1].trim() : 'HOST')}</div>
              <div class="fr-title-lg" style="font-size:\${sz(28)}px;margin-top:4px;">\${esc(hostInfo[0].trim())}</div>
              <div class="fr-sub-md" style="font-size:\${sz(16)}px;margin-top:2px;">\${esc(config.churchName)}</div>
            </div>
          </div>

          <div class="fr-card" style="position:absolute;left:960px;top:862px;width:912px;height:168px;\${radiusStyle}display:flex;align-items:center;padding:0 30px;border-left:6px solid rgb(var(--accent-rgb));">
            <div>
              <div class="fr-section-tag">\${esc(guestInfo[1] ? guestInfo[1].trim() : 'GUEST')}</div>
              <div class="fr-title-lg" style="font-size:\${sz(28)}px;margin-top:4px;">\${esc(guestInfo[0].trim())}</div>
              <div class="fr-sub-md" style="font-size:\${sz(16)}px;margin-top:2px;">Special Discussion</div>
            </div>
          </div>
        \`;
      }

      // Frame 10: welcome-cam
      else if (def.id === 'welcome-cam') {
        const formatted = formatRemainingCountdown();
        lastCountdownFormatted = formatted;
        const camLeft = posX(48, 1152);
        const cardLeft = posX(1236, 636);
        const digitsSize = formatted.length > 5 ? sz(70) : sz(94);
        innerHtml += buildFrameHeader(fs.headerBadge || 'STARTING SOON', fs);
        innerHtml += \`
          \${fs.showInfoBar ? \`
            <div class="fr-card" style="position:absolute;left:\${camLeft}px;top:834px;width:1152px;height:190px;\${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
              <div>
                <div class="fr-section-tag">WELCOME TO WORSHIP</div>
                <div class="fr-title-lg" style="font-size:\${sz(32)}px;margin-top:6px;">\${esc(config.frameWelcomeTitle)}</div>
                <div class="fr-sub-md" style="font-size:\${sz(19)}px;margin-top:4px;">\${esc(config.frameWelcomeSub)}</div>
              </div>
            </div>
          \` : ''}

          <div class="fr-card" style="position:absolute;left:\${cardLeft}px;top:156px;width:636px;height:868px;\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;text-align:center;">
            <div class="fr-card-top-bar"></div>
            <div style="padding:48px 40px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;">
              \${getLogoMarkup(100, fs.showLogo)}
              <div>
                <div class="fr-section-tag" style="margin-bottom:6px;">WELCOME TO</div>
                <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(28)}px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:rgb(var(--text-rgb));">
                  \${esc(config.churchName)}
                </div>
              </div>
              <div style="width:64px;height:3px;background:rgb(var(--accent-rgb));border-radius:2px;"></div>
              <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(15)}px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgb(var(--muted-rgb));">
                \${esc(fs.panelTitle || 'SERVICE BEGINS IN')}
              </div>
              <div id="frame-countdown-display" class="fr-countdown-digits" data-base-scale="\${ts}" style="font-size:\${digitsSize}px;">\${formatted}</div>
              <div style="padding:8px 20px;border-radius:999px;background:rgba(var(--accent-rgb),0.2);border:1px solid rgba(var(--accent-rgb),0.5);font-family:'Montserrat',sans-serif;font-size:\${sz(13)}px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:rgb(var(--text-rgb));">
                \${esc(config.badge || 'JOHN 14:6')}
              </div>
            </div>
            <div style="padding:18px 30px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--text-rgb),0.08);font-size:14px;color:rgb(var(--muted-rgb));">
              Please invite your friends and family to join online!
            </div>
          </div>
        \`;
      }

      // Frame 11: event-announce
      else if (def.id === 'event-announce') {
        const items = parseAnnouncements().slice(0, 3);
        innerHtml += buildFrameHeader(fs.headerBadge || 'UPCOMING EVENTS', fs);
        innerHtml += \`
          <div style="position:absolute;left:48px;top:680px;right:48px;height:360px;display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;">
            \${items.map(it => \`
              <div class="fr-card" style="\${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;padding:24px 28px;border-top:4px solid rgb(var(--accent-rgb));">
                <div>
                  <div class="fr-section-tag" style="font-size:\${sz(11)}px;">EVENT BULLETIN</div>
                  <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(22)}px;font-weight:800;color:rgb(var(--text-rgb));margin-top:8px;line-height:1.25;">
                    \${esc(it.title)}
                  </div>
                  \${it.detail ? \`
                    <div style="font-size:\${sz(15)}px;color:rgb(var(--muted-rgb));margin-top:10px;line-height:1.4;">
                      \${esc(it.detail)}
                    </div>
                  \` : ''}
                </div>
                <div style="font-size:\${sz(13)}px;font-weight:700;color:rgb(var(--accent-rgb));text-transform:uppercase;margin-top:14px;">
                  Bangkok Christ Church
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
      }

      // Frame 12: countdown-closing
      else if (def.id === 'countdown-closing') {
        innerHtml += \`
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px;gap:26px;">
            \${getLogoMarkup(120, fs.showLogo)}
            <div>
              <div class="fr-section-tag" style="font-size:\${sz(16)}px;margin-bottom:8px;">\${esc(fs.panelTitle || 'THANK YOU FOR JOINING US')}</div>
              <div style="font-family:'Montserrat',sans-serif;font-size:\${sz(46)}px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:rgb(var(--text-rgb));">
                \${esc(config.churchName)}
              </div>
              <div style="font-size:\${sz(22)}px;color:rgb(var(--muted-rgb));margin-top:10px;">
                “The Lord bless you and keep you; the Lord make his face shine upon you.” — Numbers 6:24-25
              </div>
            </div>
            <div style="width:120px;height:4px;background:rgb(var(--accent-rgb));border-radius:2px;"></div>
            <div style="display:flex;gap:36px;font-size:\${sz(16)}px;color:rgb(var(--muted-rgb));font-weight:500;">
              <div>Sunday Worship: <strong>10:00 AM</strong></div>
              <div>•</div>
              <div>Wednesday Prayer: <strong>7:00 PM</strong></div>
              <div>•</div>
              <div>Website: <strong>bcc.church</strong></div>
            </div>
          </div>
        \`;
      }

      container.innerHTML = \`<div class="fr-layer">\${innerHtml}</div>\`;
    }

    /* Countdown interval loop */
    function startCountdownLoop() {
      if (countdownLoopTimer) return;
      countdownLoopTimer = setInterval(() => {
        const formatted = formatRemainingCountdown();
        if (formatted === lastCountdownFormatted) return;
        lastCountdownFormatted = formatted;

        const disp = document.getElementById('frame-countdown-display');
        if (disp) {
          disp.textContent = formatted;
          const baseScale = parseFloat(disp.dataset.baseScale) || 1;
          disp.style.fontSize = \`\${Math.round((formatted.length > 5 ? 70 : 94) * baseScale)}px\`;
        }
        const ctrlReadout = document.getElementById('ctrl-cd-readout');
        if (ctrlReadout) ctrlReadout.textContent = formatted;

        updateCountdownStatusLabel();

        if (config.countdownMode !== 'target' && config.countdownRunning && formatted === '00:00') {
          config.countdownRunning = false;
          config.countdownRemainingSec = 0;
          updateCountdownButtons();
        }
      }, 250);
    }

    function updateCountdownStatusLabel() {
      const statusEl = document.getElementById('ctrl-cd-status');
      if (!statusEl) return;
      if (config.countdownMode === 'target') {
        const rem = getRemainingCountdownSeconds();
        statusEl.textContent = rem > 0 ? \`Until \${config.countdownTargetTime || '10:00'}\` : 'Time reached';
      } else {
        statusEl.textContent = config.countdownRunning ? 'Running' : 'Paused';
      }
    }

    function updateCountdownButtons() {
      const isTarget = config.countdownMode === 'target';
      const durBtn = document.getElementById('btn-cd-mode-duration');
      const tgtBtn = document.getElementById('btn-cd-mode-target');
      const durBox = document.getElementById('cd-duration-controls');
      const tgtBox = document.getElementById('cd-target-controls');

      if (durBtn && tgtBtn) {
        const activeCls = 'px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-red-700 text-white transition';
        const idleCls = 'px-2.5 py-1 rounded-md text-[10.5px] font-semibold text-zinc-400 hover:text-zinc-200 transition';
        durBtn.className = isTarget ? idleCls : activeCls;
        tgtBtn.className = isTarget ? activeCls : idleCls;
      }
      if (durBox) durBox.classList.toggle('hidden', isTarget);
      if (tgtBox) tgtBox.classList.toggle('hidden', !isTarget);

      const btn = document.getElementById('btn-cd-toggle');
      const readout = document.getElementById('ctrl-cd-readout');
      if (readout) readout.textContent = formatRemainingCountdown();
      updateCountdownStatusLabel();

      if (!btn) return;
      if (config.countdownRunning) {
        btn.textContent = 'Pause';
        btn.className = 'px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold';
      } else {
        btn.textContent = 'Start';
        btn.className = 'px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold';
      }
    }

    function setCountdownMode(mode) {
      config.countdownMode = mode === 'target' ? 'target' : 'duration';
      lastCountdownFormatted = '';
      updateCountdownButtons();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function handleTargetTimeChange() {
      const val = document.getElementById('in-cd-target-time').value;
      if (!val) return;
      config.countdownTargetTime = val;
      config.countdownMode = 'target';
      lastCountdownFormatted = '';
      updateCountdownButtons();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function toggleCountdown() {
      config.countdownMode = 'duration';
      if (config.countdownRunning) {
        config.countdownRemainingSec = getRemainingCountdownSeconds();
        config.countdownRunning = false;
        config.countdownEndTs = 0;
      } else {
        const rem = config.countdownRemainingSec > 0
          ? config.countdownRemainingSec
          : (Math.max(1, parseInt(config.countdownMinutes, 10) || 5) * 60);
        config.countdownRemainingSec = rem;
        config.countdownEndTs = Date.now() + rem * 1000;
        config.countdownRunning = true;
      }
      lastCountdownFormatted = '';
      updateCountdownButtons();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function resetCountdown() {
      const mins = Math.max(1, Math.min(90, parseInt(document.getElementById('in-cd-mins').value, 10) || 5));
      config.countdownMode = 'duration';
      config.countdownMinutes = mins;
      config.countdownRemainingSec = mins * 60;
      config.countdownRunning = false;
      config.countdownEndTs = 0;
      lastCountdownFormatted = '';
      updateCountdownButtons();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }
`;
