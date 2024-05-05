import search from 'yt-search';

type YouTubeVideo = {
    title: string;
    link: string;
    author: {
        name: string;
        url: string;
    };
};

/**
 * Searches YouTube for videos based on a search term and returns a specified number of results.
 * @param searchTerm - The term to search for on YouTube.
 * @param numResults - The number of search results to return.
 * @returns A promise that resolves to an array of YouTubeVideo objects.
 */
export async function searchYouTube(searchTerm: string, numResults: number): Promise<YouTubeVideo[]> {
    const results = await search(searchTerm);
    const videos: YouTubeVideo[] = [];

    for (let i = 0; i < numResults && i < results.videos.length; i++) {
        const video = results.videos[i];
        videos.push({
            title: video.title,
            link: video.url,
            author: {
                name: video.author.name,
                url: video.author.url,
            },
        });
    }

    return videos;
}

/**
 * Searches for a condensed YouTube video of NHL highlights for a specific game.
 * 
 * @param awayTeam - The name of the away team.
 * @param homeTeam - The name of the home team.
 * @returns A promise that resolves to a YouTubeVideo object representing the condensed video, or null if no video is found.
 */
export async function youtubeCondensed(awayTeam: string, homeTeam: string): Promise<YouTubeVideo | null> {
    const searchTerm = `NHL Highlights | ${awayTeam} @ ${homeTeam}`;
    const results = await searchYouTube(searchTerm, 1);

    if (results.length > 0) {
        const result = results[0];
        const ytLink = `https://youtube.com${result.link}`;
        result.link = ytLink;
        return result;
    }

    return null;
}

