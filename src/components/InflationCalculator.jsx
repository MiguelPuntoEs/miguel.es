import React, { useState, useMemo, useEffect } from "react";
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

// Map country codes to full names and currency info
const COUNTRY_MAP = {
  "NOR": { name: "Norway", code: "NOK", symbol: "kr" },
  "USA": { name: "United States", code: "USD", symbol: "$" },
  "GBR": { name: "United Kingdom", code: "GBP", symbol: "£" },
  "DEU": { name: "Germany", code: "EUR", symbol: "€" },
  "FRA": { name: "France", code: "EUR", symbol: "€" },
  "ESP": { name: "Spain", code: "EUR", symbol: "€" },
  "ITA": { name: "Italy", code: "EUR", symbol: "€" },
  "JPN": { name: "Japan", code: "JPY", symbol: "¥" },
  "CAN": { name: "Canada", code: "CAD", symbol: "$" },
  "AUS": { name: "Australia", code: "AUD", symbol: "$" },
  "CHE": { name: "Switzerland", code: "CHF", symbol: "CHF" },
  "SWE": { name: "Sweden", code: "SEK", symbol: "kr" },
  "DNK": { name: "Denmark", code: "DKK", symbol: "kr" },
  "NLD": { name: "Netherlands", code: "EUR", symbol: "€" },
  "BEL": { name: "Belgium", code: "EUR", symbol: "€" },
  "AUT": { name: "Austria", code: "EUR", symbol: "€" },
  "FIN": { name: "Finland", code: "EUR", symbol: "€" },
  "IRL": { name: "Ireland", code: "EUR", symbol: "€" },
  "PRT": { name: "Portugal", code: "EUR", symbol: "€" },
  "GRC": { name: "Greece", code: "EUR", symbol: "€" },
  "POL": { name: "Poland", code: "PLN", symbol: "zł" },
  "CZE": { name: "Czechia", code: "CZK", symbol: "Kč" },
  "HUN": { name: "Hungary", code: "HUF", symbol: "Ft" },
  "SVK": { name: "Slovak Republic", code: "EUR", symbol: "€" },
  "SVN": { name: "Slovenia", code: "EUR", symbol: "€" },
  "EST": { name: "Estonia", code: "EUR", symbol: "€" },
  "LVA": { name: "Latvia", code: "EUR", symbol: "€" },
  "LTU": { name: "Lithuania", code: "EUR", symbol: "€" },
  "BGR": { name: "Bulgaria", code: "BGN", symbol: "лв" },
  "HRV": { name: "Croatia", code: "EUR", symbol: "€" },
  "ISL": { name: "Iceland", code: "ISK", symbol: "kr" },
  "MEX": { name: "Mexico", code: "MXN", symbol: "$" },
  "CHL": { name: "Chile", code: "CLP", symbol: "$" },
  "COL": { name: "Colombia", code: "COP", symbol: "$" },
  "CRI": { name: "Costa Rica", code: "CRC", symbol: "₡" },
  "TUR": { name: "Türkiye", code: "TRY", symbol: "₺" },
  "KOR": { name: "Korea", code: "KRW", symbol: "₩" },
  "NZL": { name: "New Zealand", code: "NZD", symbol: "$" },
  "ISR": { name: "Israel", code: "ILS", symbol: "₪" },
  "LUX": { name: "Luxembourg", code: "EUR", symbol: "€" },
};

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
  const years = toYear - fromYear;
  if (years === 0) {
    return {
      adjustedAmount: amount,
      totalInflation: 0,
      yearlyBreakdown: [],
    };
  }

  const countryData = CPI_DATA[country];
  if (!countryData || !countryData[fromYear] || !countryData[toYear]) {
    return {
      adjustedAmount: amount,
      totalInflation: 0,
      yearlyBreakdown: [],
      error: "Data not available for selected years",
    };
  }

  const fromCPI = countryData[fromYear];
  const toCPI = countryData[toYear];
  
  // Adjust amount based on CPI ratio
  const adjustedAmount = (amount * toCPI) / fromCPI;
  const totalInflation = ((adjustedAmount - amount) / amount) * 100;

  // Generate yearly breakdown
  const yearlyBreakdown = [];
  const step = years > 0 ? 1 : -1;
  const startYear = years > 0 ? fromYear : toYear;
  const endYear = years > 0 ? toYear : fromYear;
  
  for (let year = startYear; year <= endYear; year++) {
    if (countryData[year]) {
      const yearAmount = (amount * countryData[year]) / fromCPI;
      const prevYear = year - 1;
      let yearlyInflation = 0;
      
      if (year > startYear && countryData[prevYear]) {
        yearlyInflation = ((countryData[year] - countryData[prevYear]) / countryData[prevYear]) * 100;
      }
      
      yearlyBreakdown.push({
        year,
        amount: yearAmount,
        yearlyInflation,
        cpi: countryData[year],
      });
    }
  }

  return {
    adjustedAmount,
    totalInflation,
    yearlyBreakdown: years < 0 ? yearlyBreakdown.reverse() : yearlyBreakdown,
  };
}

