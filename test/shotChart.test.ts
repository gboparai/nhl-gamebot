import {
  createShotChart,
  createAndSaveShotChart,
  extractShotEvents,
  ShotEvent,
} from "../src/graphic/shotChart";
import { fetchPlayByPlay } from "../src/api/nhl";
import type { PlayByPlayGame } from "../src/types";
import fs from "fs";
import path from "path";

// Mock the NHL API module
jest.mock("../src/api/nhl");

// Mock logger
jest.mock("../src/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock sharp
jest.mock("sharp", () => {
  return jest.fn(() => ({
    png: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockImplementation((filePath: string) => {
      // Create a minimal PNG file for testing
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // PNG magic bytes followed by minimal data
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      ]);
      fs.writeFileSync(filePath, pngBuffer);
      return Promise.resolve();
    }),
  }));
});

// Mock jsdom and d3-hockey
jest.mock("jsdom", () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {
        createElement: jest.fn().mockReturnValue({
          id: "",
          querySelector: jest.fn().mockReturnValue({
            outerHTML: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>',
          }),
        }),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        },
      },
    },
  })),
}));

jest.mock("d3-hockey", () => ({
  Rink: jest.fn().mockImplementation(() => ({
    render: jest.fn().mockReturnThis(),
    addHeatmap: jest.fn().mockReturnThis(),
    addEvents: jest.fn().mockReturnThis(),
  })),
  colorByCategory: jest.fn().mockReturnValue("#ff0000"),
}));

