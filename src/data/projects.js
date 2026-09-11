// Single source for the Projects section, the /projects index and each project
// page, so a change to a summary or badge shows up everywhere.
export const PROJECTS = [
  {
    slug: "gnss-calculator",
    url: "/projects/gnss-calculator",
    name: "GNSS Calculator",
    icon: "i-signal",
    platform: "Web",
    summary:
      "Time and coordinate conversion across GPS, Galileo and BeiDou, plus RINEX and NMEA inspection",
    external: { label: "gnsscalc.com", href: "https://gnsscalc.com" },
  },
  {
    slug: "proxima-parada",
    url: "/projects/proxima-parada",
    name: "Próxima Parada",
    icon: "i-train",
    platform: "iOS",
    summary:
      "Live Renfe departures, platforms and delays on iPhone, Watch and Mac — an unofficial companion app",
    external: {
      label: "App Store",
      href: "https://apps.apple.com/es/app/id6766212839",
    },
  },
];
