# Dataset generation

`build-datasets.mjs` reads the CSVs in the sibling data repositories and writes JSON to
`public/data/`.

```bash
node scripts/data/build-datasets.mjs
```

The data repository is the **single source of truth**:

- `../historical-monetary-data` — https://github.com/MiguelPuntoEs/historical-monetary-data

The JSON under `public/data/` is a build artifact. It is committed so the site deploys
without needing the sibling checkout, but it should never be edited by hand: change the CSV
in the data repository, re-run the script, commit both.

If the sibling repository is missing the script exits with a message rather than producing
a half-built site.
