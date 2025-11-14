import React, { useState, useMemo } from "react";

// PPP conversion rates relative to USD
// Source: OECD - PPP detailed results, 2020 onwards
// Household final consumption expenditure, 2024, National currency per US dollar
// https://data-explorer.oecd.org/vis?fs[0]=Topic%2C1%7CEconomy%23ECO%23%7CPrices%23ECO_PRI%23&pg=20&fc=Topic&bp=true&snb=30&vw=tb&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PPP%40DF_PPP&df[ag]=OECD.SDD.TPS&df[vs]=1.0&dq=.A.PPP..XDC_USD.USA&pd=2024%2C2024&to[TIME_PERIOD]=false
// These represent how much local currency is needed to buy the same basket of goods as 1 USD would buy in the US
const PPP_RATES = {
  "United States": { code: "USD", rate: 1.0, symbol: "$" },
  "Australia": { code: "AUD", rate: 1.44, symbol: "$" },
  "Austria": { code: "EUR", rate: 0.752, symbol: "€" },
  "Belgium": { code: "EUR", rate: 0.776, symbol: "€" },
  "Bulgaria": { code: "BGN", rate: 0.778, symbol: "лв" },
  "Canada": { code: "CAD", rate: 1.2, symbol: "$" },
  "Chile": { code: "CLP", rate: 499.0, symbol: "$" },
  "Colombia": { code: "COP", rate: 1639.0, symbol: "$" },
  "Costa Rica": { code: "CRC", rate: 346.0, symbol: "₡" },
  "Croatia": { code: "EUR", rate: 0.508, symbol: "€" },
  "Cyprus": { code: "EUR", rate: 0.618, symbol: "€" },
  "Czechia": { code: "CZK", rate: 14.8, symbol: "Kč" },
  "Denmark": { code: "DKK", rate: 7.11, symbol: "kr" },
  "Estonia": { code: "EUR", rate: 0.666, symbol: "€" },
  "Finland": { code: "EUR", rate: 0.823, symbol: "€" },
  "France": { code: "EUR", rate: 0.741, symbol: "€" },
  "Germany": { code: "EUR", rate: 0.724, symbol: "€" },
  "Greece": { code: "EUR", rate: 0.573, symbol: "€" },
  "Hungary": { code: "HUF", rate: 194.0, symbol: "Ft" },
  "Iceland": { code: "ISK", rate: 161.0, symbol: "kr" },
  "Ireland": { code: "EUR", rate: 0.92, symbol: "€" },
  "Israel": { code: "ILS", rate: 3.71, symbol: "₪" },
  "Italy": { code: "EUR", rate: 0.65, symbol: "€" },
  "Japan": { code: "JPY", rate: 101.0, symbol: "¥" },
  "Korea": { code: "KRW", rate: 933.0, symbol: "₩" },
  "Latvia": { code: "EUR", rate: 0.545, symbol: "€" },
  "Lithuania": { code: "EUR", rate: 0.544, symbol: "€" },
  "Luxembourg": { code: "EUR", rate: 0.885, symbol: "€" },
  "Malta": { code: "EUR", rate: 0.61, symbol: "€" },
  "Mexico": { code: "MXN", rate: 11.0, symbol: "$" },
  "Netherlands": { code: "EUR", rate: 0.773, symbol: "€" },
  "New Zealand": { code: "NZD", rate: 1.49, symbol: "$" },
  "Norway": { code: "NOK", rate: 9.61, symbol: "kr" },
  "Poland": { code: "PLN", rate: 2.07, symbol: "zł" },
  "Portugal": { code: "EUR", rate: 0.579, symbol: "€" },
  "Romania": { code: "RON", rate: 2.11, symbol: "lei" },
  "Slovak Republic": { code: "EUR", rate: 0.564, symbol: "€" },
  "Slovenia": { code: "EUR", rate: 0.601, symbol: "€" },
  "Spain": { code: "EUR", rate: 0.606, symbol: "€" },
  "Sweden": { code: "SEK", rate: 8.77, symbol: "kr" },
  "Switzerland": { code: "CHF", rate: 1.11, symbol: "CHF" },
  "Türkiye": { code: "TRY", rate: 12.6, symbol: "₺" },
  "United Kingdom": { code: "GBP", rate: 0.703, symbol: "£" },
};

