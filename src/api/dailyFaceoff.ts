import axios from "axios";
import { load, CheerioAPI } from "cheerio";
import { logger } from "../logger";


// Types
export type  Lines = {
  confirmed: boolean;
  forwards: string[];
  defense: string[];
  goalies: string[];
  lastUpdate?: string;
}

export type TeamPosition = 'forwards' | 'defense' | 'goalies';

// Constants
const BASE_URL = "https://www.dailyfaceoff.com/teams";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36";

const TEAM_MAPPINGS: Record<string, string> = {
  canucks: "vancouver-canucks",
  oilers: "edmonton-oilers",
  flames: "calgary-flames",
  jets: "winnipeg-jets",
  "maple leafs": "toronto-maple-leafs",
  senators: "ottawa-senators",
  canadiens: "montreal-canadiens",
  lightning: "tampa-bay-lightning",
  panthers: "florida-panthers",
  "red wings": "detroit-red-wings",
  bruins: "boston-bruins",
  sabres: "buffalo-sabres",
  rangers: "new-york-rangers",
  islanders: "new-york-islanders",
  devils: "new-jersey-devils",
  flyers: "philadelphia-flyers",
  penguins: "pittsburgh-penguins",
  capitals: "washington-capitals",
  hurricanes: "carolina-hurricanes",
  blackhawks: "chicago-blackhawks",
  predators: "nashville-predators",
  stars: "dallas-stars",
  wild: "minnesota-wild",
  avalanche: "colorado-avalanche",
  "golden knights": "vegas-golden-knights",
  ducks: "anaheim-ducks",
  sharks: "san-jose-sharks",
  kings: "los-angeles-kings",
  mammoth: "utah-mammoth",
  "blue jackets": "columbus-blue-jackets",
  kraken: "seattle-kraken",
  blues: "st-louis-blues",
} as const;


/**
 * Converts a team name to a standardized format.
 * @param teamName - The team name to be converted.
 * @returns The converted team name.
 */
export function convertTeamName(teamName: string): string {
  const lowerCaseTeamName = teamName.toLowerCase();
  return TEAM_MAPPINGS[lowerCaseTeamName] || teamName;
}

/**
 * Extracts the last update timestamp from the CheerioAPI object.
 * 
 * @param $ - The CheerioAPI object representing the parsed HTML.
 * @returns The last update timestamp as a string.
 */
export function extractLastUpdate($: CheerioAPI): string {
  const lastUpdateElement = $(".text-white:contains('Last updated:')");
  return lastUpdateElement.text().split(": ")[1]?.replace("@ ", "").trim() || "";
}

/**
 * Extracts player names from the provided CheerioAPI object based on the given position.
 * 
 * @param $ - The CheerioAPI object representing the HTML document.
 * @param position - The position of the team.
 * @returns An array of player names.
 */
export function extractPlayerNames($: CheerioAPI, position: TeamPosition): string[] {
  return $(`#${position}`)
    .parent()
    .parent()
    .find("img")
    .map((_, el) => $(el).attr("alt"))
    .get()
    .filter(Boolean);
}

/**
 * Builds the URL for the team's line combinations based on the team name.
 * @param {string} teamName - The name of the team.
 * @returns {string} The URL for the team's line combinations.
 */
export function buildTeamUrl(teamName: string): string {
  const convertedName = convertTeamName(teamName.toLowerCase());
  return `${BASE_URL}/${convertedName}/line-combinations/`;
}

/**
 * Fetches the team page from the specified URL.
 * 
 * @param url - The URL of the team page to fetch.
 * @returns A promise that resolves to the fetched team page as a string.
 * @throws If there is an error while fetching the team page.
 */
export async function fetchTeamPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch team page: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Fetches the current line combinations for a given team from Daily Faceoff website.
 * @param teamName - The name of the team to fetch lines for
 * @returns Promise<Lines> - Object containing the team's line combinations
 * @throws Error if the fetch fails or data cannot be parsed
 */
export async function dailyfaceoffLines(teamName: string): Promise<Lines> {
  const emptyLines: Lines = {
    confirmed: false,
    forwards: [],
    defense: [],
    goalies: [],
  };

  try {
    const url = buildTeamUrl(teamName);
    const html = await fetchTeamPage(url);
    const $ = load(html);

    const lastUpdate = extractLastUpdate($);
    
    const lines: Lines = {
      confirmed: true,
      forwards: extractPlayerNames($, 'forwards'),
      defense: extractPlayerNames($, 'defense'),
      goalies: extractPlayerNames($, 'goalies'),
      lastUpdate
    };
    
    if (!lines.forwards.length && !lines.defense.length && !lines.goalies.length) {
      logger.warn(`No line data found for team: ${teamName}`);
      return { ...emptyLines, lastUpdate };
    }

    return lines;
  } catch (error) {
    logger.error(
      "Error fetching lines data:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return emptyLines;
  }
}