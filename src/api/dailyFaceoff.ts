import axios from 'axios';
import { load } from 'cheerio';
export type Lines = {
    confirmed: boolean;
    forwards: string[];
    defense: string[];
    goalies: string[];
}


/**
 * Fetches the current line combinations for a given team from Daily Faceoff website.
 * @param teamName - The name of the team.
 * @returns A Promise that resolves to an object containing the current line combinations.
 */
export async function dailyfaceoffLines(teamName: string): Promise<Lines> {
    const dfLinesURL = `https://www.dailyfaceoff.com/teams/${convertTeamName(teamName.toLocaleLowerCase())}/line-combinations/`;
    // Instantiate blank dictionaries
    const currentLines: Lines = {
        confirmed: false,
        forwards: [],
        defense: [],
        goalies: []
    };
    const uaHeader = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
    };
    try {
        const resp = await axios.get(dfLinesURL, { headers: uaHeader });

        const $ = load(resp.data);


        const lastUpdateElement = $(".text-white:contains('Last updated:')");
        const lastUpdate = lastUpdateElement.text().split(": ")[1].replace("@", "");
        console.log(lastUpdate)


        const fwdLinesElements = $("#forwards").parent().parent().find("img").map((i, el) => $(el).attr("alt")).get();
        const defLinesElements = $("#defense").parent().parent().find("img").map((i, el) => $(el).attr("alt")).get();
        const goaliesElements = $("#goalies").parent().parent().find("img").map((i, el) => $(el).attr("alt")).get();

        currentLines.confirmed = true;
        currentLines.forwards = fwdLinesElements;
        currentLines.defense = defLinesElements;
        currentLines.goalies = goaliesElements;
        return currentLines;


    } catch (error: unknown) {
        console.error("Error fetching lines data:", (error as Error).message as string);
        return currentLines;
    }

}

/**
 * Converts a team name to its corresponding format used in the NHL API.
 * @param teamName - The team name to be converted.
 * @returns The converted team name or the original team name if no mapping is found.
 */
function convertTeamName(teamName: string): string {
    const teamMappings: Record<string, string> = {
        "canucks": "vancouver-canucks",
        "oilers": "edmonton-oilers",
        "flames": "calgary-flames",
        "jets": "winnipeg-jets",
        "maple leafs": "toronto-maple-leafs",
        "senators": "ottawa-senators",
        "canadiens": "montreal-canadiens",
        "lightning": "tampa-bay-lightning",
        "panthers": "florida-panthers",
        "red wings": "detroit-red-wings",
        "bruins": "boston-bruins",
        "sabres": "buffalo-sabres",
        "rangers": "new-york-rangers",
        "islanders": "new-york-islanders",
        "devils": "new-jersey-devils",
        "flyers": "philadelphia-flyers",
        "penguins": "pittsburgh-penguins",
        "capitals": "washington-capitals",
        "hurricanes": "carolina-hurricanes",
        "blackhawks": "chicago-blackhawks",
        "predators": "nashville-predators",
        "stars": "dallas-stars",
        "wild": "minnesota-wild",
        "avalanche": "colorado-avalanche",
        "golden knights": "vegas-golden-knights",
        "ducks": "anaheim-ducks",
        "sharks": "san-jose-sharks",
        "kings": "los-angeles-kings",
        "coyotes": "arizona-coyotes",
        "blue jackets": "columbus-blue-jackets"
        // Add more mappings as needed
    };

    const lowerCaseTeamName = teamName.toLowerCase();
    return teamMappings[lowerCaseTeamName] || teamName;
}
