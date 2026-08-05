import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Display names for OECD reference areas present in wages.json
const COUNTRY_NAMES = {
  "AUS": "Australia", "AUT": "Austria", "BEL": "Belgium", "BGR": "Bulgaria",
  "CAN": "Canada", "CHE": "Switzerland", "CHL": "Chile", "COL": "Colombia",
  "CRI": "Costa Rica", "CZE": "Czechia", "DEU": "Germany", "DNK": "Denmark",
  "ESP": "Spain", "EST": "Estonia", "FIN": "Finland", "FRA": "France",
  "GBR": "United Kingdom", "GRC": "Greece", "HRV": "Croatia", "HUN": "Hungary",
  "IRL": "Ireland", "ISL": "Iceland", "ISR": "Israel", "ITA": "Italy",
  "JPN": "Japan", "KOR": "Korea", "LTU": "Lithuania", "LUX": "Luxembourg",
  "LVA": "Latvia", "MEX": "Mexico", "NLD": "Netherlands", "NOR": "Norway",
  "NZL": "New Zealand", "OECD": "OECD average", "POL": "Poland",
  "PRT": "Portugal", "ROU": "Romania", "SVK": "Slovak Republic",
  "SVN": "Slovenia", "SWE": "Sweden", "TUR": "Türkiye", "USA": "United States",
};

const CURRENCY_SYMBOLS = {
  EUR: "€", USD: "$", GBP: "£", JPY: "¥", KRW: "₩", CHF: "CHF", SEK: "kr",
  DKK: "kr", NOK: "kr", ISK: "kr", CZK: "Kč", PLN: "zł", HUF: "Ft", TRY: "₺",
  ILS: "₪", MXN: "$", CLP: "$", COP: "$", CRC: "₡", AUD: "$", CAD: "$",
  NZD: "$", BGN: "лв", RON: "lei",
};

const MODES = [
  { key: "nominal", label: "Nominal" },
  { key: "real", label: "Real" },
  { key: "ppp", label: "USD PPP" },
];

const COMPARE_COLORS = ["#4f46e5", "#e11d48", "#059669", "#d97706"];
const MAX_COMPARE = 3;

function seriesFor(entry, mode) {
  if (!entry) return [];
  return mode === "ppp" ? entry.usdPpp : mode === "real" ? entry.real : entry.nominal;
}

function formatCurrency(value, decimals = 0) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

// Read shareable state, e.g. ?country=ESP&compare=DEU,USA&mode=real&from=2000
function readParamsFromURL() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};
  const code = params.get("country")?.toUpperCase();
  if (code && COUNTRY_NAMES[code]) out.country = code;
  const compare = params.get("compare");
  if (compare) {
    out.compareCodes = compare
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => COUNTRY_NAMES[c])
      .slice(0, MAX_COMPARE);
  }
  const mode = params.get("mode");
  if (MODES.some((m) => m.key === mode)) out.mode = mode;
  const from = Number.parseInt(params.get("from"), 10);
  if (Number.isFinite(from)) out.fromYear = from;
  return out;
}

const INITIAL = readParamsFromURL();