function calculatePPPConversions(amount, fromCountry) {
  const fromRate = PPP_RATES[fromCountry]?.rate || 1.0;
  
  // Convert to USD PPP equivalent first
  const usdPPPEquivalent = amount / fromRate;
  
  // Then convert to all other currencies
  return Object.entries(PPP_RATES).map(([country, data]) => ({
    country,
    code: data.code,
    symbol: data.symbol,
    amount: usdPPPEquivalent * data.rate,
    rate: data.rate,
  }));
}

function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function PPPCalculator() {
  const [amount, setAmount] = useState(1000);
  const [fromCountry, setFromCountry] = useState("United States");
  const [searchTerm, setSearchTerm] = useState("");

  const conversions = useMemo(
    () => calculatePPPConversions(amount, fromCountry),
    [amount, fromCountry]
  );

  const filteredConversions = useMemo(() => {
    if (!searchTerm) return conversions;
    const term = searchTerm.toLowerCase();
    return conversions.filter(
      (c) =>
        c.country.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [conversions, searchTerm]);

  const fromCurrency = PPP_RATES[fromCountry];

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            PPP Calculator
          </h1>
          <p className="text-sm text-slate-600">
            Convert amounts based on Purchasing Power Parity to see equivalent buying power across countries.
          </p>
        </div>
      </header>

      {/* Inputs */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
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
            From Country
          </label>
          <select
            value={fromCountry}
            onChange={(e) => setFromCountry(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.keys(PPP_RATES).sort().map((country) => (
              <option key={country} value={country}>
                {country} ({PPP_RATES[country].code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search Countries
          </label>
          <input
            type="text"
            placeholder="Filter by country or currency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </section>

      {/* Summary card */}
      <section className="mb-6">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-indigo-700">
            Converting
          </div>
          <div className="mt-1 text-lg font-semibold text-indigo-900">
            {fromCurrency?.symbol}{formatCurrency(amount)} ({fromCountry})
          </div>
          <div className="mt-1 text-xs text-indigo-600">
            Shows equivalent purchasing power in other countries
          </div>
        </div>
      </section>

      {/* Conversions Table */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          PPP-Equivalent Amounts ({filteredConversions.length} countries)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2 text-right">PPP-Equivalent Amount</th>
                <th className="px-3 py-2 text-right">PPP Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredConversions.map((conversion) => {
                const isSourceCountry = conversion.country === fromCountry;
                return (
                  <tr
                    key={conversion.country}
                    className={`hover:bg-slate-50/80 ${
                      isSourceCountry ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-700 font-medium">
                      {conversion.country}
                      {isSourceCountry && (
                        <span className="ml-2 text-[0.65rem] text-indigo-600 font-semibold">
                          (SOURCE)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {conversion.code}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800 font-mono">
                      {conversion.symbol}{formatCurrency(conversion.amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600 font-mono text-[0.7rem]">
                      {formatCurrency(conversion.rate, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-xs text-slate-500 space-y-1">
          <p>
            <strong>Note:</strong> PPP rates show how much local currency is needed to buy the same basket of goods as 1 USD would buy in the United States.
          </p>
          <p>
            For example, if the PPP rate is 0.70, it means that 0.70 units of local currency have the same purchasing power as 1 USD in the US.
          </p>
          <p className="text-slate-400">
            Data from{" "}
            <a
              href="https://data-explorer.oecd.org/vis?fs[0]=Topic%2C1%7CEconomy%23ECO%23%7CPrices%23ECO_PRI%23&pg=20&fc=Topic&bp=true&snb=30&vw=tb&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PPP%40DF_PPP&df[ag]=OECD.SDD.TPS&df[vs]=1.0&dq=.A.PPP..XDC_USD.USA&pd=2024%2C2024&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              OECD (2024)
            </a>{" "}
            - Household final consumption expenditure PPP rates. Actual purchasing power may vary by region and product category.
          </p>
        </div>
      </section>
    </div>
  );
}
