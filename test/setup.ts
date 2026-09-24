import { logger } from "../src/logger";

jest.mock("../src/social/twitter", () => ({
  postToTwitter: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/social/bluesky", () => ({
  postToBluesky: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/social/threads", () => ({
  postToThreads: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/social/telegram", () => ({
  postToTelegram: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/social/discord", () => ({
  postToDiscord: jest.fn().mockResolvedValue(true),
}));

// Mock logger globally
jest.mock("../src/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
