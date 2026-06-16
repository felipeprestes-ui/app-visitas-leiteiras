#!/usr/bin/env node
// Script para gerar PNG placeholders para assets do Expo
// Execute: node generate-assets.js
// Requer: nao precisa de dependencias extras

const fs = require('fs');
const path = require('path');

// PNG minimo 1x1 pixel (branco)
// Header PNG + IHDR + IDAT + IEND
const PNG_1x1_WHITE = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
  'hex'
);

const assets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
assets.forEach(name => {
  const p = path.join(__dirname, name);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, PNG_1x1_WHITE);
    console.log('Created', name);
  } else {
    console.log('Exists', name);
  }
});