describe("shotChart", () => {
  const mockGameId = "2023020001";
  const testOutputPath = path.join(__dirname, "../temp/test-shot-chart.png");

  // Sample play-by-play data
  const mockPlayByPlay: Partial<PlayByPlayGame> = {
    id: 2023020001,
    homeTeam: {
      id: 4,
      abbrev: "PHI",
      name: { default: "Philadelphia Flyers" },
      logo: "https://assets.nhle.com/logos/nhl/svg/PHI_light.svg",
      score: 3,
    } as any,
    awayTeam: {
      id: 16,
      abbrev: "CHI",
      name: { default: "Chicago Blackhawks" },
      logo: "https://assets.nhle.com/logos/nhl/svg/CHI_light.svg",
      score: 2,
    } as any,
    plays: [
      {
        eventId: 1,
        periodDescriptor: { number: 1, periodType: "REG" },
        timeInPeriod: "05:23",
        typeDescKey: "shot-on-goal",
        details: {
          xCoord: 840, // 70 feet (840 inches)
          yCoord: 120, // 10 feet (120 inches)
          shotType: "Wrist Shot",
          shootingPlayerId: 8481035,
        },
      } as any,
      {
        eventId: 2,
        periodDescriptor: { number: 1, periodType: "REG" },
        timeInPeriod: "08:15",
        typeDescKey: "goal",
        details: {
          xCoord: 1020, // 85 feet
          yCoord: 60, // 5 feet
          shotType: "Snap Shot",
          shootingPlayerId: 8481519,
        },
      } as any,
      {
        eventId: 3,
        periodDescriptor: { number: 2, periodType: "REG" },
        timeInPeriod: "12:45",
        typeDescKey: "blocked-shot",
        details: {
          xCoord: 720, // 60 feet
          yCoord: -180, // -15 feet
          shotType: "Slap Shot",
          shootingPlayerId: 8482126,
        },
      } as any,
      {
        eventId: 4,
        periodDescriptor: { number: 2, periodType: "REG" },
        timeInPeriod: "15:30",
        typeDescKey: "missed-shot",
        details: {
          xCoord: 780, // 65 feet
          yCoord: 144, // 12 feet
          shotType: "Backhand",
          shootingPlayerId: 8481035,
        },
      } as any,
      {
        eventId: 5,
        periodDescriptor: { number: 1, periodType: "REG" },
        timeInPeriod: "03:00",
        typeDescKey: "faceoff",
        details: {
          xCoord: 0,
          yCoord: 0,
        },
      } as any,
    ],
    rosterSpots: [
      {
        playerId: 8481035,
        firstName: { default: "Connor" },
        lastName: { default: "McDavid" },
        teamId: 4,
      } as any,
      {
        playerId: 8481519,
        firstName: { default: "Leon" },
        lastName: { default: "Draisaitl" },
        teamId: 4,
      } as any,
      {
        playerId: 8482126,
        firstName: { default: "Evan" },
        lastName: { default: "Bouchard" },
        teamId: 16,
      } as any,
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPlayByPlay as jest.Mock).mockResolvedValue(mockPlayByPlay);
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  describe("extractShotEvents", () => {
    it("should extract shot events from play-by-play data", () => {
      const shots = extractShotEvents(mockPlayByPlay as PlayByPlayGame);

      expect(shots).toHaveLength(4);
      expect(shots[0]).toMatchObject({
        coordinates: { x: 70, y: 10 },
        type: "shot",
        shotType: "Wrist Shot",
        period: 1,
        timeInPeriod: "05:23",
      });
      expect(shots[1]).toMatchObject({
        coordinates: { x: 85, y: 5 },
        type: "goal",
        shotType: "Snap Shot",
      });
      expect(shots[2]).toMatchObject({
        coordinates: { x: 60, y: -15 },
        type: "blocked",
      });
      expect(shots[3]).toMatchObject({
        coordinates: { x: 65, y: 12 },
        type: "missed",
      });
    });

    it("should include player names when available", () => {
      const shots = extractShotEvents(mockPlayByPlay as PlayByPlayGame);

      expect(shots[0].player).toBe("Connor McDavid");
      expect(shots[1].player).toBe("Leon Draisaitl");
    });

    it("should filter by home team only", () => {
      const shots = extractShotEvents(mockPlayByPlay as PlayByPlayGame, {
        homeTeamOnly: true,
      });

      // Should only include shots from team ID 4
      expect(shots.length).toBeGreaterThan(0);
      shots.forEach((shot) => {
        expect(["Connor McDavid", "Leon Draisaitl"]).toContain(shot.player);
      });
    });

    it("should filter by away team only", () => {
      const shots = extractShotEvents(mockPlayByPlay as PlayByPlayGame, {
        awayTeamOnly: true,
      });

      // Should only include shots from team ID 16
      expect(shots.length).toBeGreaterThan(0);
      shots.forEach((shot) => {
        expect(shot.player).toBe("Evan Bouchard");
      });
    });

    it("should handle missing coordinates gracefully", () => {
      const playByPlayWithMissing: Partial<PlayByPlayGame> = {
        ...mockPlayByPlay,
        plays: [
          {
            eventId: 1,
            periodDescriptor: { number: 1, periodType: "REG" },
            timeInPeriod: "05:23",
            typeDescKey: "shot-on-goal",
            details: {
              // Missing xCoord and yCoord
              shotType: "Wrist Shot",
            },
          } as any,
        ],
      };

      const shots = extractShotEvents(playByPlayWithMissing as PlayByPlayGame);
      expect(shots).toHaveLength(0);
    });
  });

  describe("createShotChart", () => {
    it("should create a shot chart PNG file", async () => {
      await createShotChart(mockGameId, testOutputPath);

      expect(fetchPlayByPlay).toHaveBeenCalledWith(mockGameId);
      expect(fs.existsSync(testOutputPath)).toBe(true);

      // Verify it's a PNG file by checking the magic bytes
      const content = fs.readFileSync(testOutputPath);
      expect(content[0]).toBe(0x89); // PNG magic byte
      expect(content[1]).toBe(0x50); // PNG magic byte
      expect(content[2]).toBe(0x4e); // PNG magic byte
      expect(content[3]).toBe(0x47); // PNG magic byte
    });

    it("should create chart with heatmap by default", async () => {
      await createShotChart(mockGameId, testOutputPath);

      const content = fs.readFileSync(testOutputPath);
      expect(content[0]).toBe(0x89); // PNG file
    });

    it("should create chart without heatmap when disabled", async () => {
      await createShotChart(mockGameId, testOutputPath, {
        includeHeatmap: false,
      });

      expect(fs.existsSync(testOutputPath)).toBe(true);
      const content = fs.readFileSync(testOutputPath);
      expect(content[0]).toBe(0x89); // PNG file
    });

    it("should create chart with shots only", async () => {
      await createShotChart(mockGameId, testOutputPath, {
        includeHeatmap: false,
        includeShots: true,
      });

      expect(fs.existsSync(testOutputPath)).toBe(true);
      const content = fs.readFileSync(testOutputPath);
      expect(content[0]).toBe(0x89); // PNG file
    });

    it("should create chart for home team only", async () => {
      await createShotChart(mockGameId, testOutputPath, {
        homeTeamOnly: true,
      });

      expect(fs.existsSync(testOutputPath)).toBe(true);
    });

    it("should create chart for away team only", async () => {
      await createShotChart(mockGameId, testOutputPath, {
        awayTeamOnly: true,
      });

      expect(fs.existsSync(testOutputPath)).toBe(true);
    });

    it("should create output directory if it doesn't exist", async () => {
      const nestedPath = path.join(
        __dirname,
        "../temp/nested/dir/shot-chart.png"
      );

      try {
        await createShotChart(mockGameId, nestedPath);
        expect(fs.existsSync(nestedPath)).toBe(true);
      } finally {
        // Clean up nested directories
        if (fs.existsSync(nestedPath)) {
          fs.unlinkSync(nestedPath);
          fs.rmdirSync(path.dirname(nestedPath));
          fs.rmdirSync(path.dirname(path.dirname(nestedPath)));
        }
      }
    });

    it("should handle custom bandwidth and opacity", async () => {
      await createShotChart(mockGameId, testOutputPath, {
        bandwidth: 10,
        maxOpacity: 0.9,
      });

      expect(fs.existsSync(testOutputPath)).toBe(true);
    });

    it("should handle games with no shots gracefully", async () => {
      const emptyPlayByPlay: Partial<PlayByPlayGame> = {
        ...mockPlayByPlay,
        plays: [
          {
            eventId: 1,
            typeDescKey: "faceoff",
            details: {},
          } as any,
        ],
      };

      (fetchPlayByPlay as jest.Mock).mockResolvedValue(emptyPlayByPlay);

      await createShotChart(mockGameId, testOutputPath);

      // Should not throw, but also shouldn't create a file
      expect(fs.existsSync(testOutputPath)).toBe(false);
    });

    it("should handle API errors gracefully", async () => {
      (fetchPlayByPlay as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      await expect(
        createShotChart(mockGameId, testOutputPath)
      ).rejects.toThrow("API Error");
    });
  });

  describe("createAndSaveShotChart", () => {
    it("should create shot chart with default filename", async () => {
      const outputPath = await createAndSaveShotChart(mockGameId);

      expect(outputPath).toContain("temp");
      expect(outputPath).toContain(`shot-chart-${mockGameId}.png`);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

    it("should pass options to createShotChart", async () => {
      const outputPath = await createAndSaveShotChart(mockGameId, {
        includeHeatmap: true,
        homeTeamOnly: true,
        bandwidth: 8,
      });

      expect(fs.existsSync(outputPath)).toBe(true);

      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

    it("should return the output path", async () => {
      const outputPath = await createAndSaveShotChart(mockGameId);

      expect(typeof outputPath).toBe("string");
      expect(path.isAbsolute(outputPath)).toBe(true);

      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });
  });
});
