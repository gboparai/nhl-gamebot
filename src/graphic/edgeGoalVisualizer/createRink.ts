import fs from "fs";
import path from "path";
import {
  getTeamColor,
  getTeamAbbreviation,
  getCenterIceLogo,
  rgbaToHex,
} from "../utils";

/**
 * Parameters for creating a customized rink SVG
 */
export interface CreateRinkParams {
  /** Home team name (used for center ice logo) */
  homeTeam: string;
  /** Left team name (for abbreviation and color) */
  leftTeam: string;
  /** Right team name (for abbreviation and color) */
  rightTeam: string;
}

/**
 * Creates a customized rink SVG with team-specific elements
 * @param params - The rink creation parameters
 * @returns The customized SVG content as a string
 */
export function createRink(params: CreateRinkParams): string {
  const { homeTeam, leftTeam, rightTeam } = params;
  
  // Get team-specific data
  const leftAbbrev = getTeamAbbreviation(leftTeam);
  const rightAbbrev = getTeamAbbreviation(rightTeam);
  const centerLogo = getCenterIceLogo(homeTeam);
  const leftColor = rgbaToHex(getTeamColor(leftTeam));
  const rightColor = rgbaToHex(getTeamColor(rightTeam));
  
  // Read the template SVG
  const templatePath = path.join(process.cwd(), "assets/images/rink.svg");
  let svgContent = fs.readFileSync(templatePath, "utf-8");
  
  // Ensure SVG has width and height attributes (required for canvas rendering)
  svgContent = svgContent.replace(
    /(<svg[^>]*?)(\s*viewBox="[^"]*")/,
    '$1 width="2400" height="1013"$2'
  );
  
  // Add clipPath to hide elements outside the rink boundaries
  // The rink path creates a rounded rectangle that matches the ice surface
  const clipPathDef = `
    <defs>
      <clipPath id="rinkClip">
        <path d="M2064,1020H336C151.2,1020,0,868.8,0,684V336C0,151.2,151.2,0,336,0h1728c184.8,0,336,151.2,336,336v348C2400,868.8,2248.8,1020,2064,1020z"/>
      </clipPath>
    </defs>`;
  
  // Insert clipPath after opening <svg> tag and apply to main group
  svgContent = svgContent.replace(
    /(<svg[^>]*>)(\s*<g>)/,
    `$1${clipPathDef}$2`
  );
  
  // Apply clip-path to the main group
  svgContent = svgContent.replace(
    /(<svg[^>]*>\s*<defs>[\s\S]*?<\/defs>\s*)(<g>)/,
    '$1<g clip-path="url(#rinkClip)">'
  );
  
  // Replace the elements with team-specific values
  // Replace left abbreviation
  svgContent = svgContent.replace(
    /(<text[^>]*id="abvLeft"[^>]*>)[^<]*(<\/text>)/,
    `$1${leftAbbrev}$2`
  );
  
  // Replace right abbreviation
  svgContent = svgContent.replace(
    /(<text[^>]*id="abvRight"[^>]*>)[^<]*(<\/text>)/,
    `$1${rightAbbrev}$2`
  );
  
  // Convert logo to base64 and replace center ice logo
  // The centerLogo is a relative path like "../../assets/logos/TeamName.png"
  // Resolve from project root
  const logoPath = centerLogo ;

  let logoData = "";
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString("base64");
    const ext = path.extname(logoPath).toLowerCase();
    const mimeType = ext === ".svg" ? "image/svg+xml" : "image/png";
    logoData = `data:${mimeType};base64,${base64Logo}`;
    console.log(`Loaded logo for ${homeTeam} from ${logoPath}`);
  } catch (error) {
    console.warn(`Failed to load logo: ${logoPath}`, error);
    logoData = centerLogo; // Fallback to path
  }
  
  // Replace center ice logo (handles both href and xlink:href)
  svgContent = svgContent.replace(
    /(<image[^>]*id="centerImage"[^>]*(?:xlink:)?href=")[^"]*(")/,
    `$1${logoData}$2`
  );
  
  // Add fill color to the style attribute for left team text
  svgContent = svgContent.replace(
    /(<text[^>]*id="abvLeft"[^>]*style="[^"]*)(")/, 
    `$1fill: ${leftColor};$2`
  );
  
  // Add fill color to the style attribute for right team text
  svgContent = svgContent.replace(
    /(<text[^>]*id="abvRight"[^>]*style="[^"]*)(")/, 
    `$1fill: ${rightColor};$2`
  );
  
  return svgContent;
}

/**
 * Creates a customized rink SVG and saves it to a file
 * @param params - The rink creation parameters
 * @param outputPath - The path where the SVG file should be saved
 */
export function createRinkToFile(params: CreateRinkParams, outputPath: string): void {
  const svgContent = createRink(params);
  fs.writeFileSync(outputPath, svgContent, "utf-8");
}
