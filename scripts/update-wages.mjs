#!/usr/bin/env node
// Generates public/wages.json from the OECD SDMX API.
// Dataset: DSD_EARNINGS@AV_AN_WAGE — average annual wages per full-time
// equivalent employee. Three series per country:
//   nominal — current prices, national currency (PRICE_BASE=V)
//   real    — constant prices, national currency (PRICE_BASE=Q)
//   usdPpp  — constant prices, USD PPP converted (UNIT_MEASURE=USD_PPP)
// Run: node scripts/update-wages.mjs

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "wages.json");
const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};

const BASE =
  "https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,1.0/";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pace knobs: WAGES_CHUNK (countries/request), WAGES_ATTEMPTS (retries),
// WAGES_PACE_MS (delay between requests) — for slow-drip runs on tight quotas
const CHUNK_SIZE = Number(process.env.WAGES_CHUNK) || 8;
const ATTEMPTS = Number(process.env.WAGES_ATTEMPTS) || 5;
const PACE_MS = Number(process.env.WAGES_PACE_MS) || 1000;
const MAX_REQ = Number(process.env.WAGES_MAX_REQ) || Infinity;
let requestCount = 0;

// The OECD API intermittently returns 500/429 for valid queries.
async function fetchWithRetry(url, attempts = ATTEMPTS) {
  if (requestCount >= MAX_REQ) throw new Error("request budget exhausted");
  for (let attempt = 1; ; attempt++) {
    requestCount++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "wages-updater (miguel.es)" } });
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

function parseResponse({ data }) {
  const structure = data.structures?.[0] ?? data.structure;
  const sdims = structure.dimensions.series;
  const idx = Object.fromEntries(sdims.map((d, i) => [d.id, i]));
  const years = structure.dimensions.observation[0].values.map((v) => Number(v.id));
  const rows = [];
  for (const [key, series] of Object.entries(data.dataSets[0].series ?? {})) {
    const parts = key.split(":");
    const dimVal = (id) => sdims[idx[id]].values[Number(parts[idx[id]])].id;
    const obs = Object.entries(series.observations)
      .map(([i, v]) => ({ year: years[Number(i)], value: v[0] }))
      .filter((e) => Number.isFinite(e.year) && Number.isFinite(e.value))
      .sort((a, b) => a.year - b.year);
    rows.push({
      code: dimVal("REF_AREA"),
      unit: dimVal("UNIT_MEASURE"),
      priceBase: dimVal("PRICE_BASE"),
      obs,
    });
  }
  return rows;
}

// Known reference areas (checked 2026-08: probe `all?lastNObservations=1`)
const KNOWN_CODES = [
  "AUS","AUT","BEL","BGR","CAN","CHE","CHL","COL","CRI","CZE","DEU","DNK",
  "ESP","EST","FIN","FRA","GBR","GRC","HRV","HUN","IRL","ISL","ISR","ITA",
  "JPN","KOR","LTU","LUX","LVA","MEX","NLD","NOR","NZL","OECD","POL","PRT",
  "ROU","SVK","SVN","SWE","TUR","USA","WXOECD",
];

// Discover available countries (fall back to the known list if the probe
// fails — the API is heavily rate-limited and every request counts, so
// skip the probe entirely when resuming from a cache)
let codes = KNOWN_CODES;
if (!(process.env.WAGES_CACHE && existsSync(process.env.WAGES_CACHE))) {
  try {
    const probe = await fetchWithRetry(`${BASE}all?format=jsondata&lastNObservations=1`, 1);
    const probeStruct = probe.data.structures?.[0] ?? probe.data.structure;
    const refDim = probeStruct.dimensions.series.find((d) => d.id === "REF_AREA");
    codes = refDim.values.map((v) => v.id);
  } catch {
    console.warn("Probe failed; using known country list");
  }
}
console.log(`Fetching ${codes.length} reference areas`);

const out = {};
function mergeRows(rows) {
  for (const row of rows) {
    const entry = (out[row.code] ??= {});
    if (row.unit === "USD_PPP") {
      entry.usdPpp = row.obs;
    } else if (row.priceBase === "V") {
      entry.currency = row.unit;
      entry.nominal = row.obs;
    } else if (row.priceBase === "Q") {
      entry.real = row.obs;
    }
  }
}

const keyURL = (list) => `${BASE}${list.join("+")}.WG..A..MEAN._Z?format=jsondata`;

const isComplete = (e) => e?.nominal?.length && e?.real?.length && e?.usdPpp?.length && e?.currency;

// Resumable cache (WAGES_CACHE=path): progress survives across runs, so
// repeated runs on a tight quota only request what's still missing.
const cachePath = process.env.WAGES_CACHE;
if (cachePath && existsSync(cachePath)) {
  Object.assign(out, JSON.parse(readFileSync(cachePath, "utf8")));
  console.log(`Cache: ${Object.values(out).filter(isComplete).length} countries already complete`);
}
const saveCache = () => {
  if (cachePath) writeFileSync(cachePath, JSON.stringify(out));
};

const missing = codes.filter((c) => !isComplete(out[c]));
console.log(`Missing: ${missing.length} of ${codes.length}`);

// Try one unfiltered request first — a single call gets everything IF the
// API doesn't silently truncate the response (it does for larger datasets),
// so validate completeness before trusting it. Pointless when resuming.
let needChunks = missing.length > 0;
if (!process.env.WAGES_NO_BULK && missing.length === codes.length) {
  try {
    mergeRows(parseResponse(await fetchWithRetry(keyURL([""]), 1)));
    saveCache();
    const completeCount = Object.values(out).filter(isComplete).length;
    console.log(`Bulk request: ${completeCount} complete countries`);
    if (completeCount >= 35) {
      needChunks = false;
    } else {
      console.warn("Bulk response looks truncated; falling back to chunked requests");
      await sleep(PACE_MS);
    }
  } catch (err) {
    console.warn(`Bulk request failed (${err.message}); using chunked requests`);
    await sleep(PACE_MS);
  }
}

const toFetch = codes.filter((c) => !isComplete(out[c]));
for (let i = 0; needChunks && i < toFetch.length; i += CHUNK_SIZE) {
  const chunk = toFetch.slice(i, i + CHUNK_SIZE);
  try {
    mergeRows(parseResponse(await fetchWithRetry(keyURL(chunk))));
    saveCache();
    console.log(`Fetched ${chunk.join(",")}`);
  } catch (err) {
    console.warn(`Chunk ${chunk.join(",")} failed (${err.message}); skipping this run`);
  }
  await sleep(PACE_MS);
}

// Keep only areas with the full set of series; fall back to previous data
// for areas the API failed to return this run
const complete = {};
const dropped = [];
for (const [code, entry] of Object.entries(out)) {
  if (isComplete(entry)) complete[code] = entry;
  else dropped.push(code);
}
for (const [code, entry] of Object.entries(existing)) {
  if (!complete[code] && isComplete(entry)) {
    complete[code] = entry;
    console.warn(`Keeping previous data for ${code}`);
  }
}
if (dropped.length) console.warn("Incomplete from API:", dropped.join(", "));

const points = Object.values(complete).reduce(
  (n, e) => n + e.nominal.length + e.real.length + e.usdPpp.length,
  0
);
if (Object.keys(complete).length < 30) {
  throw new Error(`Only ${Object.keys(complete).length} complete countries; aborting.`);
}

writeFileSync(outPath, JSON.stringify(complete, null, 2) + "\n");
console.log(
  `Wrote ${Object.keys(complete).length} countries, ${points} data points to public/wages.json`
);
