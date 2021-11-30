const pico = require("picocolors");

const { getSchemaMap, loadSchema, getDocumentLoaders } = require("./graphql");
const Renderer = require("./renderer");
const Printer = require("./printer");
const {
  checkSchemaChanges,
  saveSchemaHash,
  saveSchemaFile,
} = require("./diff");
const GroupInfo = require("./group-info");

const time = process.hrtime();

module.exports = async function generateDocFromSchema({
  baseURL,
  schemaLocation,
  outputDir,
  linkRoot,
  homepageLocation,
  diffMethod,
  tmpDir,
  loaders,
  groupByDirective,
}) {
  const { loaders: documentLoaders, loaderOptions } =
    getDocumentLoaders(loaders);
  const schema = await loadSchema(schemaLocation, {
    loaders: documentLoaders,
    ...loaderOptions,
  });

  const hasChanged = await checkSchemaChanges(schema, tmpDir, diffMethod);

  if (hasChanged) {
    const rootTypes = getSchemaMap(schema);
    delete rootTypes.directives;
    const { group } = new GroupInfo(rootTypes, groupByDirective);
    const renderer = new Renderer(
      new Printer(schema, baseURL, linkRoot, group),
      outputDir,
      baseURL,
      group,
    );
    const pages = await Promise.all(
      Object.keys(rootTypes).map((typeName) =>
        renderer.renderRootTypes(typeName, rootTypes[typeName]),
      ),
    );
    await renderer.renderHomepage(homepageLocation);
    const sidebarPath = await renderer.renderSidebar();

    const [sec, msec] = process.hrtime(time);
    const duration = (sec + msec / 1e9).toFixed(3);
    console.info(
      pico.green(
        `Documentation successfully generated in "${outputDir}" with base URL "${baseURL}".`,
      ),
    );
    console.log(
      pico.blue(
        `${
          pages.flat().length
        } pages generated in ${duration}s from schema "${schemaLocation}".`,
      ),
    );
    console.info(
      pico.blue(
        pico.bold(
          `Remember to update your Docusaurus site's sidebars with "${sidebarPath}".`,
        ),
      ),
    );

    // create references for checkSchemaChanges
    await saveSchemaHash(schema, tmpDir);
    await saveSchemaFile(schema, tmpDir);
  } else {
    console.info(
      pico.blue(`No changes detected in schema "${schemaLocation}".`),
    );
  }
};
