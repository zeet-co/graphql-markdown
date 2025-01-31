const path = require("path");
const { promises: fs } = require("fs");

const cli = require("../../helpers/cli");

const rootDir = "/docusaurus2";

const pluginConfig = require(`${rootDir}/docusaurus2-graphql-doc-generator.config.js`);

const docsDir = path.resolve(
  rootDir,
  pluginConfig.rootPath,
  pluginConfig.baseURL,
);

const messageGenerated = [
  `Documentation successfully generated in "${path.join(
    pluginConfig.rootPath,
    pluginConfig.baseURL,
  )}" with base URL "${pluginConfig.baseURL}".`,
  `{Any<Number>} pages generated in {Any<Number>}s from schema "${pluginConfig.schema}".`,
  `Remember to update your Docusaurus site's sidebars with "${path.join(
    pluginConfig.rootPath,
    pluginConfig.baseURL,
    "sidebar-schema.js",
  )}".`,
];

const messageNoUpdate = [
  `No changes detected in schema "${pluginConfig.schema}".`,
];

describe("graphql-to-doc", () => {
  beforeAll(async () => {
    fs.mkdir(docsDir, { recursive: true });
  });

  test("should return 0 with generated message when completed as first run", async () => {
    const generateOutput = await cli();
    expect(generateOutput).toMatchObject({
      code: 0,
      error: null,
      stderr: "",
      stdout: expect.any(String),
    });
    const stdout = generateOutput.stdout.replace(/\d+\.?\d*/g, "{Any<Number>}");
    messageGenerated.forEach((message) => expect(stdout).toMatch(message));
  }, 60000);

  test("should return 0 with generated message when schema unchanged", async () => {
    const generateOutput = await cli();
    expect(generateOutput).toHaveProperty("code", 0);

    const updateOutput = await cli();
    expect(updateOutput).toMatchObject({
      code: 0,
      error: null,
      stderr: "",
      stdout: expect.any(String),
    });
    const stdout = generateOutput.stdout.replace(/\d+\.?\d*/g, "{Any<Number>}");
    messageNoUpdate.forEach((message) => expect(stdout).toMatch(message));
  }, 60000);

  test("should return 0 with updated message when completed with force flag", async () => {
    const generateOutput = await cli();
    expect(generateOutput).toHaveProperty("code", 0);

    const updateOutput = await cli();
    expect(updateOutput).toHaveProperty("code", 0);

    const forceOutput = await cli(["--force"]);
    expect(forceOutput).toMatchObject({
      code: 0,
      error: null,
      stderr: "",
      stdout: expect.any(String),
    });
    const stdout = generateOutput.stdout.replace(/\d+\.?\d*/g, "{Any<Number>}");
    messageNoUpdate.forEach((message) => expect(stdout).toMatch(message));
  }, 60000);
});
