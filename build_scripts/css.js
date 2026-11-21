module.exports = `
    /* =========================================================================
       1. BASE & OBS TRANSPARENT OVERLAY MODE
       ========================================================================= */
    :root {
      --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
      --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Transparent background for OBS Browser Sources (?view=overlay or ?view=frame) */
    html.obs-overlay-mode,
    html.obs-overlay-mode body {
      background: transparent !important;
      background-color: transparent !important;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
      user-select: none;
    }

    /* =========================================================================
       2. 1920x1080 BROADCAST STAGE & THEMES (CEF-Safe RGB)
       ========================================================================= */
    .broadcast-stage {
      --primary-rgb: 20, 18, 19;
      --surface-rgb: 30, 27, 29;
      --accent-rgb: 185, 28, 28;
      --text-rgb: 250, 250, 250;
      --muted-rgb: 208, 208, 214;
      --bg-opacity: 0.94;
      --safe-x: 6.5%;
      --safe-y: 11.5%;
      --lt-scale: 1;
      --logo-size: 54px;

      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      pointer-events: none;
      transform-origin: top left;
    }

    .broadcast-stage[data-theme="bcc-crimson"] {
      --primary-rgb: 20, 18, 19;
      --surface-rgb: 31, 27, 29;
      --accent-rgb: 185, 28, 28;
      --text-rgb: 250, 250, 250;
      --muted-rgb: 212, 212, 216;
    }
    .broadcast-stage[data-theme="bcc-light"] {
      --primary-rgb: 248, 247, 244;
      --surface-rgb: 255, 255, 255;
      --accent-rgb: 153, 27, 27;
      --text-rgb: 17, 17, 19;
      --muted-rgb: 82, 82, 91;
    }
    .broadcast-stage[data-theme="classic-gold"] {
      --primary-rgb: 17, 17, 19;
      --surface-rgb: 27, 26, 29;
      --accent-rgb: 200, 169, 107;
      --text-rgb: 245, 241, 232;
      --muted-rgb: 168, 164, 156;
    }
    .broadcast-stage[data-theme="navy"] {
      --primary-rgb: 11, 19, 32;
      --surface-rgb: 19, 30, 48;
      --accent-rgb: 217, 119, 6;
      --text-rgb: 248, 250, 252;
      --muted-rgb: 148, 163, 184;
    }

    /* =========================================================================
       3. ON-AIR LIVE BUG & BADGES
       ========================================================================= */
    .cg-live-bug {
      position: absolute;
      top: 5.5%;
      left: var(--safe-x);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: rgba(var(--primary-rgb), 0.92);
      border-left: 3px solid rgb(var(--accent-rgb));
      border-radius: 4px;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
      opacity: 0;
      transform: translate3d(0, -8px, 0);
      transition: opacity 350ms var(--ease-out-expo), transform 350ms var(--ease-out-expo);
      z-index: 30;
    }
    .cg-live-bug.is-visible {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
    .cg-live-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.75);
      animation: livePulse 2.4s infinite ease-in-out;
    }
    .cg-live-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: rgb(var(--text-rgb));
    }
    .cg-live-church {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.08em;
      color: rgb(var(--muted-rgb));
      padding-left: 10px;
      border-left: 1px solid rgba(var(--text-rgb), 0.22);
    }

    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.85); }
    }

    /* =========================================================================
       4. LOWER THIRD STYLES & DYNAMIC ANIMATION STYLES
       ========================================================================= */
    .cg-lt-anchor {
      position: absolute;
      left: var(--safe-x);
      bottom: var(--safe-y);
      transform: scale(var(--lt-scale));
      transform-origin: bottom left;
      z-index: 20;
      transition: bottom 360ms var(--ease-out-expo), left 360ms var(--ease-out-expo);
    }
    .broadcast-stage.has-marquee .cg-lt-anchor {
      bottom: calc(var(--safe-y) + 3.8%);
    }

    .cg-lt {
      position: relative;
      display: inline-flex;
      align-items: stretch;
      min-width: 480px;
      max-width: 1200px;
    }

    .cg-spine {
      width: 5px;
      background: rgb(var(--accent-rgb));
      border-radius: 2px;
      transform: scaleY(0);
      transform-origin: bottom center;
      will-change: transform;
      z-index: 2;
    }

    .cg-mask {
      overflow: hidden;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      box-shadow: 0 22px 46px -10px rgba(0, 0, 0, 0.52);
    }

    .cg-surface {
      position: relative;
      display: flex;
      align-items: center;
      gap: 22px;
      padding: 20px 38px 22px 26px;
      background: rgba(var(--primary-rgb), var(--bg-opacity));
      border-top: 1px solid rgba(var(--text-rgb), 0.12);
      border-right: 1px solid rgba(var(--text-rgb), 0.10);
      border-bottom: 1px solid rgba(var(--text-rgb), 0.12);
      transform: translate3d(-102%, 0, 0);
      opacity: 0;
      will-change: transform, opacity;
    }

    .cg-logo-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 20px;
      border-right: 1px solid rgba(var(--text-rgb), 0.16);
      flex-shrink: 0;
      opacity: 0;
      transform: translate3d(-10px, 0, 0);
      will-change: transform, opacity;
    }
    .cg-logo-slot.hidden-slot { display: none; }

    .cg-logo-img {
      width: var(--logo-size);
      height: var(--logo-size);
      object-fit: contain;
      border-radius: 6px;
    }

    .cg-default-logo {
      width: var(--logo-size);
      height: var(--logo-size);
      background: #ffffff;
      border-radius: 8px;
      padding: 3px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cg-stack {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cg-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
      opacity: 0;
      transform: translate3d(0, 8px, 0);
      will-change: transform, opacity;
    }

    .cg-cat {
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgb(var(--accent-rgb));
    }

    .cg-meta-line {
      width: 16px;
      height: 1px;
      background: rgba(var(--accent-rgb), 0.60);
    }

    .cg-church {
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgb(var(--muted-rgb));
    }

    .cg-primary {
      font-family: 'Montserrat', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: rgb(var(--text-rgb));
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transform: translate3d(-14px, 0, 0);
      will-change: transform, opacity;
      margin: 0;
    }

    .cg-sub-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
      opacity: 0;
      transform: translate3d(0, 6px, 0);
      will-change: transform, opacity;
    }

    .cg-secondary {
      font-size: 17px;
      font-weight: 400;
      color: rgb(var(--muted-rgb));
      line-height: 1.35;
      margin: 0;
    }

    .cg-badge {
      font-family: 'Montserrat', sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgb(var(--text-rgb));
      background: rgba(var(--accent-rgb), 0.24);
      border: 1px solid rgba(var(--accent-rgb), 0.50);
      padding: 2px 9px;
      border-radius: 4px;
      display: none;
    }
    .cg-badge.has-badge { display: inline-block; }

    /* Mode-Specific Typography */
    .cg-lt.mode-scripture .cg-primary {
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-weight: 400;
      font-size: 26px;
      line-height: 1.38;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .cg-lt.mode-scripture .cg-secondary {
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgb(var(--accent-rgb));
    }
    .cg-lt.mode-sermon .cg-primary {
      font-size: 34px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* --- ANIMATION STYLES --- */

    /* Style 1: Modern Slide (Default) */
    .cg-lt.style-modern-slide.is-active .cg-spine     { transform: scaleY(1); transition: transform 320ms var(--ease-out-expo) 0ms; }
    .cg-lt.style-modern-slide.is-active .cg-surface   { transform: translate3d(0,0,0); opacity: 1; transition: transform 460ms var(--ease-out-expo) 80ms, opacity 340ms ease-out 80ms; }
    .cg-lt.style-modern-slide.is-active .cg-logo-slot { transform: translate3d(0,0,0); opacity: 1; transition: transform 400ms var(--ease-out-expo) 180ms, opacity 340ms ease-out 180ms; }
    .cg-lt.style-modern-slide.is-active .cg-meta      { transform: translate3d(0,0,0); opacity: 1; transition: transform 380ms var(--ease-out-expo) 200ms, opacity 320ms ease-out 200ms; }
    .cg-lt.style-modern-slide.is-active .cg-primary   { transform: translate3d(0,0,0); opacity: 1; transition: transform 420ms var(--ease-out-expo) 260ms, opacity 360ms ease-out 260ms; }
    .cg-lt.style-modern-slide.is-active .cg-sub-row   { transform: translate3d(0,0,0); opacity: 1; transition: transform 400ms var(--ease-out-expo) 340ms, opacity 360ms ease-out 340ms; }

    .cg-lt.style-modern-slide.is-exiting .cg-sub-row   { transform: translate3d(0,5px,0); opacity: 0; transition: transform 180ms var(--ease-in-out) 0ms, opacity 150ms ease-in 0ms; }
    .cg-lt.style-modern-slide.is-exiting .cg-primary   { transform: translate3d(-12px,0,0); opacity: 0; transition: transform 220ms var(--ease-in-out) 60ms, opacity 180ms ease-in 60ms; }
    .cg-lt.style-modern-slide.is-exiting .cg-meta,
    .cg-lt.style-modern-slide.is-exiting .cg-logo-slot { transform: translate3d(-8px,0,0); opacity: 0; transition: transform 200ms var(--ease-in-out) 80ms, opacity 160ms ease-in 80ms; }
    .cg-lt.style-modern-slide.is-exiting .cg-surface   { transform: translate3d(-103%,0,0); opacity: 0; transition: transform 340ms var(--ease-in-out) 140ms, opacity 280ms ease-in 160ms; }
    .cg-lt.style-modern-slide.is-exiting .cg-spine     { transform: scaleY(0); transition: transform 240ms var(--ease-in-out) 240ms; }

    /* Style 2: Minimal Fade */
    .cg-lt.style-minimal-fade .cg-surface { transform: translate3d(0, 10px, 0); }
    .cg-lt.style-minimal-fade.is-active .cg-spine { transform: scaleY(1); transition: transform 280ms ease-out; }
    .cg-lt.style-minimal-fade.is-active .cg-surface { transform: translate3d(0,0,0); opacity: 1; transition: opacity 350ms ease-out, transform 350ms ease-out; }
    .cg-lt.style-minimal-fade.is-active .cg-logo-slot,
    .cg-lt.style-minimal-fade.is-active .cg-meta,
    .cg-lt.style-minimal-fade.is-active .cg-primary,
    .cg-lt.style-minimal-fade.is-active .cg-sub-row { transform: translate3d(0,0,0); opacity: 1; transition: opacity 300ms ease-out 100ms; }

    .cg-lt.style-minimal-fade.is-exiting .cg-surface,
    .cg-lt.style-minimal-fade.is-exiting .cg-spine { opacity: 0; transform: translate3d(0, 8px, 0); transition: opacity 260ms ease-in, transform 260ms ease-in; }

    /* Style 3: Elegant Reveal (Curtain drop) */
    .cg-lt.style-elegant-reveal .cg-surface { transform: translate3d(0, -100%, 0); }
    .cg-lt.style-elegant-reveal.is-active .cg-spine { transform: scaleY(1); transition: transform 300ms ease-out; }
    .cg-lt.style-elegant-reveal.is-active .cg-surface { transform: translate3d(0,0,0); opacity: 1; transition: transform 420ms var(--ease-out-expo) 60ms, opacity 300ms ease 60ms; }
    .cg-lt.style-elegant-reveal.is-active .cg-logo-slot,
    .cg-lt.style-elegant-reveal.is-active .cg-meta,
    .cg-lt.style-elegant-reveal.is-active .cg-primary,
    .cg-lt.style-elegant-reveal.is-active .cg-sub-row { transform: translate3d(0,0,0); opacity: 1; transition: opacity 350ms ease 150ms, transform 350ms ease 150ms; }

    .cg-lt.style-elegant-reveal.is-exiting .cg-surface { transform: translate3d(0, -100%, 0); opacity: 0; transition: transform 280ms ease-in, opacity 250ms ease-in; }
    .cg-lt.style-elegant-reveal.is-exiting .cg-spine { transform: scaleY(0); transition: transform 220ms ease-in 100ms; }

    /* Style 4: Classic Bar (Immediate clean expand) */
    .cg-lt.style-classic-bar .cg-surface { transform: scaleX(0.01); transform-origin: left center; }
    .cg-lt.style-classic-bar.is-active .cg-spine { transform: scaleY(1); transition: transform 200ms ease-out; }
    .cg-lt.style-classic-bar.is-active .cg-surface { transform: scaleX(1); opacity: 1; transition: transform 320ms ease-out 60ms, opacity 250ms ease 60ms; }
    .cg-lt.style-classic-bar.is-active .cg-logo-slot,
    .cg-lt.style-classic-bar.is-active .cg-meta,
    .cg-lt.style-classic-bar.is-active .cg-primary,
    .cg-lt.style-classic-bar.is-active .cg-sub-row { transform: translate3d(0,0,0); opacity: 1; transition: opacity 280ms ease 160ms; }

    .cg-lt.style-classic-bar.is-exiting .cg-surface { transform: scaleX(0.01); opacity: 0; transition: transform 240ms ease-in, opacity 200ms ease-in; }
    .cg-lt.style-classic-bar.is-exiting .cg-spine { transform: scaleY(0); transition: transform 180ms ease-in 120ms; }

    /* =========================================================================
       5. SCROLLING MARQUEE / TICKER
       ========================================================================= */
    .cg-marquee {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 48px;
      background: rgba(var(--primary-rgb), 0.96);
      border-top: 2px solid rgb(var(--accent-rgb));
      display: flex;
      align-items: center;
      z-index: 25;
      transform: translate3d(0, 100%, 0);
      opacity: 0;
      transition: transform 380ms var(--ease-out-expo), opacity 300ms ease;
    }
    .cg-marquee.is-visible {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    .cg-marquee-tag {
      height: 100%;
      padding: 0 24px;
      background: rgb(var(--accent-rgb));
      color: #ffffff;
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 9px;
      flex-shrink: 0;
      box-shadow: 4px 0 16px rgba(0,0,0,0.3);
      z-index: 2;
    }
    .cg-marquee-tag-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ffffff;
      animation: livePulse 2.4s infinite ease-in-out;
    }
    .cg-marquee-viewport {
      flex: 1;
      overflow: hidden;
      height: 100%;
      display: flex;
      align-items: center;
      position: relative;
    }
    .cg-marquee-track {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      will-change: transform;
      animation: marqueeScroll var(--marquee-duration, 32s) linear infinite;
    }
    .cg-marquee.is-paused .cg-marquee-track,
    .cg-marquee:not(.is-visible) .cg-marquee-track {
      animation-play-state: paused;
    }
    .cg-marquee-item {
      display: inline-flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
      color: rgb(var(--text-rgb));
      padding-right: 36px;
    }
    .cg-marquee-sep {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgb(var(--accent-rgb));
      margin-right: 36px;
      flex-shrink: 0;
    }
    @keyframes marqueeScroll {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }

    /* =========================================================================
       6. READY-MADE OBS FRAMES (?view=frame&frame=<id>)
       ========================================================================= */
    .fr-layer {
      position: absolute;
      inset: 0;
      width: 1920px;
      height: 1080px;
      pointer-events: none;
    }

    .fr-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100px;
      padding: 0 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(var(--text-rgb), 0.12);
    }
    .fr-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .fr-brand-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: rgb(var(--text-rgb));
    }
    .fr-brand-sub {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgb(var(--accent-rgb));
      margin-top: 2px;
    }

    .fr-live-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 6px;
      background: rgba(var(--surface-rgb), 0.94);
      border: 1px solid rgba(var(--text-rgb), 0.14);
      border-left: 4px solid rgb(var(--accent-rgb));
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgb(var(--text-rgb));
    }

    .fr-card {
      background: rgba(var(--surface-rgb), 0.94);
      border: 1px solid rgba(var(--text-rgb), 0.12);
      border-radius: 14px;
      box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
      overflow: hidden;
    }
    .fr-card-top-bar {
      height: 5px;
      width: 100%;
      background: rgb(var(--accent-rgb));
    }
    .fr-section-tag {
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgb(var(--accent-rgb));
    }
    .fr-title-lg {
      font-family: 'Montserrat', sans-serif;
      font-size: 30px;
      font-weight: 800;
      line-height: 1.22;
      color: rgb(var(--text-rgb));
    }
    .fr-sub-md {
      font-size: 18px;
      font-weight: 500;
      color: rgb(var(--muted-rgb));
      line-height: 1.4;
    }
    .fr-window-tag {
      position: absolute;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 6px;
      background: rgba(var(--primary-rgb), 0.88);
      border: 1px solid rgba(var(--text-rgb), 0.16);
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgb(var(--text-rgb));
    }
    .fr-announce-item {
      padding: 16px 20px;
      border-radius: 8px;
      background: rgba(var(--primary-rgb), 0.58);
      border: 1px solid rgba(var(--text-rgb), 0.09);
      border-left: 4px solid rgb(var(--accent-rgb));
    }
    .fr-verse-text {
      font-family: Georgia, 'Times New Roman', serif;
      font-style: italic;
      color: rgb(var(--text-rgb));
      line-height: 1.48;
    }
    .fr-countdown-digits {
      font-family: 'Montserrat', sans-serif;
      font-size: 96px;
      font-weight: 800;
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      color: rgb(var(--text-rgb));
      line-height: 1;
    }

    /* Preview Stage Backdrops */
    .bg-stage {
      background:
        radial-gradient(circle at 70% 25%, rgba(200, 169, 107, 0.22), transparent 45%),
        radial-gradient(circle at 25% 45%, rgba(59, 130, 246, 0.18), transparent 55%),
        linear-gradient(180deg, #12141c 0%, #1c1917 55%, #0c0b0a 100%);
    }
    .bg-bright {
      background: linear-gradient(135deg, #e8e4db 0%, #d4cdc1 55%, #bcb4a8 100%);
    }
    .bg-checker {
      background-color: #141416;
      background-image:
        linear-gradient(45deg, #202024 25%, transparent 25%),
        linear-gradient(-45deg, #202024 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #202024 75%),
        linear-gradient(-45deg, transparent 75%, #202024 75%);
      background-size: 24px 24px;
      background-position: 0 0, 0 12px, 12px -12px, -12px 0;
    }

    /* =========================================================================
       7. STREAM DECK & OBS DECK VIEW (?view=deck)
       ========================================================================= */
    .deck-container {
      width: 100vw;
      min-height: 100vh;
      background: #09090b;
      color: #fafafa;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }

    .deck-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid #27272a;
    }

    .deck-section-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #fbbf24;
      margin-bottom: 8px;
    }

    .deck-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }

    .deck-btn {
      min-height: 86px;
      padding: 12px 10px;
      border-radius: 12px;
      border: 1px solid #3f3f46;
      background: #18181b;
      color: #f4f4f5;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition: all 150ms ease;
      position: relative;
      overflow: hidden;
    }
    .deck-btn:active {
      transform: scale(0.96);
    }
    .deck-btn.action-primary {
      background: linear-gradient(135deg, #15803d, #166534);
      border-color: #22c55e;
      color: #ffffff;
    }
    .deck-btn.action-danger {
      background: linear-gradient(135deg, #b91c1c, #991b1b);
      border-color: #ef4444;
      color: #ffffff;
    }
    .deck-btn.action-warning {
      background: linear-gradient(135deg, #b45309, #92400e);
      border-color: #f59e0b;
      color: #ffffff;
    }
    .deck-btn.action-frame {
      background: linear-gradient(135deg, #1e3a8a, #1e40af);
      border-color: #3b82f6;
      color: #ffffff;
    }
    .deck-btn.is-active {
      box-shadow: 0 0 0 3px #ef4444, 0 0 16px rgba(239, 68, 68, 0.8);
      background: #7f1d1d !important;
      border-color: #ef4444 !important;
    }

    /* =========================================================================
       8. CUE FEED DOCK VIEW (?view=feed)
       ========================================================================= */
    .feed-container {
      width: 100vw;
      min-height: 100vh;
      background: #09090b;
      color: #f4f4f5;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }

    .feed-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #18181b;
      border: 1px solid #27272a;
      transition: all 180ms ease;
    }
    .feed-item.is-on-air {
      border-color: #ef4444;
      background: rgba(127, 29, 29, 0.35);
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.25);
    }
    .feed-item.is-preview {
      border-color: #3b82f6;
      background: rgba(30, 58, 138, 0.3);
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #09090b;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }
`;
