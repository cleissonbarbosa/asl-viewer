/**
 * Renders the promo frame by frame in headless Chrome and encodes it with
 * ffmpeg.
 *
 *   node record.mjs                       # MP4 + README GIF in ../assets
 *   node record.mjs --from 12 --to 18     # part of the video, in out/
 *   node record.mjs --stills 0.5          # PNG every 0.5 s, in out/stills
 *   node record.mjs --gif-only            # GIF again from the last render
 *
 * Chrome is looked up in CHROME_PATH or the usual install locations.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import gifsicle from "gifsicle";
import puppeteer from "puppeteer-core";
import { build, preview } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

const { values: args } = parseArgs({
  options: {
    fps: { type: "string", default: "60" },
    from: { type: "string", default: "0" },
    to: { type: "string" },
    stills: { type: "string" },
    out: { type: "string" },
    gif: {
      type: "string",
      default: join(repo, "assets", "asl-viewer-demo.gif"),
    },
    "no-gif": { type: "boolean", default: false },
    "no-build": { type: "boolean", default: false },
    "gif-only": { type: "boolean", default: false },
  },
});

const WIDTH = 1920;
const HEIGHT = 1080;
const fps = Number(args.fps);
const from = Number(args.from);
const stillsEvery = args.stills ? Number(args.stills) : null;
const isFullRender = from === 0 && !args.to;
const out =
  args.out ??
  (isFullRender
    ? join(repo, "assets", "asl-viewer-promo.mp4")
    : join(here, "out", "partial.mp4"));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error("Chrome not found, set CHROME_PATH");
  return found;
}

function run(command, commandArgs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, { stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${command} exited with ${code}`)),
    );
  });
}

/** ffmpeg process fed with PNG frames on stdin. */
function startEncoder(file, outputArgs) {
  mkdirSync(dirname(file), { recursive: true });
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-i",
      "-",
      ...outputArgs,
      file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((resolvePromise, reject) =>
    ffmpeg.on("exit", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`ffmpeg ${code}`)),
    ),
  );
  return {
    write: (buffer) =>
      ffmpeg.stdin.write(buffer)
        ? Promise.resolve()
        : new Promise((r) => ffmpeg.stdin.once("drain", r)),
    end: () => {
      ffmpeg.stdin.end();
      return done;
    },
  };
}

const VIDEO_ARGS = [
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
];

/*
 * The GIF is made from lossless frames: compression noise from the MP4
 * would change every pixel of every frame and multiply the GIF size.
 */
const GIF_FPS = 12;
const GIF_WIDTH = 1200;
const gifSource = join(here, "out", "gif-source.mkv");
const GIF_SOURCE_ARGS = [
  "-vf",
  `fps=${GIF_FPS},scale=${GIF_WIDTH}:-2:flags=lanczos`,
  "-c:v",
  "ffv1",
  "-pix_fmt",
  "bgr0",
];

/**
 * One palette for the whole GIF, only the changed region of each frame,
 * then gifsicle's lossy compression (about half the size).
 */
async function exportGif(source, gif) {
  const palettized = join(here, "out", "palettized.gif");
  const filters =
    "split[a][b];" +
    "[a]palettegen=stats_mode=diff[p];" +
    "[b][p]paletteuse=dither=none:diff_mode=rectangle";
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    source,
    "-filter_complex",
    filters,
    palettized,
  ]);
  await run(gifsicle, ["-O3", "--lossy=40", palettized, "-o", gif]);
}

if (args["gif-only"]) {
  await exportGif(gifSource, args.gif);
  console.log(`gif: ${args.gif}`);
  process.exit(0);
}

if (!args["no-build"]) {
  await build({ configFile: join(here, "vite.config.ts"), logLevel: "warn" });
}
const server = await preview({
  configFile: join(here, "vite.config.ts"),
  preview: { port: 5198, strictPort: false },
  logLevel: "warn",
});
const url = server.resolvedUrls.local[0];

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--mute-audio"],
});

try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error("page:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("console:", message.text());
  });
  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
  });
  await page.evaluateOnNewDocument(
    readFileSync(join(here, "virtual-time.js"), "utf8"),
  );

  const cdp = await page.createCDPSession();
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });

  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.__ready === true", { timeout: 30000 });

  const duration = await page.evaluate("window.__duration");
  const to = args.to ? Number(args.to) : duration / 1000;
  const total = Math.round(to * fps);
  const first = Math.round(from * fps);
  const stillsDir = join(here, "out", "stills");
  const stillStep = stillsEvery
    ? Math.max(1, Math.round(stillsEvery * fps))
    : 0;

  const encoders = stillsEvery ? [] : [startEncoder(out, VIDEO_ARGS)];
  const withGif = encoders.length > 0 && isFullRender && !args["no-gif"];
  if (withGif) encoders.push(startEncoder(gifSource, GIF_SOURCE_ARGS));
  if (stillsEvery) mkdirSync(stillsDir, { recursive: true });

  const started = Date.now();
  for (let frame = 0; frame < total; frame++) {
    await page.evaluate(
      (ms) => window.__tick(ms),
      frame === 0 ? 0 : 1000 / fps,
    );
    if (frame < first) continue;
    if (stillsEvery && (frame - first) % stillStep !== 0) continue;

    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      optimizeForSpeed: true,
    });
    const buffer = Buffer.from(data, "base64");
    if (encoders.length) {
      await Promise.all(encoders.map((encoder) => encoder.write(buffer)));
    } else {
      const name = `t${(frame / fps).toFixed(2).padStart(6, "0")}.png`;
      writeFileSync(join(stillsDir, name), buffer);
    }
    if (frame % fps === 0) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(0);
      process.stdout.write(
        `\r${(frame / fps).toFixed(0)}s / ${to}s  (${elapsed}s)`,
      );
    }
  }
  process.stdout.write("\n");

  if (encoders.length) {
    await Promise.all(encoders.map((encoder) => encoder.end()));
    console.log(`video: ${out}`);
    if (withGif) {
      await exportGif(gifSource, args.gif);
      console.log(`gif:   ${args.gif}`);
    }
  } else {
    console.log(`stills: ${stillsDir}`);
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
