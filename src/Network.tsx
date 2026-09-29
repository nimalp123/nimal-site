import { useState } from "react";
import { graph } from "./graph";

const colors = ["#c5f660", "#c5f660", "#6dac84", "#698798"];
export default function Network() {
  const [degree, setDegree] = useState(3);
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(true);
  const node = graph[selected];
  const children = graph.filter(
    (n) => n.parent === selected && n.id !== selected,
  ).length;
  const path = new Set<number>();
  let current = selected;
  while (current !== 0) {
    path.add(current);
    current = graph[current].parent;
  }
  path.add(0);
  function filter(next: number) {
    setDegree(next);
    if (node.degree > next) setSelected(0);
  }

  return (
    <div className={`network ${playing ? "network-playing" : ""}`}>
      <div className="network-top">
        <span className="mono">
          <i className="status-dot" /> FRIENDSHIP NETWORK
        </span>
        <span className="network-demo mono">FICTIONAL DEMO</span>
      </div>
      <div className="network-canvas">
        <svg
          viewBox="0 0 900 500"
          role="group"
          aria-label="Interactive fictional friendship network. Select a first-degree friend or use the circle filters."
        >
          <defs>
            <radialGradient id="network-light">
              <stop stopColor="#c5f660" stopOpacity=".055" />
              <stop offset="1" stopColor="#c5f660" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="450" cy="250" r="235" fill="url(#network-light)" />
          <g
            transform={`translate(450 250) scale(${zoom}) translate(-450 -250)`}
          >
            {[80, 155, 230].map((radius, i) => (
              <ellipse
                key={radius}
                cx="450"
                cy="250"
                rx={radius * 1.48}
                ry={radius * 0.86}
                fill="none"
                stroke="#a1ad9b"
                strokeOpacity=".07"
                strokeDasharray="3 7"
                className={`orbit orbit-${i}`}
              />
            ))}
            {graph
              .filter((n) => n.id && n.degree <= degree)
              .map((n) => {
                const parent = graph[n.parent];
                return (
                  <line
                    key={`edge-${n.id}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={n.x}
                    y2={n.y}
                    stroke={path.has(n.id) ? "#c5f660" : colors[n.degree]}
                    strokeWidth={path.has(n.id) ? 1.3 : 0.7}
                    strokeOpacity={
                      path.has(n.id) ? 0.9 : n.degree === 1 ? 0.38 : 0.28
                    }
                  />
                );
              })}
            {graph
              .filter((n) => n.degree <= degree)
              .map((n) => (
                <g
                  key={n.id}
                  className="network-node"
                  onClick={() => setSelected(n.id)}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.id === selected ? 12 : 9}
                    fill="transparent"
                  />
                  {n.id === selected && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.id === 0 ? 24 : 11}
                      fill="none"
                      stroke="#c5f660"
                      strokeOpacity=".3"
                      className="node-pulse"
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={
                      n.id === 0
                        ? 8
                        : n.degree === 1
                          ? 4.5
                          : n.degree === 2
                            ? 2.7
                            : 1.7
                    }
                    fill={colors[n.degree]}
                    tabIndex={n.degree <= 1 ? 0 : undefined}
                    role="button"
                    aria-label={`Inspect ${n.name}, ${n.degree === 0 ? "center of network" : `degree ${n.degree}`}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(n.id);
                      }
                    }}
                  />
                </g>
              ))}
            <text
              x="450"
              y="279"
              textAnchor="middle"
              fill="#c5f660"
              fontSize="10"
              fontFamily="IBM Plex Mono"
            >
              YOU
            </text>
          </g>
        </svg>
        <div className="network-inspector" aria-live="polite">
          <span className="mono">
            {selected === 0
              ? "START WITH YOUR CIRCLE"
              : `${node.degree}${node.degree === 1 ? "ST" : node.degree === 2 ? "ND" : "RD"} DEGREE`}
          </span>
          <strong>{selected === 0 ? "It’s a small world." : node.name}</strong>
          <span>
            {selected === 0
              ? "Pick a node. Follow the connection."
              : `${children} outward ${children === 1 ? "connection" : "connections"} in this demo.`}
          </span>
        </div>
        <div className="zoom-controls">
          <button
            aria-label="Zoom out"
            disabled={zoom <= 0.8}
            onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}
          >
            −
          </button>
          <button
            aria-label="Reset graph view"
            onClick={() => {
              setZoom(1);
              setSelected(0);
              setDegree(3);
            }}
          >
            ⌖
          </button>
          <button
            aria-label="Zoom in"
            disabled={zoom >= 1.6}
            onClick={() => setZoom(Math.min(1.6, zoom + 0.2))}
          >
            +
          </button>
        </div>
      </div>
      <div className="network-bottom">
        <div
          className="degree-filters"
          aria-label="Show connections up to degree"
        >
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              aria-pressed={degree === d}
              onClick={() => filter(d)}
            >
              <i style={{ background: colors[d] }} />
              {d}
              {d === 1 ? "st" : d === 2 ? "nd" : "rd"} degree
            </button>
          ))}
        </div>
        <button
          className="motion-control mono"
          aria-pressed={!playing}
          aria-label={
            playing ? "Pause graph animation" : "Play graph animation"
          }
          onClick={() => setPlaying(!playing)}
        >
          {playing ? "Ⅱ" : "▷"}
        </button>
      </div>
    </div>
  );
}
