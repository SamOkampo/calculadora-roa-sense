const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

const HTML_FILES = [
  "index.html",
  "404.html",
  "terminos.html",
  "privacidad.html",
  "cuanto-debo-cobrar/index.html",
  "salario-neto-colombia/index.html",
  "costo-empleado-colombia/index.html",
  "punto-de-equilibrio/index.html",
];

const STATIC_FILES = [
  "CNAME",
  "robots.txt",
  "sitemap.xml",
  "f7f8a2d9-2f97-4a19-9c80-2f9cf10d48ea.txt",
];

const STATIC_DIRECTORIES = [
  "assets",
];

module.exports = {
  PROJECT_ROOT,
  DIST_DIR,
  HTML_FILES,
  STATIC_FILES,
  STATIC_DIRECTORIES,
};