const inputClass =
  "h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function SalaryExplorer() {
  const [country, setCountry] = useState(INITIAL.country ?? "ESP");
  const [compareCodes, setCompareCodes] = useState(INITIAL.compareCodes ?? ["DEU", "USA"]);
  const [mode, setMode] = useState(INITIAL.mode ?? "real");
  const [fromYear, setFromYear] = useState(INITIAL.fromYear ?? 2000);
  const [wages, setWages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/wages.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setWages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading wage data:", err);
        setLoading(false);
      });
  }, []);

  const availableCodes = useMemo(() => {
    if (!wages) return [];
    return Object.keys(wages)
      .filter((c) => COUNTRY_NAMES[c])
      .sort((a, b) => COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b]));
  }, [wages]);

  const entry = wages?.[country];
  const symbol = CURRENCY_SYMBOLS[entry?.currency] ?? "";
  const modeSymbol = mode === "ppp" ? "$" : symbol;

  const availableYears = useMemo(
    () => (entry ? entry.nominal.map((e) => e.year).sort((a, b) => b - a) : []),
    [entry]
  );
  const latestYear = availableYears[0] ?? null;

  // Snap fromYear into the selected country's range
  useEffect(() => {
    if (availableYears.length === 0) return;
    const nearest = (y) =>
      availableYears.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    setFromYear((y) => (availableYears.includes(y) ? y : nearest(y)));
  }, [availableYears]);

  // Keep the URL in sync so any view can be shared as a link
  useEffect(() => {
    if (!wages || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("country", country);
    params.set("mode", mode);
    params.set("from", String(fromYear));
    if (compareCodes.length > 0) params.set("compare", compareCodes.join(","));
    else params.delete("compare");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [country, compareCodes, mode, fromYear, wages]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Chart rows: one column per selected country, in the chosen mode
  const chart = useMemo(() => {
    if (!wages || !entry || !latestYear) return { rows: [], series: [] };
    const codes = [country, ...compareCodes.filter((c) => c !== country && wages[c])];
    const byCode = Object.fromEntries(
      codes.map((c) => [c, Object.fromEntries(seriesFor(wages[c], mode).map((e) => [e.year, e.value]))])
    );
    const rows = [];
    for (let year = fromYear; year <= latestYear; year++) {
      const row = { year };
      codes.forEach((c) => {
        if (byCode[c][year] !== undefined) row[COUNTRY_NAMES[c]] = byCode[c][year];
      });
      rows.push(row);
    }
    return { rows, series: codes.map((c) => COUNTRY_NAMES[c]) };
  }, [wages, entry, country, compareCodes, mode, fromYear, latestYear]);

  const stats = useMemo(() => {
    if (!entry || !latestYear) return null;
    const at = (series, year) => series.find((e) => e.year === year)?.value;
    const nominalFrom = at(entry.nominal, fromYear);
    const nominalLatest = at(entry.nominal, latestYear);
    const realFrom = at(entry.real, fromYear);
    const realLatest = at(entry.real, latestYear);
    const pppLatest = at(entry.usdPpp, latestYear);
    if (!nominalFrom || !nominalLatest || !realFrom || !realLatest) return null;
    return {
      nominalLatest,
      pppLatest,
      nominalGrowth: (nominalLatest / nominalFrom - 1) * 100,
      realGrowth: (realLatest / realFrom - 1) * 100,
    };
  }, [entry, fromYear, latestYear]);

  const addCompare = (code) => {
    if (!code || code === country || compareCodes.includes(code)) return;
    setCompareCodes((prev) => [...prev, code].slice(0, MAX_COMPARE));
  };

  const removeCompare = (code) => {
    setCompareCodes((prev) => prev.filter((c) => c !== code));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="text-center py-12">
          <div className="text-slate-600">Loading wage data...</div>
        </div>
      </div>
    );
  }

  if (!wages) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="text-center py-12">
          <div className="text-slate-600">
            Wage data could not be loaded. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Average Salary Explorer
          </h2>
          <p className="text-sm text-slate-600">
            Average annual wages across OECD countries: nominal, inflation-adjusted (real),
            and PPP-converted for fair cross-country comparison.
          </p>
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.54 3.54 0 0 0-5-5l-1 1" />
            <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.54 3.54 0 0 0 5 5l1-1" />
          </svg>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </header>

      {/* Inputs */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="salary-country" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Country
          </label>
          <select
            id="salary-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            {availableCodes.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_NAMES[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="salary-from" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From Year
          </label>
          <select
            id="salary-from"
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            className={inputClass}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prices
          </span>
          <div className="inline-flex h-9 items-center self-start rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs" role="group" aria-label="Price mode">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={`rounded-md px-2.5 py-1.5 transition ${
                  mode === m.key
                    ? "bg-white font-medium text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {stats && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Avg. wage {latestYear} ({COUNTRY_NAMES[country]})
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {symbol}{formatCurrency(stats.nominalLatest)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              In USD PPP
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              ${formatCurrency(stats.pppLatest)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nominal growth since {fromYear}
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {stats.nominalGrowth >= 0 ? "+" : ""}{formatCurrency(stats.nominalGrowth, 1)}%
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Real growth since {fromYear}
            </div>
            <div className={`mt-1 text-lg font-semibold ${stats.realGrowth >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {stats.realGrowth >= 0 ? "+" : ""}{formatCurrency(stats.realGrowth, 1)}%
            </div>
          </div>
        </section>
      )}

      {/* Chart */}
      {chart.rows.length > 1 && (
        <section className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-slate-700">
              Average annual wage ({fromYear} - {latestYear},{" "}
              {mode === "ppp" ? "constant-price USD PPP" : mode === "real" ? `constant prices, national currency` : "current prices, national currency"})
            </h2>
            <span className="text-xs font-medium text-slate-500">Compare:</span>
            {compareCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {COUNTRY_NAMES[code]}
                <button
                  type="button"
                  onClick={() => removeCompare(code)}
                  aria-label={`Remove ${COUNTRY_NAMES[code]} from comparison`}
                  className="text-slate-400 transition hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
            {compareCodes.length < MAX_COMPARE && (
              <select
                value=""
                onChange={(e) => addCompare(e.target.value)}
                aria-label="Add country to comparison"
                className="h-7 rounded-full border border-dashed border-slate-300 bg-slate-50 px-2 text-xs text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">+ Add country</option>
                {availableCodes
                  .filter((c) => c !== country && !compareCodes.includes(c))
                  .map((c) => (
                    <option key={c} value={c}>
                      {COUNTRY_NAMES[c]}
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div style={{ width: "100%", height: "320px" }} className="rounded-xl border border-slate-200 bg-slate-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart.rows} margin={{ top: 12, right: 20, left: 10, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => compactFormatter.format(value)}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${mode === "ppp" ? "$" : chart.series.length > 1 ? "" : symbol}${formatCurrency(value)}`,
                    name,
                  ]}
                  labelFormatter={(label) => `Year ${label}`}
                  wrapperClassName="!text-xs"
                />
                {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: "0.75rem" }} />}
                {chart.series.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                    strokeWidth={2}
                    dot={chart.series.length === 1 ? { r: 2 } : false}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {mode === "nominal" && (
              <>Wages at each year's own prices, in national currency.</>
            )}
            {mode === "real" && (
              <>Wages at constant prices (inflation removed), in national currency — a flat line means purchasing power stagnated.</>
            )}
            {mode === "ppp" && (
              <>Wages converted with purchasing power parities at constant prices — comparable across countries and over time.</>
            )}
            {chart.series.length > 1 && mode !== "ppp" && (
              <> <strong>Note:</strong> each line is in its own national currency — switch to USD PPP for a fair cross-country comparison.</>
            )}
          </p>
        </section>
      )}

      <div className="text-xs text-slate-400">
        Source:{" "}
        <a
          href="https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_EARNINGS%40AV_AN_WAGE&df[ag]=OECD.ELS.SAE"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 underline"
        >
          OECD - Average annual wages
        </a>
        . Mean gross wages per full-time equivalent employee, national-accounts based
        (higher than median take-home pay). Constant-price series use the latest year as base.
      </div>
    </div>
  );
}
