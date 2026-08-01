const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../node_modules/.pnpm/node_modules/sharp');

const outputDir = path.join(process.cwd(), 'public', 'gallery', 'wallets');
const sourceSets = [
	['D:/TCL Photos/Roper Wallets', 'IMG_0044.JPG', 'roper-air-force.webp'],
	['D:/TCL Photos/Roper Wallets', 'IMG_0211.JPG', 'roper-floral-initials.webp'],
	['D:/TCL Photos/Roper Wallets', 'IMG_0682.HEIC', 'roper-personal-message-interior.webp'],
	['D:/TCL Photos/Roper Wallets', 'IMG_0442 (W)-2.HEIC', 'roper-wr-basket-weave.webp'],
	['D:/TCL Photos/Roper Wallets', 'IMG_0641.HEIC', 'roper-ranch-action.webp'],
	['D:/TCL Photos/Roper Wallets', 'IMG_1258-(W).HEIC', 'roper-deer-brand.webp'],
	['D:/TCL Photos/tri-folds', 'F30FB1C9-3EDA-4CBF-8F18-F91A8B1E1AFB.JPG', 'trifold-floral-set.webp'],
	['D:/TCL Photos/tri-folds', 'IMG_0029.JPG', 'trifold-brown-interior.webp'],
	['D:/TCL Photos/tri-folds', 'IMG_0671.HEIC', 'trifold-floral-initial.webp'],
	['D:/TCL Photos/tri-folds', 'IMG_0689.HEIC', 'trifold-scripture-interior.webp'],
	['D:/TCL Photos/tri-folds', 'IMG_1353.HEIC', 'trifold-pnut-floral.webp'],
	['D:/TCL Photos/tri-folds', 'IMG_1523.JPG', 'trifold-ranch-floral.webp'],
];

async function prepare(sourceDir, inputFile, outputFile) {
	const input = path.join(sourceDir, inputFile);
	const output = path.join(outputDir, outputFile);
	fs.mkdirSync(outputDir, { recursive: true });

	const width = 1600;
	const height = 1200;
	const resized = await sharp(input, { limitInputPixels: false })
		.rotate()
		.resize(width - 120, height - 120, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 86 })
		.toBuffer();

	await sharp({ create: { width, height, channels: 3, background: '#000000' } })
		.composite([{ input: resized, gravity: 'center' }])
		.webp({ quality: 86 })
		.toFile(output);

	return { inputFile, output: `/gallery/wallets/${outputFile}`, width, height };
}

async function main() {
	const prepared = [];
	for (const source of sourceSets) prepared.push(await prepare(...source));
	console.log(JSON.stringify(prepared, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
