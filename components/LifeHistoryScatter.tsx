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

// Curated grouping for mammalian orders — keeps the legend short and stable.
const MAMMAL_ORDER_GROUP: Record<string, string> = {
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

const MAMMAL_GROUP_COLOR: Record<string, string> = {
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

// Generic categorical palette used when grouping by Class (All view) or by
// raw Order (any non-mammal single-class view).
const CATEGORICAL_PALETTE = [
  "#2a78d6", "#1baf7a", "#eda100", "#9085e9", "#e34948",
  "#e87ba4", "#eb6834", "#85b7eb", "#63992e", "#c47ad6",
  "#3ab0a8", "#d6a83a", "#8c8c8c",
];

const X_NONE = "(none — Y distribution)";

type ColorMode = "mammal-group" | "order" | "class";

function colorModeFor(activeClass: string): ColorMode {
  if (activeClass === "All") return "class";
  if (activeClass === "Mammalia") return "mammal-group";
  return "order";
}

function groupForRecord(r: Rec, mode: ColorMode): string {
  if (mode === "class") return r.Class ?? "Unknown";
  if (mode === "order") return r.Order ?? "Unknown";
  // mammal-group
  if (r.Class !== "Mammalia") return "Other";
  return MAMMAL_ORDER_GROUP[r.Order ?? ""] ?? "Other";
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

// Deterministic [0,1) jitter from a string, so the strip plot is stable
// across re-renders.
function hashJitter(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export default function LifeHistoryScatter() {
  const [xCol, setXCol] = useState<string>(DATA.defaultX);
  const [yCol, setYCol] = useState<string>(DATA.defaultY);
  const [logScale, setLogScale] = useState(true);
  const [showFit, setShowFit] = useState(true);

  const noXAxis = xCol === X_NONE;

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

  const colorMode = colorModeFor(activeClass);

  // active point set
  const points = useMemo(() => {
    return DATA.records
      .filter((r) => activeClass === "All" || r.Class === activeClass)
      .map((r) => {
        const y = r[yCol];
        if (typeof y !== "number") return null;
        if (logScale && y <= 0) return null;

        let x: number;
        if (noXAxis) {
          x = hashJitter(r.name);
        } else {
          const xv = r[xCol];
          if (typeof xv !== "number") return null;
          if (logScale && xv <= 0) return null;
          x = xv;
        }

        return {
          name: r.name,
          x,
          y,
          group: groupForRecord(r, colorMode),
        };
      })
      .filter((p): p is { name: string; x: number; y: number; group: string } => p !== null);
  }, [xCol, yCol, logScale, activeClass, colorMode, noXAxis]);

  // Stable group ordering: mammal-group uses curated order; class/order are
  // ordered by descending count so common groups read first.
  const groups = useMemo(() => {
    const set = new Set(points.map((p) => p.group));
    if (colorMode === "mammal-group") {
      return Object.keys(MAMMAL_GROUP_COLOR).filter((g) => set.has(g));
    }
    const counts = new Map<string, number>();
    for (const p of points) counts.set(p.group, (counts.get(p.group) ?? 0) + 1);
    return [...set].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  }, [points, colorMode]);

  const colorFor = (g: string, i: number) => {
    if (colorMode === "mammal-group") return MAMMAL_GROUP_COLOR[g] ?? "#6b7280";
    return CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length];
  };

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
  const zoomBehRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
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

    // clip the plot area so zoomed-out-of-range points don't leak into axes
    const clipId = "lh-clip";
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", innerW)
      .attr("height", innerH);

    const root = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ---- base scales (zoom = identity) ----
    const yExtent = d3.extent(visiblePoints, (d) => d.y) as [number, number];
    const xBase = noXAxis
      ? d3.scaleLinear().domain([0, 1]).range([0, innerW])
      : logScale
        ? d3
            .scaleLog()
            .domain([
              (d3.min(visiblePoints, (d) => d.x) as number) * 0.8,
              (d3.max(visiblePoints, (d) => d.x) as number) * 1.2,
            ])
            .range([0, innerW])
        : d3
            .scaleLinear()
            .domain([0, (d3.max(visiblePoints, (d) => d.x) as number) * 1.05])
            .range([0, innerW]);
    const yBase = logScale
      ? d3.scaleLog().domain([yExtent[0] * 0.8, yExtent[1] * 1.2]).range([innerH, 0])
      : d3.scaleLinear().domain([0, yExtent[1] * 1.05]).range([innerH, 0]);

    // ---- persistent containers ----
    const xAxisG = root.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = root.append("g");
    const gridG = root.append("g").attr("stroke", "#111827");

    // axis labels (static)
    root
      .append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 42)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text(
        noXAxis
          ? "no X axis — points jittered horizontally"
          : niceUnitLabel(xCol) + (logScale ? " (log)" : "")
      );
    root
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -52)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", 12)
      .text(niceUnitLabel(yCol) + (logScale ? " (log)" : ""));

    // regression fit (data-anchored — slope/R² don't change on zoom)
    let fit: { slope: number; intercept: number; r2: number } | null = null;
    if (!noXAxis && showFit && logScale && visiblePoints.length > 2) {
      fit = logRegression(visiblePoints);
      root
        .append("text")
        .attr("x", innerW - 6)
        .attr("y", 14)
        .attr("text-anchor", "end")
        .attr("fill", "#f5d76e")
        .attr("font-size", 11)
        .text(`slope ${fit.slope.toFixed(2)} · R² ${fit.r2.toFixed(2)}`);
    }

    // outlier point (largest log-residual from fit) — computed once
    let outlierName: string | null = null;
    if (fit) {
      let bestResid = 0;
      for (const p of visiblePoints) {
        const pred = fit.slope * Math.log10(p.x) + fit.intercept;
        const r = Math.abs(Math.log10(p.y) - pred);
        if (r > bestResid) {
          bestResid = r;
          outlierName = p.name;
        }
      }
    }
    const topYName = visiblePoints.reduce((a, b) => (b.y > a.y ? b : a)).name;
    const botYName = visiblePoints.reduce((a, b) => (b.y < a.y ? b : a)).name;
    const labelNames = Array.from(new Set([topYName, botYName, outlierName].filter(Boolean) as string[]));
    const labelPoints = labelNames
      .map((n) => visiblePoints.find((p) => p.name === n)!)
      .filter(Boolean);

    // clipped content
    const content = root.append("g").attr("clip-path", `url(#${clipId})`);
    const fitLineG = content.append("g");
    const circlesG = content.append("g");
    const labelsG = content.append("g").attr("pointer-events", "none");

    // baseline (no-X mode shows a single bottom rule)
    if (noXAxis) {
      root
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", innerH)
        .attr("y2", innerH)
        .attr("stroke", "#334155");
    }

    const styleAxis = (sel: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      sel.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 10);
      sel.selectAll("line").attr("stroke", "#1f2937");
      sel.select(".domain").attr("stroke", "#334155");
    };

    type AnyScale = d3.ScaleContinuousNumeric<number, number>;

    const draw = (xs: AnyScale, ys: AnyScale) => {
      // axes
      if (!noXAxis) {
        const xAxis = logScale
          ? d3.axisBottom(xs as any).ticks(6, "~s")
          : d3.axisBottom(xs as any).ticks(6);
        xAxisG.call(xAxis as any);
        styleAxis(xAxisG as any);
      }
      const yAxis = logScale
        ? d3.axisLeft(ys as any).ticks(6, "~s")
        : d3.axisLeft(ys as any).ticks(6);
      yAxisG.call(yAxis as any);
      styleAxis(yAxisG as any);

      // gridlines (Y)
      gridG
        .selectAll("line")
        .data(ys.ticks(6) as number[])
        .join("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", (d) => ys(d))
        .attr("y2", (d) => ys(d));

      // regression line — endpoints are data, mapped through current scales
      fitLineG.selectAll("*").remove();
      if (fit) {
        const xMin = d3.min(visiblePoints, (d) => d.x) as number;
        const xMax = d3.max(visiblePoints, (d) => d.x) as number;
        const y0 = Math.pow(10, fit.slope * Math.log10(xMin) + fit.intercept);
        const y1 = Math.pow(10, fit.slope * Math.log10(xMax) + fit.intercept);
        fitLineG
          .append("line")
          .attr("x1", xs(xMin))
          .attr("y1", ys(y0))
          .attr("x2", xs(xMax))
          .attr("y2", ys(y1))
          .attr("stroke", "#f5d76e")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "6 4");
      }

      // circles
      const circ = circlesG.selectAll<SVGCircleElement, typeof visiblePoints[number]>("circle")
        .data(visiblePoints, (d) => d.name);
      circ
        .join(
          (enter) =>
            enter
              .append("circle")
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
                  text: noXAxis
                    ? `${d.name} — ${formatVal(d.y)} ${shortUnit(yCol)}`
                    : `${d.name} — ${formatVal(d.x)} ${shortUnit(xCol)}, ${formatVal(d.y)} ${shortUnit(yCol)}`,
                });
              })
              .on("mouseleave", () => setTip(null)),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr("cx", (d) => xs(d.x))
        .attr("cy", (d) => ys(d.y));

      // extreme-point labels
      labelsG.selectAll("*").remove();
      for (const p of labelPoints) {
        const cx = xs(p.x);
        const cy = ys(p.y);
        labelsG
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 5)
          .attr("fill", "none")
          .attr("stroke", "#f8fafc")
          .attr("stroke-width", 1.2);
        const goLeft = cx > innerW - 120;
        const tx = cx + (goLeft ? -8 : 8);
        const ty = Math.max(12, Math.min(innerH - 4, cy - 8));
        labelsG
          .append("text")
          .attr("x", tx)
          .attr("y", ty)
          .attr("text-anchor", goLeft ? "end" : "start")
          .attr("fill", "#f8fafc")
          .attr("font-size", 11)
          .attr("font-style", "italic")
          .attr("stroke", "#07090d")
          .attr("stroke-width", 3)
          .attr("paint-order", "stroke")
          .text(p.name);
      }
    };

    // initial render
    draw(xBase, yBase);

    // zoom: 1× is the full view (max zoom-out), up to 50× zoom-in. Wheel
    // zooms, drag pans. In no-X mode we only zoom Y; X stays jittered 0..1.
    const zoomBeh = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 50])
      .translateExtent([
        [0, 0],
        [innerW, innerH],
      ])
      .extent([
        [0, 0],
        [innerW, innerH],
      ])
      // d3's default wheelDelta is ~0.002 per pixel — on most desktop trackpads
      // that turns one flick into a 1.5x jump. Soften it ~4x for a more gradual
      // wheel zoom; pinch-zoom (ctrlKey) stays brisker since it's deliberate.
      .wheelDelta((event) => {
        const k = event.deltaMode === 1 ? 0.0125 : event.deltaMode ? 0.25 : 0.0005;
        return -event.deltaY * k * (event.ctrlKey ? 2 : 1);
      })
      .on("zoom", (event) => {
        const t = event.transform as d3.ZoomTransform;
        const newXs = noXAxis ? xBase : (t.rescaleX(xBase as any) as AnyScale);
        const newYs = t.rescaleY(yBase as any) as AnyScale;
        draw(newXs, newYs);
      });

    zoomBehRef.current = zoomBeh;
    (svg as any).call(zoomBeh).style("cursor", "grab");
    svg.on("mousedown.cursor", () => svg.style("cursor", "grabbing"));
    svg.on("mouseup.cursor", () => svg.style("cursor", "grab"));
  }, [visiblePoints, xCol, yCol, logScale, showFit, colorMode, groups, innerW, innerH, margin.left, margin.top, noXAxis]);

  const zoomBy = (k: number) => {
    if (!zoomBehRef.current || !svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(180)
      .call(zoomBehRef.current.scaleBy as any, k);
  };
  const zoomReset = () => {
    if (!zoomBehRef.current || !svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(180)
      .call(zoomBehRef.current.transform as any, d3.zoomIdentity);
  };

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
        traits for the axes — or set X to <span className="italic">none</span> to
        see a single trait&apos;s distribution — switch the class, and read the
        fitted log-log slope and R² off the dashed line.
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
            <option value={X_NONE}>{X_NONE}</option>
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
          disabled={noXAxis}
          className={`text-[12px] px-2 py-1 rounded border transition ${
            noXAxis
              ? "border-rule text-slate-600 cursor-not-allowed"
              : showFit
                ? "border-slate-500 text-slate-100 bg-panel"
                : "border-rule text-slate-400"
          }`}
        >
          Regression line
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[11px] text-slate-500 mr-1">Zoom</span>
          <button
            onClick={() => zoomBy(1 / 1.25)}
            aria-label="Zoom out"
            className="text-[12px] w-7 h-7 rounded border border-rule text-slate-300 hover:border-slate-500"
          >
            −
          </button>
          <button
            onClick={() => zoomBy(1.25)}
            aria-label="Zoom in"
            className="text-[12px] w-7 h-7 rounded border border-rule text-slate-300 hover:border-slate-500"
          >
            +
          </button>
          <button
            onClick={zoomReset}
            aria-label="Reset zoom"
            className="text-[11px] px-2 h-7 rounded border border-rule text-slate-300 hover:border-slate-500"
          >
            Reset
          </button>
        </div>
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
          aria-label={`Scatter plot of ${noXAxis ? "Y-distribution" : xCol + " versus " + yCol} for ${visiblePoints.length} ${
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
