import { renderTrackingFrame, renderTrackingFrameToFile } from "../src/graphic/edgeGoalVisualizer/renderTrackingFrame";
import type { TrackingFrame } from "../src/graphic/edgeGoalVisualizer/renderTrackingFrame";
import fs from "fs";
import path from "path";

describe("renderTrackingFrame", () => {
  const exampleFrame: TrackingFrame = {
    timeStamp: 17665486489,
    onIce: {
      "4033": {
        id: 4033,
        playerId: 8481035,
        x: 2226.915,
        y: 538.7071,
        sweaterNumber: 33,
        teamId: 4,
        teamAbbrev: "PHI",
      },
      "16030": {
        id: 16030,
        playerId: 8481519,
        x: 188.2515,
        y: 513.7416,
        sweaterNumber: 30,
        teamId: 16,
        teamAbbrev: "CHI",
      },
      "4036": {
        id: 4036,
        playerId: 8482126,
        x: 1691.2697,
        y: 897.0882,
        sweaterNumber: 36,
        teamId: 4,
        teamAbbrev: "PHI",
      },
      "16055": {
        id: 16055,
        playerId: 8484783,
        x: 1589.929,
        y: 968.812,
        sweaterNumber: 55,
        teamId: 16,
        teamAbbrev: "CHI",
      },
      "4027": {
        id: 4027,
        playerId: 8480220,
        x: 1555.0546,
        y: 868.1815,
        sweaterNumber: 27,
        teamId: 4,
        teamAbbrev: "PHI",
      },
      "4010": {
        id: 4010,
        playerId: 8481553,
        x: 1417.6001,
        y: 199.6576,
        sweaterNumber: 10,
        teamId: 4,
        teamAbbrev: "PHI",
      },
      "16008": {
        id: 16008,
        playerId: 8477987,
        x: 1469.923,
        y: 988.9761,
        sweaterNumber: 8,
        teamId: 16,
        teamAbbrev: "CHI",
      },
      "4009": {
        id: 4009,
        playerId: 8482142,
        x: 1700.3916,
        y: 533.6656,
        sweaterNumber: 9,
        teamId: 4,
        teamAbbrev: "PHI",
      },
      "16028": {
        id: 16028,
        playerId: 8477444,
        x: 1322.3187,
        y: 208.8385,
        sweaterNumber: 28,
        teamId: 16,
        teamAbbrev: "CHI",
      },
      "16048": {
        id: 16048,
        playerId: 8476891,
        x: 1444.4981,
        y: 450.8508,
        sweaterNumber: 48,
        teamId: 16,
        teamAbbrev: "CHI",
      },
      "1": {
        id: 1,
        playerId: "",
        x: 1624.3138,
        y: 992.6984,
        sweaterNumber: "",
        teamId: "",
        teamAbbrev: "",
      },
    },
  };

  it("should render a tracking frame with all players and puck", () => {
    const svg = renderTrackingFrame(
      {
        homeTeam: "Flyers",
        leftTeam: "PHI",
        rightTeam: "CHI",
      },
      exampleFrame
    );

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("trackingFrame");
    
    // Check for player numbers
    expect(svg).toContain(">33<");
    expect(svg).toContain(">30<");
    expect(svg).toContain(">55<");
  });

  it("should render puck as a black circle", () => {
    const svg = renderTrackingFrame(
      {
        homeTeam: "Flyers",
        leftTeam: "PHI",
        rightTeam: "CHI",
      },
      exampleFrame
    );

    // Puck should have black fill
    expect(svg).toContain('fill="#000000"');
  });

  it("should highlight a specific player", () => {
    const svg = renderTrackingFrame(
      {
        homeTeam: "Flyers",
        leftTeam: "PHI",
        rightTeam: "CHI",
      },
      exampleFrame,
      {
        highlightPlayerId: 8482142, // Player #9
      }
    );

    expect(svg).toContain("<svg");
    // Should have extra circle for highlight
    const circleCount = (svg.match(/<circle/g) || []).length;
    expect(circleCount).toBeGreaterThan(11); // 11 entities + highlight circle
  });

  it("should position entities at correct coordinates", () => {
    const svg = renderTrackingFrame(
      {
        homeTeam: "Flyers",
        leftTeam: "PHI",
        rightTeam: "CHI",
      },
      exampleFrame
    );

    // Check that player positions are included
    expect(svg).toContain("translate(2226.915px, 538.7071px)");
    expect(svg).toContain("translate(188.2515px, 513.7416px)");
    expect(svg).toContain("translate(1624.3138px, 992.6984px)"); // Puck
  });

  describe("renderTrackingFrameToFile", () => {
    const testOutputPath = path.join(__dirname, "../temp/test-tracking-frame.svg");

    afterEach(() => {
      if (fs.existsSync(testOutputPath)) {
        fs.unlinkSync(testOutputPath);
      }
    });

    it("should create a file with tracking frame", () => {
      renderTrackingFrameToFile(
        {
          homeTeam: "Flyers",
          leftTeam: "PHI",
          rightTeam: "CHI",
        },
        exampleFrame,
        testOutputPath
      );

      expect(fs.existsSync(testOutputPath)).toBe(true);
      const content = fs.readFileSync(testOutputPath, "utf-8");
      expect(content).toContain("trackingFrame");
      expect(content).toContain(">33<");
    });

    it("should create a file with highlighted player", () => {
      renderTrackingFrameToFile(
        {
          homeTeam: "Flyers",
          leftTeam: "PHI",
          rightTeam: "CHI",
        },
        exampleFrame,
        testOutputPath,
        {
          highlightPlayerId: 8484783, // Player #55 (goal scorer)
        }
      );

      expect(fs.existsSync(testOutputPath)).toBe(true);
      const content = fs.readFileSync(testOutputPath, "utf-8");
      expect(content).toContain("trackingFrame");
    });
  });
});
