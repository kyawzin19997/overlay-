/* =========================================================================
   Bangkok Christ Church — Broadcast Frame Renderers
   SVG Matte Cutouts & High-Fidelity Church Broadcast Frames
   ========================================================================= */

function buildSvgMatteMask(cutouts, palette, fs, frameId) {
  const r = Math.max(0, Number(fs.cornerRadius ?? 14));
  const bw = Math.max(0, Number(fs.borderWidth ?? 3));
  const opacity = Math.min(1, Math.max(0, Number(fs.matteOpacity ?? 1)));
  const maskId = `mask-${frameId}-${Math.floor(Math.random() * 100000)}`;

  let maskCutouts = '';
  let borderStrokes = '';

  cutouts.forEach(c => {
    maskCutouts += `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.r}" ry="${c.r}" fill="#000" />`;
    if (bw > 0) {
      borderStrokes += `
        <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.r}" ry="${c.r}"
              fill="none" stroke="${palette.accent}" stroke-width="${bw}" stroke-opacity="0.88" />
        <rect x="${c.x - 1}" y="${c.y - 1}" width="${c.w + 2}" height="${c.h + 2}" rx="${c.r + 1}" ry="${c.r + 1}"
              fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
      `;
    }
  });

  return `
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;z-index:10;">
      <defs>
        <mask id="${maskId}">
          <rect x="0" y="0" width="1920" height="1080" fill="#fff" />
          ${maskCutouts}
        </mask>
        <linearGradient id="grad-${maskId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${palette.bgStart}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${palette.bgEnd}" stop-opacity="${opacity}" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1920" height="1080" fill="url(#grad-${maskId})" mask="url(#${maskId})" />
      ${borderStrokes}
    </svg>
  `;
}

function getLogoMarkup(size = 48, show = true) {
  if (!show) return '';
  if (config.customLogo) {
    return `<img src="${config.customLogo}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:8px;" alt="Logo" />`;
  }
  return `
    <div style="width:${size}px;height:${size}px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);padding:3px;display:flex;align-items:center;justify-content:center;shrink:0;">
      <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
        <rect x="52" y="16" width="16" height="88" rx="4" fill="#9E1B1E" stroke="#fff" stroke-width="2"/>
        <rect x="22" y="38" width="76" height="16" rx="4" fill="#9E1B1E" stroke="#fff" stroke-width="2"/>
        <path d="M42 46 C47 39, 54 41, 56 49 C58 36, 68 27, 74 25 C71 35, 72 42, 79 34 C75 45, 73 53, 68 58 C73 61, 74 66, 71 69 C63 63, 53 60, 49 52 L42 46 Z" fill="#FFFFFF" stroke="#111" stroke-width="2"/>
      </svg>
    </div>
  `;
}

