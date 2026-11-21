# Bangkok Christ Church — Broadcast CG & OBS Frames System

Production-ready, ultra-stable, single-file church broadcast graphics system and ready-made OBS multi-layout frames. Designed for zero-lag one-click live operation, volunteer-friendly workflow, OBS Studio Custom Browser Docks, and Elgato Stream Deck / touch screen integration.

---

## 🌟 Key Features

1. **One-Click Lower Thirds**
   - Direct **Show** action on every lower third card in the OBS Control Dock.
   - Individual preset display durations: **5s, 10s, 15s, 30s**, or **Manual** (stays on air until hidden).
   - Clear live **ON AIR** badge and real-time countdown timer.
   - 4 Broadcast Animation Styles:
     - **Modern Slide**: Smooth left-to-right mask wipe with expanding accent spine.
     - **Minimal Fade**: Subtle cinematic opacity rise.
     - **Elegant Reveal**: Top-to-bottom curtain reveal with golden accent line.
     - **Classic Bar**: Immediate geometric news bar expansion.
   - **Bulletproof State Machine** (`IDLE` ➔ `ENTERING` ➔ `ACTIVE` ➔ `EXITING` ➔ `IDLE`) preventing race conditions, double triggers, flickering, or stuck overlays.

2. **Stream Deck & Touch-Friendly Deck URL**
   - Dedicated touch/tablet interface via `?view=deck`.
   - Large buttons (minimum 86px height) with high-contrast color coding.
   - One-tap triggers for Saved Lower Thirds, Marquee Tickers, Frame Presets, and Emergency Clear All.
   - Instant response with zero confirmation popups.

3. **12 Ready-Made Professional OBS Frames**
   100% transparent SVG camera cutouts at 1920×1080 resolution:
   - **Main Camera** (`main-cam`): Cinematic border, church crest, lower info strip.
   - **Pastor & Sermon** (`pastor-info`): 1152×648 camera cutout + side card for pastor title, series, and key scripture.
   - **Camera + Bible Verse** (`cam-bible`): 1152×648 camera cutout + elegant scripture card.
   - **Camera + Announcements** (`cam-announce`): 1216×684 camera cutout + right-hand news bulletin board.
   - **Camera + Slideshow** (`cam-slides`): 1216×684 presentation slides + 576×324 speaker PiP cutout.
   - **Camera PiP Corner** (`cam-pip`): 1600×900 wide camera + 384×216 corner camera inset.
   - **Worship Service** (`worship`): 1824×788 camera cutout + bottom hymn/song title, key, and team card.
   - **Prayer Session** (`prayer`): 1152×648 sanctuary camera + reverent prayer petition card.
   - **Two-Camera Split** (`interview`): Two equal 912×684 side-by-side camera feeds with speaker tags.
   - **Starting Soon & Cam** (`welcome-cam`): 1152×648 sanctuary camera + live countdown clock.
   - **Church Event Cards** (`event-announce`): 1824×620 stage camera + 3 event bulletins below.
   - **Benediction & Closing** (`countdown-closing`): Full-stage closing screen with church service schedule.

4. **Visual Frame Customizer**
   - Instant live preview in 16:9 monitor.
   - Independent frame settings: Themes, custom accent color, corner radius (0–32px), border stroke (0–8px), text scale (85%–125%), matte opacity, and horizontal mirror (flip left/right).
   - Visibility toggles for headers, info bars, LIVE bug, and church logo.

5. **Smooth Scrolling News Ticker / Marquee**
   - Multiple saved marquee presets (Sunday Service, Weekly Events, Giving & Tithes, Prayer Requests).
   - Real-time pause/resume control.
   - Zero-glitch diffing: editing lower-third text or changing frames never restarts or stutters the ticker.

6. **Dedicated OBS Rundown Feed Dock**
   - Live broadcast cue list via `?view=feed`.
   - Clear state badges: `READY`, `PREVIEW` (blue ring), `ON AIR` (red pulse + countdown).
   - One-click **Preview**, **Take Live**, **Next**, and **Previous** navigation.

