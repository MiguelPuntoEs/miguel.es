import { useEffect, useState } from "react";
import { palette } from "./theme.js";

/**
 * Follow the site's theme toggle. The site stamps data-theme on <html> before
 * first paint, so charts must read it at mount and again whenever it changes —
 * otherwise a dark-mode visitor gets light-mode ink.
 */
export function useChartTheme() {
  const [mode, setMode] = useState("light");
  useEffect(() => {
    const read = () =>
      setMode(document.documentElement.dataset.theme || "light");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, []);
  return palette(mode);
}
