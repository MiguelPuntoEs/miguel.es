import { useState, useMemo, useEffect } from "react";
import { COUNTRY_MAP } from "../data/cpi-countries.js";
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

const COMPARE_COLORS = ["#0551d8", "#d92d53", "#0f9d76", "#d97706"];
const MAX_COMPARE = 3;

// Map country codes to full names and currency info.
// `legacy` holds the pre-euro national currency with its fixed, irrevocable
// euro conversion rate (1 EUR = `rate` legacy units) and the last year the
// legacy currency was in everyday use (cash changeover year minus one).

// Process CPI data from JSON
function processCPIData(cpiDataRaw) {
  const CPI_DATA = {};
  Object.keys(cpiDataRaw).forEach(countryCode => {
    if (COUNTRY_MAP[countryCode]) {
      const countryName = COUNTRY_MAP[countryCode].name;
      CPI_DATA[countryName] = {};
      cpiDataRaw[countryCode].forEach(entry => {
        CPI_DATA[countryName][entry.year] = entry.value;
      });
    }
  });
  return CPI_DATA;
}

function calculateInflationAdjustment(amount, country, fromYear, toYear, CPI_DATA) {
  const countryData = CPI_DATA[country];
  if (!countryData || !countryData[fromYear] || !countryData[toYear]) {
    return {
      adjustedAmount: amount,
      totalInflation: 0,
      avgAnnualInflation: null,
      yearlyBreakdown: [],
      error: "Data not available for selected years",
    };
  }

  const fromCPI = countryData[fromYear];
  const toCPI = countryData[toYear];

  // Adjust amount based on CPI ratio (works in both directions)
  const adjustedAmount = (amount * toCPI) / fromCPI;
  const totalInflation = ((toCPI - fromCPI) / fromCPI) * 100;

  // Average annual inflation over the covered period, always chronological
  const startYear = Math.min(fromYear, toYear);
  const endYear = Math.max(fromYear, toYear);
  const span = endYear - startYear;
  const avgAnnualInflation =
    span > 0
      ? (Math.pow(countryData[endYear] / countryData[startYear], 1 / span) - 1) * 100
      : null;

  // Yearly breakdown, in chronological order
  const yearlyBreakdown = [];
  for (let year = startYear; year <= endYear; year++) {
    if (countryData[year]) {
      const prevYear = year - 1;
      yearlyBreakdown.push({
        year,
        amount: (amount * countryData[year]) / fromCPI,
        // What the original fromYear amount can still buy, in fromYear money
        purchasingPower: (amount * fromCPI) / countryData[year],
        yearlyInflation:
          year > startYear && countryData[prevYear]
            ? ((countryData[year] - countryData[prevYear]) / countryData[prevYear]) * 100
            : null,
        cpi: countryData[year],
      });
    }
  }

  return {
    adjustedAmount,
    totalInflation,
    avgAnnualInflation,
    yearlyBreakdown,
  };
}

function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Legacy-currency equivalent of a euro amount for years before the changeover,
// e.g. "102,563 Pta" for €616.41 in Spain, 2001 or earlier.
function formatLegacy(countryInfo, year, euroAmount) {
  const legacy = countryInfo?.legacy;
  if (!legacy || year > legacy.lastYear || !Number.isFinite(euroAmount)) return null;
  const decimals = legacy.rate >= 10 ? 0 : 2;
  return `${formatCurrency(euroAmount * legacy.rate, decimals)} ${legacy.symbol}`;
}

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const inputClass =
  "h-9 rounded-lg border border-line-strong bg-bg-2 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue";

const CODE_BY_NAME = Object.fromEntries(
  Object.entries(COUNTRY_MAP).map(([code, info]) => [info.name, code])
);

