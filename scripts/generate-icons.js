import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import png2icons from 'png2icons';

async function generate() {
  const svgPath = path.resolve('public/icon.svg');
  const buildDir = path.resolve('build');
  const iconsDir = path.join(buildDir, 'icons');

  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  console.log('Rendering 1024x1024 PNG from SVG...');
  fs.copyFileSync(svgPath, path.join(buildDir, 'icon.svg'));
  const png1024Buffer = await sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toBuffer();

  // Save 1024x1024 icon.png into build/
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png1024Buffer);
  fs.writeFileSync(path.resolve('icon.png'), png1024Buffer);
  console.log('Saved build/icon.png and root icon.png (1024x1024)');

  // Convert to ICNS with BICUBIC for retina precision
  console.log('Generating build/icon.icns using png2icons...');
  const icnsBuffer = png2icons.createICNS(png1024Buffer, png2icons.BICUBIC, 0);
  if (icnsBuffer) {
    fs.writeFileSync(path.join(buildDir, 'icon.icns'), icnsBuffer);
    fs.writeFileSync(path.resolve('icon.icns'), icnsBuffer);
    console.log('Saved build/icon.icns and root icon.icns (size: ' + icnsBuffer.length + ' bytes)');
  } else {
    console.error('Failed to create ICNS buffer');
  }

  // Convert to ICO
  const icoBuffer = png2icons.createICO(png1024Buffer, png2icons.BILINEAR, 0, false);
  if (icoBuffer) {
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('Saved build/icon.ico');
  }

  // Also write individual sizes to build/icons/{size}x{size}.png for electron-builder compatibility
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    const resized = await sharp(png1024Buffer).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(iconsDir, `${size}x${size}.png`), resized);
  }
  console.log('Generated multi-res icons in build/icons/');

  // Also update public/icon.png and public/icon-512.png
  fs.writeFileSync(path.resolve('public/icon.png'), png1024Buffer);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
