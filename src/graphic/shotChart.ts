import { fetchPlayByPlay } from "../api/nhl";
import { logger } from "../logger";
import type { PlayByPlayGame } from "../types";
import { rgbaToHex } from "./utils";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import {JSDOM} from "jsdom";

export interface ShotEvent {
  coordinates: { x: number; y: number };
  type: "goal" | "shot" | "blocked" | "missed";
  player?: string;
  shotType?: string;
  period?: number;
  timeInPeriod?: string;
  teamAbbrev?: string;
  teamColor?: string;
}

export interface ShotChartOptions {
  includeHeatmap?: boolean;
  includeShots?: boolean;
  homeTeamOnly?: boolean;
  awayTeamOnly?: boolean;
  bandwidth?: number;
  maxOpacity?: number;
  normalizeByTeam?: boolean; // If true, home attacks left, away attacks right
}

/**
 * Converts NHL API coordinates to d3-hockey coordinates
 * NHL API uses feet from center ice: -100 to +100 (x), -42.5 to +42.5 (y)
 * d3-hockey uses the same coordinate system
 * Coordinates need to be flipped when home team defends right (period 2, OT2, OT4, etc.)
 * When normalizeByTeam is true: home always attacks left (negative x), away always attacks right (positive x)
 */
function convertCoordinates(
  xCoord: number, 
  yCoord: number, 
  homeDefendingSide?: string,
  isHomeTeam?: boolean,
  normalizeByTeam?: boolean
): { x: number; y: number } {
  // Flip coordinates when home team defends right side
  const shouldFlip = homeDefendingSide === 'right';
  
  let x = xCoord;
  let y = yCoord;
  
  if (shouldFlip) {
    x = -x;
    y = -y;
  }
  
  // Normalize by team: home attacks left (negative x), away attacks right (positive x)
  if (normalizeByTeam) {
    if (isHomeTeam && x > 0) {
      // Home team shot on right side, flip to left
      x = -x;
      y = -y;
    } else if (!isHomeTeam && x < 0) {
      // Away team shot on left side, flip to right
      x = -x;
      y = -y;
    }
  }
  
  return { x, y };
}

/**
 * Extracts shot events from play-by-play data
 */
export function extractShotEvents(
  playByPlay: PlayByPlayGame,
  options?: { homeTeamOnly?: boolean; awayTeamOnly?: boolean; normalizeByTeam?: boolean }
): ShotEvent[] {
  const shots: ShotEvent[] = [];
  let skippedGoals = 0;

  for (const play of playByPlay.plays) {
    // Skip shootout plays
    if (play.periodDescriptor?.periodType === "SO") {
      continue;
    }

    // Check if this is a shot-related event
    const isShotEvent =
      play.typeDescKey === "shot-on-goal" ||
      play.typeDescKey === "goal" ||
      play.typeDescKey === "blocked-shot" ||
      play.typeDescKey === "missed-shot";

    if (!isShotEvent) {
      continue;
    }

    // Log missing coordinates for goals specifically (check for null/undefined, not falsy since 0 is valid)
    if (play.typeDescKey === "goal" && (play.details?.xCoord == null || play.details?.yCoord == null || play.details?.xCoord == undefined || play.details?.yCoord == undefined)) {
      skippedGoals++;
      logger.warn(`Goal missing coordinates - Period ${play.periodDescriptor?.number}, EventId: ${play.eventId}, xCoord: ${play.details?.xCoord}, yCoord: ${play.details?.yCoord}`);
      continue;
    }

    if (play.details?.xCoord == null || play.details?.yCoord == null || play.details?.xCoord == undefined || play.details?.yCoord == undefined) {
      continue;
    }

    // Filter by team if specified
    if (options?.homeTeamOnly || options?.awayTeamOnly) {
      // Determine shooting team based on situation code
      const shootingTeam = getShotTeam(play, playByPlay);
      if (options.homeTeamOnly && shootingTeam !== "home") continue;
      if (options.awayTeamOnly && shootingTeam !== "away") continue;
    }

    // Get player name and team info if available
    // Goals use scoringPlayerId, other shots use shootingPlayerId
    const playerId = play.typeDescKey === "goal" 
      ? play.details.scoringPlayerId 
      : play.details.shootingPlayerId;
    let playerName: string | undefined;
    let teamAbbrev: string | undefined;
    
    // Use eventOwnerTeamId to determine team (more reliable)
    const eventOwnerTeamId = play.details.eventOwnerTeamId;
    if (eventOwnerTeamId) {
      teamAbbrev = eventOwnerTeamId === playByPlay.homeTeam.id 
        ? playByPlay.homeTeam.abbrev 
        : playByPlay.awayTeam.abbrev;
    }
    
    if (playerId) {
      const player = playByPlay.rosterSpots.find((p) => p.playerId === playerId);
      if (player) {
        playerName = `${player.firstName.default} ${player.lastName.default}`;
      }
    }

    // Get defending side for coordinate flipping
    const homeDefendingSide = play.homeTeamDefendingSide;
    const isHomeTeam = eventOwnerTeamId === playByPlay.homeTeam.id;
    const coords = convertCoordinates(
      play.details.xCoord, 
      play.details.yCoord, 
      homeDefendingSide,
      isHomeTeam,
      options?.normalizeByTeam
    );

    shots.push({
      coordinates: coords,
      type: getShotType(play.typeDescKey),
      player: playerName,
      shotType: play.details.shotType,
      period: play.periodDescriptor.number,
      timeInPeriod: play.timeInPeriod,
      teamAbbrev,
    });
  }

  if (skippedGoals > 0) {
    logger.warn(`Skipped ${skippedGoals} goals due to missing coordinates`);
  }

  const goalCount = shots.filter(s => s.type === "goal").length;
  logger.info(`Extracted ${goalCount} goals out of ${shots.length} total shot events`);

  return shots;
}