// Quick-start examples; "latest" resolves to the newest year with data
const PRESETS = [
  { label: "€1,000 from 2002 (Spain)", amount: 1000, country: "Spain", from: 2002, to: "latest" },
  { label: "€1,000 back to pesetas (Spain)", amount: 1000, country: "Spain", from: "latest", to: 2001 },
  { label: "$100 from 1980 (US)", amount: 100, country: "United States", from: 1980, to: "latest" },
  { label: "€1,000 from the DM era (Germany)", amount: 1000, country: "Germany", from: 1990, to: "latest" },
  { label: "₺1,000 from 2010 (Türkiye)", amount: 1000, country: "Türkiye", from: 2010, to: "latest" },
];

// Read shareable state from the URL, e.g. ?amount=1000&country=ESP&from=2024&to=2002
function readParamsFromURL() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};
  const amount = Number.parseFloat(params.get("amount"));
  if (Number.isFinite(amount) && amount >= 0) out.amountInput = String(amount);
  const code = params.get("country")?.toUpperCase();
  if (code && COUNTRY_MAP[code]) out.country = COUNTRY_MAP[code].name;
  const from = Number.parseInt(params.get("from"), 10);
  if (Number.isFinite(from)) out.fromYear = from;
  const to = Number.parseInt(params.get("to"), 10);
  if (Number.isFinite(to)) out.toYear = to;
  const compare = params.get("compare");
  if (compare) {
    out.compareCountries = compare
      .split(",")
      .map((c) => COUNTRY_MAP[c.trim().toUpperCase()]?.name)
      .filter(Boolean)
      .slice(0, MAX_COMPARE);
  }
  return out;
}

const INITIAL = readParamsFromURL();

