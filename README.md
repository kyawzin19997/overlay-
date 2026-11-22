# Bangkok Christ Church — Broadcast CG & OBS Frames System

Production-ready, ultra-stable church broadcast graphics system and ready-made OBS multi-layout frames. Designed for zero-lag one-click live operation, volunteer-friendly workflow, OBS Studio Custom Browser Docks, and Elgato Stream Deck / touch screen integration.

---

## 🌟 Key Features

1. **One-Click Lower Thirds (Show & Hide Toggle)**
   - Every saved lower third card has its own **Show / Hide** toggle button directly in the OBS Control Dock and Master Console.
   - Click once to **Show** (smooth entrance animation, turns red with **ON AIR** badge and countdown).
   - Click again to **Hide** (smooth exit animation, returns to green **Show** state).
   - Individual display durations: **5s, 10s, 15s, 30s**, or **Manual** (stays on air until toggled off).
   - **4 Broadcast Animation Styles**: Modern Slide, Minimal Fade, Elegant Reveal, and Classic Bar.
   - Bulletproof State Machine (`IDLE` ➔ `ENTERING` ➔ `ACTIVE` ➔ `EXITING` ➔ `IDLE`) preventing race conditions, double triggers, flickering, or stuck overlays.

2. **Clean Main Broadcast Monitor & Simple Control Panel**
   - Single, centered, broadcast-grade **Main Screen Monitor** at the top of the console showing the exact 1920×1080 output in real time.
   - Quick one-click source toggle between **Lower Thirds & Ticker** and **OBS Frames**.
   - Live tallies with real-time remaining countdown and sync indicators.
   - 3 clean, focused operator tabs underneath:
     1. **Lower Thirds & Ticker**: One-click Show/Hide toggle cards, live text inputs, duration, and ticker crawler controls (duplicate saved lists removed).
     2. **OBS Frames**: 12 layout cards with instant context-sensitive content editor (Bible verse, announcements, pastor, countdown).
     3. **OBS Setup & Settings**: Direct zero-config URLs with one-click copy and browser preview links.

3. **12 Ready-Made Professional OBS Frames**
   100% transparent SVG camera cutouts at 1920×1080 resolution:
   - **Main Camera** (`main-cam`): Cinematic border, church crest, lower info strip.
   - **Pastor & Sermon** (`pastor-info`): Standardized 1216×684 camera cutout + side card for pastor title, series, and key scripture.
   - **Camera + Bible Verse** (`cam-bible`): Standardized 1216×684 camera cutout + elegant scripture card.
   - **Camera + Announcements** (`cam-announce`): Standardized 1216×684 camera cutout + right-hand structured news bulletin board.
   - **Camera + Slideshow** (`cam-slides`): Standardized 1216×684 presentation slides + speaker PiP cutout.
   - **Camera PiP Corner** (`cam-pip`): 1600×900 wide camera + 384×216 corner camera inset.
   - **Worship Service** (`worship`): 1824×788 camera cutout + bottom hymn/song title, key, and team card.
   - **Prayer Session** (`prayer`): Standardized 1216×684 sanctuary camera + reverent prayer petition card.
   - **Two-Camera Split** (`interview`): Two equal 912×684 side-by-side camera feeds with speaker tags.
   - **Starting Soon & Cam** (`welcome-cam`): Standardized 1216×684 sanctuary camera + live countdown clock.
   - **Church Event Cards** (`event-announce`): 1824×620 stage camera + 3 event bulletins below.
   - **Benediction & Closing** (`countdown-closing`): Full-stage closing screen with church service schedule.
   *Note: Camera frames share the exact same `1216×684` @ `(48, 148)` camera cutout geometry for seamless live transitions.*

4. **Simplified Context-Sensitive Frame Editor**
   - Shows **only** the content fields relevant to the selected frame:
     - **Announcements**: 2-field structured table per row (Title and Description) with "+ Add Announcement Row".
     - **Scripture**: Scripture Reference (e.g. John 3:16), body text, and quick "Pull from active lower third" button.
     - **Countdown**: Service start time, countdown mode, and live timer controls.
   - Advanced frame appearance settings (themes, custom colors, borders) are neatly tucked in a collapsed section.