function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function InflationCalculator() {
  const [amount, setAmount] = useState(1000);
  const [country, setCountry] = useState("United States");
  const [fromYear, setFromYear] = useState(2020);
  const [toYear, setToYear] = useState(2024);
  const [cpiData, setCpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

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
  
  // Get available year range for selected country
  const availableYears = useMemo(() => {
    if (!cpiData || !cpiData[country]) return [];
    return Object.keys(cpiData[country]).map(Number).sort((a, b) => a - b);
  }, [cpiData, country]);

  const minYear = availableYears.length > 0 ? availableYears[0] : 1950;
  const maxYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : currentYear;

  const result = useMemo(() => {
    if (!cpiData) return { adjustedAmount: 0, totalInflation: 0, yearlyBreakdown: [] };
    return calculateInflationAdjustment(amount, country, fromYear, toYear, cpiData);
  }, [amount, country, fromYear, toYear, cpiData]);

  const countryInfo = Object.values(COUNTRY_MAP).find(c => c.name === country);
  const isFutureCalculation = toYear > fromYear;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
        <div className="text-center py-12">
          <div className="text-slate-600">Loading inflation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Inflation Calculator
          </h1>
          <p className="text-sm text-slate-600">
            Adjust amounts for inflation based on country-specific rates. Calculate past purchasing power or future values.
          </p>
        </div>
      </header>

      {/* Inputs */}
      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Amount
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From Year
          </label>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            To Year
          </label>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </section>

      {availableYears.length > 0 && (
        <div className="mb-4 text-xs text-slate-500">
          Data available for {country}: {minYear} - {maxYear}
        </div>
      )}

      {/* Summary cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Original amount ({fromYear})
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {countryInfo?.symbol}{formatCurrency(amount)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isFutureCalculation ? `Projected value (${toYear})` : `Equivalent in ${toYear}`}
          </div>
          <div className="mt-1 text-lg font-semibold text-indigo-700">
            {countryInfo?.symbol}{formatCurrency(result.adjustedAmount)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isFutureCalculation ? 'Total inflation' : 'Purchasing power change'}
          </div>
          <div className={`mt-1 text-lg font-semibold ${result.totalInflation >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {result.totalInflation >= 0 ? '+' : ''}{formatCurrency(result.totalInflation, 1)}%
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
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-indigo-700">
              {isFutureCalculation ? 'Inflation Impact' : 'Purchasing Power'}
            </div>
            <div className="mt-1 text-sm text-indigo-900">
              {isFutureCalculation ? (
                <>
                  {countryInfo?.symbol}{formatCurrency(amount)} in {fromYear} will have the purchasing power of{' '}
                  <strong>{countryInfo?.symbol}{formatCurrency(result.adjustedAmount)}</strong> in {toYear}
                  {' '}(based on historical CPI data).
                </>
              ) : (
                <>
                  {countryInfo?.symbol}{formatCurrency(amount)} in {fromYear} had the same purchasing power as{' '}
                  <strong>{countryInfo?.symbol}{formatCurrency(result.adjustedAmount)}</strong> in {toYear}
                  {' '}(based on actual CPI data).
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Chart */}
      {result.yearlyBreakdown.length > 1 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-slate-700">
            Value over time
          </h2>
          <div style={{ width: '100%', height: '320px' }} className="rounded-xl border border-slate-200 bg-slate-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={result.yearlyBreakdown}
                margin={{ top: 12, right: 20, left: 10, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Value"]}
                  labelFormatter={(label) => `Year ${label}`}
                  wrapperClassName="!text-xs"
                />
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name={`Value (${countryInfo?.symbol})`}
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Year-by-year breakdown */}
      {result.yearlyBreakdown.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-700">
            Year-by-year breakdown
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-right">Annual Inflation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {result.yearlyBreakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/80">
                    <td className="px-3 py-1.5 text-slate-700">{row.year}</td>
                    <td className="px-3 py-1.5 text-right text-slate-800 font-mono">
                      {countryInfo?.symbol}{formatCurrency(row.amount)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-slate-600">
                      {row.yearlyInflation === 0 ? '-' : `${formatCurrency(row.yearlyInflation, 1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <p>
              <strong>Note:</strong> This calculator uses actual Consumer Price Index (CPI) data from OECD.
              The CPI measures changes in the price level of a basket of consumer goods and services.
            </p>
            <p className="text-slate-400">
              Source:{" "}
              <a
                href="https://data-explorer.oecd.org/vis?lc=en&pg=0&bp=true&snb=20&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PRICES%40DF_PRICES_ALL&df[ag]=OECD.SDD.TPS&df[vs]=1.0&tm=Inflation%20%28CPI%29.A.N.CPI.PA._T.N.GY&to[TIME_PERIOD]=false&vw=tb&lb=bt&dq=.A.N.CPI.IX._T.N.GY%2B_Z&pd=%2C"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline"
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
