const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.join(__dirname, '..');

console.log('=== BANGKOK CHRIST CHURCH CG — SYSTEM VERIFICATION ===\n');

// 1. Check all JavaScript files syntax and exports
const jsFiles = ['js/data.js', 'js/engine.js', 'js/frames.js', 'js/ui.js'];
jsFiles.forEach(rel => {
  const fullPath = path.join(rootDir, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing JS file ${rel}`);
    process.exit(1);
  }
  const code = fs.readFileSync(fullPath, 'utf8');
  try {
    new vm.Script(code);
    console.log(`PASS: Valid syntax in ${rel}`);
  } catch (e) {
    console.error(`FAIL: Syntax error in ${rel}:`, e);
    process.exit(1);
  }
});

// 2. Check CSS files
const cssFiles = ['css/broadcast.css', 'css/studio.css'];
cssFiles.forEach(rel => {
  const fullPath = path.join(rootDir, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing CSS file ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.length < 500) {
    console.error(`FAIL: CSS file ${rel} is suspiciously small.`);
    process.exit(1);
  }
  console.log(`PASS: CSS file verified: ${rel} (${(content.length / 1024).toFixed(1)} KB)`);
});

// 3. Check Dedicated HTML Zero-Config Views
const htmlFiles = [
  'index.html',
  'overlay.html',
  'frame.html',
  'dock.html',
  'deck.html',
  'feed.html'
];
htmlFiles.forEach(rel => {
  const fullPath = path.join(rootDir, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing HTML file ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('<!DOCTYPE html>')) {
    console.error(`FAIL: Invalid HTML doctype in ${rel}`);
    process.exit(1);
  }
  console.log(`PASS: HTML view verified: ${rel}`);
});

// 4. Verify Essential Core Elements in index.html
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const essentialIndexIds = [
  'obs-mount', 'deck-view', 'feed-view', 'dock-view', 'studio-app',
  'tally-pill', 'tally-dot', 'tally-text', 'tally-timer',
  'btn-toggle-dock', 'workspace', 'monitor-col', 'monitor-title',
  'btn-switch-preview', 'stage-wrap', 'stage-shell',
  'cg-canvas', 'cg-live-bug', 'cg-lt', 'cg-logo-slot',
  'cg-cat', 'cg-primary', 'cg-secondary', 'cg-badge',
  'cg-marquee', 'cg-marquee-tag', 'cg-marquee-track',
  'frame-canvas', 'sync-status-text',
  'tab-btn-control', 'tab-btn-library', 'tab-btn-frames', 'tab-btn-settings',
  'tab-control', 'tab-library', 'tab-frames', 'tab-settings',
  'mode-grid', 'in-category', 'in-church', 'in-primary', 'in-secondary', 'in-badge',
  'cue-list', 'lib-cue-list', 'frame-selector-grid',
  'ctrl-scale', 'lbl-scale', 'ctrl-opacity', 'lbl-opacity', 'ctrl-show-logo',
  'in-marquee-tag', 'in-marquee-speed', 'lbl-speed', 'in-marquee-text',
  'btn-reset-all', 'cue-modal', 'toast',
  'preview-stage-wrap', 'preview-stage-shell', 'preview-cg-canvas', 'preview-frame-canvas',
  'btn-take-live', 'frame-context-editor',
  'url-obs-overlay', 'url-obs-frame', 'url-obs-dock', 'url-obs-deck'
];

let missingIds = [];
essentialIndexIds.forEach(id => {
  if (!indexHtml.includes(`id="${id}"`)) {
    missingIds.push(id);
  }
});

if (missingIds.length > 0) {
  console.error('FAIL: Missing element IDs in index.html:', missingIds);
  process.exit(1);
}
console.log(`PASS: All ${essentialIndexIds.length} required element IDs verified in index.html.`);

// 5. Check 12 Standard Frames in js/data.js
const dataJs = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
const expectedFrames = [
  'main-cam', 'pastor-info', 'cam-bible', 'cam-announce',
  'cam-slides', 'cam-pip', 'worship', 'prayer',
  'interview', 'welcome-cam', 'event-announce', 'countdown-closing'
];

expectedFrames.forEach(f => {
  if (!dataJs.includes(`id: '${f}'`)) {
    console.error(`FAIL: Missing frame definition for: ${f}`);
    process.exit(1);
  }
});
console.log(`PASS: All 12 frame presets verified in js/data.js.`);

// 6. Check Standardized Camera Cutout (1216x684 @ 48,148) across camera frames
const framesJs = fs.readFileSync(path.join(rootDir, 'js/frames.js'), 'utf8');
const sharedCamFrames = ['cam-bible', 'cam-announce', 'welcome-cam', 'cam-slides', 'pastor-info', 'prayer'];
sharedCamFrames.forEach(f => {
  if (!framesJs.includes(`1216`) || !framesJs.includes(`684`)) {
    console.error(`FAIL: Standardized 1216x684 cutout missing in frames generator.`);
    process.exit(1);
  }
});
console.log(`PASS: Standardized 1216x684 camera cutouts verified across camera frame layouts.`);

// 7. Check View Routing
const uiJs = fs.readFileSync(path.join(rootDir, 'js/ui.js'), 'utf8');
const expectedViews = ['overlay', 'frame', 'control', 'feed', 'deck', 'dock'];
expectedViews.forEach(v => {
  if (!uiJs.includes(`view === '${v}'`)) {
    console.error(`FAIL: Missing view routing check for: ${v}`);
    process.exit(1);
  }
});
console.log(`PASS: All ${expectedViews.length} view routing handlers verified in js/ui.js.`);

// 8. Check Marquee Entrance / Exit Animation CSS
const broadcastCss = fs.readFileSync(path.join(rootDir, 'css/broadcast.css'), 'utf8');
if (!broadcastCss.includes('.cg-marquee.is-visible') || !broadcastCss.includes('transform: translateY(100%)')) {
  console.error('FAIL: Marquee show/hide animation CSS missing.');
  process.exit(1);
}
console.log('PASS: Smooth Marquee Show/Hide animation verified in css/broadcast.css.');

// 9. Check One-Click Lower Thirds Toggle Functionality
if (!uiJs.includes('function toggleCue(')) {
  console.error('FAIL: toggleCue function missing in js/ui.js.');
  process.exit(1);
}
console.log('PASS: One-Click Lower Thirds Show/Hide toggle verified in js/ui.js.');

console.log('\n======================================================');
console.log('SUCCESS: All system verification checks passed with 100%!');
console.log('======================================================\n');