function buildFrameHeader(tag, fs) {
  if (!fs.showHeader) return '';
  const church = esc(config.churchName || 'Bangkok Christ Church');
  const badge = esc(fs.headerBadge || tag || 'LIVE');
  const logo = getLogoMarkup(44, fs.showLogo);

  return `
    <div class="fr-header-bar">
      <div style="display:flex;align-items:center;gap:16px;">
        ${logo}
        <div>
          <div style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#fff;">
            ${church}
          </div>
          <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgb(var(--accent-rgb));">
            ${esc(config.badge || 'JOHN 14:6')}
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;">
        ${fs.showLive ? `
          <div class="fr-live-pill">
            <span class="cg-live-dot"></span>
            <span>${badge}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/* Master Active Frame Renderers */
function renderActiveFrame() {
  // 1. Program Frame (Live On Air)
  const progFrame = document.getElementById('frame-canvas') || document.getElementById('program-frame-canvas');
  if (progFrame) {
    renderFrameOnCanvas(progFrame, activeFrameId);
  }

  // 2. Preview Frame (Staged for Testing)
  const prevFrame = document.getElementById('preview-frame-canvas');
  if (prevFrame) {
    renderFrameOnCanvas(prevFrame, stagedFrameId || activeFrameId);
  }
}

function renderFrameOnCanvas(container, frameId) {
  if (!container) return;
  const def = getFrameDef(frameId);
  const fs = getFrameSettings(def.id);
  const effectiveTheme = fs.theme === 'inherit' ? config.theme : fs.theme;
  const basePalette = THEME_PALETTES[effectiveTheme] || THEME_PALETTES['bcc-crimson'];
  const customRgb = fs.customAccent ? hexToRgbString(fs.customAccent) : null;
  const palette = customRgb
    ? { ...basePalette, accent: fs.customAccent, accentSoft: `rgba(${customRgb}, 0.38)` }
    : basePalette;

  const ts = Number(fs.textScale || 1);
  const sz = (n) => Math.round(n * ts);
  const r = Math.max(0, Number(fs.cornerRadius ?? 14));
  const radiusStyle = `border-radius:${r}px;`;
  const cutouts = getTransformedCutouts(def, fs);
  const posX = (x, w) => (fs.mirror ? (1920 - x - w) : x);

  container.dataset.theme = effectiveTheme;
  if (customRgb) container.style.setProperty('--accent-rgb', customRgb);
  else container.style.removeProperty('--accent-rgb');

  let innerHtml = buildSvgMatteMask(cutouts, palette, fs, frameId);

  // Frame 1: Main Camera
  if (def.id === 'main-cam') {
    const showLive = fs.showLive && config.showLive;
    innerHtml += `
      ${showLive ? `
        <div class="fr-live-pill" style="position:absolute;top:48px;left:52px;font-size:${sz(14)}px;">
          <span class="cg-live-dot"></span>
          <span>${esc(fs.headerBadge || 'LIVE')}</span>
          <span style="color:rgb(var(--muted-rgb));font-weight:600;padding-left:10px;border-left:1px solid rgba(var(--border-rgb),0.2);">${esc(config.churchName)}</span>
        </div>
      ` : ''}
      ${fs.showHeader ? `
        <div style="position:absolute;top:44px;right:52px;display:flex;align-items:center;gap:14px;padding:10px 18px;border-radius:10px;background:rgba(var(--primary-rgb),0.85);border:1px solid rgba(var(--border-rgb),0.14);">
          ${getLogoMarkup(44, fs.showLogo)}
          <div>
            <div style="font-family:'Montserrat',sans-serif;font-size:${sz(14)}px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#fff;">${esc(config.churchName)}</div>
            <div style="font-size:${sz(11)}px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgb(var(--accent-rgb));">${esc(config.badge || 'JOHN 14:6')}</div>
          </div>
        </div>
      ` : ''}
      ${fs.showInfoBar ? `
        <div style="position:absolute;left:52px;right:52px;bottom:48px;display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-radius:10px;background:rgba(var(--primary-rgb),0.85);border:1px solid rgba(var(--border-rgb),0.12);border-left:5px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(11)}px;">${esc(config.category || 'LIVE')}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:${sz(22)}px;font-weight:800;color:#fff;">${esc(config.primary)}</div>
          </div>
          <div style="font-size:${sz(16)}px;color:rgb(var(--muted-rgb));font-weight:500;">${esc(config.secondary)}</div>
        </div>
      ` : ''}
    `;
  }

  // Frame 2: Camera + Bible Verse (Standard 1216x684 window)
  else if (def.id === 'cam-bible') {
    const camLeft = posX(48, 1216);
    const cardLeft = posX(1296, 576);
    const cleanVerse = (config.frameVerseText || '').replace(/^[“"]|[”"]$/g, '');
    const baseVersePx = cleanVerse.length > 180 ? 24 : cleanVerse.length > 110 ? 28 : 32;

    innerHtml += buildFrameHeader(fs.headerBadge || 'SCRIPTURE READING', fs);
    innerHtml += `
      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:${camLeft}px;top:862px;width:1216px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(13)}px;">${esc(config.category || 'SPEAKER')}</div>
            <div class="fr-title-lg" style="font-size:${sz(32)}px;margin-top:6px;">${esc(config.primary)}</div>
            <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:4px;">${esc(config.secondary)}</div>
          </div>
        </div>
      ` : ''}

      <div class="fr-card" style="position:absolute;left:${cardLeft}px;top:148px;width:576px;height:882px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;">
        <div class="fr-card-top-bar"></div>
        <div style="padding:32px 36px 18px;border-bottom:1px solid rgba(var(--border-rgb),0.10);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(12)}px;">${esc(fs.panelTitle || 'HOLY BIBLE')}</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:${sz(28)}px;font-weight:800;color:#fff;margin-top:4px;">${esc(config.frameVerseRef || 'John 14:6')}</div>
          </div>
          ${config.frameVerseVer ? `
            <div style="padding:6px 12px;border-radius:6px;background:rgba(var(--accent-rgb),0.22);border:1px solid rgba(var(--accent-rgb),0.5);font-family:'Montserrat',sans-serif;font-size:${sz(14)}px;font-weight:800;letter-spacing:0.12em;color:#fff;">
              ${esc(config.frameVerseVer)}
            </div>
          ` : ''}
        </div>
        <div style="padding:36px;flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;">
          <div style="font-family:Georgia,serif;font-size:72px;line-height:0.5;color:rgba(var(--accent-rgb),0.55);">“</div>
          <div class="fr-verse-text" style="font-size:${sz(baseVersePx)}px;">
            ${esc(cleanVerse)}
          </div>
        </div>
        <div style="padding:20px 36px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--border-rgb),0.08);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgb(var(--muted-rgb));">${esc(config.churchName)}</span>
          <span style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:800;color:rgb(var(--accent-rgb));">SCRIPTURE</span>
        </div>
      </div>
    `;
  }

  // Frame 3: Camera + Announcements (Standard 1216x684 window)
  else if (def.id === 'cam-announce') {
    const items = parseAnnouncements();
    const camLeft = posX(48, 1216);
    const panelLeft = posX(1296, 576);

    innerHtml += buildFrameHeader(fs.headerBadge || 'CHURCH ANNOUNCEMENTS', fs);
    innerHtml += `
      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:${camLeft}px;top:862px;width:1216px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(13)}px;">${esc(config.category || 'WORSHIP SERVICE')}</div>
            <div class="fr-title-lg" style="font-size:${sz(32)}px;margin-top:6px;">${esc(config.primary)}</div>
            <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:4px;">${esc(config.secondary)}</div>
          </div>
        </div>
      ` : ''}

      <div class="fr-card" style="position:absolute;left:${panelLeft}px;top:148px;width:576px;height:882px;${radiusStyle}display:flex;flex-direction:column;">
        <div class="fr-card-top-bar"></div>
        <div style="padding:26px 30px 16px;border-bottom:1px solid rgba(var(--border-rgb),0.10);">
          <div class="fr-section-tag" style="font-size:${sz(12)}px;">UPCOMING EVENTS</div>
          <div class="fr-title-lg" style="font-size:${sz(28)}px;margin-top:6px;">${esc(fs.panelTitle || 'Church News')}</div>
        </div>
        <div style="padding:20px 26px;display:flex;flex-direction:column;gap:14px;flex:1;overflow:hidden;">
          ${items.map(it => `
            <div class="fr-announce-item">
              <div style="font-family:'Montserrat',sans-serif;font-size:${sz(18)}px;font-weight:700;color:#fff;line-height:1.3;">${esc(it.title)}</div>
              ${it.details ? `<div style="font-size:${sz(15)}px;color:rgb(var(--muted-rgb));margin-top:4px;line-height:1.4;">${esc(it.details)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Frame 4: Starting Soon & Cam (Standard 1216x684 window)
  else if (def.id === 'welcome-cam') {
    const formatted = formatRemainingCountdown();
    lastCountdownFormatted = formatted;
    const camLeft = posX(48, 1216);
    const cardLeft = posX(1296, 576);
    const digitsSize = formatted.length > 5 ? sz(68) : sz(90);

    innerHtml += buildFrameHeader(fs.headerBadge || 'STARTING SOON', fs);
    innerHtml += `
      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:${camLeft}px;top:862px;width:1216px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag">WELCOME TO WORSHIP</div>
            <div class="fr-title-lg" style="font-size:${sz(32)}px;margin-top:6px;">${esc(config.frameWelcomeTitle)}</div>
            <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:4px;">${esc(config.frameWelcomeSub)}</div>
          </div>
        </div>
      ` : ''}

      <div class="fr-card" style="position:absolute;left:${cardLeft}px;top:148px;width:576px;height:882px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;text-align:center;">
        <div class="fr-card-top-bar"></div>
        <div style="padding:40px 32px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;">
          ${getLogoMarkup(92, fs.showLogo)}
          <div>
            <div class="fr-section-tag" style="margin-bottom:6px;">WELCOME TO</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:${sz(26)}px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#fff;">
              ${esc(config.churchName)}
            </div>
          </div>
          <div style="width:56px;height:3px;background:rgb(var(--accent-rgb));border-radius:2px;"></div>
          <div style="font-family:'Montserrat',sans-serif;font-size:${sz(14)}px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgb(var(--muted-rgb));">
            ${esc(fs.panelTitle || 'SERVICE BEGINS IN')}
          </div>
          <div class="fr-countdown-digits" style="font-size:${digitsSize}px;">${formatted}</div>
          <div style="padding:8px 20px;border-radius:999px;background:rgba(var(--accent-rgb),0.2);border:1px solid rgba(var(--accent-rgb),0.5);font-family:'Montserrat',sans-serif;font-size:${sz(13)}px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#fff;">
            ${esc(config.badge || 'JOHN 14:6')}
          </div>
        </div>
        <div style="padding:16px 24px;background:rgba(var(--primary-rgb),0.55);border-top:1px solid rgba(var(--border-rgb),0.08);font-size:14px;color:rgb(var(--muted-rgb));">
          Please invite your friends and family to join online!
        </div>
      </div>
    `;
  }

  // Frame 5: Camera + Slideshow (Standard 1216x684 window)
  else if (def.id === 'cam-slides') {
    const slidesLeft = posX(48, 1216);
    const sideLeft = posX(1296, 576);

    innerHtml += buildFrameHeader(fs.headerBadge || config.frameSlideTag || 'SERMON SLIDES', fs);
    innerHtml += `
      <div class="fr-window-tag" style="left:${slidesLeft + 18}px;top:164px;">
        <span style="width:7px;height:7px;border-radius:50%;background:rgb(var(--accent-rgb));"></span>
        <span>${esc(config.frameSlideTag || 'SERMON SLIDES')}</span>
      </div>

      <div class="fr-window-tag" style="left:${sideLeft + 16}px;top:164px;">
        <span class="cg-live-dot" style="width:7px;height:7px;"></span>
        <span>${esc(fs.panelTitle || 'LIVE SPEAKER')}</span>
      </div>

      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:${slidesLeft}px;top:862px;width:1216px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(13)}px;">${esc(config.category || "TODAY'S MESSAGE")}</div>
            <div class="fr-title-lg" style="font-size:${sz(32)}px;margin-top:6px;">${esc(config.primary)}</div>
            <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:4px;">${esc(config.secondary)}</div>
          </div>
          <div style="text-align:right;">
            <div class="fr-section-tag" style="font-size:${sz(12)}px;">KEY SCRIPTURE</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:${sz(22)}px;font-weight:800;color:#fff;margin-top:6px;">${esc(config.frameVerseRef || 'John 14:6')}</div>
          </div>
        </div>
      ` : ''}

      <div class="fr-card" style="position:absolute;left:${sideLeft}px;top:502px;width:576px;height:528px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;padding:32px 36px;">
        <div class="fr-card-top-bar"></div>
        <div>
          <div class="fr-section-tag" style="font-size:${sz(12)}px;">MINISTRY &amp; WORD</div>
          <div class="fr-title-lg" style="font-size:${sz(26)}px;margin-top:8px;">${esc(config.churchName)}</div>
          <div class="fr-sub-md" style="font-size:${sz(16)}px;margin-top:10px;">${esc(config.secondary)}</div>
        </div>
        <div style="padding:16px 20px;border-radius:10px;background:rgba(var(--accent-rgb),0.18);border:1px solid rgba(var(--accent-rgb),0.4);">
          <div style="font-size:12px;font-weight:700;color:rgb(var(--accent-rgb));letter-spacing:0.1em;text-transform:uppercase;">NOW PREACHING</div>
          <div style="font-family:'Montserrat',sans-serif;font-size:${sz(18)}px;font-weight:800;color:#fff;margin-top:4px;">${esc(config.primary)}</div>
        </div>
      </div>
    `;
  }

  // Frame 6: Pastor & Sermon (Standard 1216x684 window)
  else if (def.id === 'pastor-info') {
    const camLeft = posX(48, 1216);
    const cardLeft = posX(1296, 576);

    innerHtml += buildFrameHeader(fs.headerBadge || 'SUNDAY MESSAGE', fs);
    innerHtml += `
      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:${camLeft}px;top:862px;width:1216px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 36px;border-left:6px solid rgb(var(--accent-rgb));">
          <div>
            <div class="fr-section-tag" style="font-size:${sz(13)}px;">${esc(config.category || 'SPEAKER')}</div>
            <div class="fr-title-lg" style="font-size:${sz(32)}px;margin-top:6px;">${esc(config.primary)}</div>
            <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:4px;">${esc(config.secondary)}</div>
          </div>
        </div>
      ` : ''}

      <div class="fr-card" style="position:absolute;left:${cardLeft}px;top:148px;width:576px;height:882px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;padding:40px 36px;">
        <div class="fr-card-top-bar"></div>
        <div>
          <div class="fr-section-tag" style="font-size:${sz(12)}px;">${esc(fs.panelTitle || 'SENIOR PASTOR')}</div>
          <div class="fr-title-lg" style="font-size:${sz(34)}px;margin-top:8px;">${esc(config.primary)}</div>
          <div class="fr-sub-md" style="font-size:${sz(19)}px;margin-top:8px;">${esc(config.secondary)}</div>
          <div style="margin-top:24px;padding:20px;border-radius:12px;background:rgba(255,255,255,0.04);border-left:4px solid rgb(var(--accent-rgb));">
            <div class="fr-section-tag" style="font-size:11px;">SERMON THEME</div>
            <div style="font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700;color:#fff;margin-top:4px;">Walking by Faith</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:20px;border-top:1px solid rgba(var(--border-rgb),0.12);">
          <span style="font-size:13px;color:rgb(var(--muted-rgb));">${esc(config.churchName)}</span>
          <span style="font-size:12px;font-weight:700;color:rgb(var(--accent-rgb));">${esc(config.badge || 'JOHN 14:6')}</span>
        </div>
      </div>
    `;
  }

  // Frame 7: Worship Service (Wide Camera 1824x788)
  else if (def.id === 'worship') {
    innerHtml += `
      ${fs.showInfoBar ? `
        <div class="fr-card" style="position:absolute;left:48px;right:48px;bottom:36px;height:192px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-left:6px solid rgb(var(--accent-rgb));">
          <div class="fr-card-top-bar"></div>
          <div>
            <div class="fr-section-tag" style="font-size:${sz(13)}px;">${esc(fs.headerBadge || 'WORSHIP & PRAISE')}</div>
            <div class="fr-title-lg" style="font-size:${sz(36)}px;margin-top:6px;">${esc(config.frameSongTitle || 'Amazing Grace (My Chains Are Gone)')}</div>
            <div class="fr-sub-md" style="font-size:${sz(20)}px;margin-top:6px;">${esc(config.frameSongDetails || 'Worship Team • Key of G • 4/4 Time')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;">
            ${getLogoMarkup(56, fs.showLogo)}
            <div style="text-align:right;">
              <div style="font-family:'Montserrat',sans-serif;font-size:15px;font-weight:800;color:#fff;">${esc(config.churchName)}</div>
              <div style="font-size:12px;font-weight:700;color:rgb(var(--accent-rgb));margin-top:2px;">SANCTUARY WORSHIP</div>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }

  // Frame 8: Prayer Session (Standard 1216x684 window)
  else if (def.id === 'prayer') {
    const camLeft = posX(48, 1216);
    const cardLeft = posX(1296, 576);

    innerHtml += buildFrameHeader(fs.headerBadge || 'INTERCESSORY PRAYER', fs);
    innerHtml += `
      <div class="fr-card" style="position:absolute;left:${cardLeft}px;top:148px;width:576px;height:882px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;padding:40px 36px;">
        <div class="fr-card-top-bar"></div>
        <div>
          <div class="fr-section-tag" style="font-size:${sz(12)}px;">${esc(fs.panelTitle || 'PRAYER REQUESTS')}</div>
          <div class="fr-title-lg" style="font-size:${sz(30)}px;margin-top:10px;">${esc(config.framePrayerTitle || 'Prayer for Healing & Community')}</div>
          <div class="fr-sub-md" style="font-size:${sz(18)}px;margin-top:16px;line-height:1.5;">${esc(config.framePrayerDetails || 'Heavenly Father, we bring our families, church members, and leaders before You for peace, restoration, and strength.')}</div>
        </div>
        <div style="padding:16px 20px;border-radius:10px;background:rgba(255,255,255,0.04);border-top:1px solid rgba(var(--border-rgb),0.12);">
          <div style="font-size:12px;color:rgb(var(--muted-rgb));">Join in prayer with us right now wherever you are.</div>
        </div>
      </div>
    `;
  }

  // Frame 9: Corner Inset PiP
  else if (def.id === 'cam-pip') {
    innerHtml += `
      <div class="fr-live-pill" style="position:absolute;top:44px;left:48px;">
        <span class="cg-live-dot"></span>
        <span>${esc(fs.headerBadge || 'LIVE BROADCAST')}</span>
      </div>
    `;
  }

  // Frame 10: Two-Camera Split
  else if (def.id === 'interview') {
    innerHtml += buildFrameHeader(fs.headerBadge || 'CONVERSATION & DIALOGUE', fs);
    innerHtml += `
      <div class="fr-window-tag" style="left:66px;top:164px;">
        <span class="cg-live-dot"></span>
        <span>HOST</span>
      </div>
      <div class="fr-window-tag" style="left:978px;top:164px;">
        <span class="cg-live-dot" style="background:#3b82f6;"></span>
        <span>GUEST</span>
      </div>
      <div class="fr-card" style="position:absolute;left:48px;right:48px;bottom:48px;height:168px;${radiusStyle}display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-left:6px solid rgb(var(--accent-rgb));">
        <div>
          <div class="fr-section-tag">SPECIAL DIALOGUE</div>
          <div class="fr-title-lg" style="font-size:${sz(30)}px;margin-top:6px;">${esc(config.frameInterviewHost || 'Pastor John Smith | Host')}</div>
        </div>
        <div style="text-align:right;">
          <div class="fr-section-tag">VISITING GUEST</div>
          <div class="fr-title-lg" style="font-size:${sz(30)}px;margin-top:6px;">${esc(config.frameInterviewGuest || 'Dr. David Lee | Visiting Missionary')}</div>
        </div>
      </div>
    `;
  }

  // Frame 11: Event Bulletins
  else if (def.id === 'event-announce') {
    const items = parseAnnouncements().slice(0, 3);
    innerHtml += `
      <div style="position:absolute;left:48px;right:48px;bottom:36px;height:360px;display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;">
        ${items.map(it => `
          <div class="fr-card" style="padding:28px;${radiusStyle}display:flex;flex-direction:column;justify-content:space-between;border-top:4px solid rgb(var(--accent-rgb));">
            <div>
              <div class="fr-section-tag" style="font-size:11px;">CHURCH CALENDAR</div>
              <div class="fr-title-lg" style="font-size:${sz(22)}px;margin-top:8px;">${esc(it.title)}</div>
              <div class="fr-sub-md" style="font-size:${sz(16)}px;margin-top:10px;">${esc(it.details)}</div>
            </div>
            <div style="font-size:12px;font-weight:700;color:rgb(var(--accent-rgb));letter-spacing:0.1em;text-transform:uppercase;">BANGKOK CHRIST CHURCH</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Frame 12: Closing Screen
  else if (def.id === 'countdown-closing') {
    innerHtml += `
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;text-align:center;">
        ${getLogoMarkup(110, fs.showLogo)}
        <div>
          <div class="fr-section-tag" style="font-size:14px;letter-spacing:0.2em;margin-bottom:8px;">${esc(fs.headerBadge || 'CLOSING BENEDICTION')}</div>
          <div class="fr-title-lg" style="font-size:${sz(54)}px;letter-spacing:0.02em;">${esc(config.churchName)}</div>
          <div class="fr-sub-md" style="font-size:${sz(24)}px;margin-top:12px;">“The Lord bless you and keep you; the Lord make his face shine on you.”</div>
          <div style="font-family:'Montserrat',sans-serif;font-size:16px;font-weight:800;color:rgb(var(--accent-rgb));margin-top:8px;">Numbers 6:24-26</div>
        </div>
        <div style="margin-top:16px;padding:12px 28px;border-radius:999px;background:rgba(var(--primary-rgb),0.85);border:1px solid rgba(var(--border-rgb),0.15);font-size:15px;color:rgb(var(--muted-rgb));">
          Join us again next Sunday at 10:00 AM • Have a blessed week!
        </div>
      </div>
    `;
  }

  container.innerHTML = innerHtml;
}

// CommonJS export fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildSvgMatteMask, getLogoMarkup, buildFrameHeader,
    renderActiveFrame, renderFrameOnCanvas
  };
}
