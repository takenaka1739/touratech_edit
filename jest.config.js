module.exports = {
  verbose: true,
  testRegex: 'resources/ts/.*\\.(test|spec)\\.tsx?$',
  moduleNameMapper: {
    '^@/(.+)': '<rootDir>/resources/ts/$1',
  },
};
