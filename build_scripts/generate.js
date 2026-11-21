const fs = require('fs');
const path = require('path');

const css = require('./css.js');
const html = require('./html.js');
const jsData = require('./js_data.js');
const jsEngine = require('./js_engine.js');
const jsUi = require('./js_ui.js');

const targetPath = path.join(__dirname, '..', 'index.html');

const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bangkok Christ Church — Broadcast CG &amp; OBS Frames</title>

  <!-- Tailwind CSS for clean, responsive Studio & OBS Dock UI -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Google Broadcast Fonts (Inter & Montserrat with offline system fallbacks) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet" />

  <style>
`;

const bodyOpen = `
  </style>
</head>
<body class="bg-zinc-950 text-slate-100 min-h-screen antialiased selection:bg-red-700 selection:text-white">
`;

const scriptOpen = `
  <script>
`;

const footer = `
  </script>
</body>
</html>
`;

const fullHtml = header + css + bodyOpen + html + scriptOpen + jsData + '\n' + jsEngine + '\n' + jsUi + footer;

fs.writeFileSync(targetPath, fullHtml, 'utf8');
console.log('Successfully generated index.html. Total lines:', fullHtml.split('\n').length, 'File size:', (fullHtml.length / 1024).toFixed(1), 'KB');
