const search = require('yt-search');

interface YouTubeVideo {
    title: string;
    link: string;
    author: {
        name: string;
        url: string;
    };
}

async function searchYouTube(searchTerm: string, numResults: number): Promise<YouTubeVideo[]> {
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

async function youtubeCondensed(awayTeam: string, homeTeam: string): Promise<YouTubeVideo | null> {
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

export { searchYouTube, youtubeCondensed };