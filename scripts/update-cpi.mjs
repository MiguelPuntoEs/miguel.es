#!/usr/bin/env node
// Updates public/cpi.json from the OECD SDMX API.
// Series: annual CPI, all items, national methodology, index (2015=100).
// New observations are merged into the existing file: fresh API values win on
// overlapping years, and historical years the API no longer serves (e.g. GBR
// before 1973) are preserved. Run: node scripts/update-cpi.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "cpi.json");
const existing = JSON.parse(readFileSync(outPath, "utf8"));
const codes = Object.keys(existing);

// The API silently truncates large responses, so query in small chunks.
const CHUNK_SIZE = 8;
const chunks = [];
for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
  chunks.push(codes.slice(i, i + CHUNK_SIZE));
}

const merged = {};
for (const code of codes) {
  merged[code] = new Map(existing[code].map((e) => [e.year, e.value]));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The OECD API intermittently returns 500 for valid queries; retry with backoff.
async function fetchWithRetry(url, attempts = 5) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "cpi-updater (miguel.es)" } });
      if (res.ok) return res.json();
      if (attempt >= attempts) throw new Error(`OECD API returned ${res.status}`);
      console.warn(`Attempt ${attempt} got ${res.status}, retrying...`);
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 30000 * attempt);
        continue;
      }
    } catch (err) {
      if (attempt >= attempts) throw err;
      console.warn(`Attempt ${attempt} failed (${err.message}), retrying...`);
    }
    await sleep(3000 * attempt);
  }
}

function keyURL(codes) {
  return (
    "https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/" +
    `${codes.join("+")}.A.N.CPI.IX._T.N._Z?format=jsondata&startPeriod=1950`
  );
}

let fetched = 0;
function mergeResponse({ data }) {
  const structure = data.structures?.[0] ?? data.structure;
  const seriesDims = structure.dimensions.series;
  const refAreaIndex = seriesDims.findIndex((d) => d.id === "REF_AREA");
  const refAreas = seriesDims[refAreaIndex].values.map((v) => v.id);
  const years = structure.dimensions.observation[0].values.map((v) => Number(v.id));

  for (const [key, series] of Object.entries(data.dataSets[0].series ?? {})) {
    const code = refAreas[Number(key.split(":")[refAreaIndex])];
    if (!merged[code]) continue;
    for (const [i, v] of Object.entries(series.observations)) {
      const year = years[Number(i)];
      const value = v[0];
      if (Number.isFinite(year) && Number.isFinite(value)) {
        merged[code].set(year, value);
        fetched++;
      }
    }
  }
}

const failed = [];
for (const chunk of chunks) {
  try {
    mergeResponse(await fetchWithRetry(keyURL(chunk)));
  } catch {
    // Fall back to one request per country; skipped countries keep old data
    console.warn(`Chunk ${chunk.join(",")} failed, retrying countries individually...`);
    for (const code of chunk) {
      try {
        mergeResponse(await fetchWithRetry(keyURL([code]), 3));
      } catch (err) {
        console.warn(`Skipping ${code} (${err.message}); previous data kept.`);
        failed.push(code);
      }
      await sleep(1000);
    }
  }
  await sleep(1000);
}

if (fetched === 0) throw new Error("API returned no observations; aborting.");
if (failed.length) console.warn(`Countries not refreshed: ${failed.join(", ")}`);

const out = {};
for (const code of codes) {
  out[code] = [...merged[code].entries()]
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year);
}

const oldPoints = Object.values(existing).reduce((n, arr) => n + arr.length, 0);
const newPoints = Object.values(out).reduce((n, arr) => n + arr.length, 0);
if (newPoints < oldPoints) {
  throw new Error(`New dataset has ${newPoints} points vs ${oldPoints} before; aborting.`);
}

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(
  `Merged ${fetched} fresh observations; ${Object.keys(out).length} countries, ` +
  `${newPoints} data points (was ${oldPoints}).`
);
