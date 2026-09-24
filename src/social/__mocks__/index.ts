// src/social/__mocks__/index.ts
export const postToAll = jest.fn();
export const socialProviders = {
  twitter: { post: jest.fn() },
  bluesky: { post: jest.fn() },
  threads: { post: jest.fn() },
  telegram: { post: jest.fn() },
  discord: { post: jest.fn() }
};
