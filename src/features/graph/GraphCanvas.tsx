import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { forceCollide, forceX, forceY } from 'd3-force';
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d';
import type { EntityType, GraphEdge, GraphNode, RelationType } from '@/api';
import { useTheme } from '@/hooks/useTheme';
import { ENTITY_META, ENTITY_TYPES } from '@/lib/entities';
import type { GraphIndex } from '@/lib/graph';
import { tracePath } from './shapes';

interface SimNode extends GraphNode {
  /** Drawing radius, from the number of relationships. */
  radius: number;
  anchorX: number;
  anchorY: number;
}

type SimLink = { source: string; target: string; relation: RelationType };
type FGNode = NodeObject<SimNode>;
type FGLink = LinkObject<SimNode, SimLink>;

export interface GraphCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  focusNode: (id: string) => void;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  index: GraphIndex;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  width: number;
  height: number;
}

interface Palette {
  bg: string;
  ink: string;
  ink2: string;
  line: string;
  lineStrong: string;
  types: Record<EntityType, string>;
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const value = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: value('--bg'),
    ink: value('--ink'),
    ink2: value('--ink-2'),
    line: value('--line-strong'),
    lineStrong: value('--ink-3'),
    types: Object.fromEntries(ENTITY_TYPES.map((t) => [t, value(ENTITY_META[t].colorVar)])) as Record<EntityType, string>,
  };
}

const CLUSTER_RADIUS = 240;
/** Leaves room for the type filter chips that sit over the top of the canvas. */
const FIT_PADDING = 72;
const LINK_DISTANCE: Partial<Record<RelationType, number>> = {
  member_of: 34,
  owns: 42,
  source_of: 26,
  maintains: 60,
  depends_on: 90,
  on_call_for: 70,
  leads: 50,
  contributes_to: 80,
  changes: 80,
  authored: 56,
  governs: 80,
};

