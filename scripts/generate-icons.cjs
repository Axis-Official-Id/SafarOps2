/* Generate small raster variants from the same simple compass geometry as favicon.svg. */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const out = path.resolve(__dirname, '..', 'assets');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}
function triangle(px, py, a, b, c) {
  const sign = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const p = [px, py], d1 = sign(p, a, b), d2 = sign(p, b, c), d3 = sign(p, c, a);
  return !(d1 < 0 || d2 < 0 || d3 < 0) || !(d1 > 0 || d2 > 0 || d3 > 0);
}
function color(x, y) {
  const dx = Math.max(Math.abs(x - .5) - .29, 0), dy = Math.max(Math.abs(y - .5) - .29, 0);
  if (dx * dx + dy * dy > .21 * .21) return [0, 0, 0, 0];
  const radius = Math.hypot(x - .5, y - .5);
  if (Math.abs(radius - .3125) < .020) return [212, 178, 76, 255];
  if (triangle(x,y,[.5,.18],[.603,.5],[.5,.445]) || triangle(x,y,[.5,.18],[.5,.445],[.397,.5])) return [212,178,76,255];
  if (triangle(x,y,[.5,.82],[.397,.5],[.5,.555]) || triangle(x,y,[.5,.82],[.5,.555],[.603,.5])) return [248,244,231,255];
  if (radius < .033) return [11,64,54,255];
  return [11,64,54,255];
}
function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const sums = [0,0,0,0];
      for (let sy=0;sy<2;sy++) for (let sx=0;sx<2;sx++) {
        const pixel = color((x+(sx+.5)/2)/size,(y+(sy+.5)/2)/size);
        for(let channel=0;channel<4;channel++) sums[channel]+=pixel[channel];
      }
      const at = y * (size * 4 + 1) + 1 + x * 4;
      for(let channel=0;channel<4;channel++) raw[at+channel]=Math.round(sums[channel]/4);
    }
  }
  const header = Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}

const icons = [16,32,48].map(size=>({size,data:png(size)}));
let offset=6+icons.length*16;
const directory=Buffer.alloc(offset);directory.writeUInt16LE(1,2);directory.writeUInt16LE(icons.length,4);
for(let i=0;i<icons.length;i++) {
  const {size,data}=icons[i],at=6+i*16;
  directory[at]=size;directory[at+1]=size;directory.writeUInt16LE(1,at+4);directory.writeUInt16LE(32,at+6);
  directory.writeUInt32LE(data.length,at+8);directory.writeUInt32LE(offset,at+12);offset+=data.length;
}
fs.writeFileSync(path.join(out,'favicon.ico'),Buffer.concat([directory,...icons.map(x=>x.data)]));
for(const [name,size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) fs.writeFileSync(path.join(out,name),png(size));
console.log('Generated favicon.ico and PNG touch icons.');
