import { useState, useRef, useEffect } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import * as d3Sankey from "d3-sankey";
import { type ApplicationWithStages, type Stage } from "../api/applications";

// ─── Node colours ─────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  Rejected: "#BA1A1A",
  Offer: "#4EDEA3",
};
const DEFAULT_NODE_COLOR = "#607CEC";

function nodeColor(stage: string) {
  return NODE_COLORS[stage] ?? DEFAULT_NODE_COLOR;
}

// ─── Sankey helpers ───────────────────────────────────────────────────────────

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export function computeSankeyLinks(
  applications: ApplicationWithStages[],
): SankeyLink[] {
  const counts = new Map<string, number>();
  for (const app of applications) {
    const sorted = [...app.stages].sort((a: Stage, b: Stage) => {
      if (a.stageDate && b.stageDate)
        return a.stageDate.localeCompare(b.stageDate);
      if (a.stageDate) return -1;
      if (b.stageDate) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
    for (let i = 1; i < sorted.length; i++) {
      const key = `${sorted[i - 1].stage}\x00${sorted[i].stage}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([key, value]) => {
      const [source, target] = key.split("\x00");
      return { source, target, value };
    })
    .filter((l) => l.source.toLowerCase() !== l.target.toLowerCase());
}

// ─── Conversion Flow card ─────────────────────────────────────────────────────

export default function ConversionFlowCard({
  links,
  selectedNode,
  onNodeClick,
}: {
  links: SankeyLink[];
  selectedNode: string | null;
  onNodeClick: (node: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.floor(w));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (links.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #eceef0",
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#c6c6cd" }}>
          No stage transitions yet
        </Typography>
      </Paper>
    );
  }

  const height = 280;
  const padding = { top: 16, right: 16, bottom: 16, left: 16 };

  // Build d3-sankey graph
  const stageIds = Array.from(
    new Set(links.flatMap((l) => [l.source, l.target])),
  );

  const sankeyNodes: d3Sankey.SankeyNode<{ id: string }, object>[] =
    stageIds.map((id) => ({ id }));
  const sankeyLinks: d3Sankey.SankeyLink<{ id: string }, object>[] = links.map(
    (l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
    }),
  );

  const sankey = d3Sankey
    .sankey<{ id: string }, object>()
    .nodeId((d) => d.id)
    .nodeWidth(16)
    .nodePadding(20)
    .extent([
      [padding.left, padding.top],
      [width - padding.right, height - padding.bottom],
    ]);

  let graph: d3Sankey.SankeyGraph<{ id: string }, object>;
  try {
    graph = sankey({ nodes: sankeyNodes, links: sankeyLinks });
  } catch {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #eceef0",
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#c6c6cd" }}>
          Cannot render flow — stage data contains cycles
        </Typography>
      </Paper>
    );
  }
  const linkPath = d3Sankey.sankeyLinkHorizontal();

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 3, border: "1px solid #eceef0" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}
        >
          Conversion Flow
        </Typography>
        {selectedNode && (
          <Button
            size="small"
            onClick={() => onNodeClick(null)}
            sx={{ fontSize: 12, minWidth: 0 }}
          >
            Clear filter
          </Button>
        )}
      </Box>

      <Box ref={containerRef} sx={{ width: "100%" }}>
        <svg width={width} height={height} style={{ display: "block" }}>
          {/* Links */}
          {graph.links.map((link, i) => {
            const pathD = linkPath(
              link as d3Sankey.SankeyLink<{ id: string }, object>,
            );
            const targetId = (
              link.target as d3Sankey.SankeyNode<{ id: string }, object>
            ).id;
            const isRejected = targetId === "Rejected";
            const strokeColor = isRejected ? "#BA1A1A" : "#607CEC";
            const strokeW = Math.max(1, link.width ?? 4);
            return (
              <path
                key={i}
                d={pathD ?? ""}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeOpacity={0.18}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const id = node.id;
            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const isSelected = id === selectedNode;
            const color = nodeColor(id);
            return (
              <g
                key={id}
                style={{ cursor: "pointer" }}
                onClick={() => onNodeClick(id === selectedNode ? null : id)}
              >
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={y1 - y0}
                  fill={color}
                  rx={4}
                  opacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? color : "none"}
                  strokeWidth={isSelected ? 2 : 0}
                />
                <text
                  x={x0 > width / 2 ? x0 - 8 : x1 + 8}
                  y={(y0 + y1) / 2}
                  dy="0.35em"
                  textAnchor={x0 > width / 2 ? "end" : "start"}
                  fontSize={12}
                  fontFamily="Manrope, sans-serif"
                  fontWeight={isSelected ? 700 : 500}
                  fill="#45464D"
                >
                  {id}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}
