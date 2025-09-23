import axios from "axios";
import { load, CheerioAPI, Element } from "cheerio";
import { logObjectToFile } from "../logger";



type WordPressPost = {
  id: number;
  date: string;
  categories: number[];
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
}

export type Referee = {
  name: string;
  seasongames: string;
  careergames: string;
  penaltygame: string;
  totalgames: number;
}

export type GameDetails = {
  referees: Referee[];
  linesmens: Referee[];
  confirmed: boolean;
}

const API_URL = "https://scoutingtherefs.com/wp-json/wp/v2/posts";
const REFS_CATEGORY_ID = 921;


/**
 * Checks if a given date string represents today's date.
 * @param dateString - The date string to check.
 * @returns A boolean indicating whether the date is today or not.
 */
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Calculates the total number of games by adding the season games and career games.
 * 
 * @param seasonGames - The number of games played in the current season.
 * @param careerGames - The number of games played in the entire career.
 * @returns The total number of games played.
 */
function calculateTotalGames(seasonGames: string, careerGames: string): number {
  const season = parseInt(seasonGames) || 0;
  const career = parseInt(careerGames) || 0;
  return season + career;
}

/**
 * Extracts official data from a CheerioAPI object and returns an array of Referee objects.
 * @param $ - The CheerioAPI object.
 * @param row - The row element containing the official data.
 * @param includesPenalties - Optional. Indicates whether penalty game data should be included.
 * @returns An array of Referee objects containing the extracted official data.
 */
function extractOfficialData(
  $: CheerioAPI,
  row: Element,
  includesPenalties = false
): Referee[] {
  const officials: Referee[] = [];
  const namesRow = $(row).next();
  const namesData = namesRow.find("td");
  const seasonGamesRow = $(row)
    .nextAll()
    .filter((_, el) => $(el).text().toLowerCase().includes("23-24"));
  const careerGamesRow = $(row)
    .nextAll()
    .filter((_, el) => $(el).text().toLowerCase().includes("career games"));
  const penaltyGamesRow = includesPenalties
    ? $(row)
        .parent()
        .find("tr")
        .filter((_, el) => $(el).text().toLowerCase().includes("penl/gm"))
    : null;

  namesData.each((i, el) => {
    const name = $(el).text().trim();
    if (!name) return;

    const seasongames = $(seasonGamesRow.children().get(i)).text().trim();
    const careergames = $(careerGamesRow.children().get(i)).text().trim();
    const penaltygame = includesPenalties
      ? $(penaltyGamesRow?.children().get(i) || "")
          .text()
          .split(" (")[0]
          .trim()
      : "";

    officials.push({
      name,
      seasongames,
      careergames,
      penaltygame,
      totalgames: calculateTotalGames(seasongames, careergames),
    });
  });

  return officials;
}

/**
 * Fetches posts data from the WordPress API.
 * @returns A promise that resolves to an array of WordPressPost objects.
 */
async function fetchPostsData(): Promise<WordPressPost[]> {
  try {
    const response = await axios.get<WordPressPost[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

/**
 * Finds the relevant WordPress post from an array of posts.
 * A relevant post is determined by either having the REF_CATEGORY_ID category and being published today,
 * or having today's date and the title containing "NHL Referees and Linesmen".
 *
 * @param posts - An array of WordPress posts.
 * @returns The relevant WordPress post, or null if no relevant post is found.
 */
function findRelevantPost(posts: WordPressPost[]): WordPressPost | null {
  return (
    posts.find(
      (post) =>
        (post.categories.includes(REFS_CATEGORY_ID) && isToday(post.date)) ||
        (isToday(post.date) &&
          post.title.rendered.includes("NHL Referees and Linesmen"))
    ) || null
  );
}

/**
 * Fetches the game details for a preferred team.
 * @param prefTeamFullName - The full name of the preferred team.
 * @returns A Promise that resolves to the game details.
 */
export async function fetchGameDetails(
  prefTeamFullName: string
): Promise<GameDetails> {
  const emptyGameDetails: GameDetails = {
    referees: [],
    linesmens: [],
    confirmed: false,
  };

  try {
    const posts = await fetchPostsData();
    const relevantPost = findRelevantPost(posts);

    logObjectToFile(posts, "scoutingtherefs-posts");
    logObjectToFile(relevantPost, "scoutingtherefs-posts");

    if (!relevantPost) {
      console.warn("No relevant game details found for today.");
      return emptyGameDetails;
    }

    const $ = load(relevantPost.content.rendered);
    const game = $("h1")
      .filter((_, el) => $(el).text().includes(prefTeamFullName))
      .first()
      .next("table");

    if (!game.length) {
      console.warn(`No game details found for team: ${prefTeamFullName}`);
      return emptyGameDetails;
    }

    const refereesRow = game
      .find("tr")
      .filter((_, el) => $(el).text().toLowerCase().trim() === "referees");
    const linesmenRow = game
      .find("tr")
      .filter((_, el) => $(el).text().toLowerCase().trim() === "linespersons");

    if (!refereesRow.length || !linesmenRow.length) {
      console.warn("Could not find referee or linesman data in the game table");
      return emptyGameDetails;
    }

    const gameDetails: GameDetails = {
      referees: extractOfficialData($, refereesRow[0], true),
      linesmens: extractOfficialData($, linesmenRow[0], false),
      confirmed: true,
    };

    return gameDetails;
  } catch (error) {
    console.error(
      "Error fetching game details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return emptyGameDetails;
  }
}
