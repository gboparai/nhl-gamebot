import { renderTrackingFrame, TrackingFrame } from "./renderTrackingFrame";
import { CreateRinkParams } from "./createRink";
import { createCanvas, loadImage } from "canvas";
import GIFEncoder from "gif-encoder-2";
import fs from "fs";
import path from "path";
import imagemin from "imagemin";
import gifsicle from "imagemin-gifsicle";
import sharp from "sharp";

export interface CreateTrackingGifOptions {
  highlightPlayerId?: number;
  showNumbers?: boolean;
  playerRadius?: number;
  puckRadius?: number;
  width?: number;
  height?: number;
  quality?: number; // 1-20, lower is better quality but slower
  repeat?: number; // 0 = loop forever, -1 = no loop, n = loop n times
  frameSkip?: number; // Skip every N frames (e.g., 2 = use every other frame)
}

/**
 * Create an animated GIF from an array of tracking frames
 * @param rinkParams - Parameters for creating the rink (team info)
 * @param frames - Array of tracking frames to animate
 * @param outputPath - Path where the GIF should be saved
 * @param options - Optional rendering and GIF settings
 */
export async function createTrackingGif(
  rinkParams: CreateRinkParams,
  frames: TrackingFrame[],
  outputPath: string,
  options: CreateTrackingGifOptions = {}
): Promise<void> {
  const {
    highlightPlayerId,
    showNumbers = true,
    playerRadius = 38,
    puckRadius = 12,
    width = 2400,
    height = 1013,
    quality = 10,
    repeat = 0,
    frameSkip = 1,
  } = options;

  if (frames.length === 0) {
    throw new Error("No frames provided");
  }

  // Apply frame skipping for smaller file size
  const selectedFrames = frameSkip > 1 
    ? frames.filter((_, index) => index % frameSkip === 0)
    : frames;

  // Calculate delay between frames (in milliseconds)
  // Timestamps are in nanoseconds (based on the example: 17665440053 to 17665440055)
  let delay = 100; // Default to 100ms (10 fps) if we can't calculate

  if (selectedFrames.length > 1) {
    // Calculate average time difference between frames
    const timeDiffs: number[] = [];
    for (let i = 1; i < Math.min(selectedFrames.length, 10); i++) {
      const diff = (selectedFrames[i].timeStamp - selectedFrames[i - 1].timeStamp) / 1000000; // Convert to milliseconds
      timeDiffs.push(diff);
    }
    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    delay = Math.max(100*frameSkip, Math.round(avgDiff * frameSkip)); // Adjust for frame skipping
  }

  console.log(`Creating GIF with ${selectedFrames.length} frames (skipped ${frames.length - selectedFrames.length}) at ~${Math.round(1000 / delay)} fps (${delay}ms per frame)`);

  // Create GIF encoder
  const encoder = new GIFEncoder(width, height, "octree", true);
  encoder.setDelay(delay);
  encoder.setRepeat(repeat);
  encoder.setQuality(quality);

  // Start encoding
  encoder.start();

  // Render each frame
  for (let i = 0; i < selectedFrames.length; i++) {
    if (i % 10 === 0) {
      console.log(`Processing frame ${i + 1}/${selectedFrames.length}...`);
    }

    // Generate SVG for this frame
    const svgContent = renderTrackingFrame(
      rinkParams,
      selectedFrames[i],
      {
        highlightPlayerId,
        showNumbers,
        playerRadius,
        puckRadius,
      }
    );

    // Convert SVG to PNG using sharp (works reliably on Linux)
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(width, height)
      .png()
      .toBuffer();

    // Load PNG image from buffer
    const image = await loadImage(pngBuffer);

    // Create a new canvas for each frame to ensure proper encoding
    const frameCanvas = createCanvas(width, height);
    const frameCtx = frameCanvas.getContext("2d");

    // Fill with light grey background
    frameCtx.fillStyle = "#E5E5E5";
    frameCtx.fillRect(0, 0, width, height);

    // Draw the PNG image
    frameCtx.drawImage(image, 0, 0, width, height);

    // Add frame to GIF
    encoder.addFrame(frameCtx);
  }

  // Finish encoding
  encoder.finish();

  // Write to file
  const buffer = encoder.out.getData();
  const tempPath = outputPath.replace(/\.gif$/, '.temp.gif');
  fs.writeFileSync(tempPath, buffer as any);

  console.log(`✓ GIF created, now compressing...`);

  // Compress the GIF using imagemin
  await imagemin([tempPath], {
    destination: path.dirname(outputPath),
    plugins: [
      gifsicle({
        optimizationLevel: 3,
        colors: 32
      })
    ]
  });

  // Get the compressed file name (imagemin may change it)
  const compressedPath = path.join(
    path.dirname(outputPath),
    path.basename(tempPath)
  );

  // Rename to final output path if needed
  if (compressedPath !== outputPath) {
    fs.renameSync(compressedPath, outputPath);
  }

  // Clean up temp file if it still exists
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  const finalSize = fs.statSync(outputPath).size;

  console.log(`✓ GIF created successfully: ${outputPath}`);
  console.log(`  Frames: ${selectedFrames.length} (${frames.length} total)`);
  console.log(`  Frame rate: ~${Math.round(1000 / delay)} fps`);
  console.log(`  Duration: ~${((selectedFrames.length * delay) / 1000).toFixed(1)}s`);
  console.log(`  File size: ${(finalSize / 1024 / 1024).toFixed(2)} MB (compressed)`);
}

/**
 * Helper function to create a GIF from a subset of frames (e.g., for testing)
 */
export async function createTrackingGifFromRange(
  rinkParams: CreateRinkParams,
  frames: TrackingFrame[],
  outputPath: string,
  startIndex: number,
  endIndex: number,
  options: CreateTrackingGifOptions = {}
): Promise<void> {
  const selectedFrames = frames.slice(startIndex, endIndex);
  return createTrackingGif(rinkParams, selectedFrames, outputPath, options);
}
