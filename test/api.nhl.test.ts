import axios from "axios";
import {
  fetchTeamSummaries,
  fetchGameLanding,
  fetchBoxscore,
  fetchPlayByPlay,
  fetchNHLScores,
  fetchGameCenterRightRail,
} from "../src/api/nhl";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("src/api/nhl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTeamSummaries", () => {
    it("fetches team summaries successfully", async () => {
      const mockData = { data: [{ teamId: 1, teamFullName: "New Jersey Devils" }] };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchTeamSummaries();
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId="));
    });

    it("falls back to previous season if current season returns empty data", async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [{ teamId: 1, teamFullName: "New Jersey Devils" }] } });

      const result = await fetchTeamSummaries();
      expect(result).toEqual({ data: [{ teamId: 1, teamFullName: "New Jersey Devils" }] });
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it("throws an error when fetching team summaries fails completely", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      await expect(fetchTeamSummaries()).rejects.toThrow("Network Error");
    });
  });

  describe("fetchGameLanding", () => {
    it("fetches game landing data successfully", async () => {
      const mockData = { id: 2023020001, homeTeam: { abbrev: "NJD" }, awayTeam: { abbrev: "NYR" } };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchGameLanding("2023020001");
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://api-web.nhle.com/v1/gamecenter/2023020001/landing");
    });

    it("throws an error when game landing fetch fails", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      await expect(fetchGameLanding("2023020001")).rejects.toThrow("Network Error");
    });
  });

  describe("fetchBoxscore", () => {
    it("fetches boxscore data successfully", async () => {
      const mockData = { id: 2023020001, playerByGameStats: {} };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchBoxscore("2023020001");
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://api-web.nhle.com/v1/gamecenter/2023020001/boxscore");
    });
  });

  describe("fetchPlayByPlay", () => {
    it("fetches play-by-play events successfully", async () => {
      const mockData = {
        id: 2023020001,
        plays: [
          { eventId: 1, typeDescKey: "goal", periodDescriptor: { number: 1 } },
          { eventId: 2, typeDescKey: "penalty", periodDescriptor: { number: 2 } },
        ],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchPlayByPlay("2023020001");
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://api-web.nhle.com/v1/gamecenter/2023020001/play-by-play");
    });

    it("throws an error when play-by-play fetch fails", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      await expect(fetchPlayByPlay("2023020001")).rejects.toThrow("Network Error");
    });
  });

  describe("fetchNHLScores", () => {
    it("fetches NHL scores successfully", async () => {
      const mockData = { games: [{ id: 2023020001 }] };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchNHLScores("2023-11-20");
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://api-web.nhle.com/v1/score/2023-11-20");
    });
  });

  describe("fetchGameCenterRightRail", () => {
    it("fetches game center right rail data successfully", async () => {
      const mockData = { seasonSeries: [] };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchGameCenterRightRail("2023020001");
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith("https://api-web.nhle.com/v1/gamecenter/2023020001/right-rail");
    });
  });
});