export default function InflationCalculator() {
  const [amountInput, setAmountInput] = useState(INITIAL.amountInput ?? "1000");
  const [country, setCountry] = useState(INITIAL.country ?? "United States");
  const [fromYear, setFromYear] = useState(INITIAL.fromYear ?? 2020);
  const [toYear, setToYear] = useState(INITIAL.toYear ?? 2024);
  const [compareCountries, setCompareCountries] = useState(INITIAL.compareCountries ?? []);
  const [chartMode, setChartMode] = useState("equivalent");
  const [cpiData, setCpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const amount = Number.parseFloat(amountInput);
  const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;

  // Load CPI data from public folder
  useEffect(() => {
    fetch('/cpi.json')
      .then(res => res.json())
      .then(data => {
        setCpiData(processCPIData(data));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading CPI data:', err);
        setLoading(false);
      });
  }, []);

  // Get available countries
  const availableCountries = useMemo(() => {
    if (!cpiData) return [];
    return Object.keys(cpiData).sort();
  }, [cpiData]);

  // Available years for the selected country, most recent first (for the dropdowns)
  const availableYears = useMemo(() => {
    if (!cpiData || !cpiData[country]) return [];
    return Object.keys(cpiData[country]).map(Number).sort((a, b) => b - a);
  }, [cpiData, country]);

  const maxYear = availableYears.length > 0 ? availableYears[0] : null;
  const minYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : null;

  // When the country changes, snap years to the nearest available year
  useEffect(() => {
    if (availableYears.length === 0) return;
    const nearest = (y) =>
      availableYears.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    setFromYear((y) => (availableYears.includes(y) ? y : nearest(y)));
    setToYear((y) => (availableYears.includes(y) ? y : nearest(y)));
  }, [availableYears]);

  // Keep the URL in sync so any conversion can be shared as a link
  useEffect(() => {
    if (!cpiData || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("amount", String(safeAmount));
    params.set("country", CODE_BY_NAME[country]);
    params.set("from", String(fromYear));
    params.set("to", String(toYear));
    if (compareCountries.length > 0) {
      params.set("compare", compareCountries.map((c) => CODE_BY_NAME[c]).join(","));
    } else {
      params.delete("compare");
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [safeAmount, country, fromYear, toYear, compareCountries, cpiData]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const result = useMemo(() => {
    if (!cpiData) {
      return { adjustedAmount: 0, totalInflation: 0, avgAnnualInflation: null, yearlyBreakdown: [] };
    }
    return calculateInflationAdjustment(safeAmount, country, fromYear, toYear, cpiData);
  }, [safeAmount, country, fromYear, toYear, cpiData]);

  const countryInfo = Object.values(COUNTRY_MAP).find(c => c.name === country);
  const symbol = countryInfo?.symbol ?? "";
  const isBackward = toYear < fromYear;
  const fromLegacy = formatLegacy(countryInfo, fromYear, safeAmount);
  const toLegacy = formatLegacy(countryInfo, toYear, result.adjustedAmount);

  // Table follows the from -> to direction; chart stays chronological
  const tableRows = useMemo(
    () => (isBackward ? [...result.yearlyBreakdown].reverse() : result.yearlyBreakdown),
    [result.yearlyBreakdown, isBackward]
  );

  const startYear = Math.min(fromYear, toYear);
  const endYear = Math.max(fromYear, toYear);

  // One line per country: the starting amount under each country's inflation,
  // anchored so all lines pass through (fromYear, amount). chartMode picks the
  // rising (equivalent value) or falling (purchasing power) view.
  const chartSeries = useMemo(() => {
    if (!cpiData) return { rows: [], series: [], dropped: [] };
    const names = [country, ...compareCountries.filter((c) => c !== country)];
    const series = [];
    const dropped = [];
    names.forEach((name) => {
      const data = cpiData[name];
      if (data && data[fromYear]) series.push({ name, base: data[fromYear] });
      else dropped.push(name);
    });
    const rows = [];
    for (let year = startYear; year <= endYear; year++) {
      const row = { year };
      series.forEach((s) => {
        const value = cpiData[s.name][year];
        if (value) {
          row[s.name] =
            chartMode === "equivalent"
              ? (safeAmount * value) / s.base
              : (safeAmount * s.base) / value;
        }
      });
      rows.push(row);
    }
    return { rows, series: series.map((s) => s.name), dropped };
  }, [cpiData, country, compareCountries, startYear, endYear, fromYear, chartMode, safeAmount]);

  const addCompareCountry = (name) => {
    if (!name || name === country || compareCountries.includes(name)) return;
    setCompareCountries((prev) => [...prev, name].slice(0, MAX_COMPARE));
  };

  const removeCompareCountry = (name) => {
    setCompareCountries((prev) => prev.filter((c) => c !== name));
  };

  const swapYears = () => {
    setFromYear(toYear);
    setToYear(fromYear);
  };

  const applyPreset = (preset) => {
    const latest = (cpiData && cpiData[preset.country])
      ? Math.max(...Object.keys(cpiData[preset.country]).map(Number))
      : maxYear;
    setAmountInput(String(preset.amount));
    setCountry(preset.country);
    setFromYear(preset.from === "latest" ? latest : preset.from);
    setToYear(preset.to === "latest" ? latest : preset.to);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-line bg-bg-1 p-6 shadow-lg shadow-black/5">
        <div className="text-center py-12">
          <div className="text-text-2">Loading inflation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-line bg-bg-1 p-6 shadow-lg shadow-black/5">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-1">
            Inflation Calculator
          </h2>
          <p className="text-sm text-text-2">
            Adjust amounts for inflation based on country-specific rates. Calculate past purchasing power or future values.
          </p>
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-2 px-3 text-xs font-medium text-text-2 shadow-sm transition hover:border-blue hover:text-blue focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
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
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inflation-amount" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Amount
          </label>
          <input
            id="inflation-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="1000"
            className={`${inputClass} placeholder:text-text-3`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="inflation-country" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Country
          </label>
          <select
            id="inflation-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inflation-from-year" className="text-xs font-semibold uppercase tracking-wide text-text-3">
                From Year
              </label>
              <select
                id="inflation-from-year"
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className={`${inputClass} w-full`}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={swapYears}
              title="Swap years"
              aria-label="Swap from and to years"
              className="h-9 w-9 shrink-0 rounded-lg border border-line-strong bg-bg-2 text-text-2 shadow-inner transition hover:border-blue hover:text-blue focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 7h11M12 4l3 3-3 3" />
                <path d="M16 13H5M8 10l-3 3 3 3" />
              </svg>
            </button>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inflation-to-year" className="text-xs font-semibold uppercase tracking-wide text-text-3">
                To Year
              </label>
              <select
                id="inflation-to-year"
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className={`${inputClass} w-full`}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-start presets */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-3">Try:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-full border border-line bg-bg-2 px-3 py-1 text-xs text-text-2 transition hover:border-blue hover:bg-bg-2 hover:text-blue-hover focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {availableYears.length > 0 && (
        <div className="mb-4 text-xs text-text-3">
          Data available for {country}: {minYear} - {maxYear}
        </div>
      )}

      {/* Summary cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Original amount ({fromYear})
          </div>
          <div className="mt-1 text-lg font-semibold text-text-1">
            {symbol}{formatCurrency(safeAmount)}
          </div>
          {fromLegacy && (
            <div className="mt-0.5 text-xs text-text-3">≈ {fromLegacy}</div>
          )}
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Equivalent in {toYear}
          </div>
          <div className="mt-1 text-lg font-semibold text-blue-hover">
            {symbol}{formatCurrency(result.adjustedAmount)}
          </div>
          {toLegacy && (
            <div className="mt-0.5 text-xs text-text-3">≈ {toLegacy}</div>
          )}
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            {isBackward ? 'Change vs ' + fromYear : 'Total inflation'}
          </div>
          <div className={`mt-1 text-lg font-semibold ${result.totalInflation >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {result.totalInflation >= 0 ? '+' : ''}{formatCurrency(result.totalInflation, 1)}%
          </div>
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Avg. annual inflation
          </div>
          <div className="mt-1 text-lg font-semibold text-text-1">
            {result.avgAnnualInflation === null ? '-' : `${formatCurrency(result.avgAnnualInflation, 2)}%`}
          </div>
        </div>
      </section>

      {result.error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {result.error}
        </div>
      )}

      {/* Explanation */}
      {!result.error && (
        <section className="mb-6">
          <div className="rounded-xl border border-line-strong bg-bg-2 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-blue-hover">
              Purchasing Power
            </div>
            <div className="mt-1 text-sm text-text-1">
              {symbol}{formatCurrency(safeAmount)}{fromLegacy ? ` (≈ ${fromLegacy})` : ''} in {fromYear} {isBackward ? 'had' : 'has'} the same purchasing power as{' '}
              <strong>{symbol}{formatCurrency(result.adjustedAmount)}{toLegacy ? ` (≈ ${toLegacy})` : ''}</strong> in {toYear}
              {' '}(based on actual CPI data).
            </div>
          </div>
        </section>
      )}

      {/* Chart */}
      {result.yearlyBreakdown.length > 1 && (
        <section className="mb-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-text-2">
              Value over time ({startYear} - {endYear})
            </h2>
            <div className="inline-flex rounded-lg border border-line bg-bg-2 p-0.5 text-xs" role="group" aria-label="Chart mode">
              {[
                { key: "equivalent", label: "Equivalent value" },
                { key: "power", label: "Purchasing power" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setChartMode(mode.key)}
                  aria-pressed={chartMode === mode.key}
                  className={`rounded-md px-2.5 py-1 transition ${
                    chartMode === mode.key
                      ? "bg-bg-1 font-medium text-text-1 shadow-sm"
                      : "text-text-3 hover:text-text-2"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-text-3">Compare:</span>
            {compareCountries.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-2 px-2.5 py-0.5 text-xs text-text-2"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeCompareCountry(name)}
                  aria-label={`Remove ${name} from comparison`}
                  className="text-text-3 transition hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
            {compareCountries.length < MAX_COMPARE && (
              <select
                value=""
                onChange={(e) => addCompareCountry(e.target.value)}
                aria-label="Add country to comparison"
                className="h-7 rounded-full border border-dashed border-line-strong bg-bg-2 px-2 text-xs text-text-3 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
              >
                <option value="">+ Add country</option>
                {availableCountries
                  .filter((c) => c !== country && !compareCountries.includes(c))
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div style={{ width: '100%', height: '320px' }} className="rounded-xl border border-line bg-bg-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartSeries.rows}
                margin={{ top: 12, right: 20, left: 10, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => compactFormatter.format(value)}
                />
                <Tooltip
                  formatter={(value, name) => [
                    chartSeries.series.length > 1 ? formatCurrency(value) : `${symbol}${formatCurrency(value)}`,
                    name,
                  ]}
                  labelFormatter={(label) => `Year ${label}`}
                  wrapperClassName="!text-xs"
                />
                {chartSeries.series.length > 1 && (
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                )}
                {chartSeries.series.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={
                      chartSeries.series.length === 1
                        ? (chartMode === "equivalent" ? "#0551d8" : "#d92d53")
                        : COMPARE_COLORS[i % COMPARE_COLORS.length]
                    }
                    strokeWidth={2}
                    dot={chartSeries.series.length === 1 ? { r: 3 } : false}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1.5 text-xs text-text-3">
            {chartMode === "equivalent" ? (
              <>Amount needed each year to match the purchasing power of {symbol}{formatCurrency(safeAmount)} in {fromYear}.</>
            ) : (
              <>What the original {symbol}{formatCurrency(safeAmount)} from {fromYear} can still buy each year, in {fromYear} money — the value of money eroding as prices rise.</>
            )}
            {chartSeries.series.length > 1 && (
              <> Each line applies that country's inflation to the same starting amount, so all lines cross at {fromYear}.</>
            )}
            {chartSeries.dropped.length > 0 && (
              <> No data for {chartSeries.dropped.join(", ")} in {fromYear}.</>
            )}
          </p>
        </section>
      )}

      {/* Year-by-year breakdown */}
      {tableRows.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-2">
            Year-by-year breakdown
          </h2>
          <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
            <table className="min-w-full text-xs">
              <thead className="bg-bg-2 text-left text-[0.7rem] uppercase tracking-wide text-text-3">
                <tr>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2 text-right">Equivalent value</th>
                  <th className="px-3 py-2 text-right">{fromYear} money buys</th>
                  <th className="px-3 py-2 text-right">Annual Inflation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-bg-1">
                {tableRows.map((row) => {
                  const rowLegacy = formatLegacy(countryInfo, row.year, row.amount);
                  return (
                  <tr key={row.year} className="hover:bg-bg-2">
                    <td className="px-3 py-1.5 text-text-2">{row.year}</td>
                    <td className="px-3 py-1.5 text-right text-text-1 font-mono">
                      {symbol}{formatCurrency(row.amount)}
                      {rowLegacy && (
                        <span className="ml-1.5 text-[0.65rem] text-text-3">≈ {rowLegacy}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right text-rose-700 font-mono">
                      {symbol}{formatCurrency(row.purchasingPower)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-2">
                      {row.yearlyInflation === null ? '-' : `${formatCurrency(row.yearlyInflation, 1)}%`}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-text-3 space-y-1">
            <p>
              <strong>Note:</strong> This calculator uses actual Consumer Price Index (CPI) data from OECD.
              The CPI measures changes in the price level of a basket of consumer goods and services.
            </p>
            {countryInfo?.legacy && (
              <p>
                For years before the euro changeover, amounts are also shown in the pre-euro currency
                ({countryInfo.legacy.name}) using the fixed conversion rate of 1 € = {countryInfo.legacy.rate} {countryInfo.legacy.symbol}.
              </p>
            )}
            <p className="text-text-3">
              Source:{" "}
              <a
                href="https://data-explorer.oecd.org/vis?lc=en&pg=0&bp=true&snb=20&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PRICES%40DF_PRICES_ALL&df[ag]=OECD.SDD.TPS&df[vs]=1.0&tm=Inflation%20%28CPI%29.A.N.CPI.PA._T.N.GY&to[TIME_PERIOD]=false&vw=tb&lb=bt&dq=.A.N.CPI.IX._T.N.GY%2B_Z&pd=%2C"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:text-blue-hover underline"
              >
                OECD - Consumer price indices (CPIs, HICPs), COICOP 1999
              </a>
              . Base year: 2015=100. Inflation rates calculated from actual CPI values year-over-year.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
