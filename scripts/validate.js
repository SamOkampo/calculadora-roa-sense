const { validateProjectSite } = require("./lib/site-utils");

const errors = validateProjectSite();

if (errors.length > 0) {
  console.error("Validación fallida:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Validación OK: rutas, sitemap y referencias locales coherentes.");
