// Regenerates the gallery thumbnails at cdn.httpraccoons.com/thumbnails/<code>.webp
// The originals are 750x600 PNGs averaging ~395KB, which makes the gallery ~24MB.
// These bring it down to ~1.1MB. Only needed when a raccoon image changes.
//
//   npm run thumbnails             generate into .thumbnails/
//   npm run thumbnails -- --upload generate, then push to R2

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const BUCKET = "httpraccoons";
const PREFIX = "thumbnails";
const CDN = "https://cdn.httpraccoons.com";

// 2x the 224x180 the gallery renders at, keeping the source 5:4 ratio
const WIDTH = 450;
const HEIGHT = 360;
const QUALITY = 82;

// A status code never changes its picture, so these can be cached forever
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const OUT_DIR = ".thumbnails";
const SRC_DIR = path.join(OUT_DIR, "src");
const CONCURRENCY = 8;

const upload = process.argv.includes("--upload");

const readStatusCodes = async () => {
	const source = await readFile("lib/statuses.ts", "utf8");
	const codes = [...source.matchAll(/code: (\d+),/g)].map((match) => match[1]);
	if (!codes.length)
		throw new Error("No status codes found in lib/statuses.ts");
	return codes;
};

const fetchOriginal = async (code) => {
	const file = path.join(SRC_DIR, `${code}.png`);
	if (existsSync(file)) return file;

	const response = await fetch(`${CDN}/${code}.png`);
	if (!response.ok)
		throw new Error(`GET ${CDN}/${code}.png returned ${response.status}`);

	await writeFile(file, Buffer.from(await response.arrayBuffer()));
	return file;
};

const makeThumbnail = async (code) => {
	const source = await fetchOriginal(code);
	const destination = path.join(OUT_DIR, `${code}.webp`);

	await sharp(source)
		.resize(WIDTH, HEIGHT, { fit: "cover" })
		.webp({ quality: QUALITY })
		.toFile(destination);

	return { code, destination, bytes: (await stat(destination)).size };
};

// Without --remote wrangler writes to the local simulated bucket
const uploadThumbnail = ({ code, destination }) =>
	execFileAsync(
		"npx",
		[
			"wrangler",
			"r2",
			"object",
			"put",
			`${BUCKET}/${PREFIX}/${code}.webp`,
			`--file=${destination}`,
			"--content-type=image/webp",
			`--cache-control=${CACHE_CONTROL}`,
			"--remote",
		],
		{ shell: process.platform === "win32" },
	);

const mapWithConcurrency = async (items, task) => {
	const queue = [...items];
	const results = [];

	const worker = async () => {
		while (queue.length) results.push(await task(queue.shift()));
	};

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker),
	);
	return results;
};

const main = async () => {
	await mkdir(SRC_DIR, { recursive: true });

	const codes = await readStatusCodes();
	console.log(`Generating ${codes.length} thumbnails at ${WIDTH}x${HEIGHT}...`);

	const thumbnails = await mapWithConcurrency(codes, makeThumbnail);
	const total = thumbnails.reduce((sum, thumb) => sum + thumb.bytes, 0);
	console.log(
		`Done: ${(total / 1024 / 1024).toFixed(2)}MB total, ` +
			`${(total / thumbnails.length / 1024).toFixed(1)}KB average`,
	);

	if (!upload) {
		console.log(`Wrote to ${OUT_DIR}/. Re-run with --upload to push to R2.`);
		return;
	}

	console.log(`Uploading to ${BUCKET}/${PREFIX}/...`);
	await mapWithConcurrency(thumbnails, uploadThumbnail);
	console.log(`Uploaded ${thumbnails.length} thumbnails.`);
};

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
