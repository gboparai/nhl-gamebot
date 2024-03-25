import axios from "axios";
import { load } from 'cheerio';


interface Post {
    id: number;
    date: string;
    date_gmt: string;
    guid: {
        rendered: string;
    };
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    excerpt: {
        rendered: string;
        protected: boolean;
    };
    author: number;
    featured_media: number;
    comment_status: string;
    ping_status: string;
    sticky: boolean;
    template: string;
    format: string;
    meta: {
        [key: string]: any;
    };
    categories: number[];
    tags: number[];
    jetpack_publicize_connections: any[];
    jetpack_featured_media_url: string;
    _links: {
        self: { href: string }[];
        collection: { href: string }[];
        about: { href: string }[];
        author: { embeddable: boolean; href: string }[];
        replies: { embeddable: boolean; href: string }[];
        version_history: { count: number; href: string }[];
        predecessor_version: { id: number; href: string }[];
        'wp:featuredmedia': { embeddable: boolean; href: string }[];
        'wp:attachment': { href: string }[];
        'wp:term': { taxonomy: string; embeddable: boolean; href: string }[];
        curies: { name: string; href: string; templated: boolean }[];
    };
}
async function fetchPostsData(): Promise<Post[]> {
    const url = 'https://scoutingtherefs.com/wp-json/wp/v2/posts';

    try {
        const response = await axios.get<Post[]>(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching data:', error.message as string);
        return [];
    }
}

interface Referee {
    name: string;
    seasongames: string;
    careergames: string;
    penaltygame: string;
    totalgames: number;
}

interface GameDetails {
    referees: Referee[];
    linesmen: Referee[];
    confirmed: boolean;
}

export async function fetchGameDetails(prefTeam: any): Promise<GameDetails> {
    try {
        const response = await fetchPostsData();

        const gameDetails: GameDetails = {
            referees: [],
            linesmen: [],
            confirmed: false
        };

        let postToLoad: Post | null = null;

        for (let i = 0; i < response.length; i++) {
            const post = response[i];
            const categories = post.categories;
            // Assuming you'll implement parse and datetime logic accordingly
            const postDate = new Date(post.date);
            const today = new Date();
            const postedToday = postDate.getDate() === today.getDate() &&
                postDate.getMonth() === today.getMonth() &&
                postDate.getFullYear() === today.getFullYear();
            const postTitle = post.title.rendered;

            if ((categories.includes(921) && postedToday) || (postedToday && postTitle.includes('NHL Referees and Linesmen'))) {
                postToLoad = post;
                break;
            }
        }

        if (!postToLoad) {
            console.warn('No relevant game details found.');
            return gameDetails;
        }
        const $ = load(postToLoad?.content.rendered || '');



        const game = $('h1').filter((_, el) => $(el).text().includes(prefTeam.team_name)).first().next('table');
        if (!game.length) {
            console.warn('No game details found - your team is probably not playing today.');
            return gameDetails;
        }

        const refereesRow = game.find('tr').filter((_, el) => $(el).text().toLowerCase().trim() === 'referees');
        const refereesNamesRow = refereesRow.next();
        const refereesData = refereesNamesRow.find('td');
        const refereesSeasonGamesRow = refereesRow.nextAll().filter((_, el) => $(el).text().toLowerCase().includes('22-23'));
        const refereesCareerGamesRow = refereesRow.nextAll().filter((_, el) => $(el).text().toLowerCase().includes('career games'));
        const refereesPenaltyGamesRow = game.find('tr').filter((_, el) => $(el).text().toLowerCase().includes('penl/gm'));

        refereesData.each((i, el) => {
            const name = $(el).text().trim();
            const seasongames = $(refereesSeasonGamesRow.children().get(i)).text();
            const careergames = $(refereesCareerGamesRow.children().get(i)).text();
            const penaltygame = $(refereesPenaltyGamesRow.children().get(i)).text().split(' (')[0];

            const referee: Referee = {
                name,
                seasongames,
                careergames,
                penaltygame,
                totalgames: calculateTotalGames(seasongames, careergames)
            };

            gameDetails.referees.push(referee);
        });

        const linesmenRow = game.find('tr').filter((_, el) => $(el).text().toLowerCase().trim() === 'linesmen');
        const linesmenNamesRow = linesmenRow.next();
        const linesmenData = linesmenNamesRow.find('td');
        const linesmenSeasonGamesRow = linesmenRow.nextAll().filter((_, el) => $(el).text().toLowerCase().includes('22-23'));
        const linesmenCareerGamesRow = linesmenRow.nextAll().filter((_, el) => $(el).text().toLowerCase().includes('career games'));

        linesmenData.each((i, el) => {
            const name = $(el).text().trim();
            const seasongames = $(linesmenSeasonGamesRow.children().get(i)).text();
            const careergames = $(linesmenCareerGamesRow.children().get(i)).text();

            const linesman: Referee = {
                name,
                seasongames,
                careergames,
                penaltygame: '',
                totalgames: calculateTotalGames(seasongames, careergames)
            };

            gameDetails.linesmen.push(linesman);
        });

        gameDetails.confirmed = true;
        console.debug('Scouting the Refs -', gameDetails);
        return gameDetails;
    } catch (error: any) {
        console.error('Error:', error.message);
        return {
            referees: [],
            linesmen: [],
            confirmed: false
        };
    }
}

function calculateTotalGames(seasonGames: string, careerGames: string): number {
    return parseInt(seasonGames) + parseInt(careerGames);
}