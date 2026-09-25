import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COMPOUNDING_OPTIONS = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
];

const CONTRIBUTION_FREQUENCY_OPTIONS = [
  { value: 1, label: "Annually" },
  { value: 2, label: "Semi-annually" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
];

const GROWTH_MODES = [
  { value: "flat", label: "Flat" },
  { value: "arithmetic", label: "Arithmetic" },
  { value: "geometric", label: "Geometric" },
];

const FREQUENCY_VALUES = COMPOUNDING_OPTIONS.map((o) => o.value);
const GROWTH_MODE_VALUES = GROWTH_MODES.map((o) => o.value);

// Read shareable state from the URL, e.g.
// ?p=1000&c=200&cf=12&rate=7&y=20&timing=ordinary&cap=12&g=flat
function readParamsFromURL() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out = {};

  const num = (key) => {
    const value = Number.parseFloat(params.get(key));
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  const freq = (key) => {
    const value = Number.parseInt(params.get(key), 10);
    return FREQUENCY_VALUES.includes(value) ? value : undefined;
  };

  const p = num("p");
  if (p !== undefined) out.principal = p;
  const c = num("c");
  if (c !== undefined) out.contributionAmount = c;
  const cf = freq("cf");
  if (cf !== undefined) out.contributionsPerYear = cf;
  const g = params.get("g");
  if (GROWTH_MODE_VALUES.includes(g)) out.contributionGrowth = g;
  const gamt = num("gamt");
  if (gamt !== undefined) out.growthAmount = gamt;
  const grate = num("grate");
  if (grate !== undefined) out.growthRate = grate;
  const rate = num("rate");
  if (rate !== undefined) out.annualRate = rate;
  const y = num("y");
  if (y !== undefined) out.years = y;
  const timing = params.get("timing");
  if (timing === "ordinary" || timing === "due") out.paymentTiming = timing;
  const cap = freq("cap");
  if (cap !== undefined) out.compoundsPerYear = cap;

  return out;
}

const INITIAL = readParamsFromURL();

function effectiveAnnualRate(annualRate, compoundsPerYear) {
  const r = Number(annualRate) || 0;
  const m = Number(compoundsPerYear) || 12;
  return (Math.pow(1 + r / 100 / m, m) - 1) * 100;
}

function calculateSchedule({
  principal,
  contributionAmount,
  contributionsPerYear = 12,
  contributionGrowth = "flat",
  growthAmount = 0,
  growthRate = 0,
  annualRate,
  years,
  compoundsPerYear = 12,
  paymentTiming = "ordinary",
}) {
  const P = Number(principal) || 0;
  const C = Number(contributionAmount) || 0;
  const r = Number(annualRate) || 0;
  const t = Number(years) || 0;
  const m = Number(compoundsPerYear) || 12;
  const cf = Number(contributionsPerYear) || 12;
  const d = Number(growthAmount) || 0;
  const g = Number(growthRate) || 0;

  // Interest always accrues monthly at the nominal rate, but it's only
  // capitalized (folded into principal, so it starts compounding itself)
  // every 12/m months. Contributions land every 12/cf months, and each
  // one can grow over the previous one in an arithmetic (renta en
  // progresión aritmética, +d each time) or geometric progression
  // (renta en progresión geométrica, ×(1+g) each time).
  const monthlyNominalRate = r / 100 / 12;
  const monthsPerCompoundPeriod = 12 / m;
  const monthsPerContribution = 12 / cf;
  const totalMonths = Math.max(Math.round(t * 12), 0);

  let capitalized = P;
  let pendingInterest = 0;
  // Parallel, non-compounding track for the "simple interest" comparison
  // line: interest here is only ever computed on contributed principal,
  // and never itself earns interest.
  let simplePrincipal = P;
  let simpleInterest = 0;
  let totalContributed = P;
  let contributionIndex = 0;
  let contributedThisYear = 0;

  const schedule = [];

  if (totalMonths === 0) {
    schedule.push({
      year: 0,
      label: "0",
      balance: capitalized,
      simpleBalance: capitalized,
      totalContributed,
      totalInterest: capitalized - totalContributed,
      periodContribution: 0,
    });
    return schedule;
  }

  const applyContribution = () => {
    let amount = C;
    if (contributionGrowth === "arithmetic") amount = C + contributionIndex * d;
    if (contributionGrowth === "geometric") amount = C * Math.pow(1 + g / 100, contributionIndex);
    capitalized += amount;
    simplePrincipal += amount;
    totalContributed += amount;
    contributedThisYear += amount;
    contributionIndex += 1;
  };

  for (let month = 1; month <= totalMonths; month++) {
    const isContributionMonth = month % monthsPerContribution === 0;

    if (paymentTiming === "due") {
      // Annuity due: contribution first, then that month's interest
      if (isContributionMonth) applyContribution();
      pendingInterest += capitalized * monthlyNominalRate;
      simpleInterest += simplePrincipal * monthlyNominalRate;
    } else {
      // Ordinary annuity: interest first, then contribution
      pendingInterest += capitalized * monthlyNominalRate;
      simpleInterest += simplePrincipal * monthlyNominalRate;
      if (isContributionMonth) applyContribution();
    }

    const isCapitalizationMonth = month % monthsPerCompoundPeriod === 0;
    if (isCapitalizationMonth) {
      capitalized += pendingInterest;
      pendingInterest = 0;
    }

    const isEndOfYear = month % 12 === 0 || month === totalMonths;
    if (isEndOfYear) {
      const year = month / 12;
      const balance = capitalized + pendingInterest;
      const simpleBalance = simplePrincipal + simpleInterest;
      schedule.push({
        year,
        label: year.toFixed(1).replace(/\.0$/, ""),
        balance,
        simpleBalance,
        totalContributed,
        totalInterest: balance - totalContributed,
        periodContribution: contributedThisYear,
      });
      contributedThisYear = 0;
    }
  }

  return schedule;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

// A segmented control with a pill that slides to the active option instead
// of each button flipping its own background — reused for every toggle on
// the page so they all animate the same way.
function SegmentedControl({ options, value, onChange, className = "", label }) {
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-value="${value}"]`);
    if (active) {
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className={`relative inline-flex rounded-lg border border-line-strong bg-bg-1 p-0.5 ${className}`}
    >
      {indicator && (
        <div
          className="absolute top-0.5 bottom-0.5 rounded-md bg-blue transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden="true"
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          data-value={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors duration-200 ${
            value === option.value ? "text-white" : "text-text-2 hover:text-text-1"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// A show/hide wrapper that animates width+opacity instead of mounting or
// unmounting the child — lets a conditional field slide in next to a
// segmented control rather than popping in.
function Reveal({ show, children, className = "" }) {
  return (
    <div
      className={`overflow-hidden transition-[max-width,opacity] duration-200 ease-out ${className}`}
      style={{ maxWidth: show ? 320 : 0, opacity: show ? 1 : 0 }}
    >
      <div className="flex items-center gap-1.5 pl-0.5">{children}</div>
    </div>
  );
}

export default function CompoundCalculator() {
  const [principal, setPrincipal] = useState(INITIAL.principal ?? 1000);
  const [contributionAmount, setContributionAmount] = useState(INITIAL.contributionAmount ?? 200);
  const [contributionsPerYear, setContributionsPerYear] = useState(INITIAL.contributionsPerYear ?? 12);
  const [contributionGrowth, setContributionGrowth] = useState(INITIAL.contributionGrowth ?? "flat");
  const [growthAmount, setGrowthAmount] = useState(INITIAL.growthAmount ?? 5);
  const [growthRate, setGrowthRate] = useState(INITIAL.growthRate ?? 0.2);
  const [annualRate, setAnnualRate] = useState(INITIAL.annualRate ?? 7);
  const [years, setYears] = useState(INITIAL.years ?? 20);
  const [paymentTiming, setPaymentTiming] = useState(INITIAL.paymentTiming ?? "ordinary");
  const [compoundsPerYear, setCompoundsPerYear] = useState(INITIAL.compoundsPerYear ?? 12);
  const [copied, setCopied] = useState(false);
  const [yScale, setYScale] = useState("linear");
  const [interestMode, setInterestMode] = useState("compound");
  const [advancedOpen, setAdvancedOpen] = useState(
    () =>
      INITIAL.contributionsPerYear !== undefined ||
      INITIAL.contributionGrowth !== undefined ||
      INITIAL.paymentTiming !== undefined ||
      INITIAL.compoundsPerYear !== undefined
  );

  // Keep the URL in sync so any configuration can be shared as a link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    params.set("p", String(principal));
    params.set("c", String(contributionAmount));
    params.set("cf", String(contributionsPerYear));
    params.set("g", contributionGrowth);
    if (contributionGrowth === "arithmetic") params.set("gamt", String(growthAmount));
    if (contributionGrowth === "geometric") params.set("grate", String(growthRate));
    params.set("rate", String(annualRate));
    params.set("y", String(years));
    params.set("timing", paymentTiming);
    params.set("cap", String(compoundsPerYear));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [
    principal,
    contributionAmount,
    contributionsPerYear,
    contributionGrowth,
    growthAmount,
    growthRate,
    annualRate,
    years,
    paymentTiming,
    compoundsPerYear,
  ]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const schedule = useMemo(
    () =>
      calculateSchedule({
        principal,
        contributionAmount,
        contributionsPerYear,
        contributionGrowth,
        growthAmount,
        growthRate,
        annualRate,
        years,
        compoundsPerYear,
        paymentTiming,
      }),
    [
      principal,
      contributionAmount,
      contributionsPerYear,
      contributionGrowth,
      growthAmount,
      growthRate,
      annualRate,
      years,
      paymentTiming,
      compoundsPerYear,
    ]
  );

  // Schedule rows annotated with the "display" balance/interest for the
  // currently selected mode, so the chart and table always agree with
  // the summary cards. Also carries explicit [min, max] bands for the
  // chart: passing a two-value range per Area (rather than relying on
  // Recharts' stackId, which stacks in pixel space and breaks on a log
  // axis) keeps the two layers correctly stacked on any scale, since
  // each band's own edges are what get passed through the y-scale.
  const displaySchedule = useMemo(() => {
    // log(0) is undefined, so floor both band edges above zero in log mode.
    const floor = yScale === "log" ? 1 : 0;
    return schedule.map((row) => {
      const displayBalance = interestMode === "simple" ? row.simpleBalance : row.balance;
      const displayInterest =
        interestMode === "simple" ? row.simpleBalance - row.totalContributed : row.totalInterest;
      const contributedTop = Math.max(row.totalContributed, floor);
      const balanceTop = Math.max(displayBalance, floor);
      return {
        ...row,
        displayBalance,
        displayInterest,
        contributedRange: [floor, contributedTop],
        interestRange: [contributedTop, balanceTop],
      };
    });
  }, [schedule, interestMode, yScale]);

  const finalRow =
    displaySchedule.length > 0
      ? displaySchedule[displaySchedule.length - 1]
      : { balance: 0, simpleBalance: 0, totalContributed: 0, totalInterest: 0, displayBalance: 0, displayInterest: 0 };

  const apy = useMemo(
    () => effectiveAnnualRate(annualRate, compoundsPerYear),
    [annualRate, compoundsPerYear]
  );

  // First/last contribution preview for the growth-mode helper text —
  // computed independently of the schedule since it doesn't depend on
  // the interest side at all.
  const contributionPreview = useMemo(() => {
    if (contributionGrowth === "flat") return null;
    const cf = Number(contributionsPerYear) || 12;
    const monthsPerContribution = 12 / cf;
    const totalMonths = Math.max(Math.round((Number(years) || 0) * 12), 0);
    const count = Math.floor(totalMonths / monthsPerContribution);
    if (count === 0) return null;
    const C = Number(contributionAmount) || 0;
    const d = Number(growthAmount) || 0;
    const g = Number(growthRate) || 0;
    const last =
      contributionGrowth === "arithmetic"
        ? C + (count - 1) * d
        : C * Math.pow(1 + g / 100, count - 1);
    return { first: C, last };
  }, [contributionGrowth, contributionsPerYear, years, contributionAmount, growthAmount, growthRate]);

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-line bg-bg-1 p-6 shadow-lg shadow-black/5">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-1">
            Compound Interest Calculator
          </h2>
          <p className="text-sm text-text-2">
            Adjust the values and see how your money grows over time.
          </p>
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-bg-2 px-3 text-xs font-medium text-text-2 shadow-sm transition hover:border-blue hover:text-blue focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.54 3.54 0 0 0-5-5l-1 1" />
            <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.54 3.54 0 0 0 5 5l1-1" />
          </svg>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </header>

      {/* Core inputs */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-principal" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Initial amount
          </label>
          <input
            id="cc-principal"
            type="number"
            inputMode="decimal"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-bg-2 px-2 text-sm text-text-1 placeholder:text-text-3 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-contribution" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Contribution
          </label>
          <input
            id="cc-contribution"
            type="number"
            inputMode="decimal"
            min="0"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-bg-2 px-2 text-sm text-text-1 placeholder:text-text-3 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-rate" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Annual rate (%)
          </label>
          <input
            id="cc-rate"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-bg-2 px-2 text-sm text-text-1 placeholder:text-text-3 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
          <p className="text-[11px] text-text-3">
            ≈ {apy.toFixed(2)}% effective annual rate
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cc-years" className="text-xs font-semibold uppercase tracking-wide text-text-3">
            Years
          </label>
          <input
            id="cc-years"
            type="number"
            inputMode="decimal"
            min="0"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-bg-2 px-2 text-sm text-text-1 placeholder:text-text-3 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
      </section>

      {/* Interest: how it's calculated — kept visible since it's core to */}
      {/* what this calculator is for, not a detail */}
      <section className="mb-6 rounded-xl border border-line bg-bg-2 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-text-3">
            Interest
          </span>
          <SegmentedControl
            label="Interest"
            options={[
              { value: "compound", label: "Compound" },
              { value: "simple", label: "Simple" },
            ]}
            value={interestMode}
            onChange={setInterestMode}
          />
        </div>
        <p className="mt-2 text-xs text-text-3">
          {interestMode === "simple"
            ? "Simple: interest is only ever earned on what you've contributed, never on interest already earned."
            : "Compound: interest earns interest too, on the schedule set by Capitalization below."}
        </p>
      </section>

      {/* Advanced options */}
      <div className="mb-6 rounded-xl border border-line bg-bg-2 p-4">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          aria-controls="advanced-options-panel"
          className="flex w-full cursor-pointer select-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-3"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${advancedOpen ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            <path d="M7 4l6 6-6 6" />
          </svg>
          Advanced options
        </button>
        <div
          id="advanced-options-panel"
          className="grid transition-[grid-template-rows] duration-200 ease-out"
          style={{ gridTemplateRows: advancedOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wide text-text-3">
                  Contributions
                </span>
                <SegmentedControl
                  label="Contribution growth"
                  options={GROWTH_MODES}
                  value={contributionGrowth}
                  onChange={setContributionGrowth}
                />
                <Reveal show={contributionGrowth === "arithmetic"}>
                  <label className="flex items-center gap-1.5 text-xs text-text-2 whitespace-nowrap">
                    +
                    <input
                      type="number"
                      inputMode="decimal"
                      value={growthAmount}
                      onChange={(e) => setGrowthAmount(e.target.value)}
                      className="h-8 w-24 rounded-md border border-line-strong bg-bg-1 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                    />
                    per contribution
                  </label>
                </Reveal>
                <Reveal show={contributionGrowth === "geometric"}>
                  <label className="flex items-center gap-1.5 text-xs text-text-2 whitespace-nowrap">
                    +
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={growthRate}
                      onChange={(e) => setGrowthRate(e.target.value)}
                      className="h-8 w-20 rounded-md border border-line-strong bg-bg-1 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                    />
                    % per contribution
                  </label>
                </Reveal>
              </div>

              {contributionGrowth === "flat" ? (
                <p className="mt-2 text-xs text-text-3">
                  Every contribution is the same amount.
                </p>
              ) : (
                <p className="mt-2 text-xs text-text-3">
                  {contributionGrowth === "arithmetic"
                    ? "Renta en progresión aritmética: "
                    : "Renta en progresión geométrica: "}
                  each contribution grows over the last one.
                  {contributionPreview &&
                    ` First ${formatCurrency(contributionPreview.first)}, last ${formatCurrency(
                      contributionPreview.last
                    )}.`}
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cc-contrib-freq" className="text-xs font-semibold uppercase tracking-wide text-text-3">
                  Contribution frequency
                </label>
                <select
                  id="cc-contrib-freq"
                  value={contributionsPerYear}
                  onChange={(e) => setContributionsPerYear(Number(e.target.value))}
                  className="h-9 rounded-lg border border-line-strong bg-bg-1 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                >
                  {CONTRIBUTION_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cc-timing" className="text-xs font-semibold uppercase tracking-wide text-text-3">
                  Payment timing
                </label>
                <select
                  id="cc-timing"
                  value={paymentTiming}
                  onChange={(e) => setPaymentTiming(e.target.value)}
                  className="h-9 rounded-lg border border-line-strong bg-bg-1 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                >
                  <option value="ordinary">Ordinary annuity</option>
                  <option value="due">Annuity due</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cc-capitalization" className="text-xs font-semibold uppercase tracking-wide text-text-3">
                  Capitalization
                </label>
                <select
                  id="cc-capitalization"
                  value={compoundsPerYear}
                  onChange={(e) => setCompoundsPerYear(Number(e.target.value))}
                  className="h-9 rounded-lg border border-line-strong bg-bg-1 px-2 text-sm text-text-1 shadow-inner focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
                >
                  {COMPOUNDING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Total contributed
          </div>
          <div className="mt-1 text-lg font-semibold text-text-1">
            {formatCurrency(finalRow.totalContributed)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Total interest earned
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-700">
            {formatCurrency(finalRow.displayInterest)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-3">
            Final balance
          </div>
          <div className="mt-1 text-lg font-semibold text-blue-hover">
            {formatCurrency(finalRow.displayBalance)}
          </div>
        </div>
      </section>

      <p className="-mt-3 mb-6 text-xs text-text-3">
        Compounding advantage over simple interest:{" "}
        <span className="font-medium text-text-2">
          {formatCurrency(finalRow.balance - finalRow.simpleBalance)}
        </span>
      </p>

      {/* Chart */}
      <section className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-text-2">
            Growth over time
          </h2>
          <SegmentedControl
            label="Chart scale"
            options={[
              { value: "linear", label: "Linear" },
              { value: "log", label: "Log" },
            ]}
            value={yScale}
            onChange={setYScale}
          />
        </div>
        <div style={{ width: '100%', height: '320px' }} className="rounded-xl border border-line bg-bg-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displaySchedule}
              margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis
                scale={yScale}
                domain={yScale === "log" ? [1, "auto"] : [0, "auto"]}
                allowDataOverflow
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => compactFormatter.format(value)}
              />
              <Tooltip
                formatter={(value, name) => {
                  const amount = Array.isArray(value) ? value[1] - value[0] : value;
                  return [formatCurrency(amount), name];
                }}
                labelFormatter={(label) => `Year ${label}`}
                wrapperClassName="!text-xs"
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Area
                type="monotone"
                dataKey="contributedRange"
                name="Contributed"
                stroke="#0f9d76"
                fill="#0f9d76"
                fillOpacity={0.55}
              />
              <Area
                type="monotone"
                dataKey="interestRange"
                name={interestMode === "simple" ? "Simple interest" : "Interest"}
                stroke="#0551d8"
                fill="#0551d8"
                fillOpacity={0.55}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-text-2">
          Year-by-year breakdown
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
          <table className="min-w-full text-xs">
            <thead className="bg-bg-2 text-left text-[0.7rem] uppercase tracking-wide text-text-3">
              <tr>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-right">Contributed this year</th>
                <th className="px-3 py-2 text-right">Total contributed</th>
                <th className="px-3 py-2 text-right">Total interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-bg-1">
              {displaySchedule.map((row) => (
                <tr key={row.label} className="hover:bg-bg-2">
                  <td className="px-3 py-1.5 text-text-2">{row.label}</td>
                  <td className="px-3 py-1.5 text-right text-text-1">
                    {formatCurrency(row.displayBalance)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-text-3">
                    {formatCurrency(row.periodContribution)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-text-1">
                    {formatCurrency(row.totalContributed)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-emerald-700">
                    {formatCurrency(row.displayInterest)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}