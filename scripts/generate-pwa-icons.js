const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../public/icon.png');
const PUBLIC_DIR = path.join(__dirname, '../public');

const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
];

async function generateIcons() {
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error('Source icon not found:', SOURCE_ICON);
        process.exit(1);
    }

    console.log('Generating PWA icons from:', SOURCE_ICON);

    for (const { size, name } of sizes) {
        await sharp(SOURCE_ICON)
            .resize(size, size)
            .toFile(path.join(PUBLIC_DIR, name));
        console.log(`Generated: ${name}`);
    }
}

generateIcons().catch(console.error);
