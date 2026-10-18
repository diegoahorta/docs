const sharp = require('sharp'); const path = require('path');
const A = path.join(__dirname, '..', 'assets');
(async () => {
  await sharp(path.join(A,'svg/chrono-knight.svg'), {density: 300}).resize(800).png().toFile(path.join(A,'chrono-knight.png'));
  await sharp(path.join(A,'svg/arena.svg'), {density: 150}).resize(1600,900).png().toFile(path.join(A,'arena-bg.png'));
  console.log('rendered');
})();
