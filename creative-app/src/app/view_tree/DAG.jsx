"use client";

import { useRef, useEffect, useState, useContext } from "react";
import * as d3 from "d3";
import { TakenCoursesContext, WantedCoursesContext } from "../page";
import {
  graphStratify,
  sugiyama,
  layeringLongestPath,
  decrossTwoLayer,
  coordGreedy
} from "d3-dag";


export default function DagView({ dagData, rootNodeId = null }) {
  // get these global sets for coloring nodes
  const takenCourses = useContext(TakenCoursesContext);
  const wantedCourses = useContext(WantedCoursesContext);

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
    const nodeRadius = 15;
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
      .selectAll("rect")
      .data(nodes)
      .enter()
      .append("rect")
      // center
      .attr("x", d => d.x * scale - (nodeRadius * 2))
      .attr("y", d => d.y * scale - nodeRadius)
      .attr("width", nodeRadius * 4)
      .attr("height", nodeRadius * 2)
      // rounded corners
      .attr("rx", nodeRadius)
      .attr("ry", nodeRadius)
      .attr("fill", d => {
        const isTaken = takenCourses.has(d.data.id);
        const isWanted = wantedCourses.has(d.data.id);
        if (isTaken) return "green";
        if (isWanted) return "orange";
        return "steelblue";
      })
      .attr("stroke", d => {
        const isRoot = d.data.id === rootNodeId;
        return isRoot ? "hotpink" : borderColor;
      })
      .attr("stroke-width", d => {
        const isRoot = d.data.id === rootNodeId;
        return isRoot ? 3 : 1;
      });

    // draw labels
    g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      // set location to center of node
      .attr("x", d => d.x * scale)
      .attr("y", d => d.y * scale)
      .text(d => d.data.id)
      .style("font-size", "10px")
      .style("fill", textColor)
      // center text
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");


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