/**
 * Determines which team took the shot
 */
function getShotTeam(play: any, playByPlay: PlayByPlayGame): "home" | "away" {
  // Use eventOwnerTeamId (most reliable)
  const eventOwnerTeamId = play.details?.eventOwnerTeamId;
  if (eventOwnerTeamId) {
    return eventOwnerTeamId === playByPlay.homeTeam.id ? "home" : "away";
  }
  
  // Fallback: Use the shooting/scoring player ID to determine the team
  const playerId = play.typeDescKey === "goal" 
    ? play.details?.scoringPlayerId 
    : play.details?.shootingPlayerId;
  if (playerId) {
    const player = playByPlay.rosterSpots.find((p) => p.playerId === playerId);
    if (player) {
      return player.teamId === playByPlay.homeTeam.id ? "home" : "away";
    }
  }
  
  return "home";
}

/**
 * Maps NHL event type to shot chart type
 */
function getShotType(
  typeDescKey: string
): "goal" | "shot" | "blocked" | "missed" {
  switch (typeDescKey) {
    case "goal":
      return "goal";
    case "shot-on-goal":
      return "shot";
    case "blocked-shot":
      return "blocked";
    case "missed-shot":
      return "missed";
    default:
      return "shot";
  }
}

/**
 * Creates a heatmap and shot visualization for a game and saves as PNG
 * @param gameId - The NHL game ID
 * @param outputPath - Path where the PNG file will be saved
 * @param options - Configuration options for the visualization
 */
