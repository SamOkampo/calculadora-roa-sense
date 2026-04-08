const fs = require("node:fs");
const path = require("node:path");

const TESTS_DIR = __dirname;

function loadTestFiles() {
  return fs
    .readdirSync(TESTS_DIR)
    .filter((file) => file.endsWith(".test.js"))
    .sort();
}

async function main() {
  const failures = [];
  let passed = 0;

  for (const testFile of loadTestFiles()) {
    const fullPath = path.join(TESTS_DIR, testFile);
    const suite = require(fullPath);

    for (const testCase of suite) {
      try {
        await testCase.run();
        passed += 1;
        console.log(`PASS ${testFile} :: ${testCase.name}`);
      } catch (error) {
        failures.push({ file: testFile, name: testCase.name, error });
        console.error(`FAIL ${testFile} :: ${testCase.name}`);
        console.error(error && error.stack ? error.stack : error);
      }
    }
  }

  console.log(`\nResumen: ${passed} OK, ${failures.length} fallos`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
