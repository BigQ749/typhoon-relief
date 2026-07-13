// 生成 tabBar 占位图标（48x48 纯色 PNG）
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const OUTPUT = path.join(__dirname, 'miniprogram', 'images');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type);
  const crcInput = Buffer.concat([t, data]);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, t, data, crcB]);
}

function createPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // RGB

  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const off = y * (w * 3 + 1);
    raw[off] = 0;
    for (let x = 0; x < w; x++) {
      const po = off + 1 + x * 3;
      raw[po] = r; raw[po+1] = g; raw[po+2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// 台风图标 - 蓝色 #07c160 用绿色调，台风改蓝色系
fs.writeFileSync(path.join(OUTPUT, 'typhoon.png'), createPNG(48, 48, 0x07, 0xc1, 0x60));
fs.writeFileSync(path.join(OUTPUT, 'typhoon-active.png'), createPNG(48, 48, 0x06, 0xad, 0x56));
// 救援图标 - 红色
fs.writeFileSync(path.join(OUTPUT, 'rescue.png'), createPNG(48, 48, 0xee, 0x0a, 0x24));
fs.writeFileSync(path.join(OUTPUT, 'rescue-active.png'), createPNG(48, 48, 0xd4, 0x09, 0x21));
// 科普图标 - 橙色
fs.writeFileSync(path.join(OUTPUT, 'knowledge.png'), createPNG(48, 48, 0xfa, 0x8c, 0x16));
fs.writeFileSync(path.join(OUTPUT, 'knowledge-active.png'), createPNG(48, 48, 0xe6, 0x7e, 0x0e));

console.log('Icons generated.');