export async function createShotChart(
  gameId: string,
  outputPath: string,
  options: ShotChartOptions = {}
): Promise<void> {
  try {
    logger.info(`Creating shot chart for game ${gameId}`);

    // Fetch play-by-play data
    const playByPlay = await fetchPlayByPlay(gameId);

    // Extract shot events
    const shots = extractShotEvents(playByPlay, {
      homeTeamOnly: options.homeTeamOnly,
      awayTeamOnly: options.awayTeamOnly,
      normalizeByTeam: options.normalizeByTeam,
    });

    logger.info(`Extracted ${shots.length} shot events`);

    if (shots.length === 0) {
      logger.warn("No shots found in the game");
      return;
    }

    // Dynamically import d3-hockey and jsdom only when needed
    const d3Hockey = await import("d3-hockey/dist/d3-hockey.es.js");
    const { Rink, NHLDataManager } = d3Hockey;
    // Setup jsdom for server-side rendering
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    (global as any).document = dom.window.document;
    (global as any).window = dom.window;
    
    // Polyfill requestAnimationFrame for server-side rendering
    (global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(callback, 16) as any;
    };
    (global as any).cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };

    // Create a container div
    const container = dom.window.document.createElement("div");
    container.id = "shot-chart-container";
    dom.window.document.body.appendChild(container);

    // Get team colors from the play-by-play data
    const homeTeamName = playByPlay.homeTeam.commonName?.default || 'Home';
    const awayTeamName = playByPlay.awayTeam.commonName?.default || 'Away';
    const homeTeamAbbrev = playByPlay.homeTeam.abbrev;
    const awayTeamAbbrev = playByPlay.awayTeam.abbrev;
    
    // Import team color utility
    const { getTeamColor } = await import("./utils");
    const homeColorRgba = getTeamColor(homeTeamName);
    const awayColorRgba = getTeamColor(awayTeamName);
    const homeColor = rgbaToHex(homeColorRgba);
    const awayColor = rgbaToHex(awayColorRgba);

    // Create the rink
    const rink = new Rink("#shot-chart-container").render();

    // Add hexbin layer if enabled (shows shot density through hexagonal binning)
    if (options.includeHeatmap === true) {
      logger.info("Adding hexbin layer...");
      rink.addHexbin(shots, {
        radius: 4,
        opacity: options.maxOpacity || 0.8,
        animate: false,
      });
    }

    // Add shot events layer if enabled (default: true)
    if (options.includeShots !== false) {
      rink.addEvents(shots, {
        id: "shot-events",
        color: (d: ShotEvent) => {
          // Goals are yellow to highlight them
          if (d.type === "goal") {
            return "#FFD700"; // Gold/yellow for goals
          }
          // Use team color based on which team took the shot
          return d.teamAbbrev === homeTeamAbbrev ? homeColor : awayColor;
        },
        radius: 5,
        opacity: 0.75,
        zIndex: 10,
        animate: false,
      });
    }

    // Get the SVG element
    const svgElement = container.querySelector("svg");
    if (!svgElement) {
      throw new Error("Failed to generate SVG");
    }

    // Only add legend if showing shot markers (not for heatmap-only)
    if (options.includeShots !== false) {
      // Update SVG viewBox to include minimal space for legend (d3-hockey creates 1000x425)
      svgElement.setAttribute("viewBox", "0 0 1000 485");

      // Add legend to the SVG - horizontal just below rink, centered
      const svgNS = "http://www.w3.org/2000/svg";
      const legendGroup = dom.window.document.createElementNS(svgNS, "g");
      legendGroup.setAttribute("class", "legend");
      legendGroup.setAttribute("transform", "translate(320, 428)");

    // Legend background
    const legendBg = dom.window.document.createElementNS(svgNS, "rect");
    legendBg.setAttribute("x", "0");
    legendBg.setAttribute("y", "0");
    legendBg.setAttribute("width", "360");
    legendBg.setAttribute("height", "45");
    legendBg.setAttribute("fill", "white");
    legendBg.setAttribute("opacity", "0.95");
    legendBg.setAttribute("stroke", "#333");
    legendBg.setAttribute("stroke-width", "2");
    legendBg.setAttribute("rx", "5");
    legendGroup.appendChild(legendBg);

    // Add legend items horizontally - combine Miss and Block
    const legendItems = [
      { symbol: "circle", label: "Shot", color: homeColor, x: 25 },
      { symbol: "star", label: "Goal", color: "#FFD700", x: 140 },
      { symbol: "plus", label: "Miss/Block", color: homeColor, x: 255 },
    ];

    legendItems.forEach(item => {
      // Symbol
      const symbol = dom.window.document.createElementNS(svgNS, "path");
      let pathData = "";
      let xOffset = 0;
      switch(item.symbol) {
        case "circle":
          pathData = "M 0,-5 A 5,5 0 1,1 0,5 A 5,5 0 1,1 0,-5";
          xOffset = 0;
          break;
        case "star":
          pathData = "M 0,-8 L 2.5,-2 L 8,-2 L 3.5,2 L 5.5,8 L 0,4 L -5.5,8 L -3.5,2 L -8,-2 L -2.5,-2 Z";
          xOffset = 0;
          break;
        case "plus":
          pathData = "M -2,-7 L -2,-2 L -7,-2 L -7,2 L -2,2 L -2,7 L 2,7 L 2,2 L 7,2 L 7,-2 L 2,-2 L 2,-7 Z";
          xOffset = 0;
          break;
      }
      symbol.setAttribute("d", pathData);
      symbol.setAttribute("transform", `translate(${item.x + xOffset}, 23)`);
      symbol.setAttribute("fill", item.color);
      symbol.setAttribute("stroke", "#333");
      symbol.setAttribute("stroke-width", "1.5");
      legendGroup.appendChild(symbol);

      // Label
      const label = dom.window.document.createElementNS(svgNS, "text");
      label.setAttribute("x", (item.x + 15).toString());
      label.setAttribute("y", "28");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-weight", "500");
      label.setAttribute("fill", "#333");
      label.setAttribute("alignment-baseline", "middle");
      label.textContent = item.label;
      legendGroup.appendChild(label);
    });

    svgElement.appendChild(legendGroup);
    } else {
      // For heatmap-only, keep the original viewBox
      svgElement.setAttribute("viewBox", "0 0 1000 425");
    }

    // Get the outer HTML
    const svgContent = svgElement.outerHTML;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert SVG to PNG
    await sharp(Buffer.from(svgContent), { density: 150 })
      .png({
        quality: 95,
        compressionLevel: 6,
      })
      .toFile(outputPath);

    logger.info(`Shot chart PNG saved to ${outputPath}`);

    // Clean up
    dom.window.document.body.removeChild(container);
    delete (global as any).document;
    delete (global as any).window;
    delete (global as any).requestAnimationFrame;
    delete (global as any).cancelAnimationFrame;
  } catch (error) {
    logger.error("Error creating shot chart:", error);
    throw error;
  }
}

/**
 * Creates a shot chart PNG and saves it to the temp folder with a default filename
 * @param gameId - The NHL game ID
 * @param options - Configuration options for the visualization
 * @returns The path to the generated PNG file
 */
export async function createAndSaveShotChart(
  gameId: string,
  options: ShotChartOptions = {}
): Promise<string> {
  const tempDir = path.join(process.cwd(), "temp");
  const filename = `shot-chart-${gameId}.png`;
  const outputPath = path.join(tempDir, filename);

  await createShotChart(gameId, outputPath, options);

  return outputPath;
} 