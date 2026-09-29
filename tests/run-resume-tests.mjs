// Migration parity and layout tests for the Folio-based resume.
//
// Renders the preserved pre-migration pages (tests/baseline/) and the migrated
// pages with the same resume.json, then compares PDFs by words, page geometry,
// and layout invariants. Chromium produces the PDFs; screen and print-media
// layout checks run in every engine listed in RESUME_ENGINES
// (default: chromium,firefox,webkit).
//
// Network: Knockout is served from node_modules (byte-identical to the SRI-pinned
// cdnjs file). The Folio stylesheet is fetched from jsDelivr at the pinned
// commit, or read from a local Folio checkout when FOLIO_ROOT is set. Either
// way the browser enforces the page's SRI hash.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputDir = resolve(root, "test-results");
const manifest = JSON.parse(await readFile(resolve(root, "tests/baseline/manifest.json"), "utf8"));
const engines = {chromium, firefox, webkit};
const selectedEngines = (process.env.RESUME_ENGINES ?? "chromium,firefox,webkit").split(",").map(name => name.trim()).filter(Boolean);

const MM = 72 / 25.4;
const A4 = {width: 595.28, height: 841.89};
const LETTER = {width: 612, height: 792};
const types = {html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", ico: "image/x-icon"};

const knockout = await readFile(resolve(root, "node_modules/knockout/build/output/knockout-latest.js"));
const folioHref = (await readFile(resolve(root, "index.html"), "utf8")).match(/href="(https:\/\/cdn\.jsdelivr\.net\/gh\/kemiller2002\/folio@([0-9a-f]{40})\/src\/styles\/print\.css)"/);
assert.ok(folioHref, "index.html pins the Folio stylesheet to a full commit SHA");
const [, folioUrl, folioSha] = folioHref;
const folioCss = process.env.FOLIO_ROOT
  ? execFileSync("git", ["-C", process.env.FOLIO_ROOT, "show", `${folioSha}:src/styles/print.css`])
  : null;

async function routeAll(page) {
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    const cors = {"access-control-allow-origin": "*"};
    if (url.hostname === "cdnjs.cloudflare.com") return route.fulfill({contentType: types.js, headers: cors, body: knockout});
    if (url.href === folioUrl && folioCss) return route.fulfill({contentType: types.css, headers: cors, body: folioCss});
    if (url.hostname === "cdn.jsdelivr.net") return route.continue();
    if (url.hostname === "resume.test") {
      // Baseline pages fetch resume.json relative to themselves; serve the current data.
      const path = url.pathname === "/tests/baseline/resume.json" ? "resume.json" : url.pathname.slice(1);
      return readFile(resolve(root, path))
        .then(body => route.fulfill({contentType: types[path.split(".").pop()] ?? "application/octet-stream", body}))
        .catch(() => route.fulfill({status: 404, body: ""}));
    }
    return route.fulfill({contentType: "text/css", body: ""});
  });
}

async function open(browser, path, {viewport = {width: 1100, height: 900}, media = "print"} = {}) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => message.type() === "error" && errors.push(message.text()));
  await routeAll(page);
  await page.emulateMedia({media});
  await page.goto(`http://resume.test/${path}`);
  await page.waitForFunction(() => document.body.getAttribute("display") === "true", null, {timeout: 20000});
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
  return {context, page, errors};
}

const pdfText = path => execFileSync("pdftotext", ["-layout", path, "-"], {encoding: "utf8"});
// Hyphen-insensitive tokens: line-break hyphenation depends on installed fonts.
const words = text => text.split(/[\s-]+/).filter(Boolean);
const counts = list => list.reduce((map, word) => map.set(word, (map.get(word) ?? 0) + 1), new Map());
const subtract = (left, right) => [...left].flatMap(([word, count]) => Array(Math.max(0, count - (right.get(word) ?? 0))).fill(word)).sort();

function pdfInfo(path) {
  const info = execFileSync("pdfinfo", [path], {encoding: "utf8"});
  const [, width, height] = info.match(/^Page size:\s+([\d.]+) x ([\d.]+) pts/m) ?? [];
  return {pages: Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0), width: Number(width), height: Number(height)};
}

