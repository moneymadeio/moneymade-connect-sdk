// module.exports = {
//   testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
// 	testPathIgnorePatterns: ['lib/', 'node_modules/'],
// 	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
// 	testEnvironment: 'node',
// 	rootDir: './',
// 	testTimeout: 10000,
// }


module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
	testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}