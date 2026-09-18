# Charts

A house style, not a charting library. Datawrapper already exists and is better
than anything I would build; what it cannot do is make my figures look like mine
across a paper PDF and a web page at the same time. That is what this is for.

## Files

| | |
|---|---|
| `theme.js` | The single source of truth: palette, ink, type sizes, stroke widths, formatters |
| `useChartTheme.js` | Hook that follows the site's `data-theme` toggle and returns resolved tokens |
| `TimeSeries.jsx` | The general component — series toggles, optional log axis, table, CSV |
| `SourceComparison.jsx` | A specialised chart for disagreeing sources, built on the same tokens |

## How the style reaches the papers

`theme.js` is exported to `public/chart-theme.json`:

```bash
node scripts/data/export-chart-theme.mjs   # or: pnpm run build:data
```

The Python figure scripts in the data repositories read that JSON through their
own `analysis/_theme.py`, so a vector figure in a manuscript and an interactive
chart on the site use the same palette. Change a colour here and both follow.

Those scripts carry a small fallback palette so they still run if the JSON is
absent; if you change `theme.js`, re-export and check the fallback has not
drifted.

## Rules worth keeping

**Series colours are assigned in fixed order and never cycled.** The order is
checked for colour-vision-deficiency separation and for at least 3:1 contrast
against the surface. An eighth series is not a new hue — fold it into "other",
facet the chart, or choose a different form.

**Every dataset carries its own provenance.** The descriptors under
`public/data/` hold `title`, `unit` and `source`, and `TimeSeries` renders them
as the caption. A chart cannot be published here without the note saying where
the numbers came from.

**Missing data stays missing.** `connectNulls` is false everywhere. Where a
source is silent the line breaks, and in `SourceComparison` the silence is shaded
and labelled — inferring a value from a continuous line is the error this whole
project exists to document.

**Dark mode is a real mode, not an inversion.** Both palettes are chosen against
their own surface. Charts re-read the theme on change rather than at mount.