7. **Synchronized State Architecture**
   - Dual-channel communication via `BroadcastChannel` and `localStorage` with automated storage events and polling heartbeat.
   - Seamless synchronization across OBS Browser Sources, Custom Docks, and external browser windows.

---

## 🚀 OBS Studio Setup Guide

### 1. Add Lower-Third & Ticker Overlay
1. In OBS Studio, go to the **Sources** dock of your live scene.
2. Click **+** (Add) ➔ **Browser**.
3. Name it `Church CG Overlay`.
4. Enter the URL:
   ```text
   http://localhost:8000/index.html?view=overlay
   ```
   *(or your deployed GitHub Pages / hosted URL)*
5. Set:
   - **Width**: `1920`
   - **Height**: `1080`
6. Check **Shutdown source when not visible** and **Refresh browser when scene becomes active**.
7. Position this source at the top of your scene stack.

---

### 2. Add Ready-Made OBS Frames
1. In the **Frame Editor** tab of the studio app, select your desired frame layout (e.g. *Camera + Announcements*).
2. Click **Copy URL** under the frame selector (e.g. `http://localhost:8000/index.html?view=frame&frame=cam-announce`).
3. In OBS, add a **Browser Source** (1920×1080) with this URL.
4. Place your Video Capture Device (Camera) directly **below** the frame Browser Source. The camera video will be perfectly visible through the transparent cutout windows!

---

### 3. Add OBS Custom Browser Dock (Control Panel)
1. In OBS Studio menu bar, click **Docks** ➔ **Custom Browser Docks...**
2. In **Dock Name**, enter `Church CG Control`.
3. In **URL**, enter:
   ```text
   http://localhost:8000/index.html?view=control
   ```
4. Click **Apply**.
5. Dock the new panel into your OBS interface (e.g. on the right or bottom dock area). You now have 1-click lower thirds right inside OBS without opening an external browser!

---

### 4. Add OBS Custom Feed Dock (Rundown List)
1. In OBS menu: **Docks** ➔ **Custom Browser Docks...**
2. In **Dock Name**, enter `Church CG Feed`.
3. In **URL**, enter:
   ```text
   http://localhost:8000/index.html?view=feed
   ```
4. Click **Apply** and dock into your layout.

---

### 5. Stream Deck / Tablet Touch Control
1. On your Stream Deck, tablet, or secondary monitor, open:
   ```text
   http://<your-ip>:8000/index.html?view=deck
   ```
2. You will get a touch-optimized grid of high-contrast buttons for:
   - Showing prepared lower thirds (turns red with countdown when active).
   - Toggling ticker presets.
   - Switching OBS frame overlays.
   - Emergency **CLEAR ALL**.

---

## ⌨️ Keyboard Hotkeys

| Hotkey | Action |
|---|---|
| <kbd>Space</kbd> | Toggle Show / Hide active lower third |
| <kbd>Esc</kbd> | Hide active lower third |
| <kbd>1</kbd> | Switch to **Speaker** mode |
| <kbd>2</kbd> | Switch to **Sermon** mode |
| <kbd>3</kbd> | Switch to **Scripture** mode |
| <kbd>4</kbd> | Switch to **Announcement / Notice** mode |

---

## 🎨 Themes & Custom Branding

- **BCC Dark** (`bcc-crimson`): Deep charcoal and church crimson red.
- **BCC Light** (`bcc-light`): High-contrast crisp white paper matte with burgundy accents.
- **Classic Gold** (`classic-gold`): Warm obsidian with liturgical gold.
- **Navy** (`navy`): Deep midnight blue with amber accents.
- **Custom Logo**: Upload any PNG/JPG/SVG directly via the Settings tab. It is automatically scaled and synchronized across all frames and lower thirds.

---

## 🛠️ Build and Development

This project is completely zero-dependency and runs directly in any modern browser or OBS Browser Source without requiring Node.js or Webpack at runtime.

To regenerate or modify components:
```bash
node build_scripts/generate.js
node build_scripts/verify.js
```

---

## ✝️ Bangkok Christ Church
*“I am the way and the truth and the life.” — John 14:6*
