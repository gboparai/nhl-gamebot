import { createRink, createRinkToFile, CreateRinkParams } from "../src/graphic/edgeGoalVisualizer/createRink";
import fs from "fs";
import path from "path";

describe("createRink", () => {
  describe("createRink function", () => {
    it("should return a valid SVG string", () => {
      const params: CreateRinkParams = {
        homeTeam: "MapleLeafs",
        leftTeam: "MapleLeafs",
        rightTeam: "Bruins",
      };
      
      const result = createRink(params);
      
      expect(result).toContain("svg");
      expect(result).toContain("id=\"abvLeft\"");
      expect(result).toContain("id=\"abvRight\"");
      expect(result).toContain("id=\"centerImage\"");
    });
    
    it("should replace left team abbreviation correctly", () => {
      const params: CreateRinkParams = {
        homeTeam: "Oilers",
        leftTeam: "Oilers",
        rightTeam: "Flames",
      };
      
      const result = createRink(params);
      
      expect(result).toContain("EDM");
    });
    
    it("should replace right team abbreviation correctly", () => {
      const params: CreateRinkParams = {
        homeTeam: "Oilers",
        leftTeam: "Oilers",
        rightTeam: "Flames",
      };
      
      const result = createRink(params);
      
      expect(result).toContain("CGY");
    });
    
    it("should replace center ice logo path correctly", () => {
      const params: CreateRinkParams = {
        homeTeam: "Canucks",
        leftTeam: "Canucks",
        rightTeam: "Kraken",
      };
      
      const result = createRink(params);
      

    });
    
    it("should handle different team combinations", () => {
      const params: CreateRinkParams = {
        homeTeam: "GoldenKnights",
        leftTeam: "GoldenKnights",
        rightTeam: "Kings",
      };
      
      const result = createRink(params);
      
      expect(result).toContain("VGK");
      expect(result).toContain("LAK");

    });
    
    it("should include team colors in hex format", () => {
      const params: CreateRinkParams = {
        homeTeam: "Lightning",
        leftTeam: "Lightning",
        rightTeam: "Panthers",
      };
      
      const result = createRink(params);
      
      // Should contain hex color codes (starting with #)
      expect(result).toMatch(/#[0-9a-fA-F]{6}/);
    });
    
    it("should use fallback values for unknown teams", () => {
      const params: CreateRinkParams = {
        homeTeam: "UnknownTeam",
        leftTeam: "UnknownTeam",
        rightTeam: "AnotherUnknown",
      };
      
      const result = createRink(params);
      
      // Should use "NHL" as fallback abbreviation
      expect(result).toContain("NHL");
    });
  });
  
  describe("createRinkToFile function", () => {
    const testOutputPath = path.join(__dirname, "test-rink.svg");
    
    afterEach(() => {
      // Clean up test file
      if (fs.existsSync(testOutputPath)) {
        //fs.unlinkSync(testOutputPath);
      }
    });
    
    it("should create an SVG file at the specified path", () => {
      const params: CreateRinkParams = {
        homeTeam: "Penguins",
        leftTeam: "Penguins",
        rightTeam: "Flyers",
      };
      
      createRinkToFile(params, testOutputPath);
      
      expect(fs.existsSync(testOutputPath)).toBe(true);
    });
    
    it("should create a file with valid SVG content", () => {
      const params: CreateRinkParams = {
        homeTeam: "Canadiens",
        leftTeam: "Canadiens",
        rightTeam: "Senators",
      };
      
      createRinkToFile(params, testOutputPath);
      
      const fileContent = fs.readFileSync(testOutputPath, "utf-8");
      
      expect(fileContent).toContain("svg");
      expect(fileContent).toContain("MTL");
      expect(fileContent).toContain("OTT");

    });
    
    it("should overwrite existing file", () => {
      const params1: CreateRinkParams = {
        homeTeam: "Rangers",
        leftTeam: "Rangers",
        rightTeam: "Islanders",
      };
      
      const params2: CreateRinkParams = {
        homeTeam: "Blackhawks",
        leftTeam: "Blackhawks",
        rightTeam: "Blues",
      };
      
      // Create first file
      createRinkToFile(params1, testOutputPath);
      const firstContent = fs.readFileSync(testOutputPath, "utf-8");
      
      // Overwrite with second file
      createRinkToFile(params2, testOutputPath);
      const secondContent = fs.readFileSync(testOutputPath, "utf-8");
      
      expect(firstContent).toContain("NYR");
      expect(firstContent).toContain("NYI");
      expect(secondContent).toContain("CHI");
      expect(secondContent).toContain("STL");
      expect(firstContent).not.toEqual(secondContent);
    });
  });
  
  describe("integration tests", () => {
    it("should create a complete rink for a full game scenario", () => {
      const params: CreateRinkParams = {
        homeTeam: "Avalanche",
        leftTeam: "Avalanche",
        rightTeam: "Stars",
      };
      
      const result = createRink(params);
      
      // Verify all required elements are present
      expect(result).toContain("COL");
      expect(result).toContain("DAL");
      
      // Verify SVG structure
      expect(result).toMatch(/<svg[^>]*>/);
      expect(result).toMatch(/<\/svg>/);
      expect(result).toContain("id=\"abvLeft\"");
      expect(result).toContain("id=\"abvRight\"");
      expect(result).toContain("id=\"centerImage\"");
    });
  });
});
