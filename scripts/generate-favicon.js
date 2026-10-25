const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG definition for ResiGest 360 Icon / Favicon
const svgFavicon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F4F7F6"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4CAF50"/>
      <stop offset="100%" stop-color="#388E3C"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0083B0"/>
      <stop offset="100%" stop-color="#005A7A"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Squircle App Icon Container -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" stroke="#E2E8F0" stroke-width="6" />

  <!-- Emblem scaled & centered -->
  <!-- Original center (112.5, 102.5), scaled by 2.45 to fill ~355px height -->
  <g transform="translate(256, 256) scale(2.45) translate(-112.5, -102.5)" filter="url(#softShadow)">
    <!-- Top Green Recycling Loop -->
    <path fill="url(#greenGrad)" d="M80,50 Q110,30 140,50 L145,35 L160,60 L130,65 L135,55 Q110,40 85,55 Z" />
    
    <!-- Factory / Waste Containers in Green -->
    <rect fill="url(#greenGrad)" x="100" y="85" width="15" height="40" rx="1.5" />
    <rect fill="url(#greenGrad)" x="120" y="95" width="20" height="30" rx="1.5" />
    <path fill="url(#greenGrad)" d="M145,125 L145,80 L165,80 L165,125 Z" />
    <path fill="url(#greenGrad)" d="M150,75 L160,75 L158,65 Q155,60 152,65 Z" />
    
    <!-- Bottom Blue Circular Arrow Loop -->
    <path fill="url(#blueGrad)" d="M70,120 Q100,160 150,140 Q130,170 80,160 L85,175 L60,165 L75,145 L78,155 Q110,160 130,145 Q90,155 70,120 Z" />
    <path d="M90,135 Q115,125 140,135" fill="none" stroke="#007399" stroke-width="3.5" stroke-linecap="round" />
    <path d="M95,145 Q115,135 135,145" fill="none" stroke="#007399" stroke-width="3.5" stroke-linecap="round" />
  </g>
</svg>
`;

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;
  
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function run() {
  const svgBuffer = Buffer.from(svgFavicon);

  // Generate PNG sizes
  const sizes = [16, 32, 48, 64, 180, 192, 512];
  const pngs = {};

  for (const s of sizes) {
    pngs[s] = await sharp(svgBuffer).resize(s, s).png().toBuffer();
    console.log(`Generated PNG ${s}x${s} (${pngs[s].length} bytes)`);
  }

  // Create multi-resolution ICO (16, 32, 48)
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: pngs[16] },
    { width: 32, height: 32, buffer: pngs[32] },
    { width: 48, height: 48, buffer: pngs[48] }
  ]);

  // Output targets
  const targets = {
    'src/app/icon.svg': svgBuffer,
    'src/app/favicon.ico': icoBuffer,
    'src/app/apple-icon.png': pngs[180],
    'public/favicon.ico': icoBuffer,
    'public/images/favicon.ico': icoBuffer,
    'public/images/logo/logo-icon.svg': svgBuffer
  };

  for (const [relPath, buf] of Object.entries(targets)) {
    const absPath = path.resolve(__dirname, '..', relPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, buf);
    console.log(`Saved: ${relPath} (${buf.length} bytes)`);
  }

  console.log('All favicon assets generated successfully!');
}

run().catch(console.error);
