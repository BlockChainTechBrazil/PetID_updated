const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const sizes = [320, 640, 1280];
const assetsDir = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('Assets directory not found:', assetsDir);
  process.exit(1);
}

glob(path.join(assetsDir, '*.svg'), (err, files) => {
  if (err) throw err;
  if (!files.length) {
    console.log('No SVG files found in', assetsDir);
    return;
  }

  files.forEach(file => {
    const base = path.basename(file, '.svg');
    sizes.forEach(size => {
      const out = path.join(assetsDir, `${base}-${size}.png`);
      sharp(file)
        .resize(size)
        .png({ quality: 90 })
        .toFile(out)
        .then(() => console.log('Wrote', out))
        .catch(e => console.error('Error writing', out, e));
    });
  });
});
