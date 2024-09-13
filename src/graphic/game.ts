import { createCanvas } from 'canvas';
import {
    addText, addImageAsBackground, saveCanvasImage, loadCustomFont, drawStackedHorizontalBarGraph, addSquareWithGoals, addTeamLogo
} from './utils';
/**
 * Represents the parameters for generating a game image.
 */
export type GameImageParams = {
    shots: {
        pref: number;
        opp: number;
    };
    blockedShots: {
        pref: number;
        opp: number;
    };
    penalties: {
        pref: number;
        opp: number;
    };
    hits: {
        pref: number;
        opp: number;
    };
    faceoffPercentage: {
        pref: number;
        opp: number;
    };
};


/**
 * Creates a game image based on the provided parameters.
 * @param params - The parameters for creating the game image.
 * @returns A promise that resolves when the game image is created.
 */
export async function createGameImage(params: GameImageParams): Promise<void> {
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
    await addImageAsBackground(ctx, canvas, './assets/images/BG2022-Gameday-ScoreReport.png');
    addText(ctx, {
        text: 'MATCHUP REPORT',
        x: canvas.width / 2,
        y: 70,
        font: '48px RobotoBold',
        color: 'white',
        textAlign: 'center',
    });

    const barLength = 700;
    const segment1Color = 'rgba(0, 132, 61, 0.75)';
    const segment2Color = 'rgba(0, 32, 91, 0.75)';


    const barGraphOptions = {
        x: 140,
        y: 120,
        height: 50,

        bars: [
            {
                overallLabel: 'Shots',
                segments:
                    [
                        { value: (params.shots.pref / (params.shots.pref + params.shots.opp)) * barLength, label: String(params.shots.pref), color: segment1Color },
                        { value: (params.shots.opp / (params.shots.pref + params.shots.opp)) * barLength, label: String(params.shots.opp), color: segment2Color },
                    ],
            },
            {
                overallLabel: 'Blocked Shots',
                segments:
                    [
                        { value: (params.blockedShots.pref / (params.blockedShots.pref + params.blockedShots.opp)) * barLength, label: String(params.blockedShots.pref), color: segment1Color },
                        { value: (params.blockedShots.opp / (params.blockedShots.pref + params.blockedShots.opp)) * barLength, label: String(params.blockedShots.opp), color: segment2Color },
                    ],
            },
            {
                overallLabel: 'Penalties',
                segments:
                    [
                        { value: (params.penalties.pref / (params.penalties.pref + params.penalties.opp)) * barLength, label: String(params.penalties.pref), color: segment1Color },
                        { value: (params.penalties.opp / (params.penalties.pref + params.penalties.opp)) * barLength, label: String(params.penalties.opp), color: segment2Color },
                    ],
            },
            {
                overallLabel: 'Hits',
                segments:
                    [
                        { value: (params.hits.pref / (params.hits.pref + params.hits.opp)) * barLength, label: String(params.hits.pref), color: segment1Color },
                        { value: (params.hits.opp / (params.hits.pref + params.hits.opp)) * barLength, label: String(params.hits.opp), color: segment2Color },
                    ],
            },
            {
                overallLabel: 'Faceoff Percentage',
                segments:
                    [
                        { value: (params.faceoffPercentage.pref / (params.faceoffPercentage.pref + params.faceoffPercentage.opp)) * barLength, label: String(params.faceoffPercentage.pref), color: segment1Color },
                        { value: (params.faceoffPercentage.opp / (params.faceoffPercentage.pref + params.faceoffPercentage.opp)) * barLength, label: String(params.faceoffPercentage.opp), color: segment2Color },
                    ],
            },
        ],
        overallLabelWidth: 200,
        labelColor: '#ffffff',

        barSpacing: 20,
    };

    await drawStackedHorizontalBarGraph(ctx, barGraphOptions);
    await saveCanvasImage(canvas, './temp/game.png');
}