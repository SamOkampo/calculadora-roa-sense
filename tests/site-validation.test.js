const assert = require("node:assert/strict");
const { validateProjectSite } = require("../scripts/lib/site-utils");

module.exports = [
  {
    name: "el sitio mantiene rutas locales, assets y sitemap coherentes",
    run() {
      const errors = validateProjectSite();
      assert.deepStrictEqual(errors, []);
    },
  },
];