5. **Smooth Scrolling News Ticker with Show/Hide Sliding Animation**
   - Broadcast entrance and exit animation (`translateY(100%)` ➔ `translateY(0)` with smooth cubic-bezier easing).
   - Saved marquee presets (Sunday Service, Weekly Events, Giving & Tithes, Prayer Requests).
   - Real-time pause/resume control.
   - Zero-glitch diffing: editing lower-third text or changing frames never restarts or stutters the ticker.

6. **Modular Clean Architecture & Zero-Config Dedicated URLs**
   - Refactored into clean modular files (`css/broadcast.css`, `css/studio.css`, `js/data.js`, `js/engine.js`, `js/frames.js`, `js/ui.js`).
   - Dedicated zero-config HTML files so OBS operators do not have to fiddle with URL query parameters:
     - `overlay.html`: 1920×1080 transparent Lower Thirds & Ticker Browser Source.
     - `frame.html`: 1920×1080 transparent Ready-Made OBS Frames Browser Source.
     - `dock.html`: Compact OBS Custom Browser Dock.
     - `deck.html`: Stream Deck & touch tablet controller.
     - `feed.html`: Live broadcast rundown feed dock.
     - `index.html`: Master Studio Console.

---

## 🚀 OBS Studio Setup Guide

### 1. Add Lower-Third & Ticker Overlay
1. In OBS Studio, in the **Sources** dock of your live scene, click **+** ➔ **Browser**.
2. Name it `Church CG Overlay`.
3. Set the URL:
   ```text
   http://localhost:8000/overlay.html
   ```
   *(or your hosted GitHub Pages URL `https://kyawzin19997.github.io/overlay-/overlay.html`)*
4. Set **Width**: `1920`, **Height**: `1080`.
5. Check **Shutdown source when not visible** and **Refresh browser when scene becomes active**.
6. Place this source at the top of your scene stack.

---

### 2. Add Ready-Made OBS Frames
1. In OBS Studio, add a **Browser Source** (1920×1080).
2. Set the URL:
   ```text
   http://localhost:8000/frame.html
   ```
   *(or with specific preset, e.g. `http://localhost:8000/frame.html?frame=cam-announce`)*
3. Place your Video Capture Device (Camera) directly **below** the frame Browser Source. The camera video will be perfectly visible through the transparent cutout windows!

---

### 3. Add OBS Custom Browser Dock (Control Panel)
1. In OBS Studio top menu, click **Docks** ➔ **Custom Browser Docks...**
2. In **Dock Name**, enter `Church CG Dock`.
3. In **URL**, enter:
   ```text
   http://localhost:8000/dock.html
   ```
4. Click **Apply**.
5. Dock the new panel into your OBS layout. You now have one-click Show/Hide buttons right inside OBS!

---

### 4. Stream Deck / Tablet Touch Control
1. On your Elgato Stream Deck browser button, iPad, or mobile device on the local network, open:
   ```text
   http://<your-ip>:8000/deck.html
   ```
2. One-click touch triggers for all lower thirds, ticker presets, frame layouts, and emergency **CLEAR ALL**.

---

### 5. Add OBS Rundown Feed Dock
1. In OBS menu: **Docks** ➔ **Custom Browser Docks...**
2. In **Dock Name**, enter `Church CG Rundown`.
3. In **URL**, enter:
   ```text
   http://localhost:8000/feed.html
   ```
4. Click **Apply** and dock into your layout.

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

- **BCC Crimson** (`bcc-crimson`): Deep charcoal and church crimson red.
- **BCC Light** (`bcc-light`): High-contrast crisp white paper matte with burgundy accents.
- **Classic Gold** (`classic-gold`): Warm obsidian with liturgical gold.
- **Navy** (`navy`): Deep midnight blue with amber accents.
- **Custom Logo**: Upload any PNG/JPG/SVG directly via the Settings tab. It is automatically scaled and synchronized across all frames and lower thirds.

---

## 🛠️ Verification Test

Run the automated test suite to verify all modular scripts, CSS, HTML views, and frame geometry:
```bash
node build_scripts/verify.js
```

---

## ✝️ Bangkok Christ Church
*“I am the way and the truth and the life.” — John 14:6*
