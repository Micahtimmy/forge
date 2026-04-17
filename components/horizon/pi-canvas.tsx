"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FeatureCardNode } from "./nodes/feature-card-node";
import { IterationHeaderNode } from "./nodes/iteration-header-node";
import { TeamRowNode } from "./nodes/team-row-node";
import { DependencyEdge } from "./edges/dependency-edge";
import { useHorizonStore } from "@/stores/horizon-store";
import type { PICanvasData, FeatureCardData, IterationHeaderData, TeamRowData } from "@/types/pi";

interface PICanvasProps {
  canvasData: PICanvasData;
  onCanvasChange?: (data: PICanvasData) => void;
}

// Custom node types
const nodeTypes: NodeTypes = {
  featureCard: FeatureCardNode,
  iterationHeader: IterationHeaderNode,
  teamRowHeader: TeamRowNode,
};

// Custom edge types
const edgeTypes: EdgeTypes = {
  dependency: DependencyEdge,
};

// Generate mock canvas data if none provided
function generateMockCanvasData(): PICanvasData {
  const teams = [
    { id: "team-1", name: "Platform Team" },
    { id: "team-2", name: "Mobile Team" },
    { id: "team-3", name: "Data Team" },
  ];

  const iterations = 5;
  const cellWidth = 200;
  const cellHeight = 120;
  const headerHeight = 60;
  const teamColumnWidth = 150;

  const nodes: PICanvasData["nodes"] = [];
  const edges: PICanvasData["edges"] = [];

  // Add iteration headers
  for (let i = 0; i < iterations; i++) {
    nodes.push({
      id: `iteration-${i + 1}`,
      type: "iterationHeader",
      position: { x: teamColumnWidth + i * cellWidth, y: 0 },
      data: {
        iterationNumber: i + 1,
        startDate: `2026-04-${14 + i * 14}`,
        endDate: `2026-04-${27 + i * 14}`,
      } as IterationHeaderData,
    });
  }

  // Add team rows and some feature cards
  teams.forEach((team, teamIndex) => {
    const y = headerHeight + teamIndex * cellHeight;

    // Team row header
    nodes.push({
      id: `team-row-${team.id}`,
      type: "teamRowHeader",
      position: { x: 0, y },
      data: {
        teamId: team.id,
        teamName: team.name,
        totalCapacity: 40,
        committed: 35,
      } as TeamRowData,
    });

    // Add some feature cards
    const features = [
      { iteration: 1, title: "Auth Service", points: 8 },
      { iteration: 2, title: "API Gateway", points: 5 },
      { iteration: 3, title: "User Dashboard", points: 13 },
    ];

    features.slice(0, 2 + teamIndex).forEach((feature, featureIndex) => {
      const featureId = `feature-${team.id}-${featureIndex}`;
      nodes.push({
        id: featureId,
        type: "featureCard",
        position: {
          x: teamColumnWidth + (feature.iteration - 1) * cellWidth + 10,
          y: y + 10,
        },
        data: {
          title: feature.title,
          points: feature.points,
          teamId: team.id,
          iterationIndex: feature.iteration - 1,
          jiraKey: `FEAT-${100 + teamIndex * 10 + featureIndex}`,
          riskLevel: featureIndex === 0 ? "none" : featureIndex === 1 ? "medium" : "none",
        } as FeatureCardData,
      });
    });
  });

  // Add some dependencies
  edges.push({
    id: "dep-1",
    source: "feature-team-1-0",
    target: "feature-team-2-1",
    type: "dependency",
    data: { status: "resolved" },
  });

  edges.push({
    id: "dep-2",
    source: "feature-team-2-0",
    target: "feature-team-3-1",
    type: "dependency",
    data: { status: "at_risk" },
  });

  return { nodes, edges };
}

export function PICanvas({ canvasData, onCanvasChange }: PICanvasProps) {
  const { isDependencyMode, setIsDependencyMode, pendingDependencyFrom, setPendingDependencyFrom } =
    useHorizonStore();

  // Use mock data if none provided
  const initialData = useMemo(
    () => (canvasData?.nodes?.length ? canvasData : generateMockCanvasData()),
    [canvasData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges as unknown as Edge[]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isDependencyMode) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              type: "dependency",
              data: { status: "open" },
            },
            eds
          )
        );
        setIsDependencyMode(false);
        setPendingDependencyFrom(null);
      }
    },
    [isDependencyMode, setEdges, setIsDependencyMode, setPendingDependencyFrom]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (isDependencyMode && node.type === "featureCard") {
        if (!pendingDependencyFrom) {
          setPendingDependencyFrom(node.id);
        } else if (pendingDependencyFrom !== node.id) {
          // Create dependency
          setEdges((eds) =>
            addEdge(
              {
                id: `dep-${Date.now()}`,
                source: pendingDependencyFrom,
                target: node.id,
                type: "dependency",
                data: { status: "open" },
              },
              eds
            )
          );
          setIsDependencyMode(false);
          setPendingDependencyFrom(null);
        }
      }
    },
    [isDependencyMode, pendingDependencyFrom, setEdges, setIsDependencyMode, setPendingDependencyFrom]
  );

  const onNodeDragStop = useCallback(() => {
    // Save canvas state on drag end
    if (onCanvasChange) {
      const data: PICanvasData = {
        nodes: nodes as unknown as PICanvasData["nodes"],
        edges: edges as unknown as PICanvasData["edges"],
      };
      onCanvasChange(data);
    }
  }, [nodes, edges, onCanvasChange]);

  return (
    <div className="w-full h-[600px] bg-canvas rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "dependency",
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border-subtle)"
        />
        <Controls
          className="!bg-surface-02 !border-border !rounded-md !shadow-md"
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeColor="var(--color-border)"
          nodeColor="var(--color-surface-02)"
          nodeBorderRadius={4}
          maskColor="rgba(8, 12, 20, 0.8)"
          className="!bg-surface-01 !border-border !rounded-md"
        />
      </ReactFlow>

      {/* Dependency Mode Indicator */}
      {isDependencyMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-iris rounded-full text-white text-sm font-medium shadow-lg">
          {pendingDependencyFrom
            ? "Click target feature to create dependency"
            : "Click source feature to start dependency"}
        </div>
      )}
    </div>
  );
}
