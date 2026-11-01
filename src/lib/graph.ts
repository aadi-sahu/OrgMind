import type { GraphEdge, GraphNode, KnowledgeGraph, RelationType } from '@/api';
import { RELATION_LABELS } from './entities';

export interface Relation {
  relation: RelationType;
  direction: 'forward' | 'reverse';
  label: string;
  node: GraphNode;
}

export interface RelationGroup {
  key: string;
  label: string;
  relations: Relation[];
}

export interface GraphIndex {
  graph: KnowledgeGraph;
  nodeById: Map<string, GraphNode>;
  /** Every edge touching a node. */
  edgesByNode: Map<string, GraphEdge[]>;
  /** Number of edges touching each node. */
  degree: Map<string, number>;
}

export function buildGraphIndex(graph: KnowledgeGraph): GraphIndex {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgesByNode = new Map<string, GraphEdge[]>();
  const degree = new Map<string, number>();

  for (const node of graph.nodes) {
    edgesByNode.set(node.id, []);
    degree.set(node.id, 0);
  }
  for (const edge of graph.edges) {
    edgesByNode.get(edge.source)?.push(edge);
    edgesByNode.get(edge.target)?.push(edge);
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  return { graph, nodeById, edgesByNode, degree };
}

/** A node's relationships, grouped the way they read from that node's perspective. */
export function relationsOf(index: GraphIndex, nodeId: string): RelationGroup[] {
  const groups = new Map<string, RelationGroup>();

  for (const edge of index.edgesByNode.get(nodeId) ?? []) {
    const direction = edge.source === nodeId ? 'forward' : 'reverse';
    const other = index.nodeById.get(direction === 'forward' ? edge.target : edge.source);
    if (!other) continue;

    const label = RELATION_LABELS[edge.relation][direction];
    const key = `${edge.relation}:${direction}`;
    const group = groups.get(key) ?? { key, label, relations: [] };
    group.relations.push({ relation: edge.relation, direction, label, node: other });
    groups.set(key, group);
  }

  const ordered = [...groups.values()];
  for (const group of ordered) group.relations.sort((a, b) => a.node.name.localeCompare(b.node.name));
  return ordered.sort((a, b) => b.relations.length - a.relations.length || a.label.localeCompare(b.label));
}

/** Ids of the node plus everything within `depth` hops. */
export function neighborhood(index: GraphIndex, nodeId: string, depth: number): Set<string> {
  const seen = new Set([nodeId]);
  let frontier = [nodeId];
  for (let hop = 0; hop < depth; hop += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of index.edgesByNode.get(id) ?? []) {
        const other = edge.source === id ? edge.target : edge.source;
        if (!seen.has(other)) {
          seen.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  return seen;
}
