import { loadImage, CanvasRenderingContext2D, Canvas, registerFont } from 'canvas';
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
    fontSize: number;
    text: string;
};

/**
 * Loads a custom font and sets it as the font for the canvas context.
 * @param options - The options for loading the custom font.
 * @param canvas - The canvas element to set the font on.
 * @returns The canvas rendering context with the custom font set.
 */
export function loadCustomFont(options: CustomFontOptions, canvas: Canvas): CanvasRenderingContext2D {
    const { fontPath, fontSize } = options;
    const ctx = canvas.getContext('2d');
    registerFont(fontPath, { family: 'CustomFont' });
    ctx.font = `${fontSize}px CustomFont`;
    return ctx;
}


/**
 * Represents the options for a double-sided bar.
 */
type DoubleSidedBarOptions = {
    x: number;
    y: number;
    width: number;
    height: number;
    percentageLeft: number;
    percentageRight: number;
    valueLeft: string;
    valueRight: string;
};


/**
 * Adds a double-sided bar to the canvas.
 * @param ctx - The canvas rendering context.
 * @param options - The options for the double-sided bar.
 */
export function addDoubleSidedBar(ctx: CanvasRenderingContext2D, options: DoubleSidedBarOptions): void {
    const { x, y, width, height, percentageLeft, percentageRight, valueLeft, valueRight } = options;
    const barWidthLeft = (width * percentageLeft) / 100;
    const barWidthRight = (width * percentageRight) / 100;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x, y, barWidthLeft, height);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + width - barWidthRight, y, barWidthRight, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px CustomFont';
    ctx.textAlign = 'left';
    ctx.fillText(valueLeft, x + barWidthLeft / 2, y + height / 2);
    ctx.fillText(valueRight, x + width - barWidthRight / 2, y + height / 2);
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
    const { x, y, width, height, transparency, lineItems, xPadding, yPadding } = options;
    ctx.fillStyle = `rgba(0, 0, 0, ${transparency})`;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px CustomFont';
    ctx.textAlign = 'left';
    const lineHeight = 20;
    const maxLines = Math.floor((height - 2 * yPadding) / lineHeight);
    let currentLine = 0;
    for (const lineItem of lineItems) {
        const words = lineItem.split(' ');
        let line = '';
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > width - 2 * xPadding) {
                if (currentLine < maxLines) {
                    ctx.fillText(line.trim(), x + xPadding, y + yPadding + currentLine * lineHeight);
                    line = word + ' ';
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
};


/**
 * Adds text to the canvas.
 * @param ctx - The canvas rendering context.
 * @param options - The options for the text.
 */
export function addText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
    const { text, x, y, font, color } = options;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
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
    const { text, x, y, font, color, rotation } = options;
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
    abbreviation: string;
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
    const { abbreviation, x, y, width, height } = options;
    const logoPath = `../../assets/${abbreviation}.png`;
    try {
        const logoImage = await loadImage(logoPath);
        ctx.drawImage(logoImage, x, y, width, height);
    } catch (error: any) {
        console.error(`Error loading or drawing the logo for ${abbreviation}: ${error.message}`);
    }
}