import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

function calculateSchedule({
  principal,
  monthlyContribution,
  annualRate,
  years,
  compoundsPerYear = 12,
  paymentTiming = "ordinary",
}) {
  const P = Number(principal) || 0;
  const C = Number(monthlyContribution) || 0;
  const r = Number(annualRate) || 0;
  const t = Number(years) || 0;

  const ratePerPeriod = r / 100 / compoundsPerYear;
  const totalPeriods = Math.max(Math.round(t * compoundsPerYear), 0);

  let balance = P;
  let totalContributed = P;

  const schedule = [];

  if (totalPeriods === 0) {
    schedule.push({
      year: 0,
      label: "0",
      balance,
      totalContributed,
      totalInterest: balance - totalContributed,
    });
    return schedule;
  }

  for (let period = 1; period <= totalPeriods; period++) {
    if (paymentTiming === "due") {
      // Annuity due: contribution first, then interest
      balance += C;
      totalContributed += C;
      const interest = balance * ratePerPeriod;
      balance += interest;
    } else {
      // Ordinary annuity: interest first, then contribution
      const interest = balance * ratePerPeriod;
      balance += interest;
      balance += C;
      totalContributed += C;
    }

    const isEndOfYear = period % compoundsPerYear === 0 || period === totalPeriods;
    if (isEndOfYear) {
      const year = period / compoundsPerYear;
      schedule.push({
        year,
        label: year.toFixed(1).replace(/\.0$/, ""),
        balance,
        totalContributed,
        totalInterest: balance - totalContributed,
      });
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

export default function CompoundCalculator() {
  const [principal, setPrincipal] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(200);
  const [annualRate, setAnnualRate] = useState(7);
  const [years, setYears] = useState(20);
  const [paymentTiming, setPaymentTiming] = useState("ordinary");

  const schedule = useMemo(
    () =>
      calculateSchedule({
        principal,
        monthlyContribution,
        annualRate,
        years,
        compoundsPerYear: 12,
        paymentTiming,
      }),
    [principal, monthlyContribution, annualRate, years, paymentTiming]
  );

  const finalRow =
    schedule.length > 0
      ? schedule[schedule.length - 1]
      : { balance: 0, totalContributed: 0, totalInterest: 0 };

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Compound Interest Calculator
          </h1>
          <p className="text-sm text-slate-600">
            Adjust the values and see how your money grows over time.
          </p>
        </div>
      </header>

      {/* Inputs */}
      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Initial amount
          </label>
          <input
            type="number"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Monthly deposit
          </label>
          <input
            type="number"
            min="0"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Annual rate (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Years
          </label>
          <input
            type="number"
            min="0"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment timing
          </label>
          <select
            value={paymentTiming}
            onChange={(e) => setPaymentTiming(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ordinary">Ordinary annuity</option>
            <option value="due">Annuity due</option>
          </select>
        </div>
      </section>

      {/* Summary cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total contributed
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(finalRow.totalContributed)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total interest earned
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-700">
            {formatCurrency(finalRow.totalInterest)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Final balance
          </div>
          <div className="mt-1 text-lg font-semibold text-indigo-700">
            {formatCurrency(finalRow.balance)}
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          Growth over time
        </h2>
        <div style={{ width: '100%', height: '320px' }} className="rounded-xl border border-slate-200 bg-slate-50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={schedule}
              margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Year ${label}`}
                wrapperClassName="!text-xs"
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line
                type="monotone"
                dataKey="balance"
                name="Total balance"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="totalContributed"
                name="Total contributed"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          <div className="inline-flex items-center gap-1">
            <span className="h-0.5 w-6 rounded-full bg-indigo-600" />
            Total balance
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="h-0.5 w-6 rounded-full bg-emerald-600" />
            Total contributed
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          Year-by-year breakdown
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-right">Total contributed</th>
                <th className="px-3 py-2 text-right">Total interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {schedule.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/80">
                  <td className="px-3 py-1.5 text-slate-700">{row.label}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800">
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-800">
                    {formatCurrency(row.totalContributed)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-emerald-700">
                    {formatCurrency(row.totalInterest)}
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