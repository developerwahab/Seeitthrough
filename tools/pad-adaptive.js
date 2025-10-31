// tools/pad-adaptive.js
// Pads your launcher foreground into Android adaptive icon safe-zone.
// Input:  your existing PNG (without padding)
// Output: 432x432 transparent canvas with content centered & scaled ~66.7%

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => { 
  const SRC = path.resolve('./assets/seeitthrough-icon-splash.png'); 
  const OUT_DIR = path.resolve('./assets/icon');
  const OUT = path.join(OUT_DIR, 'fg_padded.png');
 
  const CANVAS = 432;     
  const SCALE = 0.667;    

  if (!fs.existsSync(SRC)) {
    console.error('❌ Source not found:', SRC);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
 
  const target = Math.round(CANVAS * SCALE);
  const resized = await sharp(SRC)
    .resize({ width: target, height: target, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
 
  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(OUT);

  console.log('✅ Wrote', OUT);
})();
