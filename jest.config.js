module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
      'src/**/*.js',
      '!dist/**',
      '!node_modules/**'
    ]
  }
