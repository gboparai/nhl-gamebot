import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { createCanvas, Image, loadImage } from "canvas";
import GIFEncoder from "gif-encoder-2";
import { fetchAndCreateGif } from "./fetchAndCreateGif";

/** Single player or puck entity on the ice */
export interface OnIceEntity {
  /** Internal tracking ID (string key mirrors this) */
  id: number;

  /** NHL player ID (empty string for puck) */
  playerId: number | "";

  /** X coordinate on rink (NHL EDGE coordinate space) */
  x: number;

  /** Y coordinate on rink (NHL EDGE coordinate space) */
  y: number;

  /** Jersey number (empty string for puck) */
  sweaterNumber: number | "";

  /** NHL team ID (empty string for puck) */
  teamId: number | "";

  /** Team abbreviation (empty string for puck) */
  teamAbbrev: string;
}

/** On-ice snapshot at a specific moment */
export interface TrackingFrame {
  /** Timestamp in NHL EDGE clock units */
  timeStamp: number;

  /**
   * All entities on ice, keyed by tracking ID.
   * Includes players + puck (id === 1).
   */
  onIce: Record<string, OnIceEntity>;
}

/** Full file payload */
export type TrackingData = TrackingFrame[];

/**
 * Parameters for generating an edge goal visualization GIF
 */
export interface EdgeGoalVisualizerParams {
  /** URL to the tracking data JSON from NHL EDGE API */
  trackingUrl: string;
  /** Home team name (full name like "Flyers", "Blackhawks") */
  homeTeam: string;
  /** Away team name (full name like "Flyers", "Blackhawks") */
  awayTeam: string;
  /** Period number (1, 2, 3, 4 for OT) */
  period: number;
  /** Optional: Player ID to highlight (goal scorer) */
  goalScorerId?: number;
  /** Optional: Output path (defaults to temp/edge-goal.gif) */
  outputPath?: string;
}

/**
 * Generates an animated GIF visualization of a goal using NHL EDGE tracking data.
 * This is the main function to call for creating edge goal visualizations.
 * 
 * @param params - Parameters including tracking URL, teams, period, and optional goal scorer
 * @returns Promise that resolves to the output file path when GIF is created
 * 
 * @example
 * ```typescript
 * const gifPath = await generateEdgeGoalVisualization({
 *   trackingUrl: "https://wsr.nhle.com/sprites/20252026/2025020583/ev187.json",
 *   homeTeam: "Flyers",
 *   awayTeam: "Blackhawks",
 *   period: 1,
 *   goalScorerId: 8482176
 * });
 * ```
 */
export async function generateEdgeGoalVisualization(
  params: EdgeGoalVisualizerParams
): Promise<string> {
  const {
    trackingUrl,
    homeTeam,
    awayTeam,
    period,
    goalScorerId,
    outputPath = path.join(process.cwd(), "temp/edge-goal.gif"),
  } = params;

  // Use consistent settings optimized for file size and quality
  await fetchAndCreateGif({
    url: trackingUrl,
    homeTeam,
    awayTeam,
    period,
    outputPath,
    options: {
      highlightPlayerId: goalScorerId,
      showNumbers: true,
      playerRadius: 38,
      puckRadius: 12,
      width: 960,  
      height: 405,
      quality: 20,
      repeat: 0,
      frameSkip: 1,
    },
  });

  return outputPath;
}

