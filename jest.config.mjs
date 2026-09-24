// jest.config.mjs
export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    moduleNameMapper: {
      '^d3-hockey/dist/d3-hockey.es.js$': '<rootDir>/node_modules/d3-hockey/dist/d3-hockey.umd.js'
    },
  };