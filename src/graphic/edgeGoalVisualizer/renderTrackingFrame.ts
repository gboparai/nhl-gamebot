import { createRink, CreateRinkParams } from "./createRink";
import { getTeamColor, getTeamAbbreviation, rgbaToHex } from "../utils";
import fs from "fs";

/**
 * Represents a player or puck on the ice
 */
export interface OnIceEntity {
  id: number | string;
  playerId: string | number;
  x: number;
  y: number;
  sweaterNumber: string | number;
  teamId: string | number;
  teamAbbrev: string;
}

/**
 * Represents a tracking frame with timestamp and entity positions
 */
export interface TrackingFrame {
  timeStamp: number;
  onIce: Record<string, OnIceEntity>;
}

/**
 * Options for rendering tracking elements
 */
export interface RenderOptions {
  /** Highlight a specific player (e.g., goal scorer) */
  highlightPlayerId?: number;
  /** Show player numbers on circles */
  showNumbers?: boolean;
  /** Radius of player circles */
  playerRadius?: number;
  /** Radius of puck circle */
  puckRadius?: number;
}

/**
 * Renders a tracking frame on the rink
 * @param rinkParams - Parameters for creating the base rink
 * @param trackingFrame - The tracking frame data with player positions
 * @param options - Rendering options
 * @returns SVG content with tracking elements rendered
 */
export function renderTrackingFrame(
  rinkParams: CreateRinkParams,
  trackingFrame: TrackingFrame,
  options: RenderOptions = {}
): string {
  const {
    highlightPlayerId,
    showNumbers = true,
    playerRadius = 38,
    puckRadius = 12,
  } = options;

  // Start with the base rink
  let svgContent = createRink(rinkParams);

  // Generate SVG elements for each entity
  const playerElements: string[] = [];
  const puckElements: string[] = [];

  // Get team colors for styling
  const leftColor = rgbaToHex(getTeamColor(rinkParams.leftTeam));
  const rightColor = rgbaToHex(getTeamColor(rinkParams.rightTeam));

  for (const [key, entity] of Object.entries(trackingFrame.onIce)) {
    // Check if this is the puck (id === 1 or empty playerId)
    const isPuck = entity.id === 1 || entity.id === "1" || !entity.playerId;

    if (isPuck) {
      // Render puck
      puckElements.push(
        `<g style="transform: translate(${entity.x}px, ${entity.y}px);">` +
          `<circle r="${puckRadius}" fill="#000000"/>` +
          `</g>`
      );
    } else {
      // Determine team color - match by abbreviation
      // leftTeam and rightTeam in rinkParams are full team names, convert to abbreviations for comparison
      const leftTeamAbbrev = getTeamAbbreviation(rinkParams.leftTeam);
      const rightTeamAbbrev = getTeamAbbreviation(rinkParams.rightTeam);
      const homeTeamAbbrev = getTeamAbbreviation(rinkParams.homeTeam);
      
      const isLeftTeam = entity.teamAbbrev === leftTeamAbbrev;
      const isRightTeam = entity.teamAbbrev === rightTeamAbbrev;
      const isHomeTeam = entity.teamAbbrev === homeTeamAbbrev;
      
      const teamColor = isLeftTeam
        ? leftColor
        : isRightTeam
        ? rightColor
        : "#CCCCCC";

      // Check if this player should be highlighted
      const isHighlighted = entity.playerId === highlightPlayerId;

      // Render player
      let playerElement = `<g style="transform: translate(${entity.x}px, ${entity.y}px);">`;

      // Add highlight circle if needed (goal scorer) - solid circle, render BEFORE main circle
      if (isHighlighted) {
        playerElement += `<circle r="${playerRadius + 12}" fill="none" stroke="${teamColor}" stroke-width="4" opacity="0.8"/>`;
      }

      // Main circle for player - home team filled, away team inverted (white with colored border)
      if (isHomeTeam) {
        // Home team: solid filled with team color
        playerElement += `<circle r="${playerRadius}" fill="${teamColor}" stroke="#FFFFFF" stroke-width="2"/>`;
      } else {
        // Away team: inverted - white fill with team color border
        playerElement += `<circle r="${playerRadius}" fill="#FFFFFF" stroke="${teamColor}" stroke-width="4"/>`;
      }

      // Add sweater number - white text for home team, team color text for away team
      if (showNumbers && entity.sweaterNumber) {
        const textColor = isHomeTeam ? "#FFFFFF" : teamColor;
        playerElement += `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" ` +
          `fill="${textColor}" font-size="32" font-weight="bold" font-family="Arial, sans-serif">` +
          `${entity.sweaterNumber}</text>`;
      }

      playerElement += `</g>`;
      playerElements.push(playerElement);
    }
  }

  // Insert tracking elements before the closing </svg> tag
  // Players first, then puck on top
  const trackingElements = [...playerElements, ...puckElements];
  const closingSvgIndex = svgContent.lastIndexOf("</svg>");
  if (closingSvgIndex !== -1) {
    // Add a group for tracking elements
    const trackingGroup =
      `\n    <!-- Tracking Frame Elements -->\n` +
      `    <g id="trackingFrame">\n        ` +
      trackingElements.join("\n        ") +
      `\n    </g>\n`;

    svgContent =
      svgContent.slice(0, closingSvgIndex) +
      trackingGroup +
      svgContent.slice(closingSvgIndex);
  }

  return svgContent;
}

/**
 * Renders a tracking frame and saves it to a file
 * @param rinkParams - Parameters for creating the base rink
 * @param trackingFrame - The tracking frame data with player positions
 * @param outputPath - Path where the SVG should be saved
 * @param options - Rendering options
 */
export function renderTrackingFrameToFile(
  rinkParams: CreateRinkParams,
  trackingFrame: TrackingFrame,
  outputPath: string,
  options: RenderOptions = {}
): void {
  const svgContent = renderTrackingFrame(rinkParams, trackingFrame, options);
  fs.writeFileSync(outputPath, svgContent, "utf-8");
}
