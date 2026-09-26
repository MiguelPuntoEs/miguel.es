// Currency pairs that show real search demand for a PPP comparison. Each one
// builds a page at /resources/ppp-calculator/<slug>. Rates are never stored
// here — they are read from ppp-rates.js so a data refresh updates every page.
//
// `country` is the PPP_RATES key the currency maps to. The euro has no single
// PPP rate (it is measured per country, not per currency), so that pair is
// rendered from the whole euro-area set instead.
export const PPP_PAIRS = [
  {
    slug: "usd-to-eur",
    title: "USD to EUR",
    euroArea: true,
    currency: "EUR",
    teaser: "why there is no single euro PPP rate, and what each euro country's rate is",
    heading: "USD to EUR purchasing power parity",
    description:
      "Dollar-to-euro purchasing power parity on OECD data. The euro has no single PPP rate — it differs by country, and this page lists every euro-area rate.",
    context: [
      "There is no single dollar-to-euro PPP rate, and any site that quotes one is quietly picking a country for you. Purchasing power parity is measured against a national consumption basket, and prices inside the euro area differ enough that the same euro buys substantially different amounts depending on where it is spent.",
      "That is the most useful thing this page can tell you: pick the country you actually mean. Converting a salary offer from New York to Lisbon and converting it to Dublin give very different answers, even though both are quoted in euros.",
    ],
    faqs: [
      {
        question: "Why is there no single USD to EUR purchasing power parity rate?",
        answer:
          "Because PPP is calculated against a national basket of goods and services, not against a currency. Twenty countries share the euro but have different price levels, so each has its own PPP rate against the dollar. A single euro figure would be an average that matches no actual country.",
      },
      {
        question: "Which euro country's rate should I use?",
        answer:
          "The one where the money will actually be spent. If you are comparing a job offer, use the country you would live in. If you are comparing national statistics, use the country the figure refers to. Using an unweighted euro-area average will misstate both.",
      },
    ],
  },
  {
    slug: "usd-to-jpy",
    title: "USD to JPY",
    country: "Japan",
    currency: "JPY",
    teaser: "the gap between Japan's PPP rate and the market rate, and what it means",
    heading: "USD to JPY purchasing power parity",
    description:
      "Dollar-to-yen purchasing power parity on OECD data, worked in both directions, and why it differs so much from the market exchange rate.",
    context: [
      "The dollar–yen pair is the textbook case of PPP and the market rate parting company. In recent years the market rate has traded well above the PPP rate, and that gap is the arithmetic behind Japan feeling inexpensive to foreign visitors: domestic prices have not moved to match where the currency trades.",
      "For anyone comparing a Japanese salary or price to a US one, this makes the choice of rate consequential rather than academic. Converting at the market rate understates what the money buys inside Japan; converting at PPP is the closer measure of living standards.",
    ],
    faqs: [
      {
        question: "Why is the USD/JPY PPP rate so different from the exchange rate?",
        answer:
          "Market exchange rates are set by capital flows, interest-rate differentials and expectations, none of which have to track domestic price levels. Interest-rate divergence in particular has moved the yen a long way from where relative prices would put it, while prices inside Japan adjusted far more slowly.",
      },
      {
        question: "Which rate should I use to compare a Japanese and a US salary?",
        answer:
          "PPP, if the question is standard of living — it reflects what each salary buys where it is earned. Use the market rate only if the money will actually be converted and spent across the border.",
      },
    ],
  },
  {
    slug: "usd-to-gbp",
    title: "USD to GBP",
    country: "United Kingdom",
    currency: "GBP",
    teaser: "dollar and pound compared at purchasing power rather than the market rate",
    heading: "USD to GBP purchasing power parity",
    description:
      "Dollar-to-pound purchasing power parity on OECD data, worked in both directions, with the formula and how it compares to the market rate.",
    context: [
      "Dollar and pound sit closer together at PPP than the market rate usually suggests, which is why a dollar salary converted to sterling at the market rate tends to overstate how much better off it leaves you in the UK.",
      "The comparison is most often made for salaries and relocation, where the honest question is not how many pounds the dollars convert into but what each buys in its own country.",
    ],
    faqs: [
      {
        question: "Is the pound overvalued or undervalued against the dollar?",
        answer:
          "PPP gives you the benchmark, not the verdict: if the market rate sits above the PPP rate the pound is cheap relative to relative prices, and below it the pound is expensive. Compare the PPP rate on this page with today's market rate to see which way the gap currently runs.",
      },
      {
        question: "Does this account for London being more expensive than the rest of the UK?",
        answer:
          "No. OECD PPP rates are national averages across the whole consumption basket, so a London-specific comparison would need a city-level cost-of-living adjustment on top of the national PPP figure.",
      },
    ],
  },
  {
    slug: "usd-to-chf",
    title: "USD to CHF",
    country: "Switzerland",
    currency: "CHF",
    teaser: "why Swiss salaries look larger at the market rate than at PPP",
    heading: "USD to CHF purchasing power parity",
    description:
      "Purchasing power parity between the US dollar and the Swiss franc, on OECD data, worked in both directions — and why Swiss pay converts less impressively at PPP.",
    context: [
      "Switzerland is the clearest example of a high-price economy where the market exchange rate flatters incomes. Swiss salaries converted to dollars at the market rate look extraordinary; converted at purchasing power parity they stay high but far less dramatically so, because Swiss domestic prices are correspondingly high.",
      "This is the single most useful adjustment to make when weighing a Swiss job offer against one elsewhere — the market-rate conversion is measuring the currency, not the standard of living.",
    ],
    faqs: [
      {
        question: "Why do Swiss salaries look so much lower after a PPP adjustment?",
        answer:
          "Because the adjustment removes the part of the gap that is just high Swiss prices. Rent, food and services cost more in Switzerland, so a franc buys less at home than its market-rate dollar value implies. The PPP-converted figure is what the salary is worth in like-for-like consumption.",
      },
      {
        question: "Is Switzerland still a high-income country after adjusting for PPP?",
        answer:
          "Yes — the adjustment narrows the gap considerably but does not close it. Swiss incomes remain among the highest in the OECD on a PPP basis; they are simply not as far ahead as a market-rate conversion suggests.",
      },
    ],
  },
  {
    slug: "usd-to-cad",
    title: "USD to CAD",
    country: "Canada",
    currency: "CAD",
    teaser: "the US–Canada comparison at purchasing power, not the market rate",
    heading: "USD to CAD purchasing power parity",
    description:
      "US-to-Canadian dollar purchasing power parity on OECD data, worked in both directions, with the formula and a market-rate comparison.",
    context: [
      "The two North American dollars are close enough at PPP that the difference between converting at PPP and at the market rate is easy to overlook — and large enough to matter over a full salary.",
      "Because the economies are so integrated, this is one of the pairs where people most often reach for the market rate out of habit. For cross-border salary and cost-of-living comparisons the PPP rate is the more meaningful one.",
    ],
    faqs: [
      {
        question: "Is a Canadian dollar worth more or less than a US dollar at PPP?",
        answer:
          "Less — it takes more than one Canadian dollar to buy in Canada what one US dollar buys in the United States. The exact rate is on this page, computed from OECD household consumption PPPs.",
      },
      {
        question: "Why does my salary comparison differ from a simple exchange-rate conversion?",
        answer:
          "Because the market rate and the PPP rate are not the same number. The market rate tells you what the money converts into; the PPP rate tells you what it buys at home. For deciding where you are better off, the second is the relevant one.",
      },
    ],
  },
  {
    slug: "usd-to-nok",
    title: "USD to NOK",
    country: "Norway",
    currency: "NOK",
    teaser: "Norwegian prices and pay compared at purchasing power parity",
    heading: "USD to NOK purchasing power parity",
    description:
      "Purchasing power parity between the US dollar and the Norwegian krone, on OECD data, worked in both directions with the formula and a comparison to the market rate.",
    context: [
      "Norway is another high-price economy where the PPP adjustment does real work: krone incomes that look modest converted at the market rate, or generous converted the other way, need the domestic price level put back in before the comparison means anything.",
      "The same adjustment explains why visitors find Norway expensive while Norwegian wages do not feel correspondingly high to residents — both facts are the same price level seen from two directions.",
    ],
    faqs: [
      {
        question: "Why is Norway so expensive for visitors but not for residents?",
        answer:
          "A visitor converts money at the market rate and then faces Norwegian prices, so the high domestic price level hits in full. A resident earns at the Norwegian price level too, so wages and prices move together. PPP is the rate that puts both sides on the same footing.",
      },
      {
        question: "Does the PPP rate account for Norway's oil wealth?",
        answer:
          "Only indirectly. PPP measures relative prices of consumption goods, not national wealth or sovereign fund income. Those show up in Norwegian incomes and public services rather than in the conversion rate itself.",
      },
    ],
  },
];
