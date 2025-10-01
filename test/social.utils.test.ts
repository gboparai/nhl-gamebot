import { Game } from "../src/types";
import {
  shouldRetry,
  getMimeType,
  retryOperation,
  generateGameHashtags,
  validateMediaPaths,
  teamHashtag,
} from "../src/social/utils";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

jest.mock("../src/logger", () => ({
  logObjectToFile: jest.fn(),
}));

const { logObjectToFile } = jest.requireMock("../src/logger") as {
  logObjectToFile: jest.Mock;
};

const fsMock = jest.requireMock("fs") as {
  existsSync: jest.Mock;
};

describe("src/social/utils", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shouldRetry returns true for transient keywords", () => {
    expect(shouldRetry(new Error("Network unreachable"))).toBe(true);
    expect(shouldRetry(new Error("Timeout waiting for response"))).toBe(true);
    expect(shouldRetry(new Error("Rate limit exceeded"))).toBe(true);
  });

  test("shouldRetry returns false for non-transient errors", () => {
    expect(shouldRetry(new Error("fatal failure"))).toBe(false);
    expect(shouldRetry("plain string error")).toBe(false);
  });

  test("getMimeType resolves known types and falls back to jpeg", () => {
    expect(getMimeType("photo.png")).toBe("image/png");
    expect(getMimeType("PHOTO.JPG")).toBe("image/jpeg");
    expect(getMimeType("archive.custom"))
      .toBeUndefined();
  });

  test("retryOperation retries transient failures and succeeds", async () => {
    jest.useFakeTimers();
    const operation = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("network hiccup"))
      .mockResolvedValueOnce("ok");

    const promise = retryOperation(operation, 2, 100, "twitter", "payload");

    await jest.advanceTimersByTimeAsync(100);

    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
    expect(logObjectToFile).toHaveBeenCalledWith("failed-twitter-post", "payload");
    expect(logObjectToFile).toHaveBeenCalledWith("twitter-error", expect.any(Error));

    jest.useRealTimers();
  });

  test("retryOperation throws when retries exhausted or non-retryable", async () => {
    const operation = jest.fn<Promise<void>, []>().mockRejectedValue(new Error("fatal failure"));

    await expect(retryOperation(operation, 1, 100, "bluesky"))
      .rejects.toThrow("fatal failure");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(logObjectToFile).toHaveBeenCalledWith("bluesky-error", expect.any(Error));
  });

  test("generateGameHashtags builds twitter formatted hashtags by default", () => {
    const game = {
      homeTeam: { name: { default: "Vancouver Canucks" }, abbrev: "VAN" },
      awayTeam: { name: { default: "Calgary Flames" }, abbrev: "CGY" },
    } as unknown as Game;

    const result = generateGameHashtags(game, (team) => `#${team.replace(/\s+/g, "")}`);
    expect(result).toBe("\n\n#CGYvsVAN  #VancouverCanucks #CalgaryFlames");
  });

  test("generateGameHashtags builds bluesky formatted hashtags", () => {
    const game = {
      homeTeam: { name: { default: "Vancouver Canucks" }, abbrev: "VAN" },
      awayTeam: { name: { default: "Calgary Flames" }, abbrev: "CGY" },
    } as unknown as Game;

    const result = generateGameHashtags(game, () => "#Team", "bluesky");
    expect(result).toBe("\n\n#CGYvsVAN #Team #Team");
  });

  test("validateMediaPaths filters out non-existent files", () => {
    fsMock.existsSync.mockImplementation((path: string) => path === "valid.png");

    expect(validateMediaPaths(["valid.png", "missing.jpg"]))
      .toEqual(["valid.png"]);

    fsMock.existsSync.mockReset();
  });

  test("teamHashtag returns the mapped hashtag", () => {
    expect(teamHashtag("Canucks")).toBe("#Canucks");
    expect(teamHashtag("Avalanche")).toBe("#GoAvsGo");
  });
});
