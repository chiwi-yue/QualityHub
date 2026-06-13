/** @type {import('jest').Config} */
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testMatch: ['**/contract/**/*.spec.ts'],
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: { module: 'ESNext', moduleResolution: 'bundler' },
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