function wordBoxes(path) {
  const html = execFileSync("pdftotext", ["-bbox", path, "-"], {encoding: "utf8", maxBuffer: 32 * 1024 * 1024});
  return html.split(/<page /).slice(1).flatMap((pageHtml, index) =>
    [...pageHtml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
      .map(([, xMin, yMin, xMax, yMax, text]) => ({page: index + 1, xMin: +xMin, yMin: +yMin, xMax: +xMax, yMax: +yMax, text})));
}

async function exportPdf(page, path) {
  await page.pdf({path, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false});
  return path;
}

function layout() {
  const rect = element => element.getBoundingClientRect();
  const style = element => getComputedStyle(element);
  const overlaps = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  const identity = document.querySelector(".ef-identity");
  const rows = [...document.querySelectorAll(".ef-row")].map(row => {
    const end = row.querySelector(":scope > [data-row-end]");
    const primary = [...row.children].filter(child => child !== end);
    const lineHeight = parseFloat(style(end).lineHeight) || parseFloat(style(end).fontSize) * 1.25;
    return {
      text: row.textContent.replace(/\s+/g, " ").trim().slice(0, 70),
      tracks: style(row).gridTemplateColumns.split(" ").length,
      endAligned: Math.abs(rect(row).right - rect(end).right) < 1.5,
      endSingleLine: rect(end).height <= lineHeight * 1.6,
      collides: primary.some(child => overlaps(rect(child), rect(end))),
      stacked: rect(end).top >= Math.max(...primary.map(child => rect(child).bottom)) - 1
    };
  });
  return {
    folioLoaded: style(document.querySelector(".ef-row")).display === "grid",
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    identityColumns: style(identity).gridTemplateColumns.split(" ").length,
    identityOverlap: overlaps(rect(identity.children[0]), rect(identity.children[1])),
    rows,
    leadWeights: [...document.querySelectorAll(".ef-lead-list > li > strong:first-child")].map(lead => Number(style(lead).fontWeight)),
    gridColumns: [...document.querySelectorAll(".ef-category-grid")].map(grid => new Set([...grid.children].map(child => Math.round(rect(child).left))).size),
    emptyHeadings: [
      ...[...document.querySelectorAll(".ef-category-grid > li")].filter(group => !group.querySelector("ul li")),
      ...[...document.querySelectorAll("section > h2")].map(heading => heading.parentElement).filter(section => ![...section.children].some(child => !child.matches("h2") && child.textContent.trim()))
    ].map(element => element.textContent.replace(/\s+/g, " ").trim())
  };
}

await rm(outputDir, {recursive: true, force: true});
await mkdir(outputDir, {recursive: true});

// Printing must not depend on runtime DOM measurement.
for (const file of ["resume.js", "index.html", "developer.html"]) {
  const source = await readFile(resolve(root, file), "utf8");
  assert.doesNotMatch(source, /getBoundingClientRect|offsetHeight|offsetTop|clientHeight|scrollHeight|ResizeObserver/, `${file} does not measure layout`);
}

const summary = {status: "passed", folio: folioSha, folioSource: folioCss ? "FOLIO_ROOT" : "jsDelivr", variants: {}};
const browser = await chromium.launch();
summary.rendererVersion = browser.version();

for (const [variant, expected] of Object.entries(manifest.variants)) {
  const label = `chromium ${variant}`;
  const baseline = await open(browser, `tests/baseline/${variant}.html`);
  const baselinePdf = await exportPdf(baseline.page, resolve(outputDir, `${variant}-baseline.pdf`));
  await baseline.context.close();

  const migrated = await open(browser, `${variant}.html`);
  assert.deepEqual(migrated.errors, [], `${label}: page loads without errors`);
  const result = await migrated.page.evaluate(layout);
  const migratedPdf = await exportPdf(migrated.page, resolve(outputDir, `${variant}.pdf`));
  await migrated.page.addStyleTag({content: "@page { size: Letter; }"});
  const letterPdf = await exportPdf(migrated.page, resolve(outputDir, `${variant}-letter.pdf`));
  await migrated.context.close();

  assert.equal(result.folioLoaded, true, `${label}: Folio stylesheet loaded and passed SRI`);
  assert.equal(result.overflow, false, `${label}: no horizontal overflow`);
  assert.equal(result.identityColumns, 2, `${label}: name and contact sit side by side in print`);
  assert.equal(result.identityOverlap, false, `${label}: name and contact do not overlap`);
  for (const row of result.rows) {
    assert.equal(row.tracks, 2, `${label}: row keeps its date column: ${row.text}`);
    assert.equal(row.endAligned, true, `${label}: date is right-aligned: ${row.text}`);
    assert.equal(row.endSingleLine, true, `${label}: date stays on one line: ${row.text}`);
    assert.equal(row.collides, false, `${label}: date does not collide with text: ${row.text}`);
  }
  assert.ok(result.leadWeights.every(weight => weight >= 600), `${label}: accomplishment lead phrases are bold`);
  assert.ok(result.gridColumns.every(columns => columns >= 2), `${label}: technology grid keeps multiple columns`);
  assert.deepEqual(result.emptyHeadings, [], `${label}: no empty section or category headings`);

  const baselineInfo = pdfInfo(baselinePdf);
  const migratedInfo = pdfInfo(migratedPdf);
  assert.ok(Math.abs(migratedInfo.width - A4.width) < 2 && Math.abs(migratedInfo.height - A4.height) < 2, `${label}: A4 page size`);
  assert.ok(Math.abs(migratedInfo.pages - baselineInfo.pages) <= 1, `${label}: ${migratedInfo.pages} pages vs baseline ${baselineInfo.pages}`);
  const outside = wordBoxes(migratedPdf).filter(box => box.xMin < 10 * MM - 1 || box.yMin < 10 * MM - 1 || box.xMax > A4.width - 10 * MM + 1 || box.yMax > A4.height - 10 * MM + 1);
  assert.deepEqual(outside.map(box => `${box.page}:${box.text}`), [], `${label}: all text inside the 10 mm margins`);

  const baselineWords = counts(words(pdfText(baselinePdf)));
  const migratedWords = counts(words(pdfText(migratedPdf)));
  assert.deepEqual(subtract(baselineWords, migratedWords), expected.removed.flatMap(words).sort(), `${label}: only intended words removed relative to baseline`);
  assert.deepEqual(subtract(migratedWords, baselineWords), expected.added.flatMap(words).sort(), `${label}: only intended words added relative to baseline`);

  const letterInfo = pdfInfo(letterPdf);
  assert.ok(Math.abs(letterInfo.width - LETTER.width) < 2, `${label}: Letter adaptation applies`);
  assert.deepEqual(subtract(migratedWords, counts(words(pdfText(letterPdf)))), [], `${label}: Letter output loses no words`);

  summary.variants[variant] = {baselinePages: baselineInfo.pages, pages: migratedInfo.pages, letterPages: letterInfo.pages, words: [...migratedWords.values()].reduce((a, b) => a + b, 0)};
}
await browser.close();

for (const engineName of selectedEngines) {
  const engine = await engines[engineName].launch();
  for (const variant of Object.keys(manifest.variants)) {
    for (const width of [320, 390, 430]) {
      const label = `${engineName} ${variant} @${width}px`;
      const view = await open(engine, `${variant}.html`, {viewport: {width, height: 900}, media: "screen"});
      const screen = await view.page.evaluate(layout);
      assert.equal(screen.folioLoaded, true, `${label}: Folio stylesheet loaded`);
      assert.equal(screen.overflow, false, `${label}: no horizontal overflow`);
      assert.equal(screen.identityColumns, 1, `${label}: header stacks`);
      assert.ok(screen.rows.every(row => row.stacked), `${label}: dates move below their text`);
      assert.ok(screen.gridColumns.every(columns => columns === 1), `${label}: grids use one column`);
      await view.page.emulateMedia({media: "print"});
      const print = await view.page.evaluate(layout);
      assert.ok(print.rows.every(row => row.tracks === 2), `${label}: print media restores date columns`);
      assert.equal(print.identityColumns, 2, `${label}: print media restores the header`);
      await view.context.close();
    }
  }
  await engine.close();
}

summary.engines = selectedEngines;
console.log(JSON.stringify(summary, null, 2));
