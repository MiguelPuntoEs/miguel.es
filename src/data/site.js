// Employer-dependent strings live here so a job change is one edit, not a
// hunt through the layout, the footer and the JSON-LD.
export const EMPLOYER = "Banco de España";

// Standard personal-capacity disclaimer for central bank staff. Banco de España
// is part of the Eurosystem, so the usual wording names both.
export const DISCLAIMER =
  `Views and opinions expressed on this site are my own and do not represent those of ${EMPLOYER} or the Eurosystem.`;

// Pages kept on the site but out of search results: curated lists of external
// links with no commentary of their own, which can't outrank the dedicated
// lists they point at and only dilute the rest of the site. One list drives
// both the robots meta tag and the sitemap, so the two can't drift apart.
export const NOINDEX_PATHS = [
  "/resources/apis",
  "/resources/llm",
  "/resources/machine-learning",
  "/resources/python",
  "/resources/economic-sources",
];
