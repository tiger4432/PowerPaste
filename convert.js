const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    console.log(`Converted ${svgPath} to ${pngPath} (${size}x${size})`);
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error);
  }
}

// images 폴더가 없으면 생성
if (!fs.existsSync('images')) {
  fs.mkdirSync('images');
}

// 다양한 크기로 변환
convertSvgToPng('icon.svg', 'images/icon16.png', 16);
convertSvgToPng('icon.svg', 'images/icon48.png', 48);
convertSvgToPng('icon.svg', 'images/icon128.png', 128); 