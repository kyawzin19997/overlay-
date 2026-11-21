module.exports = `
    /* =========================================================================
       7. UI CONTROLLERS, CUES, MARQUEES, DECK & FEED VIEWS
       ========================================================================= */
    let editingCueIdx = -1;
    let editingMarqueeIdx = -1;
    let resetArmed = false;
    let resetArmTimer = null;
    let currentFeedIndex = 0;

    /* Mode Selection */
    function renderModeButtons() {
      const grid = document.getElementById('mode-grid');
      if (!grid) return;
      grid.innerHTML = Object.entries(PRESETS).map(([id, p]) => {
        const active = config.mode === id;
        return \`
          <button onclick="selectMode('\${id}')" class="py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition \${
            active
              ? 'bg-red-700/40 border-red-500 text-white shadow-sm'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
          }">
            <span>\${p.label}</span>
            <span class="opacity-60 font-mono text-[10px]">\${p.key}</span>
          </button>
        \`;
      }).join('');
    }

    function selectMode(modeId) {
      const p = PRESETS[modeId];
      if (!p) return;
      config.mode = modeId;
      config.category = p.category;
      config.primary = p.primary;
      config.secondary = p.secondary;
      config.badge = p.badge;

      const lblP = document.getElementById('lbl-primary');
      const lblS = document.getElementById('lbl-secondary');
      if (lblP) lblP.textContent = p.pLabel;
      if (lblS) lblS.textContent = p.sLabel;
      
      populateAllInputs();
      renderActiveFrame();
      triggerSwapLive();
    }

    /* Live Text & Controls Editing */
    function handleLiveTextEdit() {
      config.category = document.getElementById('in-category').value;
      config.churchName = document.getElementById('in-church').value;
      config.primary = document.getElementById('in-primary').value;
      config.secondary = document.getElementById('in-secondary').value;
      config.badge = document.getElementById('in-badge').value.trim();
      renderLowerThirdCanvas();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function handleControlChange() {
      config.autoHide = document.getElementById('ctrl-auto-hide').checked;
      config.durationSec = Math.max(3, parseInt(document.getElementById('ctrl-duration').value, 10) || 10);
      config.showLive = document.getElementById('ctrl-show-live').checked;
      config.showTicker = document.getElementById('ctrl-show-ticker').checked;
      config.showLogo = document.getElementById('ctrl-show-logo').checked;
      
      const animStyleEl = document.getElementById('in-anim-style');
      if (animStyleEl) config.animStyle = animStyleEl.value;

      config.marqueeTag = document.getElementById('in-marquee-tag').value.trim() || 'CHURCH NEWS';
      config.marqueeSpeed = parseInt(document.getElementById('in-marquee-speed').value, 10) || 32;
      const lblSpeed = document.getElementById('lbl-speed');
      if (lblSpeed) lblSpeed.textContent = \`\${config.marqueeSpeed}s\`;
      config.marqueeText = document.getElementById('in-marquee-text').value;

      config.scale = parseFloat(document.getElementById('ctrl-scale').value) || 1;
      const lblScale = document.getElementById('lbl-scale');
      if (lblScale) lblScale.textContent = \`\${Math.round(config.scale * 100)}%\`;
      
      config.bgOpacity = parseFloat(document.getElementById('ctrl-opacity').value) || 0.94;
      const lblOpacity = document.getElementById('lbl-opacity');
      if (lblOpacity) lblOpacity.textContent = \`\${Math.round(config.bgOpacity * 100)}%\`;

      renderLowerThirdCanvas();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function setTheme(themeId) {
      config.theme = themeId;
      highlightActiveThemeButton();
      populateFrameCustomizer();
      renderFrameContextEditor(activeFrameId);
      renderLowerThirdCanvas();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
      showToast(\`Theme set to \${themeId}\`);
    }

    function highlightActiveThemeButton() {
      document.querySelectorAll('[data-theme-btn]').forEach(btn => {
        const active = btn.getAttribute('data-theme-btn') === config.theme;
        btn.className = active
          ? 'py-1.5 px-2 rounded-lg bg-red-700/50 border border-red-500 text-[11px] font-semibold text-white shadow-sm'
          : 'py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800';
      });
    }

    function handleLogoUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 256;
          const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * ratio));
          c.height = Math.max(1, Math.round(img.height * ratio));
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, c.width, c.height);
          config.customLogo = c.toDataURL('image/png');
          config.showLogo = true;
          const logoCheck = document.getElementById('ctrl-show-logo');
          if (logoCheck) logoCheck.checked = true;
          renderLowerThirdCanvas();
          renderActiveFrame();
          broadcastState('SYNC', isOnAir);
          showToast('Church logo uploaded and synced');
        };
        img.src = e.target.result;
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }

    function resetLogo() {
      config.customLogo = '';
      renderLowerThirdCanvas();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
      showToast('Restored default church logo');
    }

    function handleResetClick() {
      const btn = document.getElementById('btn-reset-all');
      if (!resetArmed) {
        resetArmed = true;
        btn.textContent = 'Click to Confirm Reset';
        btn.className = 'px-2.5 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold shadow-md transition';
        resetArmTimer = setTimeout(() => {
          resetArmed = false;
          btn.textContent = 'Reset All Defaults';
          btn.className = 'px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 text-[11px] text-red-300 font-medium transition';
        }, 3500);
        return;
      }

      clearTimeout(resetArmTimer);
      resetArmed = false;
      btn.textContent = 'Reset All Defaults';
      btn.className = 'px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 text-[11px] text-red-300 font-medium transition';

      localStorage.removeItem(STORAGE_KEY);
      config = { ...DEFAULT_CONFIG, frameSettings: {} };
      cues = DEFAULT_CUES.map(c => ({ ...c }));
      marqueePresets = DEFAULT_MARQUEE_PRESETS.map(m => ({ ...m }));
      lastMarqueeKey = '';
      lastCountdownFormatted = '';
      populateAllInputs();
      renderCues();
      renderMarqueePresets();
      renderFrameSelectorGrid();
      updateSelectedFrameUrlBox();
      renderLowerThirdCanvas();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
      showToast('Reset all settings & presets to factory defaults');
    }

    /* Saved Cues Management (One-Click Show with Individual Duration) */
    function renderCues() {
      const list = document.getElementById('cue-list');
      const libList = document.getElementById('lib-cue-list');
      if (!list && !libList) return;

      const html = cues.length ? cues.map((c, idx) => {
        const isCurrentOnAir = isOnAir && activeCueId === c.id;
        const dur = c.duration || 10;
        return \`
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl border transition \${
            isCurrentOnAir
              ? 'bg-red-950/40 border-red-500/80 shadow-md'
              : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
          }">
            <div class="min-w-0 flex-1 cursor-pointer" onclick="fireCue(\${idx})" title="Click to show live">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">\${esc(c.category || c.mode)}</span>
                \${isCurrentOnAir ? '<span class="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] animate-pulse">ON AIR</span>' : ''}
              </div>
              <div class="text-xs font-bold text-white truncate mt-0.5">\${esc(c.primary)}</div>
              <div class="text-[11px] text-zinc-400 truncate">\${esc(c.secondary)}</div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <select onchange="updateCueDuration(\${idx}, this.value)" class="px-1.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-[10.5px] text-zinc-300 outline-none" title="Duration">
                <option value="5" \${dur === 5 ? 'selected' : ''}>5s</option>
                <option value="10" \${dur === 10 ? 'selected' : ''}>10s</option>
                <option value="15" \${dur === 15 ? 'selected' : ''}>15s</option>
                <option value="30" \${dur === 30 ? 'selected' : ''}>30s</option>
                <option value="0" \${dur === 0 ? 'selected' : ''}>Manual</option>
              </select>

              <button onclick="fireCue(\${idx})" class="px-3 py-1.5 rounded-lg \${isCurrentOnAir ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-[11px] font-bold shadow-sm transition">
                \${isCurrentOnAir ? 'Replay' : 'Show'}
              </button>
              <button onclick="openCueModal(\${idx})" class="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs" title="Edit">✏️</button>
              <button onclick="deleteCue(\${idx})" class="p-1.5 rounded-md bg-zinc-900 hover:bg-red-950 text-red-400 text-xs" title="Delete">✕</button>
            </div>
          </div>
        \`;
      }).join('') : '<div class="text-xs text-zinc-500 text-center py-4">No saved lower thirds. Click "+ Save Current" to add.</div>';

      if (list) list.innerHTML = html;
      if (libList) libList.innerHTML = html;
    }

    function fireCue(idx) {
      const c = cues[idx];
      if (!c) return;
      activeCueId = c.id;
      config.mode = c.mode || 'speaker';
      config.category = c.category;
      config.primary = c.primary;
      config.secondary = c.secondary;
      config.badge = c.badge || '';
      
      const dur = (c.duration !== undefined) ? c.duration : (config.autoHide ? config.durationSec : 0);
      populateAllInputs();
      renderActiveFrame();
      triggerSwapLive(dur);
      renderCues();
      showToast(\`Showing \${c.primary}\`);
    }

    function updateCueDuration(idx, val) {
      if (!cues[idx]) return;
      cues[idx].duration = parseInt(val, 10) || 0;
      broadcastState('SYNC', isOnAir);
    }

    function saveCurrentCue() {
      const newCue = {
        id: 'c_' + Date.now(),
        mode: config.mode,
        category: config.category,
        primary: config.primary,
        secondary: config.secondary,
        badge: config.badge,
        duration: config.durationSec || 10
      };
      cues.push(newCue);
      renderCues();
      broadcastState('SYNC', isOnAir);
      showToast('Lower third saved to library');
    }

    function deleteCue(idx) {
      cues.splice(idx, 1);
      renderCues();
      broadcastState('SYNC', isOnAir);
      showToast('Cue deleted');
    }

    function openCueModal(idx) {
      const c = cues[idx];
      if (!c) return;
      editingCueIdx = idx;
      document.getElementById('edit-mode').value = c.mode || 'speaker';
      document.getElementById('edit-category').value = c.category || '';
      document.getElementById('edit-primary').value = c.primary || '';
      document.getElementById('edit-secondary').value = c.secondary || '';
      document.getElementById('edit-badge').value = c.badge || '';
      document.getElementById('edit-duration').value = c.duration || 10;
      document.getElementById('cue-modal').classList.remove('hidden');
    }

    function closeCueModal() {
      editingCueIdx = -1;
      document.getElementById('cue-modal').classList.add('hidden');
    }

    function saveEditedCue(andShow) {
      if (editingCueIdx < 0 || !cues[editingCueIdx]) return;
      cues[editingCueIdx] = {
        ...cues[editingCueIdx],
        mode: document.getElementById('edit-mode').value,
        category: document.getElementById('edit-category').value.trim(),
        primary: document.getElementById('edit-primary').value.trim(),
        secondary: document.getElementById('edit-secondary').value.trim(),
        badge: document.getElementById('edit-badge').value.trim(),
        duration: parseInt(document.getElementById('edit-duration').value, 10) || 10
      };
      const idx = editingCueIdx;
      renderCues();
      closeCueModal();
      broadcastState('SYNC', isOnAir);
      if (andShow) fireCue(idx);
    }

    
    /* =========================================================================
       STRUCTURED ANNOUNCEMENTS (Two Fields per Row: Title & Details)
       ========================================================================= */
    function renderAnnouncementRows() {
      const container = document.getElementById('announcements-rows-container');
      if (!container) return;
      if (!Array.isArray(config.frameAnnouncementsList)) {
        config.frameAnnouncementsList = [];
      }
      if (config.frameAnnouncementsList.length === 0) {
        container.innerHTML = '<div class="text-xs text-zinc-500 text-center py-3 bg-zinc-950/40 rounded-lg">No announcements. Click "+ Add Announcement Row" below.</div>';
        return;
      }
      container.innerHTML = config.frameAnnouncementsList.map((item, idx) => \`
        <div class="announce-row mb-2 flex flex-col sm:flex-row gap-2 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800">
          <div class="flex-1 min-w-0">
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Title</label>
            <input type="text" value="\${esc(item.title || '')}" oninput="updateAnnouncementRow(\${idx}, 'title', this.value)" placeholder="e.g. Sunday Worship Service" class="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none" />
          </div>
          <div class="flex-[1.5] min-w-0">
            <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Description / Details</label>
            <input type="text" value="\${esc(item.details || '')}" oninput="updateAnnouncementRow(\${idx}, 'details', this.value)" placeholder="e.g. Every Sunday at 10:00 AM • Sanctuary & Online" class="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 placeholder-zinc-500 focus:border-red-500 outline-none" />
          </div>
          <div class="flex items-end pb-0.5">
            <button type="button" onclick="deleteAnnouncementRow(\${idx})" class="p-1.5 rounded bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-700 text-red-400 text-xs transition" title="Delete Row">
              ✕
            </button>
          </div>
        </div>
      \`).join('');
    }

    function addAnnouncementRow() {
      if (!Array.isArray(config.frameAnnouncementsList)) {
        config.frameAnnouncementsList = [];
      }
      config.frameAnnouncementsList.push({ title: '', details: '' });
      renderAnnouncementRows();
      syncAnnouncementsLegacy();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function deleteAnnouncementRow(idx) {
      if (!Array.isArray(config.frameAnnouncementsList)) return;
      config.frameAnnouncementsList.splice(idx, 1);
      renderAnnouncementRows();
      syncAnnouncementsLegacy();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function updateAnnouncementRow(idx, field, val) {
      if (!Array.isArray(config.frameAnnouncementsList) || !config.frameAnnouncementsList[idx]) return;
      config.frameAnnouncementsList[idx][field] = val;
      syncAnnouncementsLegacy();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function syncAnnouncementsLegacy() {
      if (!Array.isArray(config.frameAnnouncementsList)) return;
      config.frameAnnouncements = config.frameAnnouncementsList
        .map(item => \`\${item.title || ''}\${item.details ? ' | ' + item.details : ''}\`)
        .join('\\n');
      const legacyEl = document.getElementById('in-fr-announcements');
      if (legacyEl) legacyEl.value = config.frameAnnouncements;
    }

    /* =========================================================================
       CONTEXT-SENSITIVE FRAME CONTENT CONTROLS
       ========================================================================= */
    function renderFrameContextEditor(frameId) {
      const container = document.getElementById('frame-active-content-editor');
      if (!container) return;

      const panels = container.querySelectorAll('[data-frame-panel]');
      let matched = false;
      panels.forEach(p => {
        const targets = (p.getAttribute('data-frame-panel') || '').split(',').map(s => s.trim());
        if (targets.includes(frameId)) {
          p.classList.remove('hidden');
          matched = true;
        } else {
          p.classList.add('hidden');
        }
      });

      const genericPanel = document.getElementById('panel-generic-frame');
      if (genericPanel) {
        genericPanel.classList.toggle('hidden', matched);
      }

      if (frameId === 'cam-announce') {
        renderAnnouncementRows();
      }
    }

    /* Marquee Presets Management */
    function renderMarqueePresets() {
      const list = document.getElementById('marquee-preset-list');
      if (!list) return;

      list.innerHTML = marqueePresets.length ? marqueePresets.map((m, idx) => {
        const isActive = config.showTicker && activeMarqueeId === m.id;
        return \`
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl border \${
            isActive
              ? 'bg-amber-950/40 border-amber-500/80'
              : 'bg-zinc-950/90 border-zinc-800'
          }">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">\${esc(m.tag)}</span>
                \${isActive ? '<span class="px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold text-[9px]">LIVE</span>' : ''}
              </div>
              <div class="text-xs font-semibold text-white truncate mt-0.5">\${esc(m.name)}</div>
              <div class="text-[11px] text-zinc-400 truncate">\${esc(m.text)}</div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="applyMarqueePreset(\${idx})" class="px-2.5 py-1 rounded-lg \${isActive ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'} text-white text-[11px] font-semibold">
                \${isActive ? 'Active' : 'Apply & Run'}
              </button>
              <button onclick="deleteMarqueePreset(\${idx})" class="p-1 rounded-md bg-zinc-900 hover:bg-red-950 text-red-400 text-xs">✕</button>
            </div>
          </div>
        \`;
      }).join('') : '<div class="text-xs text-zinc-500 text-center py-2">No marquee presets.</div>';
    }

    function applyMarqueePreset(idx) {
      const m = marqueePresets[idx];
      if (!m) return;
      activeMarqueeId = m.id;
      config.marqueeTag = m.tag;
      config.marqueeSpeed = m.speed;
      config.marqueeText = m.text;
      config.showTicker = true;
      populateAllInputs();
      renderLowerThirdCanvas();
      broadcastState('SYNC', isOnAir);
      renderMarqueePresets();
      showToast(\`Marquee: \${m.name}\`);
    }

    function saveCurrentMarqueePreset() {
      const name = prompt('Preset Name:', config.marqueeTag || 'Church Announcements');
      if (!name) return;
      marqueePresets.push({
        id: 'mq_' + Date.now(),
        name,
        tag: config.marqueeTag,
        speed: config.marqueeSpeed,
        text: config.marqueeText
      });
      renderMarqueePresets();
      broadcastState('SYNC', isOnAir);
      showToast('Marquee preset saved');
    }

    function deleteMarqueePreset(idx) {
      marqueePresets.splice(idx, 1);
      renderMarqueePresets();
      broadcastState('SYNC', isOnAir);
    }

    /* 12 Frame Selector Grid & Frame Customizer UI */
    function renderFrameSelectorGrid() {
      const grid = document.getElementById('frame-selector-grid');
      if (!grid) return;

      grid.innerHTML = FRAME_DEFS.map(f => {
        const active = f.id === activeFrameId;
        const customized = isFrameCustomized(f.id);
        return \`
          <button onclick="selectObsFrame('\${f.id}')" class="text-left p-2.5 rounded-xl border transition relative \${
            active
              ? 'bg-red-950/70 border-red-500/90 text-white shadow-sm'
              : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200 hover:bg-zinc-800'
          }">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold leading-tight">\${esc(f.name)}</span>
              \${customized ? '<span class="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Customized"></span>' : ''}
            </div>
            <div class="text-[10px] text-zinc-400 mt-0.5 leading-snug">\${esc(f.short)}</div>
          </button>
        \`;
      }).join('');
    }

    function selectObsFrame(frameId) {
      activeFrameId = frameId;
      setPreviewTarget('frame');
      renderFrameSelectorGrid();
      populateFrameCustomizer();
      updateSelectedFrameUrlBox();
      renderActiveFrame();
      broadcastState('FRAME_CHANGE', isOnAir);
    }

    function updateSelectedFrameUrlBox() {
      const def = getFrameDef(activeFrameId);
      const fs = getFrameSettings(def.id);
      const urlEl = document.getElementById('url-selected-frame');
      const labelEl = document.getElementById('selected-frame-url-label');
      const hintEl = document.getElementById('selected-frame-hint');
      if (urlEl) urlEl.value = getFrameUrl(def.id);
      if (labelEl) labelEl.textContent = \`\${def.name} — OBS Browser Source URL\`;
      if (hintEl) hintEl.textContent = getDynamicFrameHint(def, fs);
    }

    function populateFrameCustomizer() {
      const def = getFrameDef(activeFrameId);
      const fs = getFrameSettings(def.id);
      const effectiveTheme = fs.theme === 'inherit' ? config.theme : fs.theme;
      const palette = THEME_PALETTES[effectiveTheme] || THEME_PALETTES['bcc-crimson'];

      const titleEl = document.getElementById('customizer-frame-title');
      if (titleEl) titleEl.textContent = \`Customize: \${def.name}\`;

      document.getElementById('in-fc-theme').value = fs.theme || 'inherit';
      document.getElementById('in-fc-accent').value = fs.customAccent || palette.accent;

      const autoBtn = document.getElementById('btn-fc-accent-auto');
      if (autoBtn) {
        autoBtn.textContent = fs.customAccent ? 'Reset Auto' : 'Theme Auto';
      }

      document.getElementById('in-fc-header-badge').value = fs.headerBadge || '';
      document.getElementById('in-fc-panel-title').value = fs.panelTitle || '';

      document.getElementById('in-fc-radius').value = fs.cornerRadius;
      document.getElementById('lbl-fc-radius').textContent = \`\${fs.cornerRadius}px\`;

      document.getElementById('in-fc-border').value = fs.borderWidth;
      document.getElementById('lbl-fc-border').textContent = \`\${fs.borderWidth}px\`;

      document.getElementById('in-fc-text-scale').value = fs.textScale;
      document.getElementById('lbl-fc-text-scale').textContent = \`\${Math.round(fs.textScale * 100)}%\`;

      document.getElementById('in-fc-opacity').value = fs.matteOpacity;
      document.getElementById('lbl-fc-opacity').textContent = \`\${Math.round(fs.matteOpacity * 100)}%\`;

      document.getElementById('in-fc-mirror').checked = !!fs.mirror;
      document.getElementById('in-fc-header').checked = !!fs.showHeader;
      document.getElementById('in-fc-infobar').checked = !!fs.showInfoBar;
      document.getElementById('in-fc-live').checked = !!fs.showLive;
      document.getElementById('in-fc-logo').checked = !!fs.showLogo;
    }

    function saveFrameSettingPatch(patch) {
      if (!config.frameSettings) config.frameSettings = {};
      const current = getFrameSettings(activeFrameId);
      config.frameSettings[activeFrameId] = { ...current, ...patch };
      renderFrameSelectorGrid();
      updateSelectedFrameUrlBox();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function handleFrameCustomizeChange() {
      const radius = parseInt(document.getElementById('in-fc-radius').value, 10) || 0;
      const border = parseInt(document.getElementById('in-fc-border').value, 10) || 0;
      const textScale = parseFloat(document.getElementById('in-fc-text-scale').value) || 1;
      const matteOpacity = parseFloat(document.getElementById('in-fc-opacity').value) || 1;

      document.getElementById('lbl-fc-radius').textContent = \`\${radius}px\`;
      document.getElementById('lbl-fc-border').textContent = \`\${border}px\`;
      document.getElementById('lbl-fc-text-scale').textContent = \`\${Math.round(textScale * 100)}%\`;
      document.getElementById('lbl-fc-opacity').textContent = \`\${Math.round(matteOpacity * 100)}%\`;

      saveFrameSettingPatch({
        theme: document.getElementById('in-fc-theme').value,
        headerBadge: document.getElementById('in-fc-header-badge').value,
        panelTitle: document.getElementById('in-fc-panel-title').value,
        cornerRadius: radius,
        borderWidth: border,
        textScale,
        matteOpacity,
        mirror: document.getElementById('in-fc-mirror').checked,
        showHeader: document.getElementById('in-fc-header').checked,
        showInfoBar: document.getElementById('in-fc-infobar').checked,
        showLive: document.getElementById('in-fc-live').checked,
        showLogo: document.getElementById('in-fc-logo').checked
      });
    }

    function handleFrameAccentPick() {
      const hex = document.getElementById('in-fc-accent').value;
      saveFrameSettingPatch({ customAccent: hex });
      populateFrameCustomizer();
    }

    function clearFrameCustomAccent() {
      saveFrameSettingPatch({ customAccent: '' });
      populateFrameCustomizer();
    }

    function resetSelectedFrameSettings() {
      if (config.frameSettings && config.frameSettings[activeFrameId]) {
        delete config.frameSettings[activeFrameId];
      }
      populateFrameCustomizer();
      renderFrameSelectorGrid();
      updateSelectedFrameUrlBox();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
      showToast(\`Reset \${getFrameDef(activeFrameId).name} to defaults\`);
    }

    function copySelectedFrameUrl(btn) {
      copyText(getFrameUrl(activeFrameId), btn);
    }

    function handleFrameContentEdit() {
      config.frameVerseRef = document.getElementById('in-fr-verse-ref').value;
      config.frameVerseVer = document.getElementById('in-fr-verse-ver').value;
      config.frameVerseText = document.getElementById('in-fr-verse-text').value;
      config.frameAnnouncements = document.getElementById('in-fr-announcements').value;
      config.frameSlideTag = document.getElementById('in-fr-slide-tag').value;
      config.frameWelcomeTitle = document.getElementById('in-fr-welcome-title').value;
      config.frameWelcomeSub = document.getElementById('in-fr-welcome-sub').value;
      
      const songTitle = document.getElementById('in-fr-song-title');
      if (songTitle) config.frameSongTitle = songTitle.value;
      const songDetails = document.getElementById('in-fr-song-details');
      if (songDetails) config.frameSongDetails = songDetails.value;

      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
    }

    function pullLowerThirdToBible() {
      config.frameVerseText = config.primary || config.frameVerseText;
      config.frameVerseRef = config.secondary || config.frameVerseRef;
      populateAllInputs();
      renderActiveFrame();
      broadcastState('SYNC', isOnAir);
      showToast('Copied Lower Third text to Bible Verse Frame');
    }

    /* Populate All Input Fields */
    function populateAllInputs() {
      const inCat = document.getElementById('in-category');
      if (inCat) inCat.value = config.category;
      const inChurch = document.getElementById('in-church');
      if (inChurch) inChurch.value = config.churchName;
      const inPrimary = document.getElementById('in-primary');
      if (inPrimary) inPrimary.value = config.primary;
      const inSec = document.getElementById('in-secondary');
      if (inSec) inSec.value = config.secondary;
      const inBadge = document.getElementById('in-badge');
      if (inBadge) inBadge.value = config.badge;

      const autoHide = document.getElementById('ctrl-auto-hide');
      if (autoHide) autoHide.checked = !!config.autoHide;
      const dur = document.getElementById('ctrl-duration');
      if (dur) dur.value = config.durationSec;
      const showLive = document.getElementById('ctrl-show-live');
      if (showLive) showLive.checked = !!config.showLive;
      const showTicker = document.getElementById('ctrl-show-ticker');
      if (showTicker) showTicker.checked = !!config.showTicker;
      const showLogo = document.getElementById('ctrl-show-logo');
      if (showLogo) showLogo.checked = !!config.showLogo;

      const animStyle = document.getElementById('in-anim-style');
      if (animStyle) animStyle.value = config.animStyle || 'modern-slide';

      const mqTag = document.getElementById('in-marquee-tag');
      if (mqTag) mqTag.value = config.marqueeTag;
      const mqSpeed = document.getElementById('in-marquee-speed');
      if (mqSpeed) mqSpeed.value = config.marqueeSpeed;
      const lblSpeed = document.getElementById('lbl-speed');
      if (lblSpeed) lblSpeed.textContent = \`\${config.marqueeSpeed}s\`;
      const mqText = document.getElementById('in-marquee-text');
      if (mqText) mqText.value = config.marqueeText;

      const scale = document.getElementById('ctrl-scale');
      if (scale) scale.value = config.scale;
      const lblScale = document.getElementById('lbl-scale');
      if (lblScale) lblScale.textContent = \`\${Math.round(config.scale * 100)}%\`;
      const op = document.getElementById('ctrl-opacity');
      if (op) op.value = config.bgOpacity;
      const lblOp = document.getElementById('lbl-opacity');
      if (lblOp) lblOp.textContent = \`\${Math.round(config.bgOpacity * 100)}%\`;

      // Frame text fields
      const fRef = document.getElementById('in-fr-verse-ref');
      if (fRef) fRef.value = config.frameVerseRef;
      const fVer = document.getElementById('in-fr-verse-ver');
      if (fVer) fVer.value = config.frameVerseVer;
      const fText = document.getElementById('in-fr-verse-text');
      if (fText) fText.value = config.frameVerseText;
      const fAnn = document.getElementById('in-fr-announcements');
      if (fAnn) fAnn.value = config.frameAnnouncements;
      const fSlideTag = document.getElementById('in-fr-slide-tag');
      if (fSlideTag) fSlideTag.value = config.frameSlideTag;
      const fWTitle = document.getElementById('in-fr-welcome-title');
      if (fWTitle) fWTitle.value = config.frameWelcomeTitle;
      const fWSub = document.getElementById('in-fr-welcome-sub');
      if (fWSub) fWSub.value = config.frameWelcomeSub;
      const cdMins = document.getElementById('in-cd-mins');
      if (cdMins) cdMins.value = config.countdownMinutes || 5;
      const cdTarget = document.getElementById('in-cd-target-time');
      if (cdTarget) cdTarget.value = config.countdownTargetTime || '10:00';

      const songTitle = document.getElementById('in-fr-song-title');
      if (songTitle) songTitle.value = config.frameSongTitle || '';
      const songDetails = document.getElementById('in-fr-song-details');
      if (songDetails) songDetails.value = config.frameSongDetails || '';

      updateCountdownButtons();
      renderModeButtons();
      highlightActiveThemeButton();
      populateFrameCustomizer();
    }

    /* =========================================================================
       8. STREAM DECK / OBS DECK VIEW (?view=deck)
       ========================================================================= */
    function renderDeckView() {
      const container = document.getElementById('deck-grid-cues');
      if (!container) return;

      // Saved Lower Thirds Deck Buttons
      container.innerHTML = cues.map((c, idx) => {
        const isCurrentOnAir = isOnAir && activeCueId === c.id;
        return \`
          <button onclick="fireCue(\${idx})" class="deck-btn \${isCurrentOnAir ? 'is-active' : 'action-primary'}">
            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300 opacity-90">\${esc(c.category || c.mode)}</span>
            <span class="text-xs font-bold mt-1 line-clamp-2 leading-tight">\${esc(c.primary)}</span>
            \${isCurrentOnAir ? '<span class="text-[10px] font-bold text-red-200 mt-1 uppercase">● ON AIR</span>' : ''}
          </button>
        \`;
      }).join('');

      // Marquee Presets Deck Buttons
      const mqGrid = document.getElementById('deck-grid-marquee');
      if (mqGrid) {
        mqGrid.innerHTML = marqueePresets.map((m, idx) => {
          const isActive = config.showTicker && activeMarqueeId === m.id;
          return \`
            <button onclick="applyMarqueePreset(\${idx})" class="deck-btn \${isActive ? 'is-active' : 'action-warning'}">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white opacity-80">\${esc(m.tag)}</span>
              <span class="text-xs font-bold mt-1 line-clamp-2 leading-tight">\${esc(m.name)}</span>
            </button>
          \`;
        }).join('');
      }

      // Frames Deck Buttons
      const frGrid = document.getElementById('deck-grid-frames');
      if (frGrid) {
        frGrid.innerHTML = FRAME_DEFS.map(f => {
          const isActive = activeFrameId === f.id;
          return \`
            <button onclick="selectObsFrame('\${f.id}')" class="deck-btn \${isActive ? 'is-active' : 'action-frame'}">
              <span class="text-xs font-bold line-clamp-2 leading-tight">\${esc(f.name)}</span>
            </button>
          \`;
        }).join('');
      }
    }

    /* =========================================================================
       9. LIVE FEED DOCK VIEW (?view=feed)
       ========================================================================= */
    function renderFeedView() {
      const container = document.getElementById('feed-cue-list');
      if (!container) return;

      if (!cues.length) {
        container.innerHTML = '<div class="text-xs text-zinc-500 text-center py-6">No cues prepared in rundown.</div>';
        return;
      }

      container.innerHTML = cues.map((c, idx) => {
        const isCurrentOnAir = isOnAir && activeCueId === c.id;
        const isPreview = !isOnAir && previewCueId === c.id;
        return \`
          <div class="feed-item \${isCurrentOnAir ? 'is-on-air' : isPreview ? 'is-preview' : ''}">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-mono text-[11px] font-bold text-zinc-300">\${idx + 1}</span>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold text-amber-400 uppercase">\${esc(c.category || c.mode)}</span>
                  \${isCurrentOnAir ? '<span class="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] animate-pulse">ON AIR</span>' : ''}
                  \${isPreview ? '<span class="px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold text-[9px]">PREVIEW</span>' : ''}
                </div>
                <div class="text-xs font-bold text-white truncate max-w-[200px]">\${esc(c.primary)}</div>
                <div class="text-[10px] text-zinc-400 truncate max-w-[200px]">\${esc(c.secondary)}</div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button onclick="feedPreview(\${idx})" class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10.5px]">Preview</button>
              <button onclick="feedTakeLive(\${idx})" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold">Take</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    function feedPreview(idx) {
      const c = cues[idx];
      if (!c) return;
      currentFeedIndex = idx;
      previewCueId = c.id;
      config.mode = c.mode || 'speaker';
      config.category = c.category;
      config.primary = c.primary;
      config.secondary = c.secondary;
      config.badge = c.badge || '';
      populateAllInputs();
      renderLowerThirdCanvas();
      renderFeedView();
      showToast(\`Previewing cue #\${idx + 1}\`);
    }

    function feedTakeLive(idx) {
      currentFeedIndex = idx;
      previewCueId = null;
      fireCue(idx);
    }

    function feedNext() {
      if (currentFeedIndex < cues.length - 1) {
        currentFeedIndex += 1;
        feedTakeLive(currentFeedIndex);
      } else {
        showToast('End of cue list');
      }
    }

    function feedPrev() {
      if (currentFeedIndex > 0) {
        currentFeedIndex -= 1;
        feedTakeLive(currentFeedIndex);
      } else {
        showToast('Start of cue list');
      }
    }

    /* =========================================================================
       10. NAVIGATION, OBS DOCK RESIZING, BACKDROPS & URLS
       ========================================================================= */
    function switchTab(name) {
      ['control', 'library', 'frames', 'settings'].forEach(t => {
        const tabEl = document.getElementById(\`tab-\${t}\`);
        if (tabEl) tabEl.classList.toggle('hidden', t !== name);
        const btn = document.getElementById(\`tab-btn-\${t}\`);
        if (btn) {
          if (t === name) {
            btn.className = 'py-2.5 text-xs font-semibold border-b-2 border-amber-400 text-amber-200 transition';
          } else {
            btn.className = 'py-2.5 text-xs font-semibold border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition';
          }
        }
      });

      if (name === 'frames') setPreviewTarget('frame');
      else if (name === 'control' || name === 'library') setPreviewTarget('overlay');
    }

    function setPreviewTarget(target) {
      previewTarget = target;
      const cg = document.getElementById('cg-canvas');
      const fr = document.getElementById('frame-canvas');
      const title = document.getElementById('monitor-title');
      const switchBtn = document.getElementById('btn-switch-preview');

      if (target === 'frame') {
        if (cg) cg.classList.add('hidden');
        if (fr) fr.classList.remove('hidden');
        const def = getFrameDef(activeFrameId);
        if (title) title.textContent = \`Preview Frame: \${def.name}\`;
        if (switchBtn) switchBtn.textContent = 'Switch to Lower Third';
        renderActiveFrame();
      } else {
        if (fr) fr.classList.add('hidden');
        if (cg) cg.classList.remove('hidden');
        if (title) title.textContent = 'Preview: Lower Third Overlay';
        if (switchBtn) switchBtn.textContent = 'Switch to OBS Frames';
        const mockLayer = document.getElementById('preview-mock-layer');
        if (mockLayer) {
          mockLayer.classList.add('hidden');
          mockLayer.innerHTML = '';
        }
      }
    }

    function togglePreviewTarget() {
      setPreviewTarget(previewTarget === 'overlay' ? 'frame' : 'overlay');
    }

    function toggleDockLayout(forceDock) {
      const ws = document.getElementById('workspace');
      const wrap = document.getElementById('stage-wrap');
      const btn = document.getElementById('btn-toggle-dock');
      const isDock = (typeof forceDock === 'boolean') ? forceDock : !ws.dataset.dock;

      if (isDock) {
        ws.dataset.dock = '1';
        ws.className = 'flex-1 grid grid-cols-1 max-w-[580px] w-full mx-auto border-x border-zinc-800 min-h-0';
        if (wrap) {
          wrap.classList.remove('max-h-[460px]');
          wrap.classList.add('max-h-[220px]');
        }
        if (btn) btn.textContent = 'Wide View';
      } else {
        delete ws.dataset.dock;
        ws.className = 'flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] min-h-0';
        if (wrap) {
          wrap.classList.remove('max-h-[220px]');
          wrap.classList.add('max-h-[460px]');
        }
        if (btn) btn.textContent = 'Dock View';
      }
      setTimeout(scalePreviewMonitor, 30);
    }

    function setBackdrop(cls) {
      const shell = document.getElementById('stage-shell');
      if (!shell) return;
      shell.classList.remove('bg-stage', 'bg-bright', 'bg-checker');
      shell.classList.add(cls);
    }

    function toggleSafeGuide() {
      const guide = document.getElementById('safe-guide');
      if (guide) guide.classList.toggle('hidden');
    }

    function scalePreviewMonitor() {
      const wrap = document.getElementById('stage-wrap');
      const shell = document.getElementById('stage-shell');
      if (!wrap || !shell || isOverlayOnly) return;
      const scale = Math.min(wrap.clientWidth / 1920, wrap.clientHeight / 1080);
      shell.style.transform = \`scale(\${scale})\`;
    }

    function fitObsSource() {
      const el = document.getElementById(overlayTarget === 'frame' ? 'frame-canvas' : 'cg-canvas');
      if (!el) return;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      el.style.transform = \`scale(\${scale})\`;
    }

    function testCurrentSourceFullscreen() {
      enterOverlayMode(previewTarget, true);
    }

    function enterOverlayMode(target, showExitBtn) {
      isOverlayOnly = true;
      overlayTarget = (target === 'frame') ? 'frame' : 'overlay';

      document.documentElement.classList.add('obs-overlay-mode');
      const app = document.getElementById('studio-app');
      if (app) app.classList.add('hidden');

      const mount = document.getElementById('obs-mount');
      if (mount) {
        mount.classList.remove('hidden');
        const el = document.getElementById(overlayTarget === 'frame' ? 'frame-canvas' : 'cg-canvas');
        if (el) {
          el.classList.remove('hidden');
          mount.appendChild(el);
        }
      }

      if (overlayTarget === 'frame') renderActiveFrame();
      else renderLowerThirdCanvas();

      const exitBtn = document.getElementById('exit-overlay-btn');
      if (exitBtn) exitBtn.classList.toggle('hidden', !showExitBtn);

      fitObsSource();
      window.addEventListener('resize', fitObsSource);
    }

    function exitOverlayMode() {
      isOverlayOnly = false;
      window.removeEventListener('resize', fitObsSource);
      document.documentElement.classList.remove('obs-overlay-mode');

      const shell = document.getElementById('stage-shell');
      const cg = document.getElementById('cg-canvas');
      const fr = document.getElementById('frame-canvas');
      if (cg) { cg.style.transform = ''; shell.appendChild(cg); }
      if (fr) { fr.style.transform = ''; shell.appendChild(fr); }

      const mount = document.getElementById('obs-mount');
      if (mount) mount.classList.add('hidden');
      const exitBtn = document.getElementById('exit-overlay-btn');
      if (exitBtn) exitBtn.classList.add('hidden');
      const app = document.getElementById('studio-app');
      if (app) app.classList.remove('hidden');

      setPreviewTarget(previewTarget);
      scalePreviewMonitor();
    }

    function getBaseUrl() {
      return window.location.href.split('?')[0].split('#')[0];
    }
    function getTargetUrl(view) {
      return \`\${getBaseUrl()}?view=\${view}\`;
    }
    function getFrameUrl(frameId) {
      return \`\${getBaseUrl()}?view=frame&frame=\${encodeURIComponent(frameId)}\`;
    }

    function populateCoreObsUrls() {
      const uO = document.getElementById('url-overlay');
      if (uO) uO.value = getTargetUrl('overlay');
      const uC = document.getElementById('url-control');
      if (uC) uC.value = getTargetUrl('control');
      const uF = document.getElementById('url-feed');
      if (uF) uF.value = getTargetUrl('feed');
      const uD = document.getElementById('url-deck');
      if (uD) uD.value = getTargetUrl('deck');
    }

    function copyText(text, btn) {
      try {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        tmp.style.position = 'fixed';
        tmp.style.opacity = '0';
        document.body.appendChild(tmp);
        tmp.focus();
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      } catch (_) {}

      if (btn) {
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = prev; }, 1400);
      }
      showToast('URL copied to clipboard');
    }

    /* Keyboard Shortcuts */
    window.addEventListener('keydown', (e) => {
      if (isOverlayOnly) return;
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        isOnAir ? triggerHide() : triggerShow();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        triggerHide();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const keys = ['speaker', 'sermon', 'scripture', 'announcement'];
        selectMode(keys[Number(e.key) - 1]);
      }
    });

    /* App Boot Initialization */
    window.addEventListener('DOMContentLoaded', () => {
      const hadSaved = loadSavedState();
      initSyncChannel();
      startCountdownLoop();

      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const frameParam = params.get('frame');

      if (frameParam && FRAME_DEFS.some(f => f.id === frameParam)) {
        activeFrameId = frameParam;
      }

      if (view === 'overlay') {
        renderLowerThirdCanvas();
        enterOverlayMode('overlay', false);
        if (isOnAir) playIntro();
        if (bus) bus.postMessage({ type: 'HELLO_FROM_OBS' });
      } else if (view === 'frame') {
        enterOverlayMode('frame', false);
        if (bus) bus.postMessage({ type: 'HELLO_FROM_OBS' });
      } else if (view === 'deck') {
        document.getElementById('studio-app').classList.add('hidden');
        const deckView = document.getElementById('deck-view');
        if (deckView) deckView.classList.remove('hidden');
        renderDeckView();
      } else if (view === 'feed') {
        document.getElementById('studio-app').classList.add('hidden');
        const feedView = document.getElementById('feed-view');
        if (feedView) feedView.classList.remove('hidden');
        renderFeedView();
      } else {
        populateCoreObsUrls();
        populateAllInputs();
        renderCues();
        renderMarqueePresets();
        renderFrameSelectorGrid();
        updateSelectedFrameUrlBox();
        renderLowerThirdCanvas();
        renderActiveFrame();

        if (view === 'control') toggleDockLayout(true);

        const wrap = document.getElementById('stage-wrap');
        if ('ResizeObserver' in window && wrap) {
          new ResizeObserver(scalePreviewMonitor).observe(wrap);
        } else {
          window.addEventListener('resize', scalePreviewMonitor);
        }
        scalePreviewMonitor();

        if (!hadSaved || isOnAir) {
          setTimeout(() => playIntro(), 280);
        }
      }
    });
`;
