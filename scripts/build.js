const fs = require("node:fs");
const path = require("node:path");
const {
  DIST_DIR,
  HTML_FILES,
  STATIC_FILES,
  STATIC_DIRECTORIES,
} = require("./lib/site-config");
const {
  validateProjectSite,
  copyFileToDist,
  copyDirectoryToDist,
} = require("./lib/site-utils");

const errors = validateProjectSite();

if (errors.length > 0) {
  console.error("Build abortado. Se encontraron referencias o archivos inválidos:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

for (const htmlFile of HTML_FILES) {
  copyFileToDist(htmlFile, DIST_DIR);
}

for (const staticFile of STATIC_FILES) {
  copyFileToDist(staticFile, DIST_DIR);
}

for (const staticDirectory of STATIC_DIRECTORIES) {
  copyDirectoryToDist(staticDirectory, DIST_DIR);
}

console.log(`Build completado en ${DIST_DIR}`);
