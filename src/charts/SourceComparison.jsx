import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { useChartTheme } from "./useChartTheme.js";
import { formatDate, formatNumber } from "./theme.js";

/* Three printed renderings of one statutory schedule, plus the market it was meant
   to describe. The component exists for the disagreement: where the sources differ,
   the reader should be able to see which is which, and where the statute is silent
   the silence should be visible rather than inferred from a vanishing line. */

const DASH = {
  statute_1781_act: null,
  american_state_papers: "5 3",
  webster_1791: "2 3",
  philadelphia_market: null,
};

export default function SourceComparison({ src, from = "1780-06" }) {
  const [data, setData] = useState(null);
  const [onlyDisagreements, setOnlyDisagreements] = useState(false);
  const t = useChartTheme();

  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => r.json())
      .then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [src]);

  const {
    muted: ink,
    grid,
    surface: panel,
    text: strong,
    flag: warn,
    band: warnBand,
  } = t;
  /* The statute is the subject of this chart, so it takes the emphasis ink; the two
     compilations and the market take series colours. */
  const colours = {
    statute_1781_act: t.emphasis,
    american_state_papers: t.series[1],
    webster_1791: t.series[2],
    philadelphia_market: t.series[0],
  };

  const late = useMemo(
    () => (data ? data.rows.filter((r) => r.date >= from) : []),
    [data, from],
  );
  /* Where the statute has no entry the compilations are filling a gap. Shade it,
     so a reader sees the silence instead of inferring it from a vanishing line. */
  const silence = useMemo(() => {
    const none = late
      .filter((r) => r.statute_1781_act == null)
      .map((r) => r.date);
    if (!none.length) return null;
    const i = late.findIndex((r) => r.date === none[0]);
    return {
      from: i > 0 ? late[i - 1].date : none[0],
      to: none[none.length - 1],
      label: none[0],
    };
  }, [late]);

  const tableRows = onlyDisagreements ? late.filter((r) => r.disagree) : late;

  if (!data) return <div style={{ height: 460 }} aria-busy="true" />;

  return (
    <figure className="my-6 not-prose">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-sm">
        {data.series.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-2"
            style={{ color: strong }}
          >
            <svg width="18" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="18"
                y2="4"
                stroke={colours[s.key]}
                strokeWidth="2"
                strokeDasharray={DASH[s.key] || undefined}
              />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <LineChart
            data={late}
            margin={{ top: 6, right: 16, bottom: 4, left: 4 }}
          >
            <CartesianGrid stroke={grid} vertical={false} />
            {silence && (
              <ReferenceArea
                x1={silence.from}
                x2={silence.to}
                fill={warnBand}
                fillOpacity={1}
                stroke="none"
                label={{
                  value: "no statutory value",
                  position: "insideTopLeft",
                  fill: warn,
                  fontSize: 11,
                  offset: 10,
                }}
              />
            )}
            {silence && (
              <ReferenceLine
                x={silence.label}
                stroke={warn}
                strokeDasharray="3 3"
              />
            )}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={ink}
              tick={{ fontSize: 12, fill: ink }}
              minTickGap={28}
            />
            <YAxis stroke={ink} tick={{ fontSize: 12, fill: ink }} width={52} />
            <Tooltip
              labelFormatter={formatDate}
              contentStyle={{
                background: panel,
                border: `1px solid ${grid}`,
                borderRadius: 8,
                fontSize: 13,
                color: strong,
              }}
            />
            {data.series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={colours[s.key]}
                strokeWidth={s.key === "statute_1781_act" ? 2.5 : 2}
                strokeDasharray={DASH[s.key] || undefined}
                dot={{ r: 2.5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <p style={{ color: ink }} className="m-0">
          Rows where the three printed sources do not agree are marked.
        </p>
        <label
          className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          style={{ color: ink }}
        >
          <input
            type="checkbox"
            checked={onlyDisagreements}
            onChange={(e) => setOnlyDisagreements(e.target.checked)}
          />
          only disagreements
        </label>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm tabular-nums border-collapse">
          <thead>
            <tr>
              <th
                className="text-left py-1.5 pr-4 font-semibold"
                style={{ color: strong, borderBottom: `1px solid ${grid}` }}
              >
                Month
              </th>
              {data.series.map((s) => (
                <th
                  key={s.key}
                  className="text-right py-1.5 pl-4 font-semibold"
                  style={{ color: strong, borderBottom: `1px solid ${grid}` }}
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((r) => (
              <tr
                key={r.date}
                style={r.disagree ? { background: warnBand } : undefined}
              >
                <td
                  className="py-1 pr-4 whitespace-nowrap"
                  style={{
                    color: r.disagree ? strong : ink,
                    borderBottom: `1px solid ${grid}`,
                    fontWeight: r.disagree ? 600 : 400,
                  }}
                >
                  {formatDate(r.date)}
                </td>
                {data.series.map((s) => {
                  const v = r[s.key];
                  const missing = v == null && s.key !== "philadelphia_market";
                  return (
                    <td
                      key={s.key}
                      className="text-right py-1 pl-4"
                      style={{
                        color: missing ? warn : r.disagree ? strong : ink,
                        borderBottom: `1px solid ${grid}`,
                        fontStyle: missing ? "italic" : "normal",
                      }}
                    >
                      {v == null ? (missing ? "no entry" : "—") : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption
        className="mt-4 text-sm leading-relaxed"
        style={{ color: ink }}
      >
        <strong style={{ color: strong }}>{data.title}.</strong> {data.unit}.{" "}
        The enacted scale runs to February 1781 and stops there: the act covers
        contracts made before 1 March 1781. The values printed for March–May by
        the federal compilation, and the February figure carried forward by
        Webster, are not in the statute. The two compilations also differ for
        October 1780, where the act reads “seventy-three”. {data.source}
      </figcaption>
    </figure>
  );
}
