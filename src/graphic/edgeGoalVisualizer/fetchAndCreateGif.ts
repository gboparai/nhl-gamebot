import axios from "axios";
import { createTrackingGif, CreateTrackingGifOptions } from "./createTrackingGif";
import { TrackingFrame } from "./renderTrackingFrame";
import path from "path";

export interface FetchAndCreateGifParams {
  /** URL to the tracking data JSON (e.g., https://wsr.nhle.com/sprites/20252026/2025020583/ev187.json) */
  url: string;
  /** Home team name (full name like "Flyers", "Blackhawks") */
  homeTeam: string;
  /** Away team name (full name like "Flyers", "Blackhawks") */
  awayTeam: string;
  /** Period number (1, 2, 3, 4 for OT) */
  period: number;
  /** Output path for the GIF */
  outputPath: string;
  /** Optional GIF creation options */
  options?: CreateTrackingGifOptions;
}

/**
 * Fetches tracking data from NHL EDGE API and creates an animated GIF
 * @param params - Parameters including URL, teams, period, and output path
 * @returns Promise that resolves when GIF is created
 */
export async function fetchAndCreateGif(params: FetchAndCreateGifParams): Promise<void> {
  const { url, homeTeam, awayTeam, period, outputPath, options = {} } = params;

  console.log(`Fetching tracking data from: ${url}`);
  
  try {
    // Fetch tracking data from NHL EDGE API with browser-like headers
    const response = await axios.get<TrackingFrame[]>(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nhl.com/",
        "Origin": "https://www.nhl.com",
      },
    });
    const trackingData = response.data;

    if (!trackingData || trackingData.length === 0) {
      throw new Error("No tracking data found in response");
    }

    console.log(`✓ Fetched ${trackingData.length} tracking frames`);

    // Determine which team is on left vs right based on period
    // In NHL, home team defends the left side in periods 1 and 3
    // Away team defends the left side in period 2
    const isHomeOnLeft = period === 1 || period === 3;
    const leftTeam = isHomeOnLeft ? homeTeam : awayTeam;
    const rightTeam = isHomeOnLeft ? awayTeam : homeTeam;

    console.log(`Creating GIF...`);
    console.log(`  Home team: ${homeTeam}`);
    console.log(`  Away team: ${awayTeam}`);
    console.log(`  Period: ${period}`);
    console.log(`  Left side: ${leftTeam}`);
    console.log(`  Right side: ${rightTeam}`);

    // Create the GIF
    await createTrackingGif(
      {
        homeTeam,
        leftTeam,
        rightTeam,
      },
      trackingData,
      outputPath,
      options
    );

    console.log(`\n✓ GIF created successfully!`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching tracking data: ${error.message}`);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  URL: ${url}`);
      }
    } else {
      console.error(`Error creating GIF:`, error);
    }
    throw error;
  }
}

/**
 * Helper to extract game ID and event ID from a tracking URL
 * Example: https://wsr.nhle.com/sprites/20252026/2025020583/ev187.json
 * Returns: { season: "20252026", gameId: "2025020583", eventId: "ev187" }
 */
export function parseTrackingUrl(url: string): { season: string; gameId: string; eventId: string } | null {
  const match = url.match(/\/(\d{8})\/(\d{10})\/(ev\d+)\.json/);
  if (!match) {
    return null;
  }
  return {
    season: match[1],
    gameId: match[2],
    eventId: match[3],
  };
}
