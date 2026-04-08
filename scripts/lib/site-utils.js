const fs = require("node:fs");
const path = require("node:path");
const {
  PROJECT_ROOT,
  HTML_FILES,
  STATIC_FILES,
  STATIC_DIRECTORIES,
} = require("./site-config");

const ABSOLUTE_URL_RE = /^(?:[a-z]+:)?\/\//i;
const NON_FILE_REFS = ["mailto:", "tel:", "javascript:", "data:"];

function readText(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

function toProjectPathFromSiteUrl(sitePathname) {
  if (!sitePathname || sitePathname === "/") {
    return "index.html";
  }

  if (sitePathname.endsWith("/")) {
    return path.join(sitePathname.slice(1), "index.html");
  }

  return sitePathname.startsWith("/") ? sitePathname.slice(1) : sitePathname;
}

function resolveLocalReference(fromFile, rawReference) {
  if (!rawReference) {
    return null;
  }

  if (ABSOLUTE_URL_RE.test(rawReference) || NON_FILE_REFS.some((prefix) => rawReference.startsWith(prefix))) {
    return null;
  }

  const withoutFragment = rawReference.split("#")[0].split("?")[0];
  if (!withoutFragment) {
    return toProjectPathFromSiteUrl("/");
  }

  if (withoutFragment.startsWith("/")) {
    return toProjectPathFromSiteUrl(withoutFragment);
  }

  const baseDirectory = path.dirname(fromFile);
  const resolved = path.normalize(path.join(baseDirectory, withoutFragment));
  return resolved;
}

function extractFileReferences(html) {
  const matches = [];
  const attrRegex = /\b(?:href|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = attrRegex.exec(html))) {
    matches.push(match[1]);
  }
  return matches;
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relativePath));
}

function validateHtmlReferences(relativePath) {
  const html = readText(relativePath);
  const refs = extractFileReferences(html);
  const errors = [];

  for (const ref of refs) {
    const target = resolveLocalReference(relativePath, ref);
    if (!target) {
      continue;
    }

    if (!fileExists(target)) {
      errors.push(`${relativePath} -> ${ref} (esperaba ${target})`);
    }
  }

  return errors;
}

function extractSitemapUrls(xml) {
  const urls = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml))) {
    urls.push(match[1]);
  }
  return urls;
}

function validateSitemap() {
  const xml = readText("sitemap.xml");
  const urls = extractSitemapUrls(xml);
  const errors = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const projectPath = toProjectPathFromSiteUrl(parsed.pathname);
      if (!fileExists(projectPath)) {
        errors.push(`sitemap.xml -> ${url} (esperaba ${projectPath})`);
      }
    } catch (error) {
      errors.push(`sitemap.xml -> URL inválida: ${url}`);
    }
  }

  return errors;
}

function validateProjectSite() {
  const errors = [];

  for (const htmlFile of HTML_FILES) {
    if (!fileExists(htmlFile)) {
      errors.push(`Falta el archivo HTML ${htmlFile}`);
      continue;
    }
    errors.push(...validateHtmlReferences(htmlFile));
  }

  for (const staticFile of STATIC_FILES) {
    if (!fileExists(staticFile)) {
      errors.push(`Falta el archivo estático ${staticFile}`);
    }
  }

  for (const staticDirectory of STATIC_DIRECTORIES) {
    if (!fileExists(staticDirectory)) {
      errors.push(`Falta el directorio estático ${staticDirectory}`);
    }
  }

  errors.push(...validateSitemap());
  return errors;
}

function ensureDirectory(targetDirectory) {
  fs.mkdirSync(targetDirectory, { recursive: true });
}

function copyFileToDist(relativePath, distRoot) {
  const source = path.join(PROJECT_ROOT, relativePath);
  const destination = path.join(distRoot, relativePath);
  ensureDirectory(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function copyDirectoryToDist(relativeDirectory, distRoot) {
  const source = path.join(PROJECT_ROOT, relativeDirectory);
  const destination = path.join(distRoot, relativeDirectory);
  fs.cpSync(source, destination, { recursive: true });
}

module.exports = {
  readText,
  validateProjectSite,
  copyFileToDist,
  copyDirectoryToDist,
  toProjectPathFromSiteUrl,
};
