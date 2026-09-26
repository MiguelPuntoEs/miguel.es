// PPP conversion rates relative to USD.
// Source: OECD — PPP detailed results, 2020 onwards.
// Household final consumption expenditure, 2024, national currency per US dollar.
// https://data-explorer.oecd.org/vis?fs[0]=Topic%2C1%7CEconomy%23ECO%23%7CPrices%23ECO_PRI%23&pg=20&fc=Topic&bp=true&snb=30&vw=tb&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_PPP%40DF_PPP&df[ag]=OECD.SDD.TPS&df[vs]=1.0&dq=.A.PPP..XDC_USD.USA&pd=2024%2C2024&to[TIME_PERIOD]=false
//
// Each rate is how much local currency buys the same basket of goods that one
// US dollar buys in the United States. Shared by the interactive calculator,
// the server-rendered table on its page, and the currency-pair pages, so a
// data refresh is a single edit here.
export const PPP_VINTAGE = "2024";

export const PPP_RATES = {
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

export function convertPPP(amount, fromCountry, toCountry) {
  const from = PPP_RATES[fromCountry];
  const to = PPP_RATES[toCountry];
  if (!from || !to) return null;
  return (amount / from.rate) * to.rate;
}
