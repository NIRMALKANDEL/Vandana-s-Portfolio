import sharp from 'sharp';
import fs from 'fs';
const petals = (cx, cy, r, rx, ry, fill) => [0,72,144,216,288].map(a=>`<ellipse cx="${cx}" cy="${cy-r}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})" fill="${fill}"/>`).join('');
const flower = (bg, pad) => {
  const s = 512, c = 256, k = (512 - pad*2)/512;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  ${bg ? `<rect width="512" height="512" rx="${pad? 0 : 112}" fill="${bg}"/>` : ''}
  <g transform="translate(${c} ${c}) scale(${k}) translate(-${c} -${c})">
  ${petals(c, c, 108, 66, 104, '#F2C6CC')}
  ${petals(c, c, 64, 24, 50, '#EAA9B5')}
  <circle cx="${c}" cy="${c}" r="44" fill="#E8C878"/></g></svg>`;
};
fs.writeFileSync('src/app/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><g fill="#E9AFB9"><ellipse cx="13" cy="6" rx="4" ry="6"/><ellipse cx="13" cy="6" rx="4" ry="6" transform="rotate(72 13 13)"/><ellipse cx="13" cy="6" rx="4" ry="6" transform="rotate(144 13 13)"/><ellipse cx="13" cy="6" rx="4" ry="6" transform="rotate(216 13 13)"/><ellipse cx="13" cy="6" rx="4" ry="6" transform="rotate(288 13 13)"/></g><circle cx="13" cy="13" r="3" fill="#E8C878"/></svg>`);
const any = flower('#FFFBF5', 40), mask = flower('#FFFBF5', 110);
await sharp(Buffer.from(any)).resize(192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(any)).resize(512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(mask)).resize(512).png().toFile('public/icon-maskable-512.png');
await sharp(Buffer.from(flower('#FFFBF5', 56).replace('rx="112"','rx="0"'))).resize(180).png().toFile('src/app/apple-icon.png');
await sharp(Buffer.from(flower(null, 0))).resize(48).png().toFile('scripts/.fav48.png');
