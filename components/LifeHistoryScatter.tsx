"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import lifeHistory from "@/data/life_history.json";

// ----- types -----
type Rec = {
  name: string;
  Class: string | null;
  Order: string | null;
  Family: string | null;
  [key: string]: string | number | null;
};
type LifeHistory = {
  numericColumns: string[];
  categoricalColumns: string[];
  defaultX: string;
  defaultY: string;
  records: Rec[];
};

const DATA = lifeHistory as unknown as LifeHistory;

// Group the many taxonomic orders into a small, stable color set. Anything
// not listed falls into "Other" so the legend never explodes.
const ORDER_GROUP: Record<string, string> = {
  Rodentia: "Rodents",
  Soricomorpha: "Shrews/insectivores",
  Erinaceomorpha: "Shrews/insectivores",
  Afrosoricida: "Shrews/insectivores",
  Macroscelidea: "Shrews/insectivores",
  Scandentia: "Shrews/insectivores",
  Carnivora: "Carnivores",
  Primates: "Primates",
  Artiodactyla: "Ungulates",
  Perissodactyla: "Ungulates",
  Proboscidea: "Ungulates",
  Hyracoidea: "Ungulates",
  Tubulidentata: "Ungulates",
  Chiroptera: "Bats",
  Cetacea: "Marine",
  Sirenia: "Marine",
  Diprotodontia: "Marsupials",
  Dasyuromorphia: "Marsupials",
  Didelphimorphia: "Marsupials",
  Peramelemorphia: "Marsupials",
};

const GROUP_COLOR: Record<string, string> = {
  Rodents: "#2a78d6",
  "Shrews/insectivores": "#85b7eb",
  Carnivores: "#1baf7a",
  Primates: "#eda100",
  Ungulates: "#9085e9",
  Marine: "#e34948",
  Bats: "#e87ba4",
  Marsupials: "#eb6834",
  Other: "#6b7280",
};

// When the chart is showing a non-mammal class, the order-based grouping is
// meaningless, so we colour by Class instead. A small categorical palette.
const CLASS_PALETTE = [
  "#2a78d6", "#1baf7a", "#eda100", "#9085e9",
  "#e34948", "#e87ba4", "#eb6834", "#85b7eb", "#63992e",
];

function groupForRecord(r: Rec, colorByClass: boolean): string {
  if (colorByClass) return r.Class ?? "Unknown";
  if (r.Class !== "Mammalia") return "Other";
  return ORDER_GROUP[r.Order ?? ""] ?? "Other";
}

