import { renderTrackingFrame, TrackingFrame } from "./renderTrackingFrame";
import { CreateRinkParams } from "./createRink";
import { createCanvas, loadImage } from "canvas";
import GIFEncoder from "gif-encoder-2";
import fs from "fs";

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
    delay = Math.max(10, Math.round(avgDiff * frameSkip)); // Adjust for frame skipping
  }

  console.log(`Creating GIF with ${selectedFrames.length} frames (skipped ${frames.length - selectedFrames.length}) at ~${Math.round(1000 / delay)} fps (${delay}ms per frame)`);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Create GIF encoder
  const encoder = new GIFEncoder(width, height);
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

    // Convert SVG to image and draw on canvas
    // For SVG, we need to create a data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
    const image = await loadImage(svgDataUrl);

    // Fill with light grey background
    ctx.fillStyle = "#E5E5E5";
    ctx.fillRect(0, 0, width, height);

    // Draw the SVG image
    ctx.drawImage(image, 0, 0, width, height);

    // Add frame to GIF
    encoder.addFrame(ctx);
  }

  // Finish encoding
  encoder.finish();

  // Write to file
  const buffer = encoder.out.getData();
  fs.writeFileSync(outputPath, buffer as any);

  console.log(`✓ GIF created successfully: ${outputPath}`);
  console.log(`  Frames: ${selectedFrames.length} (${frames.length} total)`);
  console.log(`  Frame rate: ~${Math.round(1000 / delay)} fps`);
  console.log(`  Duration: ~${((selectedFrames.length * delay) / 1000).toFixed(1)}s`);
  console.log(`  File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
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
