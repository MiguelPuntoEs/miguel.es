import { useState, useMemo } from "react";

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
  const [amountInput, setAmountInput] = useState("1000");
  const [fromCountry, setFromCountry] = useState("United States");
  const [searchTerm, setSearchTerm] = useState("");

  const parsed = Number.parseFloat(amountInput);
  const amount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

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
    <div className="max-w-5xl mx-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-lg shadow-stone-200/60">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            PPP Calculator
          </h2>
          <p className="text-sm text-stone-600">
            Convert amounts based on Purchasing Power Parity to see equivalent buying power across countries.
          </p>
        </div>
      </header>

      {/* Inputs */}
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Amount
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="1000"
            className="h-9 rounded-lg border border-stone-300 bg-stone-50 px-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-inner focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            From Country
          </label>
          <select
            value={fromCountry}
            onChange={(e) => setFromCountry(e.target.value)}
            className="h-9 rounded-lg border border-stone-300 bg-stone-50 px-2 text-sm text-stone-900 shadow-inner focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {Object.keys(PPP_RATES).sort().map((country) => (
              <option key={country} value={country}>
                {country} ({PPP_RATES[country].code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Search Countries
          </label>
          <input
            type="text"
            placeholder="Filter by country or currency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-lg border border-stone-300 bg-stone-50 px-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-inner focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </section>

      {/* Summary card */}
      <section className="mb-6">
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-accent-dark">
            Converting
          </div>
          <div className="mt-1 text-lg font-semibold text-ink">
            {fromCurrency?.symbol}{formatCurrency(amount)} ({fromCountry})
          </div>
          <div className="mt-1 text-xs text-accent">
            Shows equivalent purchasing power in other countries
          </div>
        </div>
      </section>

      {/* Conversions Table */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-stone-700">
          PPP-Equivalent Amounts ({filteredConversions.length} countries)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50">
          <table className="min-w-full text-xs">
            <thead className="bg-stone-100 text-left text-[0.7rem] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Currency</th>
                <th className="px-3 py-2 text-right">PPP-Equivalent Amount</th>
                <th className="px-3 py-2 text-right">PPP Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredConversions.map((conversion) => {
                const isSourceCountry = conversion.country === fromCountry;
                return (
                  <tr
                    key={conversion.country}
                    className={`hover:bg-stone-50/80 ${
                      isSourceCountry ? "bg-accent/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-stone-700 font-medium">
                      {conversion.country}
                      {isSourceCountry && (
                        <span className="ml-2 text-[0.65rem] text-accent font-semibold">
                          (SOURCE)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {conversion.code}
                    </td>
                    <td className="px-3 py-2 text-right text-stone-800 font-mono">
                      {conversion.symbol}{formatCurrency(conversion.amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-stone-600 font-mono text-[0.7rem]">
                      {formatCurrency(conversion.rate, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-xs text-stone-500 space-y-1">
          <p>
            <strong>Note:</strong> PPP rates show how much local currency is needed to buy the same basket of goods as 1 USD would buy in the United States.
          </p>
          <p>
            For example, if the PPP rate is 0.70, it means that 0.70 units of local currency have the same purchasing power as 1 USD in the US.
          </p>
          <p className="text-stone-400">
            Data from{" "}
            <a
              href="https://data-explorer.oecd.org/vis?fs[0]=Topic%2C1%7CEconomy%23ECO%23%7CPrices%23ECO_PRI%23&pg=20&fc=Topic&bp=true&snb=30&vw=tb&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PPP%40DF_PPP&df[ag]=OECD.SDD.TPS&df[vs]=1.0&dq=.A.PPP..XDC_USD.USA&pd=2024%2C2024&to[TIME_PERIOD]=false"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-dark underline"
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