// least-squares fit on log10(x), log10(y) — returns slope/intercept in log space
function logRegression(pts: { x: number; y: number }[]) {
  const xs = pts.map((p) => Math.log10(p.x));
  const ys = pts.map((p) => Math.log10(p.y));
  const n = xs.length;
  const mx = d3.mean(xs)!;
  const my = d3.mean(ys)!;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  // R^2
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssTot += (ys[i] - my) ** 2;
    ssRes += (ys[i] - pred) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function niceUnitLabel(col: string): string {
  return col;
}

export default function LifeHistoryScatter() {
  const [xCol, setXCol] = useState(DATA.defaultX);
  const [yCol, setYCol] = useState(DATA.defaultY);
  const [logScale, setLogScale] = useState(true);
  const [showFit, setShowFit] = useState(true);

  // class filter — default to Mammalia (matches the page's theme)
  const allClasses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of DATA.records) {
      if (r.Class) counts.set(r.Class, (counts.get(r.Class) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);
  }, []);
  const [activeClass, setActiveClass] = useState("Mammalia");

  const colorByClass = activeClass === "All";

  // active point set
  const points = useMemo(() => {
    return DATA.records
      .filter((r) => activeClass === "All" || r.Class === activeClass)
      .map((r) => {
        const x = r[xCol];
        const y = r[yCol];
        if (typeof x !== "number" || typeof y !== "number") return null;
        if (logScale && (x <= 0 || y <= 0)) return null;
        return {
          name: r.name,
          x,
          y,
          group: groupForRecord(r, colorByClass),
        };
      })
      .filter((p): p is { name: string; x: number; y: number; group: string } => p !== null);
  }, [xCol, yCol, logScale, activeClass, colorByClass]);

  const groups = useMemo(() => {
    const set = new Set(points.map((p) => p.group));
    if (colorByClass) return [...set].sort();
    // preserve the canonical group order for mammals
    return Object.keys(GROUP_COLOR).filter((g) => set.has(g));
  }, [points, colorByClass]);

  const colorFor = (g: string, i: number) =>
    colorByClass ? CLASS_PALETTE[i % CLASS_PALETTE.length] : GROUP_COLOR[g] ?? "#6b7280";

  // toggle groups on/off
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggleGroup = (g: string) =>
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
  useEffect(() => setHidden(new Set()), [activeClass]);

  const visiblePoints = points.filter((p) => !hidden.has(p.group));

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const width = 720;
  const height = 480;
  const margin = { top: 16, right: 20, bottom: 56, left: 70 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (visiblePoints.length === 0) return;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(visiblePoints, (d) => d.x) as [number, number];
    const yExtent = d3.extent(visiblePoints, (d) => d.y) as [number, number];

    const xScale = logScale
      ? d3.scaleLog().domain([xExtent[0] * 0.8, xExtent[1] * 1.2]).range([0, innerW])
      : d3.scaleLinear().domain([0, xExtent[1] * 1.05]).range([0, innerW]);
    const yScale = logScale
      ? d3.scaleLog().domain([yExtent[0] * 0.8, yExtent[1] * 1.2]).range([innerH, 0])
      : d3.scaleLinear().domain([0, yExtent[1] * 1.05]).range([innerH, 0]);

    // grid + axes
    const xAxis = logScale
      ? d3.axisBottom(xScale).ticks(6, "~s")
      : d3.axisBottom(xScale).ticks(6);
    const yAxis = logScale
      ? d3.axisLeft(yScale).ticks(6, "~s")
      : d3.axisLeft(yScale).ticks(6);

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis as any)
      .call((sel) => sel.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
      .call((sel) => sel.selectAll("line").attr("stroke", "#1f2937"))
      .call((sel) => sel.select(".domain").attr("stroke", "#334155"));

    g.append("g")
      .call(yAxis as any)
      .call((sel) => sel.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10))
      .call((sel) => sel.selectAll("line").attr("stroke", "#1f2937"))
      .call((sel) => sel.select(".domain").attr("stroke", "#334155"));

    // gridlines
    g.append("g")
      .attr("stroke", "#111827")
      .selectAll("line")
      .data(yScale.ticks(6))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => yScale(d as number))
      .attr("y2", (d) => yScale(d as number));

    // axis labels
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 42)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text(niceUnitLabel(xCol) + (logScale ? " (log)" : ""));
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -52)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text(niceUnitLabel(yCol) + (logScale ? " (log)" : ""));

    // regression line (only meaningful in log-log per the source papers)
    if (showFit && logScale && visiblePoints.length > 2) {
      const { slope, intercept, r2 } = logRegression(visiblePoints);
      const x0 = xExtent[0];
      const x1 = xExtent[1];
      const y0 = Math.pow(10, slope * Math.log10(x0) + intercept);
      const y1 = Math.pow(10, slope * Math.log10(x1) + intercept);
      g.append("line")
        .attr("x1", xScale(x0))
        .attr("y1", yScale(y0))
        .attr("x2", xScale(x1))
        .attr("y2", yScale(y1))
        .attr("stroke", "#f5d76e")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6 4");
      g.append("text")
        .attr("x", innerW - 6)
        .attr("y", 14)
        .attr("text-anchor", "end")
        .attr("fill", "#f5d76e")
        .attr("font-size", 11)
        .text(`slope ${slope.toFixed(2)} · R² ${r2.toFixed(2)}`);
    }

    // points
    g.append("g")
      .selectAll("circle")
      .data(visiblePoints)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 3.2)
      .attr("fill", (d) => colorFor(d.group, groups.indexOf(d.group)))
      .attr("fill-opacity", 0.8)
      .attr("stroke", "#07090d")
      .attr("stroke-width", 0.5)
      .on("mouseenter", (event, d) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setTip({
          x: mx,
          y: my,
          text: `${d.name} — ${formatVal(d.x)} ${shortUnit(xCol)}, ${formatVal(d.y)} ${shortUnit(yCol)}`,
        });
      })
      .on("mouseleave", () => setTip(null));
  }, [visiblePoints, xCol, yCol, logScale, showFit, colorByClass, groups, innerW, innerH, margin.left, margin.top]);

  const selectCls =
    "bg-panel border border-rule rounded px-2 py-1 text-[12px] text-slate-200 focus:outline-none focus:border-slate-500";

  return (
    <div className="mt-10">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-1">
        Body mass vs longevity
      </div>
      <h2 className="font-serif text-xl text-slate-100 mb-1">
        Life-history trait space
      </h2>
      <p className="text-slate-400 text-[12px] mb-4 max-w-2xl leading-relaxed">
        Adult body mass against maximum lifespan across the AnAge dataset. Larger
        species tend to live longer along an allometric slope near ¼; bats, the
        naked mole-rat, and primates ride well above it. Pick any two measured
        traits for the axes, switch the class, and read the fitted log-log slope
        and R² off the dashed line.
      </p>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        <label className="text-[12px] text-slate-400 flex items-center gap-1.5">
          X axis
          <select
            className={selectCls}
            value={xCol}
            onChange={(e) => setXCol(e.target.value)}
          >
            {DATA.numericColumns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-slate-400 flex items-center gap-1.5">
          Y axis
          <select
            className={selectCls}
            value={yCol}
            onChange={(e) => setYCol(e.target.value)}
          >
            {DATA.numericColumns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-slate-400 flex items-center gap-1.5">
          Class
          <select
            className={selectCls}
            value={activeClass}
            onChange={(e) => setActiveClass(e.target.value)}
          >
            <option value="Mammalia">Mammalia</option>
            <option value="All">All classes</option>
            {allClasses
              .filter((c) => c !== "Mammalia")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </label>
        <button
          onClick={() => setLogScale((v) => !v)}
          className={`text-[12px] px-2 py-1 rounded border transition ${
            logScale
              ? "border-slate-500 text-slate-100 bg-panel"
              : "border-rule text-slate-400"
          }`}
        >
          Log scale
        </button>
        <button
          onClick={() => setShowFit((v) => !v)}
          className={`text-[12px] px-2 py-1 rounded border transition ${
            showFit
              ? "border-slate-500 text-slate-100 bg-panel"
              : "border-rule text-slate-400"
          }`}
        >
          Regression line
        </button>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
        {groups.map((grp, i) => {
          const off = hidden.has(grp);
          return (
            <button
              key={grp}
              onClick={() => toggleGroup(grp)}
              className="flex items-center gap-1.5 text-[11px] text-slate-300"
              style={{ opacity: off ? 0.35 : 1 }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: colorFor(grp, i) }}
              />
              {grp}
            </button>
          );
        })}
      </div>

      {/* chart */}
      <div className="relative border border-rule rounded bg-panel/40 p-2 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Scatter plot of ${xCol} versus ${yCol} for ${visiblePoints.length} ${
            activeClass === "All" ? "" : activeClass + " "
          }species`}
        />
        {tip && (
          <div
            className="pointer-events-none absolute z-10 rounded bg-ink/95 border border-rule px-2 py-1 text-[11px] text-slate-100 whitespace-nowrap"
            style={{
              left: Math.min(tip.x + 12, width - 220),
              top: tip.y + 12,
              transform: "translateZ(0)",
            }}
          >
            {tip.text}
          </div>
        )}
        <div className="text-right text-[10px] text-slate-500 pr-1 pb-0.5">
          {visiblePoints.length.toLocaleString()} species shown ·{" "}
          {activeClass === "All" ? "all classes" : activeClass}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        Data: AnAge (Tacutu et al. 2013; de Magalhães &amp; Costa 2009). Allometric
        framing after Healy et al. 2014 (<span className="italic">Proc. R. Soc. B</span>{" "}
        281:20140298) and the mass-longevity geometry of Szekely et al. 2015 (
        <span className="italic">PLoS Comput Biol</span> 11:e1004524). The dashed line
        is an ordinary least-squares fit on log₁₀-transformed axes for the currently
        shown species.
      </p>
    </div>
  );
}

function formatVal(v: number): string {
  if (v >= 1e6) return (v / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 }) + "M";
  if (v >= 1000) return (v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + "k";
  return (Math.round(v * 100) / 100).toLocaleString();
}

function shortUnit(col: string): string {
  const m = col.match(/\(([^)]+)\)/);
  return m ? m[1] : "";
}
