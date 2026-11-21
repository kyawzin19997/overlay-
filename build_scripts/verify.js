const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Check JS syntax
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('FAIL: No script tag found in index.html!');
  process.exit(1);
}

try {
  new vm.Script(scriptMatch[1]);
  console.log('PASS: JavaScript syntax valid.');
} catch (e) {
  console.error('FAIL: JavaScript syntax error:', e);
  process.exit(1);
}

// 2. Check essential IDs
const requiredIds = [
  'obs-mount', 'deck-view', 'feed-view', 'studio-app',
  'tally-pill', 'tally-dot', 'tally-text', 'tally-timer',
  'btn-toggle-dock', 'workspace', 'monitor-col', 'monitor-title',
  'btn-switch-preview', 'stage-wrap', 'stage-shell',
  'cg-canvas', 'cg-live-bug', 'cg-lt', 'cg-logo-slot',
  'cg-cat', 'cg-primary', 'cg-secondary', 'cg-badge',
  'cg-marquee', 'cg-marquee-tag', 'cg-marquee-track',
  'frame-canvas', 'sync-status-text',
  'tab-btn-control', 'tab-btn-library', 'tab-btn-frames', 'tab-btn-settings',
  'tab-control', 'tab-library', 'tab-frames', 'tab-settings',
  'in-anim-style', 'mode-grid', 'in-category', 'in-church', 'in-primary', 'in-secondary', 'in-badge',
  'cue-list', 'lib-cue-list', 'marquee-preset-list', 'frame-selector-grid',
  'url-selected-frame', 'selected-frame-url-label', 'selected-frame-hint',
  'customizer-frame-title', 'in-fc-theme', 'in-fc-accent', 'btn-fc-accent-auto',
  'in-fc-header-badge', 'in-fc-panel-title', 'in-fc-radius', 'lbl-fc-radius',
  'in-fc-border', 'lbl-fc-border', 'in-fc-text-scale', 'lbl-fc-text-scale',
  'in-fc-opacity', 'lbl-fc-opacity', 'in-fc-mirror', 'in-fc-header',
  'in-fc-infobar', 'in-fc-live', 'in-fc-logo',
  'in-fr-verse-ref', 'in-fr-verse-ver', 'in-fr-verse-text', 'in-fr-announcements',
  'in-fr-welcome-title', 'in-fr-slide-tag', 'in-fr-welcome-sub',
  'btn-cd-mode-duration', 'btn-cd-mode-target', 'ctrl-cd-status', 'ctrl-cd-readout',
  'cd-duration-controls', 'cd-target-controls', 'in-cd-mins', 'btn-cd-toggle',
  'url-overlay', 'url-control', 'url-feed', 'url-deck',
  'ctrl-scale', 'lbl-scale', 'ctrl-opacity', 'lbl-opacity', 'ctrl-show-logo',
  'in-marquee-tag', 'in-marquee-speed', 'lbl-speed', 'in-marquee-text',
  'btn-reset-all', 'cue-modal', 'edit-mode', 'edit-category', 'edit-primary',
  'edit-secondary', 'edit-badge', 'edit-duration', 'toast', 'exit-overlay-btn',
  'deck-grid-cues', 'deck-grid-marquee', 'deck-grid-frames', 'feed-cue-list',
  'preview-stage-wrap', 'preview-stage-shell', 'preview-cg-canvas',
  'btn-take-live', 'announcements-rows-container', 'frame-active-content-editor'
];

let missing = [];
for (const id of requiredIds) {
  if (!html.includes('id="' + id + '"')) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('FAIL: Missing element IDs:', missing);
  process.exit(1);
} else {
  console.log('PASS: All ' + requiredIds.length + ' required element IDs present.');
}

// 3. Check 12 Frames presence in FRAME_DEFS
const expectedFrames = [
  'main-cam', 'pastor-info', 'cam-bible', 'cam-announce',
  'cam-slides', 'cam-pip', 'worship', 'prayer',
  'interview', 'welcome-cam', 'event-announce', 'countdown-closing'
];

for (const f of expectedFrames) {
  if (!html.includes("id: '" + f + "'")) {
    console.error("FAIL: Missing frame definition for: " + f);
    process.exit(1);
  }
}
console.log('PASS: All 12 frame presets verified in FRAME_DEFS.');

// 4. Check View modes routing
const expectedViews = ['overlay', 'frame', 'control', 'feed', 'deck'];
for (const v of expectedViews) {
  if (!html.includes("view === '" + v + "'")) {
    console.error("FAIL: Missing routing check for view: " + v);
    process.exit(1);
  }
}
console.log('PASS: All 5 view routes (overlay, frame, control, feed, deck) verified.');

console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
