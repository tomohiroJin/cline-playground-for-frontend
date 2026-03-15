module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // jsdom がリソースを解放しない問題への対処
  forceExit: true,
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/features/primal-path/__tests__/helpers/jest-matchers.ts',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(mp4|webm|ogg|mp3|wav)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/test-helpers\\.ts$', '/__tests__/helpers/(?!.*\\.test\\.ts)', '/__tests__/mocks/', '<rootDir>/scripts/', '<rootDir>/e2e/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/index.tsx',
    '!src/setupTests.ts'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 45,
      lines: 50,
      statements: 50
    },
    './src/features/primal-path/domain/': {
      branches: 70,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
