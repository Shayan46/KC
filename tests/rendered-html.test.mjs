import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePaths = [
  path.join(root, "index.html"),
  path.join(root, "public", "koundinya-capital.html"),
];

const readPages = () => Promise.all(pagePaths.map(page => readFile(page, "utf8")));

test("ships complete, accessible static pages", async () => {
  const pages = await readPages();

  for (const html of pages) {
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<html lang="en"/i);
    assert.match(html, /<meta name="viewport"/i);
    assert.match(html, /<meta name="description"/i);
    assert.match(html, /class="skip-link" href="#main-content"/i);
    assert.match(html, /<main id="main-content">/i);
    assert.match(html, /id="mobile-navigation"[^>]*aria-hidden="true"[^>]*inert/i);
    assert.match(html, /<section id="testimonials" hidden>/i);
    assert.match(html, /<canvas id="hero-canvas" aria-hidden="true"><\/canvas>/i);
    assert.doesNotMatch(html, /\b(?:src|href)=""/i);
    assert.doesNotMatch(html, /console\.(?:log|warn|error)/i);
    assert.doesNotMatch(html, /\.png["']/i);
    assert.doesNotMatch(html, /Mumbai/i);

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, "page IDs must be unique");

    const images = [...html.matchAll(/<img\b[^>]*>/gis)].map(match => match[0]);
    assert.equal(images.length, 4);
    for (const image of images) {
      assert.match(image, /\bwidth="\d+"/i);
      assert.match(image, /\bheight="\d+"/i);
      assert.match(image, /\bdecoding="async"/i);
    }
    assert.equal(images.filter(image => /\bloading="lazy"/i.test(image)).length, 3);

    assert.match(html, /class="contact-form[^"]*"[\s\S]*?target="google-enquiry-submit"/i);
    assert.match(html, /name="google-enquiry-submit"/i);
    assert.match(html, /class="newsletter-form"[\s\S]*?target="google-newsletter-submit"/i);
    assert.match(html, /name="google-newsletter-submit"/i);
  }
});

test("keeps both deployment entry points synchronized", async () => {
  const [rootHtml, publicHtml] = await readPages();
  assert.equal(rootHtml.replaceAll('"public/', '"'), publicHtml);
});

test("references existing local assets and keeps image payload lean", async () => {
  const pages = await readPages();
  const imageAssets = new Set();

  for (let index = 0; index < pages.length; index += 1) {
    const html = pages[index];
    const base = path.dirname(pagePaths[index]);
    const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
      .map(match => match[1])
      .filter(reference => !/^(?:#|https?:|mailto:|tel:|data:)/i.test(reference));

    for (const reference of references) {
      const assetPath = path.resolve(base, reference);
      await access(assetPath);
      if (reference.endsWith(".webp")) imageAssets.add(assetPath);
    }
  }

  let imageBytes = 0;
  for (const assetPath of imageAssets) imageBytes += (await stat(assetPath)).size;
  assert.ok(imageBytes < 400_000, `optimized images total ${imageBytes} bytes`);
});
