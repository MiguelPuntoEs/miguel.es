// Writes the house chart style to public/chart-theme.json so non-JS consumers —
// the Python figure scripts in the data repositories — draw from the same palette
// as the site. One definition, two outputs: vector figures for papers, interactive
// charts for the web.
//
//   node scripts/data/export-chart-theme.mjs

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SERIES, INK, EMPHASIS, TYPE, STROKE } from "../../src/charts/theme.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "chart-theme.json");
writeFileSync(out, JSON.stringify({ SERIES, INK, EMPHASIS, TYPE, STROKE }, null, 2) + "\n");
console.log("wrote public/chart-theme.json");
