module.exports = `
  <!-- Standalone OBS Overlay / Frame Mount (?view=overlay or ?view=frame&frame=...) -->
  <div id="obs-mount" class="hidden w-screen h-screen overflow-hidden relative"></div>

  <!-- Stream Deck Dedicated View (?view=deck) -->
  <div id="deck-view" class="hidden deck-container">
    <div class="deck-header">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
        <span class="font-bold text-sm tracking-wide uppercase font-['Montserrat']">BCC Deck Control</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="clearAllGraphics()" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow">
          CLEAR ALL
        </button>
        <button onclick="triggerHide()" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-300 font-bold text-xs uppercase tracking-wider">
          Hide LT
        </button>
      </div>
    </div>

    <!-- Quick Global Actions -->
    <div>
      <div class="deck-section-title">Quick Actions</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button onclick="triggerShow()" class="deck-btn action-primary">
          <span class="text-xs font-bold uppercase">Show Active LT</span>
        </button>
        <button onclick="triggerHide()" class="deck-btn action-danger">
          <span class="text-xs font-bold uppercase">Hide Active LT</span>
        </button>
        <button onclick="toggleTickerPause()" class="deck-btn action-warning">
          <span class="text-xs font-bold uppercase">Pause/Resume Ticker</span>
        </button>
        <button onclick="clearAllGraphics()" class="deck-btn action-danger">
          <span class="text-xs font-bold uppercase">EMERGENCY CLEAR</span>
        </button>
      </div>
    </div>

    <!-- One-Click Lower Thirds -->
    <div>
      <div class="deck-section-title">One-Click Lower Thirds</div>
      <div id="deck-grid-cues" class="deck-grid"></div>
    </div>

    <!-- One-Click Marquee Presets -->
    <div>
      <div class="deck-section-title">Marquee / Ticker Presets</div>
      <div id="deck-grid-marquee" class="deck-grid"></div>
    </div>

    <!-- One-Click OBS Frame Layouts -->
    <div>
      <div class="deck-section-title">OBS Frame Layouts</div>
      <div id="deck-grid-frames" class="deck-grid"></div>
    </div>
  </div>

  <!-- Feed Dock Dedicated View (?view=feed) -->
  <div id="feed-view" class="hidden feed-container">
    <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
      <div class="flex items-center gap-2">
        <span class="font-bold text-xs tracking-wider uppercase text-amber-400 font-['Montserrat']">Broadcast Rundown</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="feedPrev()" class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200">◀ Prev</button>
        <button onclick="feedNext()" class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200">Next ▶</button>
        <button onclick="triggerHide()" class="px-2.5 py-1 rounded bg-red-700 hover:bg-red-600 text-xs font-bold text-white">Hide</button>
      </div>
    </div>
    <div id="feed-cue-list" class="space-y-2"></div>
  </div>

  <!-- Studio / OBS Control Dock App (Default & ?view=control) -->
  <div id="studio-app" class="flex flex-col min-h-screen">

    <!-- Top Header -->
    <header class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="24" height="24" fill="none">
            <rect x="52" y="16" width="16" height="88" rx="4" fill="#9E1B1E" stroke="#111" stroke-width="3"/>
            <rect x="22" y="38" width="76" height="16" rx="4" fill="#9E1B1E" stroke="#111" stroke-width="3"/>
            <path d="M42 46 C47 39, 54 41, 56 49 C58 36, 68 27, 74 25 C71 35, 72 42, 79 34 C75 45, 73 53, 68 58 C73 61, 74 66, 71 69 C63 63, 53 60, 49 52 L42 46 Z" fill="#FFFFFF" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <div class="font-bold text-xs sm:text-sm tracking-wide uppercase font-['Montserrat']">
            Bangkok Christ Church <span class="text-amber-400 font-semibold">Broadcast CG</span>
          </div>
          <div class="text-[11px] text-zinc-400">Production Lower-Thirds, Tickers, 12 Frames &amp; Stream Deck</div>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- On-Air Tally Pill -->
        <div id="tally-pill" class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-bold tracking-wider text-zinc-400">
          <span id="tally-dot" class="w-2 h-2 rounded-full bg-zinc-600"></span>
          <span id="tally-text">STANDBY</span>
          <span id="tally-timer" class="text-red-300 font-mono"></span>
        </div>

        <button id="btn-toggle-dock" onclick="toggleDockLayout()" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition">
          Dock View
        </button>
        <button onclick="testCurrentSourceFullscreen()" class="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 border border-red-600 text-xs font-semibold text-white transition shadow-sm">
          Test Fullscreen
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main id="workspace" class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_460px] min-h-0">

      <!-- Left / Top: Live 16:9 Program Preview -->
      <section id="monitor-col" class="bg-black/80 p-3 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col gap-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span id="monitor-title" class="text-[11px] font-bold tracking-widest uppercase text-red-400">Preview: Lower Third Overlay</span>
            <button id="btn-switch-preview" onclick="togglePreviewTarget()" class="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[10.5px] font-semibold text-amber-300 transition">
              Switch to OBS Frames
            </button>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="setBackdrop('bg-stage')" class="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300">Stage</button>
            <button onclick="setBackdrop('bg-bright')" class="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300">Bright</button>
            <button onclick="setBackdrop('bg-checker')" class="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-emerald-300" title="Verify true transparent cutouts">Alpha Check</button>
            <button onclick="toggleSafeGuide()" class="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-amber-300">Safe Area</button>
          </div>
        </div>

        <!-- 16:9 Auto-Scaled Monitor Shell -->
        <div id="stage-wrap" class="w-full aspect-video max-h-[460px] bg-black border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center relative">
          <div id="stage-shell" class="relative w-[1920px] h-[1080px] shrink-0 overflow-hidden bg-stage" style="transform-origin: center center;">

            <!-- Preview-Only Mock Cutout Guides -->
            <div id="preview-mock-layer" class="hidden absolute inset-0 pointer-events-none"></div>

            <!-- Broadcast Safe Guide -->
            <div id="safe-guide" class="hidden absolute inset-[6.5%] border-2 border-dashed border-amber-400/50 pointer-events-none z-40"></div>

            <!-- SOURCE A: LOWER-THIRD & TICKER OVERLAY (?view=overlay) -->
            <div id="cg-canvas" class="broadcast-stage" data-theme="bcc-crimson">
              <!-- Top-Left LIVE Indicator -->
              <div id="cg-live-bug" class="cg-live-bug is-visible">
                <span class="cg-live-dot"></span>
                <span class="cg-live-label">LIVE</span>
                <span id="cg-live-church" class="cg-live-church">BANGKOK CHRIST CHURCH</span>
              </div>

              <!-- Lower Third Graphic -->
              <div class="cg-lt-anchor">
                <div id="cg-lt" class="cg-lt mode-speaker style-modern-slide">
                  <div class="cg-spine"></div>
                  <div class="cg-mask">
                    <div class="cg-surface">
                      <!-- Church Logo Slot -->
                      <div id="cg-logo-slot" class="cg-logo-slot">
                        <img id="cg-logo-img" class="cg-logo-img hidden" src="" alt="Church Logo" />
                        <div id="cg-default-logo" class="cg-default-logo">
                          <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none">
                            <defs>
                              <path id="bcc-arch" d="M 28,96 A 74,74 0 0,1 172,96" />
                            </defs>
                            <text fill="#111" font-family="Montserrat, sans-serif" font-size="13.5" font-weight="800" letter-spacing="1.1">
                              <textPath href="#bcc-arch" startOffset="50%" text-anchor="middle">BANGKOK CHRIST CHURCH</textPath>
                            </text>
                            <rect x="86" y="42" width="28" height="126" rx="6" fill="#fff" stroke="#111" stroke-width="3.5"/>
                            <rect x="44" y="72" width="112" height="28" rx="6" fill="#fff" stroke="#111" stroke-width="3.5"/>
                            <rect x="89" y="45" width="22" height="120" rx="4" fill="#9E1B1E"/>
                            <rect x="47" y="75" width="106" height="22" rx="4" fill="#9E1B1E"/>
                            <path d="M74 80 C81 72, 89 74, 92 84 C95 66, 108 55, 117 52 C112 65, 114 74, 124 63 C119 77, 116 88, 109 95 C115 99, 116 105, 112 109 C101 102, 87 98, 82 87 L74 80 Z" fill="#fff" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>
                            <text x="100" y="188" text-anchor="middle" fill="#111" font-family="Montserrat, sans-serif" font-size="13.5" font-weight="700">John 14:6</text>
                          </svg>
                        </div>
                      </div>

                      <!-- Text Stack -->
                      <div class="cg-stack">
                        <div class="cg-meta">
                          <span id="cg-cat" class="cg-cat">SPEAKER</span>
                          <span id="cg-meta-line" class="cg-meta-line"></span>
                          <span id="cg-church" class="cg-church">BANGKOK CHRIST CHURCH</span>
                        </div>
                        <h1 id="cg-primary" class="cg-primary">Pastor John Smith</h1>
                        <div class="cg-sub-row">
                          <p id="cg-secondary" class="cg-secondary">Senior Pastor</p>
                          <span id="cg-badge" class="cg-badge has-badge">JOHN 14:6</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom Scrolling News Ticker -->
              <div id="cg-marquee" class="cg-marquee">
                <div class="cg-marquee-tag">
                  <span class="cg-marquee-tag-dot"></span>
                  <span id="cg-marquee-tag">CHURCH NEWS</span>
                </div>
                <div class="cg-marquee-viewport">
                  <div id="cg-marquee-track" class="cg-marquee-track"></div>
                </div>
              </div>
            </div>

            <!-- SOURCE B: READY-MADE OBS FRAMES (?view=frame&frame=...) -->
            <div id="frame-canvas" class="broadcast-stage hidden" data-theme="bcc-crimson"></div>

          </div>
        </div>

        <!-- Shortcuts & Sync Status -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-400">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span>Hotkeys:</span>
            <kbd class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-[10px]">Space</kbd> Show/Hide
            <kbd class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-[10px]">Esc</kbd> Hide
            <kbd class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-[10px]">1–4</kbd> Mode
          </div>
          <div id="sync-status" class="font-mono text-emerald-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span id="sync-status-text">Ready</span>
          </div>
        </div>
      </section>

      <!-- Right / Bottom: Operator Control Panel -->
      <aside class="bg-zinc-900 flex flex-col overflow-y-auto">

        <!-- Sticky Master Transport -->
        <div class="sticky top-0 z-20 p-3 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 space-y-2.5">
          <div class="grid grid-cols-4 gap-1.5">
            <button onclick="triggerShow()" class="py-2.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition shadow">
              Show
            </button>
            <button onclick="triggerHide()" class="py-2.5 px-2 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition shadow">
              Hide
            </button>
            <button onclick="triggerSwapLive()" class="py-2.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-amber-500/40 text-amber-200 font-bold text-xs tracking-wider uppercase transition">
              Swap
            </button>
            <button onclick="clearAllGraphics()" class="py-2.5 px-2 rounded-lg bg-zinc-950 hover:bg-red-950 border border-red-600/80 text-red-400 font-bold text-xs tracking-wider uppercase transition">
              Clear All
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs text-zinc-300">
            <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" id="ctrl-auto-hide" onchange="handleControlChange()" class="accent-red-600 rounded w-3.5 h-3.5" />
              <span>Auto-Hide</span>
              <input type="number" id="ctrl-duration" value="10" min="3" max="120" onchange="handleControlChange()" class="w-12 px-1.5 py-0.5 text-center rounded bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
              <span class="text-zinc-400">s</span>
            </label>

            <div class="flex items-center gap-3">
              <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" id="ctrl-show-ticker" onchange="handleControlChange()" class="accent-red-600 rounded w-3.5 h-3.5" />
                <span>Ticker</span>
              </label>
              <button onclick="toggleTickerPause()" class="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10.5px] text-amber-300 border border-zinc-700" title="Pause / Resume Ticker">
                ⏸
              </button>
              <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" id="ctrl-show-live" checked onchange="handleControlChange()" class="accent-red-600 rounded w-3.5 h-3.5" />
                <span>LIVE</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 4 Primary Navigation Tabs -->
        <div class="flex border-b border-zinc-800 bg-zinc-950/70 px-3 gap-3 overflow-x-auto">
          <button id="tab-btn-control" onclick="switchTab('control')" class="py-2.5 text-xs font-semibold border-b-2 border-amber-400 text-amber-200 transition shrink-0">
            1. Live Control
          </button>
          <button id="tab-btn-library" onclick="switchTab('library')" class="py-2.5 text-xs font-semibold border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition shrink-0">
            2. Graphics Library
          </button>
          <button id="tab-btn-frames" onclick="switchTab('frames')" class="py-2.5 text-xs font-semibold border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition shrink-0">
            3. Frame Editor
          </button>
          <button id="tab-btn-settings" onclick="switchTab('settings')" class="py-2.5 text-xs font-semibold border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 transition shrink-0">
            4. Settings &amp; OBS
          </button>
        </div>

        <!-- TAB 1: LIVE CONTROL -->
        <div id="tab-control" class="p-3 space-y-3">
          <!-- Quick Mode Grid -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Graphic Mode (Keys 1–4)</span>
              <select id="in-anim-style" onchange="handleControlChange()" class="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10.5px] text-zinc-200 outline-none">
                <option value="modern-slide">Modern Slide</option>
                <option value="minimal-fade">Minimal Fade</option>
                <option value="elegant-reveal">Elegant Reveal</option>
                <option value="classic-bar">Classic Bar</option>
              </select>
            </div>
            <div id="mode-grid" class="grid grid-cols-4 gap-1.5"></div>
          </div>

          <!-- Live Text Editor -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Category</span>
                <input type="text" id="in-category" oninput="handleLiveTextEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Church Name</span>
                <input type="text" id="in-church" oninput="handleLiveTextEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
              </label>
            </div>

            <label class="block space-y-1">
              <span id="lbl-primary" class="text-[11px] text-zinc-400">Main Headline / Name</span>
              <input type="text" id="in-primary" oninput="handleLiveTextEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span id="lbl-secondary" class="text-[11px] text-zinc-400">Subtitle / Role</span>
                <input type="text" id="in-secondary" oninput="handleLiveTextEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Badge (Optional)</span>
                <input type="text" id="in-badge" placeholder="e.g. JOHN 14:6" oninput="handleLiveTextEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:border-amber-400 outline-none" />
              </label>
            </div>
          </div>

          <!-- One-Click Lower Third Cues -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">One-Click Lower Thirds</span>
              <button onclick="saveCurrentCue()" class="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-semibold transition">
                + Save Current
              </button>
            </div>
            <div id="cue-list" class="space-y-2 max-h-72 overflow-y-auto pr-0.5"></div>
          </div>
        </div>

        <!-- TAB 2: GRAPHICS LIBRARY -->
        <div id="tab-library" class="hidden p-3 space-y-3">
          <!-- Lower Third Presets -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Saved Lower Third Presets</span>
              <button onclick="saveCurrentCue()" class="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-semibold">
                + New Preset
              </button>
            </div>
            <div id="lib-cue-list" class="space-y-2 max-h-80 overflow-y-auto pr-0.5"></div>
          </div>

          <!-- Marquee / Ticker Presets -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Ticker / Marquee Presets</span>
              <button onclick="saveCurrentMarqueePreset()" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold">
                + Save Marquee
              </button>
            </div>
            <div id="marquee-preset-list" class="space-y-2"></div>
          </div>
        </div>

        <!-- TAB 3: FRAME EDITOR -->
        <div id="tab-frames" class="hidden p-3 space-y-3">
          <!-- 12 Ready-Made Frame Picker -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">12 Ready-Made OBS Frames (1920×1080)</span>
              <span class="text-[10px] text-zinc-400">Click to preview</span>
            </div>

            <div id="frame-selector-grid" class="grid grid-cols-2 gap-2"></div>

            <!-- Frame OBS URL Box -->
            <div class="pt-2 border-t border-zinc-700/60 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span id="selected-frame-url-label" class="text-[11px] font-semibold text-zinc-200">OBS Frame URL</span>
                <span id="selected-frame-hint" class="text-[10px] font-mono text-amber-300 text-right"></span>
              </div>
              <div class="flex gap-1.5">
                <input type="text" id="url-selected-frame" readonly onclick="this.select()" class="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[11px] text-emerald-300 outline-none" />
                <button onclick="copySelectedFrameUrl(this)" class="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-semibold shrink-0">
                  Copy URL
                </button>
              </div>
            </div>
          </div>

          <!-- Per-Frame Visual Customizer -->
          <div class="p-3 rounded-xl bg-zinc-800/60 border border-amber-500/30 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span id="customizer-frame-title" class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Customize Frame</span>
              <button onclick="resetSelectedFrameSettings()" class="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-medium text-zinc-300">
                Reset Frame
              </button>
            </div>

            <!-- Theme & Custom Accent Override -->
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Frame Theme</span>
                <select id="in-fc-theme" onchange="handleFrameCustomizeChange()" class="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none">
                  <option value="inherit">Use Global Theme</option>
                  <option value="bcc-crimson">BCC Dark</option>
                  <option value="bcc-light">Light</option>
                  <option value="classic-gold">Gold</option>
                  <option value="navy">Navy</option>
                </select>
              </label>
              <div class="space-y-1">
                <span class="text-[11px] text-zinc-400 block">Accent Override</span>
                <div class="flex items-center gap-1.5">
                  <input type="color" id="in-fc-accent" oninput="handleFrameAccentPick()" class="h-[30px] w-10 rounded bg-zinc-950 border border-zinc-700 cursor-pointer p-0.5" />
                  <button id="btn-fc-accent-auto" onclick="clearFrameCustomAccent()" class="flex-1 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 border border-zinc-700 text-[10.5px] font-medium text-zinc-300 truncate">
                    Theme Auto
                  </button>
                </div>
              </div>
            </div>

            <!-- Header Badge & Panel Title -->
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Header Badge</span>
                <input type="text" id="in-fc-header-badge" oninput="handleFrameCustomizeChange()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Panel Heading</span>
                <input type="text" id="in-fc-panel-title" oninput="handleFrameCustomizeChange()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
            </div>

            <!-- Geometry Sliders -->
            <div class="grid grid-cols-2 gap-x-3 gap-y-2">
              <label class="block space-y-0.5">
                <span class="text-[10.5px] text-zinc-400">Corner Radius: <strong id="lbl-fc-radius" class="text-zinc-200">14px</strong></span>
                <input type="range" id="in-fc-radius" min="0" max="32" step="2" value="14" oninput="handleFrameCustomizeChange()" class="w-full accent-red-600" />
              </label>
              <label class="block space-y-0.5">
                <span class="text-[10.5px] text-zinc-400">Cutout Border: <strong id="lbl-fc-border" class="text-zinc-200">3px</strong></span>
                <input type="range" id="in-fc-border" min="0" max="8" step="1" value="3" oninput="handleFrameCustomizeChange()" class="w-full accent-red-600" />
              </label>
              <label class="block space-y-0.5">
                <span class="text-[10.5px] text-zinc-400">Text Size: <strong id="lbl-fc-text-scale" class="text-zinc-200">100%</strong></span>
                <input type="range" id="in-fc-text-scale" min="0.85" max="1.25" step="0.05" value="1" oninput="handleFrameCustomizeChange()" class="w-full accent-red-600" />
              </label>
              <label class="block space-y-0.5">
                <span class="text-[10.5px] text-zinc-400">Matte Opacity: <strong id="lbl-fc-opacity" class="text-zinc-200">100%</strong></span>
                <input type="range" id="in-fc-opacity" min="0.5" max="1" step="0.05" value="1" oninput="handleFrameCustomizeChange()" class="w-full accent-red-600" />
              </label>
            </div>

            <!-- Toggles -->
            <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-2 border-t border-zinc-700/60 text-[11px] text-zinc-200">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="in-fc-mirror" onchange="handleFrameCustomizeChange()" class="accent-red-600 rounded" />
                <span>Flip Left/Right</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="in-fc-header" onchange="handleFrameCustomizeChange()" class="accent-red-600 rounded" />
                <span>Header</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="in-fc-infobar" onchange="handleFrameCustomizeChange()" class="accent-red-600 rounded" />
                <span>Info Bar</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="in-fc-live" onchange="handleFrameCustomizeChange()" class="accent-red-600 rounded" />
                <span>LIVE</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="in-fc-logo" onchange="handleFrameCustomizeChange()" class="accent-red-600 rounded" />
                <span>Logo</span>
              </label>
            </div>
          </div>

          <!-- Scripture Content Editor -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Scripture Frame Content</span>
              <button onclick="pullLowerThirdToBible()" class="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-medium text-zinc-200">
                Use Active LT Text
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Reference</span>
                <input type="text" id="in-fr-verse-ref" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Translation</span>
                <input type="text" id="in-fr-verse-ver" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
            </div>
            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">Verse Text</span>
              <textarea id="in-fr-verse-text" rows="3" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none"></textarea>
            </label>
          </div>

          <!-- Announcements Content Editor -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Announcements Frame Content</div>
            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">One per line: <code class="text-amber-300">Title | Details</code></span>
              <textarea id="in-fr-announcements" rows="3" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none"></textarea>
            </label>
          </div>

          <!-- Worship & Prayer Extra Fields -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Worship / Praise Frame Content</div>
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Song / Hymn Title</span>
                <input type="text" id="in-fr-song-title" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Key / Worship Team</span>
                <input type="text" id="in-fr-song-details" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
            </div>
          </div>

          <!-- Welcome & Countdown Controls -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Starting Soon &amp; Countdown Timer</div>
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Welcome Title</span>
                <input type="text" id="in-fr-welcome-title" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Slideshow Window Tag</span>
                <input type="text" id="in-fr-slide-tag" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
            </div>

            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">Welcome Subtitle</span>
              <input type="text" id="in-fr-welcome-sub" oninput="handleFrameContentEdit()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
            </label>

            <!-- Countdown Timer Synced -->
            <div class="pt-2 border-t border-zinc-700/60 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <div class="inline-flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800">
                  <button id="btn-cd-mode-duration" onclick="setCountdownMode('duration')" class="px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-red-700 text-white">Duration</button>
                  <button id="btn-cd-mode-target" onclick="setCountdownMode('target')" class="px-2.5 py-1 rounded-md text-[10.5px] font-semibold text-zinc-400">Start Time</button>
                </div>
                <div class="flex items-center gap-1.5">
                  <span id="ctrl-cd-status" class="text-[10px] text-zinc-400"></span>
                  <strong id="ctrl-cd-readout" class="font-mono text-xs text-amber-300">05:00</strong>
                </div>
              </div>

              <div id="cd-duration-controls" class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 text-xs">
                  <span class="text-zinc-400">Length:</span>
                  <input type="number" id="in-cd-mins" value="5" min="1" max="90" onchange="resetCountdown()" class="w-12 px-1.5 py-1 text-center rounded bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
                  <span class="text-zinc-400">min</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button id="btn-cd-toggle" onclick="toggleCountdown()" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold">Start</button>
                  <button onclick="resetCountdown()" class="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px]">Reset</button>
                </div>
              </div>

              <div id="cd-target-controls" class="hidden flex flex-wrap items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-xs">
                  <span class="text-zinc-400">Starts At:</span>
                  <input type="time" id="in-cd-target-time" value="10:00" oninput="handleTargetTimeChange()" class="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
                </label>
                <span class="text-[10.5px] text-emerald-400 font-medium">Clock-synced</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: SETTINGS & OBS SETUP -->
        <div id="tab-settings" class="hidden p-3 space-y-3">
          <!-- Core OBS Studio URLs -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">OBS Studio &amp; Deck URLs</div>

            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">1. Lower-Third &amp; Ticker Overlay (1920×1080)</span>
              <div class="flex gap-1.5">
                <input type="text" id="url-overlay" readonly onclick="this.select()" class="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[11px] text-emerald-300 outline-none" />
                <button onclick="copyText(getTargetUrl('overlay'), this)" class="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-semibold shrink-0">Copy</button>
              </div>
            </label>

            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">2. OBS Custom Browser Dock (Control Panel)</span>
              <div class="flex gap-1.5">
                <input type="text" id="url-control" readonly onclick="this.select()" class="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[11px] text-emerald-300 outline-none" />
                <button onclick="copyText(getTargetUrl('control'), this)" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold shrink-0">Copy</button>
              </div>
            </label>

            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">3. OBS Custom Feed Dock (Rundown List)</span>
              <div class="flex gap-1.5">
                <input type="text" id="url-feed" readonly onclick="this.select()" class="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[11px] text-emerald-300 outline-none" />
                <button onclick="copyText(getTargetUrl('feed'), this)" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold shrink-0">Copy</button>
              </div>
            </label>

            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">4. Stream Deck Touch Browser URL</span>
              <div class="flex gap-1.5">
                <input type="text" id="url-deck" readonly onclick="this.select()" class="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[11px] text-emerald-300 outline-none" />
                <button onclick="copyText(getTargetUrl('deck'), this)" class="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold shrink-0">Copy</button>
              </div>
            </label>
          </div>

          <!-- Global Theme, Logo & Geometry -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-3">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Global Theme &amp; Logo</div>

            <div class="grid grid-cols-4 gap-1.5" id="theme-grid">
              <button data-theme-btn="bcc-crimson" onclick="setTheme('bcc-crimson')" class="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-200">BCC Dark</button>
              <button data-theme-btn="bcc-light" onclick="setTheme('bcc-light')" class="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-200">Light</button>
              <button data-theme-btn="classic-gold" onclick="setTheme('classic-gold')" class="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-200">Gold</button>
              <button data-theme-btn="navy" onclick="setTheme('navy')" class="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] font-semibold text-zinc-200">Navy</button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Lower-Third Size: <strong id="lbl-scale" class="text-zinc-200">100%</strong></span>
                <input type="range" id="ctrl-scale" min="0.80" max="1.25" step="0.05" value="1" oninput="handleControlChange()" class="w-full accent-red-600" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Opacity: <strong id="lbl-opacity" class="text-zinc-200">94%</strong></span>
                <input type="range" id="ctrl-opacity" min="0.65" max="1" step="0.02" value="0.94" oninput="handleControlChange()" class="w-full accent-red-600" />
              </label>
            </div>

            <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-700/60">
              <label class="inline-flex items-center gap-1.5 text-xs text-zinc-200 cursor-pointer">
                <input type="checkbox" id="ctrl-show-logo" checked onchange="handleControlChange()" class="accent-red-600 rounded" />
                <span>Show Logo</span>
              </label>
              <div class="flex items-center gap-1.5">
                <label class="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] font-semibold cursor-pointer transition">
                  Upload Logo
                  <input type="file" accept="image/*" onchange="handleLogoUpload(event)" class="hidden" />
                </label>
                <button onclick="resetLogo()" class="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-700 border border-zinc-700 text-[11px] font-medium text-zinc-300">
                  Default
                </button>
              </div>
            </div>
          </div>

          <!-- Global Marquee Settings -->
          <div class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 space-y-2.5">
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-400">Global Ticker Settings</div>
            <div class="grid grid-cols-2 gap-2">
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Tag Label</span>
                <input type="text" id="in-marquee-tag" value="CHURCH NEWS" oninput="handleControlChange()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
              </label>
              <label class="block space-y-1">
                <span class="text-[11px] text-zinc-400">Speed: <strong id="lbl-speed" class="text-zinc-200">32s</strong></span>
                <input type="range" id="in-marquee-speed" min="14" max="60" value="32" oninput="handleControlChange()" class="w-full accent-red-600 mt-1.5" />
              </label>
            </div>
            <label class="block space-y-1">
              <span class="text-[11px] text-zinc-400">Messages (separate with <code class="text-amber-300">|</code>)</span>
              <textarea id="in-marquee-text" rows="2" oninput="handleControlChange()" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none"></textarea>
            </label>
          </div>

          <!-- Beginner-Friendly OBS & Stream Deck Setup Guide -->
          <details class="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 group">
            <summary class="text-xs font-bold uppercase tracking-wider text-amber-400 cursor-pointer flex items-center justify-between">
              <span>📖 Beginner OBS &amp; Stream Deck Setup Guide</span>
              <span class="text-zinc-400 group-open:rotate-180 transition">▼</span>
            </summary>
            <div class="mt-3 space-y-2.5 text-xs text-zinc-300 leading-relaxed border-t border-zinc-700/60 pt-3">
              <div>
                <strong class="text-white">1. Add Lower Thirds into OBS:</strong>
                <p class="text-zinc-400 mt-0.5">In OBS, add a <span class="text-amber-300">Browser Source</span> → Paste URL 1 (<code>?view=overlay</code>) → Set Width: <code class="text-emerald-300">1920</code>, Height: <code class="text-emerald-300">1080</code>. Keep it on top of your camera layer.</p>
              </div>
              <div>
                <strong class="text-white">2. Add Ready-Made OBS Frames:</strong>
                <p class="text-zinc-400 mt-0.5">Select any frame in the Frame Editor tab, copy its URL, and add as a 1920×1080 Browser Source above your camera. The camera will fit seamlessly behind the transparent cutouts.</p>
              </div>
              <div>
                <strong class="text-white">3. Add OBS Custom Browser Dock:</strong>
                <p class="text-zinc-400 mt-0.5">In OBS menu: <span class="text-amber-300">Docks → Custom Browser Docks</span> → Name: "Church CG" → URL: URL 2 (<code>?view=control</code>). Dock it neatly into OBS for one-click volunteer operation!</p>
              </div>
              <div>
                <strong class="text-white">4. Stream Deck / iPad Touch Control:</strong>
                <p class="text-zinc-400 mt-0.5">Open URL 4 (<code>?view=deck</code>) in any browser or Stream Deck browser plugin. You get big touch buttons for every lower third, frame, marquee, and emergency clear!</p>
              </div>
            </div>
          </details>

          <!-- Safe Reset Defaults -->
          <div class="flex justify-end pt-1">
            <button id="btn-reset-all" onclick="handleResetClick()" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-700 text-xs text-red-300 font-medium transition">
              Reset All Defaults
            </button>
          </div>
        </div>

      </aside>
    </main>
  </div>

  <!-- Quick Edit Cue Modal -->
  <div id="cue-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div class="bg-zinc-900 border border-amber-500/50 rounded-xl w-full max-w-md p-4 space-y-3 shadow-2xl">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-400 font-['Montserrat']">Edit Lower Third</span>
        <button onclick="closeCueModal()" class="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300">✕</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="block space-y-1">
          <span class="text-[11px] text-zinc-400">Mode</span>
          <select id="edit-mode" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none">
            <option value="speaker">Speaker</option>
            <option value="sermon">Sermon</option>
            <option value="scripture">Scripture</option>
            <option value="announcement">Notice</option>
          </select>
        </label>
        <label class="block space-y-1">
          <span class="text-[11px] text-zinc-400">Category</span>
          <input type="text" id="edit-category" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
        </label>
      </div>
      <label class="block space-y-1">
        <span class="text-[11px] text-zinc-400">Main Text</span>
        <input type="text" id="edit-primary" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
      </label>
      <div class="grid grid-cols-2 gap-2">
        <label class="block space-y-1">
          <span class="text-[11px] text-zinc-400">Subtitle</span>
          <input type="text" id="edit-secondary" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
        </label>
        <label class="block space-y-1">
          <span class="text-[11px] text-zinc-400">Badge</span>
          <input type="text" id="edit-badge" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
        </label>
      </div>
      <label class="block space-y-1">
        <span class="text-[11px] text-zinc-400">Display Duration (Seconds)</span>
        <input type="number" id="edit-duration" value="10" min="0" max="120" class="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white outline-none" />
      </label>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeCueModal()" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200">Cancel</button>
        <button onclick="saveEditedCue(false)" class="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-xs font-semibold text-white">Save</button>
        <button onclick="saveEditedCue(true)" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white">Save &amp; Show</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="hidden fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-900 border border-amber-400/70 text-xs font-semibold text-amber-200 shadow-2xl z-50"></div>

  <!-- Floating Exit Fullscreen Button -->
  <button id="exit-overlay-btn" onclick="exitOverlayMode()" class="hidden fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-zinc-950/90 border border-amber-400 text-xs font-semibold text-white shadow-xl hover:bg-zinc-900">
    ← Return to Studio Control
  </button>
`;
