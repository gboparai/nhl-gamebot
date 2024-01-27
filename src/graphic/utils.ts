import { loadImage, CanvasRenderingContext2D, Canvas, registerFont } from 'canvas';
import fs from 'fs';
// Function to add an image as a background to a canvas
export async function addImageAsBackground(ctx: CanvasRenderingContext2D, canvas: Canvas, imageUrl: string): Promise<void> {
    // Load the image
    const img = await loadImage(imageUrl);

    // Set canvas size to match the image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}
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
interface CustomFontOptions {
    fontPath: string;  // Path to the custom font file
    fontSize: number;
    text: string;       // Sample text to check the loaded font
}

export function loadCustomFont(options: CustomFontOptions, canvas: Canvas): CanvasRenderingContext2D {
    const { fontPath, fontSize } = options;

    const ctx = canvas.getContext('2d');

    // Register the custom font
    registerFont(fontPath, { family: 'CustomFont' });

    // Set the font for the context
    ctx.font = `${fontSize}px CustomFont`;

    return ctx;
}

interface DoubleSidedBarOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    percentageLeft: number;
    percentageRight: number;
    valueLeft: string;
    valueRight: string;
}

export function addDoubleSidedBar(ctx: CanvasRenderingContext2D, options: DoubleSidedBarOptions): void {
    const { x, y, width, height, percentageLeft, percentageRight, valueLeft, valueRight } = options;

    // Calculate bar widths based on percentages
    const barWidthLeft = (width * percentageLeft) / 100;
    const barWidthRight = (width * percentageRight) / 100;

    // Draw left side
    ctx.fillStyle = '#3498db';  // Left bar color
    ctx.fillRect(x, y, barWidthLeft, height);

    // Draw right side
    ctx.fillStyle = '#e74c3c';  // Right bar color
    ctx.fillRect(x + width - barWidthRight, y, barWidthRight, height);

    // Display values on each side
    ctx.fillStyle = '#ffffff';  // Text color
    ctx.font = '14px CustomFont';
    ctx.textAlign = 'left';  // Keep text align left

    // Display left value
    ctx.fillText(valueLeft, x + barWidthLeft / 2, y + height / 2);

    // Display right value
    ctx.fillText(valueRight, x + width - barWidthRight / 2, y + height / 2);
}
interface TransparentSquareOptions {
    x: number;
    y: number;
    xPadding: number;
    yPadding: number;
    width: number;
    height: number;
    transparency: number;  // Value between 0 (fully transparent) and 1 (fully opaque)
    lineItems: string[];
}

export function addSquareWithGoals(ctx: CanvasRenderingContext2D, options: TransparentSquareOptions): void {
    const { x, y, width, height, transparency, lineItems, xPadding, yPadding } = options;

    // Draw semi-transparent square
    ctx.fillStyle = `rgba(0, 0, 0, ${transparency})`;
    ctx.fillRect(x, y, width, height);

    // Set text style
    ctx.fillStyle = '#ffffff';  // Text color
    ctx.font = '14px CustomFont';
    ctx.textAlign = 'left';  // Keep text align left

    const lineHeight = 20;
    const maxLines = Math.floor((height - 2 * yPadding) / lineHeight);

    let currentLine = 0;

    // Iterate through line items
    for (const lineItem of lineItems) {
        const words = lineItem.split(' ');
        let line = '';

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > width - 2 * xPadding) {  // Buffer for padding
                if (currentLine < maxLines) {
                    // Display line on the current line
                    ctx.fillText(line.trim(), x + xPadding, y + yPadding + currentLine * lineHeight);
                    line = word + ' ';
                    currentLine++;
                } else {
                    // Exit if there is no more space in the rectangular area
                    break;
                }
            } else {
                line = testLine;
            }
        }

        if (currentLine < maxLines) {
            // Display the remaining line
            ctx.fillText(line.trim(), x + xPadding, y + yPadding + currentLine * lineHeight);
            currentLine++;
        } else {
            // Exit if there is no more space in the rectangular area
            break;
        }
    }
}
interface TextOptions {
    text: string;
    x: number;
    y: number;
    font: string;
    color: string;
}

export function addText(ctx: CanvasRenderingContext2D, options: TextOptions): void {
    const { text, x, y, font, color } = options;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
}

interface RotatedTextOptions {
    text: string;
    x: number;
    y: number;
    font: string;
    color: string;
    rotation: number;  // Angle in radians
}

export function addRotatedText(ctx: CanvasRenderingContext2D, options: RotatedTextOptions): void {
    const { text, x, y, font, color, rotation } = options;

    ctx.save();  // Save the current state of the context
    ctx.translate(x, y);  // Set the origin to the specified x, y coordinates
    ctx.rotate(rotation);  // Rotate the canvas
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);  // Draw text at the rotated coordinates (0, 0)
    ctx.restore();  // Restore the saved state (reset transformations)
}

interface TeamLogoOptions {
    abbreviation: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export async function addTeamLogo(ctx: CanvasRenderingContext2D, options: TeamLogoOptions): Promise<void> {
    const { abbreviation, x, y, width, height } = options;

    // Replace 'logoPath' with the actual path or URL of the team logo
    const logoPath = `../../assets/${abbreviation}.png`;

    try {
        const logoImage = await loadImage(logoPath);

        // Draw the logo on the canvas
        ctx.drawImage(logoImage, x, y, width, height);
    } catch (error: any) {
        console.error(`Error loading or drawing the logo for ${abbreviation}: ${error.message}`);
    }
}