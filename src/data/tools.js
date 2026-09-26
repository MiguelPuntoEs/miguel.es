// Single source for the Tools section on Home and on Resources, so wording
// and icons can't drift between the two. Both render the full list: six rows
// is no burden on the page, and Home is the strongest page on the site, so
// every tool should be one click from it rather than two.
export const TOOLS = [
  {
    url: "/resources/compound-calculator",
    icon: "i-layers",
    name: "Compound Interest",
    desc: "Growth with periodic contributions, charted",
  },
  {
    url: "/resources/loan-calculator",
    icon: "i-bank",
    name: "Loan Amortization",
    desc: "French, Italian and American methods side by side",
  },
  {
    url: "/resources/salary-explorer",
    icon: "i-chart",
    name: "Average Salary Explorer",
    desc: "Real vs nominal wages, compared across countries at PPP",
  },
  {
    url: "/resources/inflation-calculator",
    icon: "i-receipt",
    name: "Inflation Calculator",
    desc: "What an amount is worth over time, on actual CPI series",
  },
  {
    url: "/resources/ppp-calculator",
    icon: "i-globe",
    name: "PPP Calculator",
    desc: "Convert a salary between countries by purchasing power",
  },
  {
    url: "/qr",
    icon: "i-qr",
    name: "QR Generator",
    desc: "URLs, WiFi, vCards and crypto — generated in your browser",
  },
];
