import type { Config } from 'jest';

export function createConfig(testType: string, title: string): Config {
  return {
    testTimeout: 600000,
    displayName: title,
    modulePathIgnorePatterns: ["__tests__/__snapshots__/"],
    transform: { ".(ts)": "ts-jest" },
    testRegex: "(test|spec)\\.ts$",
    moduleFileExtensions: ["ts", "js"],
    testPathIgnorePatterns: ["<rootDir>/__tests__/__results__"],
    testEnvironment: "node",
    collectCoverage: testType.toLowerCase() === "unit",
    coverageReporters: ["json", "lcov", "text", "cobertura"],
    coverageDirectory: `__tests__/__results__/${testType}/coverage`,
    collectCoverageFrom: [
      "src/**/*.ts",
      "!**/__tests__/**",
      "!**/index.ts",
      "!**/main.ts"
    ],
    reporters: [
      "default",
      ["jest-junit", {
        outputFile: `__tests__/__results__/${testType}/junit.xml`,
        ancestorSeparator: " > ",
        classNameTemplate: `${testType}.{classname}`,
        title: "{title}"
      }],
      ["jest-stare", {
        resultDir: `__tests__/__results__/${testType}/jest-stare`,
        coverageLink: "../coverage/lcov-report/index.html",
        resultHtml: "index.html"
      }],
      ["jest-html-reporter", {
        pageTitle: title,
        outputPath: `__tests__/__results__/${testType}/results.html`,
        includeFailureMsg: true
      }],
    ],
  };
}