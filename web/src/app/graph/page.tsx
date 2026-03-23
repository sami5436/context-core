"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Force graph needs to only run on the client
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

interface NodeData {
  id: string;
  label: string;
  name: string;
  [key: string]: any;
}

interface LinkData {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

const COLOR_MAP = {
  Supplier: "#0ea5e9", // Sky
  Product: "#8b5cf6", // Violet
  Order: "#f59e0b", // Amber
  Warehouse: "#10b981", // Emerald
};

export default function GraphExplorer() {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/graph/data");
        if (!res.ok) throw new Error("Failed to fetch graph data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as NodeData);
    
    if (fgRef.current) {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z || 0);

      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="rounded border border-red-900/60 bg-red-950/30 px-6 py-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Graph Area */}
      <div className="flex-1 relative bg-zinc-950" ref={containerRef}>
        {!data ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm">Loading graph...</span>
            </div>
          </div>
        ) : (
          <>
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={data}
              nodeLabel={(node: any) => `${node.label}: ${node.name}`}
              nodeColor={(node: any) => COLOR_MAP[node.label as keyof typeof COLOR_MAP] || "#a1a1aa"}
              nodeRelSize={6}
              linkColor={() => "#3f3f46"}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              backgroundColor="#09090b"
            />
            
            {/* Legend Overlay */}
            <div className="absolute bottom-6 left-6 rounded border border-zinc-800/60 bg-zinc-900/80 p-4 backdrop-blur-sm">
              <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Node Legend</h3>
              <div className="flex flex-col gap-2">
                {Object.entries(COLOR_MAP).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-zinc-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l border-zinc-800/60 bg-zinc-950 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Details</h2>
          <p className="mt-1 text-xs text-zinc-500 mb-6">
            Click a node in the graph to inspect its properties.
          </p>

          {selectedNode ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ backgroundColor: COLOR_MAP[selectedNode.label as keyof typeof COLOR_MAP] || "#a1a1aa" }} 
                  />
                  <span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                    {selectedNode.label}
                  </span>
                </div>
                <h3 className="text-xl font-medium text-zinc-100">{selectedNode.name}</h3>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase border-b border-zinc-800 pb-2">
                  Properties
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(selectedNode)
                    .filter(([key]) => !['id', 'x', 'y', 'z', 'vx', 'vy', 'index', 'name', 'label'].includes(key))
                    .map(([key, value]) => (
                      <div key={key}>
                        <p className="text-[10px] text-zinc-500">{key}</p>
                        <p className="text-sm text-zinc-300 font-mono mt-0.5 break-words">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-zinc-800">
              <span className="text-xs text-zinc-600">No node selected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