/** Every node belongs near a team, which gives the layout readable neighborhoods. */
function homeTeams(nodes: GraphNode[], edges: GraphEdge[]): Map<string, string> {
  const homes = new Map<string, string>();
  const teamIds = new Set(nodes.filter((n) => n.type === 'team').map((n) => n.id));
  for (const id of teamIds) homes.set(id, id);

  for (const edge of edges) {
    if (edge.relation === 'member_of') homes.set(edge.source, edge.target);
    if (edge.relation === 'owns') homes.set(edge.target, edge.source);
    if (edge.relation === 'contributes_to' && !homes.has(edge.target)) homes.set(edge.target, edge.source);
  }
  for (const edge of edges) {
    if (edge.relation === 'authored' && !homes.has(edge.target)) {
      const team = homes.get(edge.source);
      if (team) homes.set(edge.target, team);
    }
  }
  return homes;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  { nodes, edges, index, selectedId, onSelect, width, height },
  ref,
) {
  const { theme } = useTheme();
  const fgRef = useRef<ForceGraphMethods<FGNode, FGLink>>(undefined);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [palette, setPalette] = useState(readPalette);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => setPalette(readPalette()), [theme]);

  // Leaving the page while hovering a node must not leave the pointer cursor behind.
  useEffect(
    () => () => {
      document.body.style.cursor = '';
    },
    [],
  );

  // Node objects are kept for the page's lifetime so positions survive filtering.
  const simNodes = useRef(new Map<string, SimNode>());

  // Clusters spread along an ellipse that follows the canvas shape, so wide screens get used.
  const stretch = useRef(Math.min(Math.max(width / Math.max(height, 1), 0.8), 1.7));

  const graphData = useMemo(() => {
    const homes = homeTeams(index.graph.nodes, index.graph.edges);
    const teams = index.graph.nodes.filter((n) => n.type === 'team');
    const anchors = new Map(
      teams.map((team, i) => {
        const angle = (i / teams.length) * Math.PI * 2 - Math.PI / 2;
        return [
          team.id,
          { x: Math.cos(angle) * CLUSTER_RADIUS * stretch.current, y: Math.sin(angle) * CLUSTER_RADIUS },
        ];
      }),
    );

    const visible = nodes.map((node) => {
      let sim = simNodes.current.get(node.id);
      if (!sim) {
        const anchor = anchors.get(homes.get(node.id) ?? '') ?? { x: 0, y: 0 };
        const degree = index.degree.get(node.id) ?? 0;
        sim = {
          ...node,
          radius: node.type === 'team' ? 7 + Math.sqrt(degree) * 0.5 : 2.6 + Math.sqrt(degree) * 0.72,
          anchorX: anchor.x,
          anchorY: anchor.y,
        };
        // Start near the anchor, which settles much faster than a random start.
        (sim as FGNode).x = anchor.x + (Math.random() - 0.5) * 80;
        (sim as FGNode).y = anchor.y + (Math.random() - 0.5) * 80;
        simNodes.current.set(node.id, sim);
      }
      return sim;
    });

    // Drawn in order, so teams come last and their labels stay on top.
    visible.sort((a, b) => Number(a.type === 'team') - Number(b.type === 'team'));

    return {
      nodes: visible as FGNode[],
      links: edges.map((edge): SimLink => ({ source: edge.source, target: edge.target, relation: edge.relation })) as unknown as FGLink[],
    };
  }, [nodes, edges, index]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('x', forceX<FGNode>((n) => n.anchorX).strength(0.09));
    fg.d3Force('y', forceY<FGNode>((n) => n.anchorY).strength(0.09));
    fg.d3Force('collide', forceCollide<FGNode>((n) => n.radius + 7));
    fg.d3Force('charge')?.strength(-62);
    const linkForce = fg.d3Force('link');
    linkForce?.distance((link: SimLink) => LINK_DISTANCE[link.relation] ?? 60);
    linkForce?.strength(0.16);
    fg.d3ReheatSimulation();
    // Frame the layout straight away, then again once it has settled.
    const timer = setTimeout(() => {
      if (!selectedRef.current) fg.zoomToFit(0, FIT_PADDING);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  // After filtering, the settled layout should fill the view again.
  const needsFit = useRef(true);
  useEffect(() => {
    needsFit.current = true;
  }, [nodes, edges]);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() * 1.4, 200);
      },
      zoomOut: () => {
        const fg = fgRef.current;
        if (fg) fg.zoom(fg.zoom() / 1.4, 200);
      },
      fit: () => fgRef.current?.zoomToFit(400, FIT_PADDING),
      focusNode: (id) => {
        const fg = fgRef.current;
        const node = simNodes.current.get(id) as FGNode | undefined;
        if (!fg || node?.x === undefined || node.y === undefined) return;
        fg.centerAt(node.x, node.y, 500);
        fg.zoom(Math.max(fg.zoom(), 1.6), 500);
      },
    }),
    [],
  );

  const activeId = hoveredId ?? selectedId;
  const activeSet = useMemo(() => {
    if (!activeId) return null;
    const set = new Set([activeId]);
    for (const edge of index.edgesByNode.get(activeId) ?? []) {
      set.add(edge.source);
      set.add(edge.target);
    }
    return set;
  }, [activeId, index]);

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dimmed = activeSet ? !activeSet.has(node.id as string) : false;
      const isSelected = node.id === selectedId;
      const isActive = node.id === activeId;
      const shape = ENTITY_META[node.type].shape;

      ctx.globalAlpha = dimmed ? 0.14 : 1;

      // Surface ring: keeps a node legible where links cross behind it.
      tracePath(ctx, shape, x, y, node.radius + 1.5 / scale);
      ctx.fillStyle = palette.bg;
      ctx.fill();

      tracePath(ctx, shape, x, y, node.radius);
      ctx.fillStyle = palette.types[node.type];
      ctx.fill();

      if (isSelected || isActive) {
        tracePath(ctx, shape, x, y, node.radius + 3.5 / scale);
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 1.5 / scale;
        ctx.stroke();
      }

      // Labels appear by importance as you zoom, so the overview stays calm.
      const related = activeSet?.has(node.id as string) ?? false;
      const showLabel =
        isActive ||
        (activeSet ? related : node.type === 'team' || (scale > 1.05 && node.type !== 'person' && node.type !== 'decision') || scale > 1.9);

      if (showLabel) {
        const emphasized = node.type === 'team' || isActive;
        const size = (emphasized ? 12 : 11) / scale;
        ctx.font = `${emphasized ? 600 : 400} ${size}px "Geist Variable", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = node.name.length > 34 ? `${node.name.slice(0, 32)}…` : node.name;
        const labelY = y + node.radius * 1.3 + 3 / scale;
        ctx.lineWidth = 3 / scale;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = palette.bg;
        ctx.strokeText(label, x, labelY);
        ctx.fillStyle = emphasized ? palette.ink : palette.ink2;
        ctx.fillText(label, x, labelY);
      }
      ctx.globalAlpha = 1;
    },
    [activeId, activeSet, palette, selectedId],
  );

  const paintHitArea = useCallback((node: FGNode, color: string, ctx: CanvasRenderingContext2D, scale: number) => {
    // A target larger than the mark, with a minimum on-screen size.
    const r = Math.max(node.radius + 2, 9 / scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const linkEnds = (link: FGLink) => {
    const source = typeof link.source === 'object' ? (link.source as FGNode).id : link.source;
    const target = typeof link.target === 'object' ? (link.target as FGNode).id : link.target;
    return { source, target };
  };

  const isLinkActive = useCallback(
    (link: FGLink) => {
      if (!activeId) return false;
      const { source, target } = linkEnds(link);
      return source === activeId || target === activeId;
    },
    [activeId],
  );

  const linkColor = useCallback(
    (link: FGLink) => {
      if (isLinkActive(link)) return palette.lineStrong;
      if (activeId) return `${palette.line}33`;
      return link.relation === 'depends_on' ? palette.lineStrong : palette.line;
    },
    [activeId, isLinkActive, palette],
  );

  const linkWidth = useCallback(
    (link: FGLink) => (isLinkActive(link) ? 1.4 : link.relation === 'depends_on' ? 0.9 : 0.5),
    [isLinkActive],
  );

  return (
    <ForceGraph2D<SimNode, SimLink>
      ref={fgRef}
      width={width}
      height={height}
      graphData={graphData}
      backgroundColor="rgba(0,0,0,0)"
      nodeId="id"
      nodeLabel={() => ''}
      linkLabel={() => ''}
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={paintHitArea}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkDirectionalArrowLength={(link) => (link.relation === 'depends_on' ? 3.5 : 0)}
      linkDirectionalArrowRelPos={0.88}
      linkDirectionalArrowColor={linkColor}
      warmupTicks={90}
      cooldownTicks={60}
      d3AlphaDecay={0.028}
      d3VelocityDecay={0.34}
      minZoom={0.25}
      maxZoom={6}
      onNodeHover={(node) => {
        setHoveredId((node?.id as string | undefined) ?? null);
        document.body.style.cursor = node ? 'pointer' : '';
      }}
      onNodeClick={(node) => onSelect(node.id as string)}
      onBackgroundClick={() => onSelect(null)}
      onEngineStop={() => {
        if (needsFit.current && !selectedRef.current) fgRef.current?.zoomToFit(400, FIT_PADDING);
        needsFit.current = false;
      }}
    />
  );
});
