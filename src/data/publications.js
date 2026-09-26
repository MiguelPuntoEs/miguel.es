// Research outputs that get their own HTML landing page at /publications/<slug>.
//
// Why these exist: the PDFs under /docs were crawled by Google and left
// unindexed — a bare PDF with a single inbound link from a list is a weak
// index candidate. An HTML page carrying the title, abstract and citation is
// what gets indexed and ranks; the PDF becomes the download it links to. It
// also gives each work a stable, citable URL that is not a /docs/*.pdf path.
//
// `summary` is the author's own abstract where the document has one (marked
// `abstractSource: "document"`). Where it does not, it is a factual précis
// drawn from the document's own contents and should be replaced with a proper
// abstract when one is available (`abstractSource: "precis"`).
export const PUBLICATIONS = [
  {
    slug: "quantity-theory-of-money-around-the-globe",
    title:
      "Quantity Theory of Money Around the Globe: Money Growth, Money Velocity and Inflation Subject to Different Monetary Policies",
    shortTitle: "Quantity Theory of Money Around the Globe",
    description:
      "Markov regime-switching analysis of broad money growth, money velocity and inflation in Switzerland, Japan, the US, the euro area and the UK.",
    year: "2024",
    type: "Conference paper",
    schemaType: "ScholarlyArticle",
    venue: "Economics Affairs Applied Research Workshop 2024",
    place: "Universidad Francisco Marroquín, Madrid",
    authors: ["Miguel González-Calvo"],
    keywords: ["inflation", "money velocity", "money growth", "regime switching model"],
    abstractSource: "document",
    summary: [
      "Diverse monetary policies taken by leading central banks did have different effects on inflation during and especially after the COVID-19 pandemic. While certain countries such as Switzerland and Japan registered moderate annual inflation rates under 3.5% (as measured by their respective Consumer Price Index), that was not the case for other monetary areas such as the United States, the euro area, or the United Kingdom.",
      "In the last years, theoretical approaches have been used in academia to explain the origins of inflation, including the quantity theory of money, the new Keynesian framework, the modern monetary theory, and the fiscal theory of the price level. Since the leading banks from the aforementioned monetary areas and countries implemented policies with remarkable differences in terms of broad money aggregates correlating with diverse inflation results, the «broad» quantitative theory of money can be a suitable theoretical framework to analyze the effect of broad monetary aggregates on inflation.",
      "A regime-switching model (Markov-switching model) is used to test the impact of the monetary variables (changes in money quantity and money velocity) on inflation for Switzerland, Japan, the United States, the euro area, and the United Kingdom. The fact that different monetary areas are used for the present analysis allows for a multi-region, multi-currency study of relationships between monetary aggregates, money velocity, and inflation.",
    ],
    files: [
      { label: "Paper (PDF)", href: "/docs/ea-2024.pdf" },
      { label: "Presentation (PDF)", href: "/docs/ea-2024-presentation.pdf" },
    ],
    related: [
      {
        label: "Quantity Theory of Money Around the Globe: Money Supply and Inflation",
        href: "/docs/meco-tfm.pdf",
        note: "the master's thesis this work develops, Universidad de las Hespérides, 2024",
      },
      {
        label: "Inflation Calculator",
        href: "/resources/inflation-calculator",
        note: "CPI series by country, the data underlying this kind of comparison",
      },
    ],
  },
  {
    slug: "revisiting-inflation-american-civil-war",
    title:
      "Revisiting Inflation in the American Civil War: Alternative Explanations Beyond Money Supply Growth",
    shortTitle: "Revisiting Inflation in the American Civil War",
    description:
      "Greenback inflation re-examined beyond money supply growth, built on an open transcription of Mitchell's price, wage and money stock series.",
    year: "2026",
    type: "Conference paper",
    schemaType: "ScholarlyArticle",
    venue: "APEE 50th Meeting — The History of Private Enterprise Education",
    place: "Caesars Palace, Las Vegas, Nevada",
    authors: ["Miguel González-Calvo"],
    keywords: ["greenbacks", "American Civil War", "inflation", "monetary history", "gold premium"],
    abstractSource: "precis",
    summary: [
      "The greenback inflation of the American Civil War is conventionally read as a straightforward consequence of money supply growth. This paper revisits that account and examines explanations beyond the quantity of money, drawing on a transcription of the price, wage and money stock series in Wesley C. Mitchell's A History of the Greenbacks (1903) together with the Friedman–Schwartz–Mitchell estimates in Historical Statistics of the United States.",
      "The underlying data were transcribed from page images rather than OCR and are published openly, so the empirical basis of the argument can be inspected and reused independently of the argument itself.",
    ],
    files: [{ label: "Presentation (PDF)", href: "/docs/apee-2026-presentation.pdf" }],
    related: [
      {
        label: "The greenbacks, 1859–1866",
        href: "/data/greenbacks",
        note: "the open dataset underlying this paper, released under CC0",
      },
      {
        label: "Data and code on GitHub",
        href: "https://github.com/MiguelPuntoEs/historical-monetary-data",
        note: "full transcription repository with CSVs and verification notes",
      },
    ],
  },
  {
    slug: "sistemas-de-pensiones-comparados",
    lang: "es",
    title:
      "Sistemas de pensiones comparados: ¿qué puede aprender España de Alemania, Suecia y Chile?",
    shortTitle: "Sistemas de pensiones comparados",
    description:
      "Comparativa del sistema de pensiones español con Alemania, Suecia y Chile: reparto, cuentas nocionales y capitalización individual obligatoria.",
    year: "2025",
    type: "Informe",
    schemaType: "Report",
    venue: "Centro Ruth Richardson, Universidad de las Hespérides",
    place: "Noviembre de 2025",
    authors: ["Daniel Fernández Méndez", "Santiago Calvo López", "Miguel González Calvo"],
    keywords: ["pensiones", "sistema de reparto", "cuentas nocionales", "capitalización", "España"],
    abstractSource: "document",
    summary: [
      "El informe amplía el foco de trabajos previos del Centro Ruth Richardson sobre el sistema de pensiones español —la evolución de sus reformas, el impacto de la demografía y la insostenibilidad financiera del modelo actual— para contextualizar la situación española mediante una comparativa con tres países cuyos modelos de previsión social ofrecen lecciones directas.",
      "Alemania se elige por su similitud con el caso español: un sistema predominantemente de reparto sometido a presiones demográficas y financieras análogas. Suecia representa un caso de éxito en la reforma de un sistema que partía igualmente del reparto, mediante un sistema de cuentas nocionales que introduce mecanismos automáticos de ajuste sin abandonar el reparto. Chile fue pionero en la capitalización individual pura, un paradigma distinto que basa la pensión en el ahorro personal obligatorio acumulado durante la vida laboral.",
    ],
    files: [{ label: "Informe completo (PDF)", href: "/docs/hesperides/sistemas_pensiones_comparados.pdf" }],
    related: [],
  },
  {
    slug: "coaxial-to-waveguide-transitions",
    title:
      "Full-Wave Design of Coaxial to Waveguide Transitions and Waveguide Mode Transducers",
    shortTitle: "Coaxial to Waveguide Transitions and Mode Transducers",
    description:
      "Master's thesis on full-wave design of coaxial-to-waveguide transitions and mode transducers, compared by conversion efficiency and return loss.",
    year: "2019",
    type: "Master's thesis",
    schemaType: "Thesis",
    venue: "Universidad Politécnica de Madrid",
    place: "ETSI de Telecomunicación — Señales, Sistemas y Radiocomunicaciones",
    authors: ["Miguel González Calvo"],
    supervisor: "José Ramón Montejo Garai",
    grade: "10 out of 10, with distinction",
    keywords: [
      "rectangular waveguide",
      "coaxial to waveguide transition",
      "mode transducer",
      "conversion efficiency",
      "return loss",
    ],
    abstractSource: "precis",
    summary: [
      "A full-wave design study of coaxial to waveguide transitions and waveguide mode transducers, covering rectangular waveguides dimensioned to the EIA standard and SMA-fed structures.",
      "Each design is characterised by its conversion efficiency, CE = 100·|s₂₁|², and compared on the bandwidth over which efficiency stays above 99% — equivalent to a return loss better than 20 dB. The analysis accounts for mode electric and magnetic symmetries and for the presence of higher-order modes, not only the return loss of the desired mode.",
    ],
    files: [{ label: "Thesis (PDF)", href: "/docs/mstc-tfm.pdf" }],
    related: [
      {
        label: "Additive Manufacturing of a High-Performance Q-Band Circular TE01 Mode Flared-Type Transducer",
        href: "https://doi.org/10.1109/LMWC.2019.2927842",
        note: "IEEE Microwave and Wireless Components Letters, 2019",
      },
    ],
  },
  {
    slug: "sigmet-airmet-decoding-tool",
    title: "Development of a SIGMET and AIRMET decoding web-based tool",
    shortTitle: "SIGMET and AIRMET decoding tool",
    description:
      "Bachelor's thesis: a web tool decoding SIGMET and AIRMET messages and presenting them graphically with METAR, TAF and aerodrome warnings.",
    year: "2016",
    type: "Bachelor's thesis",
    schemaType: "Thesis",
    venue: "Universidad Politécnica de Madrid",
    place: "Grado en Ingeniería Aeroespacial",
    authors: ["Miguel González Calvo"],
    grade: "9.5 out of 10",
    keywords: ["SIGMET", "AIRMET", "METAR", "TAF", "aeronautical meteorology", "aviation weather"],
    abstractSource: "precis",
    summary: [
      "A web-based tool that decodes SIGMET and AIRMET aeronautical meteorological messages and presents them graphically alongside METAR, TAF and aerodrome warnings.",
      "The work covers the message grammar field by field — the header line, the FIR/UIR/CTA name, the observed or forecast phenomenon, location, level, movement and intensity changes — and turns that structure into a graphical presentation intended for flight preparation rather than raw code reading.",
    ],
    files: [{ label: "Thesis (PDF, Spanish)", href: "/docs/gia-tfg.pdf" }],
    related: [],
  },
];
