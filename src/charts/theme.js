/**
 * House chart style — the single source of truth.
 *
 * Every chart I publish should look like the same person made it, whether it is
 * interactive on the site or a vector figure in a paper. This module holds the
 * palette, the ink, the type sizes and the formatters; the React components read
 * it directly, and `pnpm run build:chart-theme` writes it to public/chart-theme.json
 * so the Python figure scripts in the data repositories can read the same values.
 *
 * Deliberately not a charting library. It is a style, plus the two or three
 * components I actually use. Datawrapper already exists.
 */

/* Categorical series colours, assigned in fixed order and never cycled. Checked
   for colour-vision-deficiency separation and for at least 3:1 against the
   surface each mode paints on. A ninth series is not a new hue: fold it into
   "other", facet, or pick a different form. */
export const SERIES = {
  light: [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
    "#4a3aa7",
  ],
  dark: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#0ca30c",
    "#9085e9",
  ],
};

/* Chart ink. These mirror the site's CSS custom properties so a chart sits in
   the page rather than on it; the Python scripts use the light column. */
export const INK = {
  light: {
    text: "#0a0a0a",
    muted: "#707070",
    grid: "#e4e4e4",
    axis: "#cecece",
    surface: "#fefefe",
    band: "#fdf8ee",
    flag: "#8a6100",
  },
  dark: {
    text: "#fefefe",
    muted: "#838383",
    grid: "#2a2a2a",
    axis: "#3c3c3c",
    surface: "#111111",
    band: "#1f1a12",
    flag: "#c98500",
  },
};

/* One emphasis colour, for the series a chart is actually about. */
export const EMPHASIS = { light: "#0a0a0a", dark: "#fefefe" };

export const TYPE = { axis: 12, legend: 13, annotation: 11, caption: 13 };

export const STROKE = { series: 2, emphasis: 2.5, rule: 1, dot: 2.6 };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "1781-05" → "May 1781". Bare years pass through. */
export function formatDate(d) {
  if (typeof d !== "string") return String(d);
  const [y, m] = d.split("-");
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

/** Trailing zeros are noise in a table of ratios. */
export function formatNumber(v) {
  if (v == null) return "—";
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
}

/** Resolve every token for one mode. */
export function palette(mode) {
  const m = mode === "dark" ? "dark" : "light";
  return {
    mode: m,
    series: SERIES[m],
    ...INK[m],
    emphasis: EMPHASIS[m],
    TYPE,
    STROKE,
  };
}

export default {
  SERIES,
  INK,
  EMPHASIS,
  TYPE,
  STROKE,
  palette,
  formatDate,
  formatNumber,
};
