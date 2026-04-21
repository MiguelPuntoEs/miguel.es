import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const METHODS = {
  frances: {
    label: "Francés",
    description:
      "Término amortizativo constante. Cuota de interés vencida sobre el capital vivo.",
  },
  italiano: {
    label: "Italiano",
    description:
      "Cuota de amortización constante. Cuota de interés vencida. Término amortizativo decreciente.",
  },
  americano: {
    label: "Americano",
    description:
      "Sólo cuota de interés cada período; devolución íntegra del capital al vencimiento.",
  },
};

function buildSchedule({ principal, annualRate, years, paymentsPerYear, method }) {
  const P = Number(principal) || 0;
  const annual = Number(annualRate) || 0;
  const t = Number(years) || 0;
  const m = Number(paymentsPerYear) || 12;
  const n = Math.max(Math.round(t * m), 0);
  const i = annual / 100 / m;

  const schedule = [
    {
      period: 0,
      yearFraction: 0,
      payment: 0,
      interest: 0,
      principalPaid: 0,
      balance: P,
      cumulativePrincipal: 0,
      cumulativeInterest: 0,
    },
  ];

  if (n === 0 || P <= 0) return schedule;

  let balance = P;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  if (method === "frances") {
    const C = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      let principalPaid = C - interest;
      if (k === n) principalPaid = balance;
      const payment = interest + principalPaid;
      balance -= principalPaid;
      if (Math.abs(balance) < 1e-8) balance = 0;
      cumulativePrincipal += principalPaid;
      cumulativeInterest += interest;
      schedule.push({
        period: k,
        yearFraction: k / m,
        payment,
        interest,
        principalPaid,
        balance,
        cumulativePrincipal,
        cumulativeInterest,
      });
    }
  } else if (method === "italiano") {
    const A = P / n;
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      let principalPaid = A;
      if (k === n) principalPaid = balance;
      const payment = interest + principalPaid;
      balance -= principalPaid;
      if (Math.abs(balance) < 1e-8) balance = 0;
      cumulativePrincipal += principalPaid;
      cumulativeInterest += interest;
      schedule.push({
        period: k,
        yearFraction: k / m,
        payment,
        interest,
        principalPaid,
        balance,
        cumulativePrincipal,
        cumulativeInterest,
      });
    }
  } else if (method === "americano") {
    for (let k = 1; k <= n; k++) {
      const interest = balance * i;
      const principalPaid = k === n ? balance : 0;
      const payment = interest + principalPaid;
      balance -= principalPaid;
      if (Math.abs(balance) < 1e-8) balance = 0;
      cumulativePrincipal += principalPaid;
      cumulativeInterest += interest;
      schedule.push({
        period: k,
        yearFraction: k / m,
        payment,
        interest,
        principalPaid,
        balance,
        cumulativePrincipal,
        cumulativeInterest,
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

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState(150000);
  const [annualRate, setAnnualRate] = useState(4);
  const [years, setYears] = useState(20);
  const [paymentsPerYear, setPaymentsPerYear] = useState(12);
  const [method, setMethod] = useState("frances");

  const schedule = useMemo(
    () =>
      buildSchedule({
        principal,
        annualRate,
        years,
        paymentsPerYear,
        method,
      }),
    [principal, annualRate, years, paymentsPerYear, method]
  );

  const totals = useMemo(() => {
    const last = schedule[schedule.length - 1];
    const totalInterest = last ? last.cumulativeInterest : 0;
    const totalPrincipal = last ? last.cumulativePrincipal : 0;
    const totalPaid = totalInterest + totalPrincipal;
    const firstPayment = schedule[1]?.payment ?? 0;
    const lastPayment = schedule[schedule.length - 1]?.payment ?? 0;
    return { totalInterest, totalPrincipal, totalPaid, firstPayment, lastPayment };
  }, [schedule]);

  const paymentsAreConstant = method === "frances";

  return (
    <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Calculadora de préstamos
          </h2>
          <p className="text-sm text-slate-600">
            Ajusta los parámetros del préstamo y elige el sistema de
            amortización para obtener el cuadro de amortización y las
            gráficas de capital vivo y capital amortizado.
          </p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Capital inicial
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
            Tasa anual (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Años
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pagos por año
          </label>
          <select
            value={paymentsPerYear}
            onChange={(e) => setPaymentsPerYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={1}>Anual (1)</option>
            <option value={2}>Semestral (2)</option>
            <option value={4}>Trimestral (4)</option>
            <option value={12}>Mensual (12)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sistema de amortización
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.entries(METHODS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="mb-6 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">
          {METHODS[method].label}:
        </span>{" "}
        {METHODS[method].description}
      </p>

      <section className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Capital inicial
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(totals.totalPrincipal)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cuotas de interés (total)
          </div>
          <div className="mt-1 text-lg font-semibold text-rose-700">
            {formatCurrency(totals.totalInterest)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total pagado
          </div>
          <div className="mt-1 text-lg font-semibold text-indigo-700">
            {formatCurrency(totals.totalPaid)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {paymentsAreConstant
              ? "Término amortizativo"
              : "Término amortizativo (1º / último)"}
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {paymentsAreConstant
              ? formatCurrency(totals.firstPayment)
              : `${formatCurrency(totals.firstPayment)} / ${formatCurrency(
                  totals.lastPayment
                )}`}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Capital vivo y capital amortizado
        </h3>
        <div
          style={{ width: "100%", height: "320px" }}
          className="rounded-xl border border-slate-200 bg-slate-50"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={schedule}
              margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10 }}
                label={{
                  value: "Período",
                  position: "insideBottom",
                  offset: -4,
                  style: { fontSize: 10, fill: "#64748b" },
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Período ${label}`}
                wrapperClassName="!text-xs"
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line
                type="monotone"
                dataKey="balance"
                name="Capital vivo"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="cumulativePrincipal"
                name="Capital amortizado"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Descomposición del término amortizativo: cuota de interés vs. cuota
          de amortización
        </h3>
        <div
          style={{ width: "100%", height: "320px" }}
          className="rounded-xl border border-slate-200 bg-slate-50"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={schedule.slice(1)}
              margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
              stackOffset="none"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10 }}
                label={{
                  value: "Período",
                  position: "insideBottom",
                  offset: -4,
                  style: { fontSize: 10, fill: "#64748b" },
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Período ${label}`}
                wrapperClassName="!text-xs"
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Area
                type="monotone"
                dataKey="principalPaid"
                name="Cuota de amortización"
                stackId="1"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.6}
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="interest"
                name="Cuota de interés"
                stackId="1"
                stroke="#e11d48"
                fill="#e11d48"
                fillOpacity={0.6}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-slate-700">
          Cuadro de amortización
        </h3>
        <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200 bg-slate-50">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2 text-right">Término amortizativo</th>
                <th className="px-3 py-2 text-right">Cuota de interés</th>
                <th className="px-3 py-2 text-right">Cuota de amortización</th>
                <th className="px-3 py-2 text-right">Capital amortizado</th>
                <th className="px-3 py-2 text-right">Capital vivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {schedule.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50/80">
                  <td className="px-3 py-1.5 text-slate-700">{row.period}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800">
                    {row.period === 0 ? "-" : formatCurrency(row.payment)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-rose-700">
                    {row.period === 0 ? "-" : formatCurrency(row.interest)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-emerald-700">
                    {row.period === 0 ? "-" : formatCurrency(row.principalPaid)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-emerald-700">
                    {formatCurrency(row.cumulativePrincipal)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-800">
                    {formatCurrency(row.balance)}
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
