import {
    loadImage, CanvasRenderingContext2D, Canvas, registerFont,
} from 'canvas';
import fs from 'fs';

// Function to add an image as a background to a canvas
/**
 * Adds an image as the background of a canvas.
 *
 * @param ctx - The rendering context of the canvas.
 * @param canvas - The canvas element.
 * @param imageUrl - The URL of the image to be used as the background.
 * @returns A promise that resolves when the image is loaded and the background is set.
 */
export async function addImageAsBackground(ctx: CanvasRenderingContext2D, canvas: Canvas, imageUrl: string): Promise<void> {
    const img = await loadImage(imageUrl);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Function to save a canvas image to a file
/**
 * Saves the canvas image to the specified output path.
 * @param canvas - The canvas object containing the image.
 * @param outputImagePath - The path where the image will be saved.
 * @returns A promise that resolves when the image is successfully saved, or rejects with an error if there was a problem.
 */
export async function saveCanvasImage(canvas: Canvas, outputImagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(outputImagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(outputStream);
        outputStream.on('finish', () => {
            console.log(`Image saved to ${outputImagePath}`);
            resolve();
        });
        outputStream.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Represents the options for a custom font.
 */
type CustomFontOptions = {
    fontPath: string;
    family: string;
};

/**
 * Loads a custom font and sets it as the font for the canvas context.
 * @param options - The options for loading the custom font.
 * @param canvas - The canvas element to set the font on.
 * @returns The canvas rendering context with the custom font set.
 */
export function loadCustomFont(options: CustomFontOptions, canvas: Canvas): CanvasRenderingContext2D {
    const { fontPath, family } = options;
    const ctx = canvas.getContext('2d');
    registerFont(fontPath, { family });
    return ctx;
}





/**
 * Represents the options for a transparent square.
 */
type TransparentSquareOptions = {
    x: number;
    y: number;
    xPadding: number;
    yPadding: number;
    width: number;
    height: number;
    transparency: number;
    lineItems: string[];
};

/**
 * Adds a square with goals to the canvas.
 * @param ctx - The canvas rendering context.
 * @param options - The options for the transparent square.
 */
export function addSquareWithGoals(ctx: CanvasRenderingContext2D, options: TransparentSquareOptions): void {
    const {
        x, y, width, height, transparency, lineItems, xPadding, yPadding,
    } = options;
    ctx.fillStyle = `rgba(0, 0, 0, ${transparency})`;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px RobotoRegular';
    ctx.textAlign = 'left';
    const lineHeight = 20;
    const maxLines = Math.floor((height - 2 * yPadding) / lineHeight);
    let currentLine = 0;
    for (const lineItem of lineItems) {
        const words = lineItem.split(' ');
        let line = '';
        for (const word of words) {
            const testLine = `${line + word} `;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > width - 2 * xPadding) {
                if (currentLine < maxLines) {
                    ctx.fillText(line.trim(), x + xPadding, y + yPadding + currentLine * lineHeight);
                    line = `${word} `;
                    currentLine++;
                } else {
                    break;
                }
            } else {
                line = testLine;
            }
        }
        if (currentLine < maxLines) {
            ctx.fillText(line.trim(), x + xPadding, y + yPadding + currentLine * lineHeight);
            currentLine++;
        } else {
            break;
        }
    }
}

/**
 * Represents the options for rendering text.
 */
type TextOptions = {
    text: string;
    x: number;
    y: number;
    font: string;
    color: string;
    textAlign?: CanvasTextAlign;
};

/**
 * Adds text to the canvas.
 * @param ctx - The canvas rendering context.
 * @param options - The options for the text.
 */
export function addText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
    const {
        text, x, y, font, color, textAlign,
    } = options;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign || 'center';
    ctx.fillText(text, x, y);
}

/**
 * Options for rendering rotated text.
 */
type RotatedTextOptions = {
    /**
     * The text to be rendered.
     */
    text: string;
    /**
     * The x-coordinate of the text position.
     */
    x: number;
    /**
     * The y-coordinate of the text position.
     */
    y: number;
    /**
     * The font style of the text.
     */
    font: string;
    /**
     * The color of the text.
     */
    color: string;
    /**
     * The rotation angle of the text in degrees.
     */
    rotation: number;
};

/**
 * Adds rotated text to the canvas.
 *
 * @param ctx - The canvas rendering context.
 * @param options - The options for the rotated text.
 */
export function addRotatedText(ctx: CanvasRenderingContext2D, options: RotatedTextOptions): void {
    const {
        text, x, y, font, color, rotation,
    } = options;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

/**
 * Represents the options for a team logo.
 */
type TeamLogoOptions = {
    teamName: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Adds a team logo to the canvas.
 * @param ctx - The canvas rendering context.
 * @param options - The options for adding the team logo.
 * @returns A promise that resolves when the team logo is added.
 */
export async function addTeamLogo(ctx: CanvasRenderingContext2D, options: TeamLogoOptions): Promise<void> {
    const {
        teamName, x, y, width, height,
    } = options;
    const logoPath = `./assets/logos/${teamImages[teamName as keyof typeof teamImages] || ''}`;
    try {
        const logoImage = await loadImage(logoPath);
        ctx.drawImage(logoImage, x, y, width, height);
    } catch (error: unknown) {
        console.error(`Error loading or drawing the logo for ${teamName}: ${(error as Error).message}`);
    }
}

const teamImages = {
    Ducks: 'AnaheimDucks.png',
    Coyotes: 'ArizonaCoyotes.png',
    Bruins: 'BostonBruins.png',
    Sabres: 'BuffaloSabres.png',
    Flames: 'CalgaryFlames.png',
    Hurricanes: 'CarolinaHurricanes.png',
    Blackhawks: 'ChicagoBlackhawks.png',
    Avalanche: 'ColoradoAvalanche.png',
    BlueJackets: 'ColumbusBlueJackets.png',
    Stars: 'DallasStars.png',
    RedWings: 'DetroitRedWings.png',
    Oilers: 'EdmontonOilers.png',
    Panthers: 'FloridaPanthers.png',
    Kings: 'LosAngelesKings.png',
    Wild: 'MinnesotaWild.png',
    Canadiens: 'MontrealCanadiens.png',
    Predators: 'NashvillePredators.png',
    Devils: 'NewJerseyDevils.png',
    Islanders: 'NewYorkIslanders.png',
    Rangers: 'NewYorkRangers.png',
    Senators: 'OttawaSenators.png',
    Flyers: 'PhiladelphiaFlyers.png',
    Penguins: 'PittsburghPenguins.png',
    Sharks: 'SanJoseSharks.png',
    Kraken: 'SeattleKraken.png',
    Blues: 'StLouisBlues.png',
    Lightning: 'TampaBayLightning.png',
    MapleLeafs: 'TorontoMapleLeafs.png',
    Canucks: 'VancouverCanucks.png',
    GoldenKnights: 'VegasGoldenKnights.png',
    Capitals: 'WashingtonCapitals.png',
    Jets: 'WinnipegJets.png',
};

/**
 * Represents a segment of a bar in a graphic.
 */
type BarSegment = {
    value: number;
    label: string;
    color: string;
};

/**
 * Represents a bar with an overall label and segments.
 */
type Bar = {
    overallLabel: string;
    segments: BarSegment[];
};

/**
 * Represents the options for a bar graph.
 */
type BarGraphOptions = {
    x: number;
    y: number;
    height: number;
    bars: Bar[];
    overallLabelWidth: number;
    labelColor?: string;
    barSpacing?: number;
};

/**
 * Draws a stacked horizontal bar graph with an overall label for each bar.
 * @param ctx - The canvas rendering context.
 * @param options - The options for the bar graph.
 */
export function drawStackedHorizontalBarGraph(ctx: CanvasRenderingContext2D, options: BarGraphOptions): void {
    const {
        x,
        y,
        height,
        bars,
        overallLabelWidth,
        labelColor = '#000000', // Default label color: black
        barSpacing = 10, // Default spacing between bars
    } = options;

    let currentY = y;

    for (const bar of bars) {
        const { overallLabel, segments } = bar;
        let currentX = x;

        // Draw the overall label
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '16px RobotoBold';
        ctx.fillText(overallLabel, currentX + 10, currentY + height / 2);

        // Draw the rectangle around the label
        const labelWidth = overallLabelWidth;
        const rectX = currentX;
        const rectY = currentY;
        const rectWidth = labelWidth;
        const rectHeight = height;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

        currentX += overallLabelWidth;

        for (const segment of segments) {
            const { value, label, color } = segment;

            // Draw the segment
            ctx.fillStyle = color;
            ctx.fillRect(currentX, currentY, value, height);

            // Draw the label inside the segment
            addText(ctx, {
                text: label,
                x: currentX + value / 2,
                y: currentY + height / 2,
                font: '16px RobotoBold',
                color: labelColor,
                textAlign: 'center',
            });

            currentX += value;
        }
        currentY += height + barSpacing;
    }
}


