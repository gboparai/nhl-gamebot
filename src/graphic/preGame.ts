import { createCanvas } from 'canvas';
import {
    addText, addImageAsBackground, saveCanvasImage, loadCustomFont, addTeamLogo,
} from './utils';

/**
 * Represents the parameters for a pre-game graphic.
 */
export type PreGameParams = {
    homeTeam: string;
    awayTeam: string;
    homeHashtag: string;
    awayHashtag: string;
    venue: string;
    date: string;
    time: string;
    homeLine1: string;
    homeLine2: string;
    awayLine1: string;
    awayLine2: string;
};

/**
 * Creates a pregame image with the given parameters.
 * @param params - The parameters for creating the pregame image.
 * @returns A promise that resolves to void.
 */
export default async function preGame(params: PreGameParams): Promise<void> {
    const {
        homeTeam, awayTeam, homeHashtag, awayHashtag, venue, date, time, homeLine1, homeLine2, awayLine1, awayLine2,
    } = params;

    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    await loadCustomFont({
        fontPath: './assets/fonts/Roboto-Bold.ttf',
        family: 'RobotoBold',
    }, canvas);

    await loadCustomFont({
        fontPath: './assets/fonts/Roboto-Regular.ttf',
        family: 'RobotoRegular',
    }, canvas);
    await addImageAsBackground(ctx, canvas, './assets/images/BG2022-Gameday-Pregame.png');
    addText(ctx, {
        text: 'Pregame Matchup',
        x: canvas.width / 2,
        y: 75,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });

    const logoWidth = 300;
    const logoHeight = 200;
    const logoSpacing = 50;
    const canvasCenterX = canvas.width / 2;

    await addTeamLogo(ctx, {
        teamName: homeTeam,
        x: canvasCenterX - logoWidth - logoSpacing / 2,
        y: 135 + 15,
        width: logoWidth,
        height: logoHeight,
    });

    addText(ctx, {
        text: homeLine1,
        x: canvasCenterX - logoWidth - logoSpacing / 2 + logoWidth / 2,
        y: 375 + 15,
        font: '24px RobotoRegular',
        color: 'white',
        textAlign: 'center',
    });

    addText(ctx, {
        text: homeLine2,
        x: canvasCenterX - logoWidth - logoSpacing / 2 + logoWidth / 2,
        y: 403 + 15,
        font: '24px RobotoRegular',
        color: 'white',
        textAlign: 'center',
    });

    await addTeamLogo(ctx, {
        teamName: awayTeam,
        x: canvasCenterX + logoSpacing / 2,
        y: 135 + 15,
        width: logoWidth,
        height: logoHeight,
    });

    addText(ctx, {
        text: awayLine1,
        x: canvasCenterX + logoSpacing / 2 + logoWidth / 2,
        y: 375 + 15,
        font: '24px RobotoRegular',
        color: 'white',
        textAlign: 'center',
    });
    addText(ctx, {
        text: awayLine2,
        x: canvasCenterX + logoSpacing / 2 + logoWidth / 2,
        y: 403 + 15,
        font: '24px RobotoRegular',
        color: 'white',
        textAlign: 'center',
    });

    addText(ctx, {
        text: 'VS',
        x: canvasCenterX,
        y: 260 + 15,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });

    addText(ctx, {
        text: `${date} - ${time}`,
        x: canvasCenterX,
        y: 525,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });
    addText(ctx, {
        text: venue,
        x: canvasCenterX,
        y: 575,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });
    addText(ctx, {
        text: `#${homeHashtag} #${awayHashtag}`,
        x: canvasCenterX,
        y: 625,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });
    await saveCanvasImage(canvas, './temp/preGame.png');
}
