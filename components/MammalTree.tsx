"use client";

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { SpeciesDataset, TaxonNode, SuperpowerMeta } from "@/lib/types";

interface Props {
  dataset: SpeciesDataset;
  selectedSuperpowers: Set<string>;
  onSelectSpecies: (name: string) => void;
  highlightedSpecies?: string | null;
}

type RadialNode = d3.HierarchyPointNode<TaxonNode>;

export default function MammalTree({
  dataset,
  selectedSuperpowers,
  onSelectSpecies,
  highlightedSpecies,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { root, width, height, radius } = useMemo(() => {
    const w = 880;
    const h = 880;
    const r = Math.min(w, h) / 2 - 160;
    const hierarchy = d3.hierarchy<TaxonNode>(dataset.taxonomy);
    hierarchy.sort((a, b) => d3.ascending(a.data.name, b.data.name));
    const layout = d3.cluster<TaxonNode>().size([2 * Math.PI, r]);
    const laidOut = layout(hierarchy);
    return { root: laidOut, width: w, height: h, radius: r };
  }, [dataset.taxonomy]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Background subtle radial guide
    g.append("circle")
      .attr("r", radius + 2)
      .attr("fill", "none")
      .attr("stroke", "#111827")
      .attr("stroke-dasharray", "1 4")
      .attr("stroke-width", 1);

    const speciesMatches = (name: string): string[] => {
      const rec = dataset.species_data[name];
      if (!rec) return [];
      if (selectedSuperpowers.size === 0) return rec.superpowers;
      return rec.superpowers.filter((p) => selectedSuperpowers.has(p));
    };

    const nodeIsMatch = (n: RadialNode): boolean => {
      if (n.data.rank !== "species") return false;
      if (selectedSuperpowers.size === 0) return false;
      return speciesMatches(n.data.name).length > 0;
    };

    const anyFilterActive = selectedSuperpowers.size > 0;

    // Links
    const linkGen = d3
      .linkRadial<unknown, RadialNode>()
      .angle((d) => (d as RadialNode).x)
      .radius((d) => (d as RadialNode).y);

    g.append("g")
      .attr("class", "tree-links")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("class", (d) => {
        const leaf = d.target;
        const active = nodeIsMatch(leaf);
        return `tree-link${active ? " active" : ""}`;
      })
      .attr("d", (d) =>
        linkGen({ source: d.source, target: d.target } as unknown as d3.DefaultLinkObject)
      )
      .attr("opacity", (d) => {
        const leaf = d.target;
        if (!anyFilterActive) return 1;
        return nodeIsMatch(leaf) ? 1 : 0.25;
      });

    // Nodes
    const node = g
      .append("g")
      .attr("class", "tree-nodes")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr(
        "transform",
        (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
      )
      .attr("class", (d) => {
        const isSpecies = d.data.rank === "species";
        return `tree-node ${isSpecies ? "clickable" : ""}`;
      })
      .on("click", (_event, d) => {
        if (d.data.rank === "species") onSelectSpecies(d.data.name);
      });

    node
      .filter((d) => d.data.rank !== "species")
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 5 : 2.5))
      .attr("fill", (d) => (d.depth === 0 ? "#e5e7eb" : "#475569"))
      .attr("stroke", "#0b0f17");

    // Species dots — colored by first matched superpower
    node
      .filter((d) => d.data.rank === "species")
      .append("circle")
      .attr("r", (d) => {
        const matches = speciesMatches(d.data.name);
        if (highlightedSpecies === d.data.name) return 6.5;
        if (anyFilterActive && matches.length > 0) return 5;
        return 3;
      })
      .attr("fill", (d) => {
        const rec = dataset.species_data[d.data.name];
        if (!rec) return "#334155";
        const matches = speciesMatches(d.data.name);
        if (matches.length === 0) return "#334155";
        const meta = dataset.superpowers[matches[0]];
        return meta ? meta.color : "#cbd5e1";
      })
      .attr("stroke", (d) =>
        highlightedSpecies === d.data.name ? "#fff8e1" : "#0b0f17"
      )
      .attr("stroke-width", (d) =>
        highlightedSpecies === d.data.name ? 2 : 1
      )
      .attr("opacity", (d) => {
        if (!anyFilterActive) return 1;
        return speciesMatches(d.data.name).length > 0 ? 1 : 0.3;
      });

    // Species tooltip on hover (plain title for simplicity)
    node
      .filter((d) => d.data.rank === "species")
      .append("title")
      .text((d) => {
        const rec = dataset.species_data[d.data.name];
        if (!rec) return d.data.name;
        return `${rec.common} — ${d.data.name}\n${rec.headline}`;
      });

    // Labels
    node
      .append("text")
      .attr("class", (d) => {
        const base = d.data.rank === "species" ? "tree-label species" : "tree-label";
        if (d.data.rank === "species") {
          const matches = speciesMatches(d.data.name);
          if (highlightedSpecies === d.data.name) return base + " highlight";
          if (anyFilterActive && matches.length === 0) return base + " dim";
          if (anyFilterActive && matches.length > 0) return base + " highlight";
        }
        return base;
      })
      .attr("dy", "0.31em")
      .attr("x", (d) => {
        if (d.data.rank === "species") return d.x < Math.PI ? 8 : -8;
        return 0;
      })
      .attr("text-anchor", (d) => {
        if (d.data.rank === "species") return d.x < Math.PI ? "start" : "end";
        return "middle";
      })
      .attr("transform", (d) => {
        if (d.data.rank === "species" && d.x >= Math.PI) return "rotate(180)";
        return null;
      })
      .attr("y", (d) => {
        if (d.data.rank === "species") return 0;
        if (d.data.rank === "class") return -10;
        if (d.data.rank === "superorder") return -8;
        return -6;
      })
      .text((d) => {
        if (d.data.rank === "species") {
          const rec = dataset.species_data[d.data.name];
          return rec?.common || d.data.name;
        }
        if (d.data.rank === "subfamily") return "";
        return d.data.name;
      });
  }, [root, dataset, selectedSuperpowers, onSelectSpecies, highlightedSpecies, width, height, radius]);

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-w-[900px]"
        role="img"
        aria-label="Radial phylogeny of mammals with therapeutic superpowers"
      />
    </div>
  );
}
