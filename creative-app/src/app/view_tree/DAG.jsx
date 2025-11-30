"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  graphStratify,
  sugiyama,
  layeringLongestPath,
  decrossTwoLayer,
  coordGreedy
} from "d3-dag";

export default function DagView({ dagData }) {
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800); // default width
  const height = 400; // fixed height

  // resize observer to track container width
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (svgRef.current) resizeObserver.observe(svgRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dagData || dagData.length === 0) return;

    const dag = graphStratify()(dagData);

    const layout = sugiyama()
      .layering(layeringLongestPath())
      .decross(decrossTwoLayer()) // non-optimal (but still good) decrossing so 131 postreqs don't crash it
      .coord(coordGreedy());
    layout(dag);

    const nodes = [...dag.nodes()];
    const links = [...dag.links()];

    // compute bounds
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 40;
    const nodeRadius = 12;
    const labelPadding = 40; // extra space for labels

    // compute scale using dynamic container width
    const scaleX = (containerWidth - 2 * padding - labelPadding) / (maxX - minX || 1);
    const scaleY = (height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = containerWidth / 2 - ((minX + maxX) / 2) * scale;
    const offsetY = height / 2 - ((minY + maxY) / 2) * scale;

    //for light/dark mode
    const textColor = getComputedStyle(document.body).getPropertyValue("--text").trim();
    const borderColor = getComputedStyle(document.body).getPropertyValue("--border").trim();
    const cardColor = getComputedStyle(document.body).getPropertyValue("--bg-card").trim();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${offsetX}, ${offsetY})`);

    // draw lines
    g.append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("stroke", borderColor)
      .attr("stroke-width", 1.5)
      .attr("fill", "none")
      .attr("d", l => `M${l.source.x * scale},${l.source.y * scale}L${l.target.x * scale},${l.target.y * scale}`);

    // draw nodes
    g.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", nodeRadius)
      .attr("cx", d => d.x * scale)
      .attr("cy", d => d.y * scale)
      .attr("fill", "steelblue")
      .attr("stroke", borderColor)

    // draw labels
    g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x * scale + nodeRadius + 5)
      .attr("y", d => d.y * scale + 5)
      .text(d => d.data.id)
      .style("font-size", "12px")
      .style("fill", textColor)
      .style("dominant-baseline", "middle");

  }, [dagData, containerWidth]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      style={{ border: "1px solid var(--border)", display: "block" }}
    />
  );
}

// TODO make this look better in browser
export function DagViewAllCourses({ dagData }) {
  return <DagView dagData={dagData} />;
}