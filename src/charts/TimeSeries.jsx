import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useChartTheme } from "./useChartTheme.js";
import { formatDate, formatNumber } from "./theme.js";

/**
 * A time series from a generated dataset descriptor: series toggles, an optional
 * log axis, the underlying table, and a CSV of exactly what is plotted.
 *
 * The descriptor carries its own provenance (title, unit, source), so a chart
 * cannot be published without the note that says where the numbers came from.
 */
export default function TimeSeries({ src, height = 380, defaultLog = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());
  const [log, setLog] = useState(defaultLog);
  const [showTable, setShowTable] = useState(false);
  const t = useChartTheme();

  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [src]);

  const visible = useMemo(
    () => (data ? data.series.filter((s) => !hidden.has(s.key)) : []),
    [data, hidden],
  );

  /* A log axis cannot render zero or negative values; derive the domain from what
     is actually visible and positive, or Recharts silently drops the series. */
  const domain = useMemo(() => {
    if (!data || !log) return ["auto", "auto"];
    let lo = Infinity,
      hi = -Infinity;
    for (const r of data.rows)
      for (const s of visible) {
        const v = r[s.key];
        if (typeof v === "number" && v > 0) {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    return Number.isFinite(lo) ? [lo, hi] : ["auto", "auto"];
  }, [data, log, visible]);

  function toggle(key) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < (data?.series.length ?? 0) - 1) next.add(key); // keep one visible
      return next;
    });
  }

  function downloadCsv() {
    /* Export every column in the rows, not only the charted series, so ranges and
       other context survive the download. */
    const seen = new Set(["date"]);
    for (const r of data.rows) for (const k of Object.keys(r)) seen.add(k);
    const cols = [...seen].filter((c) => c !== "disagree");
    const lines = [
      `# ${data.title}`,
      `# Unit: ${data.unit}`,
      `# Source: ${data.source}`,
      cols.join(","),
      ...data.rows.map((r) => cols.map((c) => r[c] ?? "").join(",")),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error)
    return (
      <p style={{ color: t.muted, fontSize: t.TYPE.caption }}>
        Could not load data ({error}).
      </p>
    );
  if (!data) return <div style={{ height }} aria-busy="true" />;

  return (
    <figure className="my-6 not-prose">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        {data.series.map((s, i) => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              className="flex items-center gap-2 cursor-pointer"
              style={{ opacity: off ? 0.35 : 1, fontSize: t.TYPE.legend }}
            >
              <span
                style={{
                  width: 16,
                  height: 3,
                  borderRadius: 2,
                  background: t.series[i % t.series.length],
                }}
              />
              <span style={{ color: off ? t.muted : t.text }}>{s.label}</span>
            </button>
          );
        })}
        <span
          className="ml-auto flex items-center gap-3"
          style={{ fontSize: t.TYPE.legend }}
        >
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ color: t.muted }}
          >
            <input
              type="checkbox"
              checked={log}
              onChange={(e) => setLog(e.target.checked)}
            />
            log scale
          </label>
          <button
            onClick={() => setShowTable((v) => !v)}
            style={{ color: t.muted }}
            className="cursor-pointer underline-offset-2 hover:underline"
          >
            {showTable ? "hide table" : "table"}
          </button>
          <button
            onClick={downloadCsv}
            style={{ color: t.muted }}
            className="cursor-pointer underline-offset-2 hover:underline"
          >
            CSV
          </button>
        </span>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart
            data={data.rows}
            margin={{ top: 6, right: 16, bottom: 4, left: 4 }}
          >
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={t.muted}
              tick={{ fontSize: t.TYPE.axis, fill: t.muted }}
              minTickGap={36}
            />
            <YAxis
              scale={log ? "log" : "linear"}
              domain={domain}
              allowDataOverflow={log}
              stroke={t.muted}
              tick={{ fontSize: t.TYPE.axis, fill: t.muted }}
              width={56}
            />
            <Tooltip
              labelFormatter={formatDate}
              contentStyle={{
                background: t.surface,
                border: `1px solid ${t.grid}`,
                borderRadius: 8,
                fontSize: t.TYPE.caption,
                color: t.text,
              }}
            />
            {data.series.map((s, i) =>
              hidden.has(s.key) ? null : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={t.series[i % t.series.length]}
                  strokeWidth={t.STROKE.series}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showTable && (
        <div className="mt-4 overflow-x-auto">
          <table
            className="w-full tabular-nums border-collapse"
            style={{ fontSize: t.TYPE.caption }}
          >
            <thead>
              <tr>
                <th
                  className="text-left py-1.5 pr-4 font-semibold whitespace-nowrap"
                  style={{ color: t.text, borderBottom: `1px solid ${t.grid}` }}
                >
                  Date
                </th>
                {data.series.map((s) => (
                  <th
                    key={s.key}
                    className="text-right py-1.5 pl-4 font-semibold"
                    style={{
                      color: t.text,
                      borderBottom: `1px solid ${t.grid}`,
                    }}
                  >
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.date}>
                  <td
                    className="py-1 pr-4 whitespace-nowrap"
                    style={{
                      color: t.muted,
                      borderBottom: `1px solid ${t.grid}`,
                    }}
                  >
                    {formatDate(r.date)}
                  </td>
                  {data.series.map((s) => (
                    <td
                      key={s.key}
                      className="text-right py-1 pl-4"
                      style={{
                        color: t.muted,
                        borderBottom: `1px solid ${t.grid}`,
                      }}
                    >
                      {formatNumber(r[s.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <figcaption
        className="mt-3"
        style={{ color: t.muted, fontSize: t.TYPE.caption }}
      >
        <strong style={{ color: t.text }}>{data.title}.</strong> {data.unit}.{" "}
        {data.source}
      </figcaption>
    </figure>
  );
}
