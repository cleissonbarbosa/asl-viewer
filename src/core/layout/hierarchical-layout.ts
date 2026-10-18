import { StateNode, Connection } from "../../types";
import { END_NODE_ID } from "../asl-utils";
import { calculateImprovedSpacing } from "./spacing";
import { getStateSize } from "./sizing";

type Direction = "TB" | "LR";
type Point = { x: number; y: number };

export interface HierarchicalLayoutOptions {
  /**
   * Ids of the group nodes (Parallel / Map) rendered expanded. When given,
   * group sizes are derived from it; otherwise the node sizes are used as-is.
   */
  expandedGroups?: ReadonlySet<string>;
}

export interface HierarchicalLayoutResult {
  nodes: StateNode[];
  edges: Connection[];
  width: number;
  height: number;
}

/** Internal layout item: a real node or a dummy waypoint of a long edge. */
interface Item {
  node?: StateNode;
  /** Size along the cross axis (width in TB, height in LR). */
  cross: number;
  /** Size along the flow axis (height in TB, width in LR). */
  flow: number;
  layer: number;
  order: number;
  /** Center along the cross axis. */
  pos: number;
  /** DFS discovery index, used as a stable tie-breaker. */
  rank: number;
  preds: number[];
  succs: number[];
}

const MARGIN = 50;
const DUMMY_GAP = 28;
const LABEL_RESERVE = 100;
const LOOP_GAP = 40;
const LOOP_STEP = 16;
const LOOP_TRACK_OFFSET = 8;
const ORDERING_ITERATIONS = 8;
const PLACEMENT_PASSES = 5;

/**
 * Layered ("Sugiyama style") layout tuned for Step Functions workflows:
 *
 * 1. Back edges (loops) are detected with a DFS and ignored for layering.
 * 2. Nodes are layered by longest path, so every forward transition points
 *    down (or right) and END is always the last layer.
 * 3. Long edges get dummy waypoints so they are routed through reserved lanes
 *    instead of crossing other states.
 * 4. Node order inside each layer is optimised with barycenter sweeps.
 * 5. Coordinates are balanced with an isotonic regression per layer.
 * 6. Edges are routed orthogonally; loops are routed around the right side.
 *
 * The function never mutates its input.
 */
export function calculateHierarchicalLayout(
  nodes: StateNode[],
  edges: Connection[],
  startAt: string,
  direction: Direction = "TB",
  options: HierarchicalLayoutOptions = {},
): HierarchicalLayoutResult {
  const isTB = direction === "TB";
  const expanded = options.expandedGroups;

  // Prepare top-level nodes (copies) with their effective sizes
  const topLevel: StateNode[] = [];
  const nested: StateNode[] = [];
  for (const node of nodes) {
    if (node.parentId) {
      nested.push({ ...node, position: { ...node.position } });
      continue;
    }
    let size = node.size;
    let isExpanded = node.isExpanded;
    if (node.isGroup && expanded) {
      isExpanded = expanded.has(node.id);
      size =
        isExpanded && node.groupBounds
          ? node.groupBounds
          : getStateSize(node.type);
    }
    topLevel.push({
      ...node,
      size: { ...size },
      position: { ...node.position },
      ...(node.isGroup ? { isExpanded } : {}),
    });
  }

  const count = topLevel.length;
  if (count === 0) {
    return {
      nodes: nested,
      edges: edges.map((e) => ({ ...e })),
      width: 600,
      height: 400,
    };
  }

  const { nodeSpacing, levelSpacing } = calculateImprovedSpacing(
    topLevel,
    edges,
  );
  const labelExtra = isTB ? 20 : 90;

  const index = new Map<string, number>();
  topLevel.forEach((node, i) => index.set(node.id, i));

  // Unique adjacency between top-level nodes
  const out: number[][] = topLevel.map(() => []);
  const seenPairs = new Set<string>();
  for (const edge of edges) {
    const a = index.get(edge.from);
    const b = index.get(edge.to);
    if (a === undefined || b === undefined) continue;
    const key = pairKey(a, b);
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    out[a].push(b);
  }

  // 1. DFS: discovery order + back edges
  const startIndex = index.get(startAt);
  const rank = new Int32Array(count).fill(-1);
  const backEdges = new Set<string>();
  {
    const state = new Uint8Array(count); // 0 = new, 1 = on stack, 2 = done
    let counter = 0;
    const roots: number[] = [];
    if (startIndex !== undefined) roots.push(startIndex);
    for (let i = 0; i < count; i++) if (i !== startIndex) roots.push(i);

    for (const root of roots) {
      if (state[root] !== 0) continue;
      state[root] = 1;
      rank[root] = counter++;
      const stack: Array<[number, number]> = [[root, 0]];
      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const u = frame[0];
        if (frame[1] < out[u].length) {
          const v = out[u][frame[1]++];
          if (state[v] === 0) {
            state[v] = 1;
            rank[v] = counter++;
            stack.push([v, 0]);
          } else if (state[v] === 1) {
            backEdges.add(pairKey(u, v));
          }
        } else {
          state[u] = 2;
          stack.pop();
        }
      }
    }
  }

  // 2. Longest-path layering on forward edges
  const forward: number[][] = topLevel.map(() => []);
  const indegree = new Int32Array(count);
  for (let a = 0; a < count; a++) {
    for (const b of out[a]) {
      if (backEdges.has(pairKey(a, b))) continue;
      forward[a].push(b);
      indegree[b]++;
    }
  }

  const layerOf = new Int32Array(count);
  {
    const queue: number[] = [];
    for (let i = 0; i < count; i++) if (indegree[i] === 0) queue.push(i);
    queue.sort((a, b) => rank[a] - rank[b]);
    for (const source of queue) {
      // Keep START alone on the first layer
      layerOf[source] =
        startIndex === undefined || source === startIndex ? 0 : 1;
    }
    const remaining = Int32Array.from(indegree);
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of forward[u]) {
        layerOf[v] = Math.max(layerOf[v], layerOf[u] + 1);
        if (--remaining[v] === 0) queue.push(v);
      }
    }
  }

  const endIndex = index.get(END_NODE_ID);
  if (endIndex !== undefined) {
    let deepest = 0;
    for (let i = 0; i < count; i++) {
      if (i !== endIndex) deepest = Math.max(deepest, layerOf[i]);
    }
    layerOf[endIndex] = Math.max(layerOf[endIndex], deepest + 1);
  }

  // 3. Items (real nodes + dummy waypoints for long edges)
  const labeledPairs = new Set<string>();
  for (const edge of edges) {
    const a = index.get(edge.from);
    const b = index.get(edge.to);
    if (a !== undefined && b !== undefined && edge.label?.trim()) {
      labeledPairs.add(pairKey(a, b));
    }
  }

  const items: Item[] = topLevel.map((node, i) => ({
    node,
    cross: isTB ? node.size.width : node.size.height,
    flow: isTB ? node.size.height : node.size.width,
    layer: layerOf[i],
    order: 0,
    pos: 0,
    rank: rank[i],
    preds: [],
    succs: [],
  }));

  // Long edges that share a target are concentrated into a single lane
  // ("bus"), which keeps catch-all error handlers readable and bounds the
  // number of dummy items by O(nodes x layers) instead of O(edges x layers).
  const longSources = new Map<number, number[]>();
  for (let a = 0; a < count; a++) {
    for (const b of forward[a]) {
      if (layerOf[b] - layerOf[a] > 1) {
        const sources = longSources.get(b) ?? [];
        sources.push(a);
        longSources.set(b, sources);
      } else {
        items[a].succs.push(b);
        items[b].preds.push(a);
      }
    }
  }

  const chains = new Map<string, number[]>();
  longSources.forEach((sources, b) => {
    const firstLayer = Math.min(...sources.map((s) => layerOf[s])) + 1;
    const bus: number[] = [];
    for (let layer = firstLayer; layer < layerOf[b]; layer++) {
      const dummy = items.length;
      items.push({
        cross: 0,
        flow: 0,
        layer,
        order: 0,
        pos: 0,
        rank: rank[b] + 0.5,
        preds: bus.length > 0 ? [bus[bus.length - 1]] : [],
        succs: [],
      });
      if (bus.length > 0) items[bus[bus.length - 1]].succs.push(dummy);
      bus.push(dummy);
    }
    const last = bus[bus.length - 1];
    items[last].succs.push(b);
    items[b].preds.push(last);

    for (const a of sources) {
      const offset = layerOf[a] + 1 - firstLayer;
      const entry = bus[offset];
      items[a].succs.push(entry);
      items[entry].preds.push(a);
      if (isTB && labeledPairs.has(pairKey(a, b))) {
        items[entry].cross = LABEL_RESERVE;
      }
      chains.set(pairKey(a, b), bus.slice(offset));
    }
  });

  let layerCount = 0;
  for (const item of items) layerCount = Math.max(layerCount, item.layer + 1);
  const layers: number[][] = Array.from({ length: layerCount }, () => []);
  items.forEach((item, i) => layers[item.layer].push(i));

  // 4. Ordering: initial barycenter pass + alternating sweeps
  for (let l = 0; l < layerCount; l++) {
    const keyed = layers[l].map((i) => ({
      i,
      key:
        l > 0 && items[i].preds.length > 0
          ? average(items[i].preds.map((p) => items[p].order))
          : Number.POSITIVE_INFINITY,
    }));
    keyed.sort((a, b) => a.key - b.key || items[a.i].rank - items[b.i].rank);
    layers[l] = keyed.map((k) => k.i);
    layers[l].forEach((i, order) => (items[i].order = order));
  }

  const countAllCrossings = () => {
    let total = 0;
    for (let l = 0; l < layerCount - 1; l++) {
      total += countCrossings(layers[l], items);
    }
    return total;
  };

  let best = layers.map((layer) => layer.slice());
  let bestCrossings = countAllCrossings();
  for (let iteration = 0; iteration < ORDERING_ITERATIONS; iteration++) {
    if (bestCrossings === 0) break;
    const downward = iteration % 2 === 0;
    if (downward) {
      for (let l = 1; l < layerCount; l++) reorder(layers[l], items, "preds");
    } else {
      for (let l = layerCount - 2; l >= 0; l--) {
        reorder(layers[l], items, "succs");
      }
    }
    const crossings = countAllCrossings();
    if (crossings < bestCrossings) {
      bestCrossings = crossings;
      best = layers.map((layer) => layer.slice());
    }
  }
  best.forEach((layer, l) => {
    layers[l] = layer;
    layer.forEach((i, order) => (items[i].order = order));
  });

  // 5. Coordinate assignment along the cross axis
  const separation = (a: Item, b: Item) =>
    (a.cross + b.cross) / 2 + (a.node && b.node ? nodeSpacing : DUMMY_GAP);

  const placeLayer = (layer: number[], desired: (item: Item) => number) => {
    if (layer.length === 0) return;
    const targets: number[] = [];
    const offsets: number[] = [];
    let offset = 0;
    layer.forEach((i, k) => {
      if (k > 0) offset += separation(items[layer[k - 1]], items[i]);
      offsets.push(offset);
      targets.push(desired(items[i]) - offset);
    });
    const solved = isotonic(targets);
    layer.forEach((i, k) => (items[i].pos = solved[k] + offsets[k]));
  };

  const neighbourCenter = (item: Item, key: "preds" | "succs"): number => {
    const neighbours =
      key === "succs" && endIndex !== undefined
        ? item.succs.filter((s) => s !== endIndex)
        : item[key];
    return neighbours.length > 0
      ? average(neighbours.map((n) => items[n].pos))
      : item.pos;
  };

  for (let pass = 0; pass < PLACEMENT_PASSES; pass++) {
    if (pass % 2 === 0) {
      for (let l = 0; l < layerCount; l++) {
        placeLayer(layers[l], (item) => neighbourCenter(item, "preds"));
      }
    } else {
      for (let l = layerCount - 1; l >= 0; l--) {
        placeLayer(layers[l], (item) => neighbourCenter(item, "succs"));
      }
    }
  }

  // 6. Flow axis: layer offsets and gap centers
  const labeledLayer = new Array<boolean>(layerCount).fill(false);
  for (const edge of edges) {
    const a = index.get(edge.from);
    if (a !== undefined && index.has(edge.to) && edge.label?.trim()) {
      labeledLayer[layerOf[a]] = true;
    }
  }

  const layerStart: number[] = [];
  const layerSize: number[] = [];
  const gapAfter: number[] = [];
  let cursor = 0;
  for (let l = 0; l < layerCount; l++) {
    let size = 0;
    for (const i of layers[l]) size = Math.max(size, items[i].flow);
    const gap = levelSpacing + (labeledLayer[l] ? labelExtra : 0);
    layerStart.push(cursor);
    layerSize.push(size);
    gapAfter.push(cursor + size + gap / 2);
    cursor += size + gap;
  }
  const contentEnd = layerStart[layerCount - 1] + layerSize[layerCount - 1];
  const gapBefore = (layer: number) =>
    layer > 0 ? gapAfter[layer - 1] : layerStart[0] - levelSpacing / 2;

  // 7. Edge routing in (cross, flow) space
  const rightExtent = (from: number, to: number) => {
    let extent = Number.NEGATIVE_INFINITY;
    for (let l = Math.max(0, from); l <= Math.min(layerCount - 1, to); l++) {
      for (const i of layers[l]) {
        extent = Math.max(extent, items[i].pos + items[i].cross / 2);
      }
    }
    return extent;
  };

  // Assign non-overlapping lanes to back edges, innermost loops first
  const loopLanes = new Map<string, number>();
  {
    const loops = Array.from(backEdges).map((key) => {
      const [a, b] = key.split(">").map(Number);
      const low = Math.min(layerOf[a], layerOf[b]);
      const high = Math.max(layerOf[a], layerOf[b]);
      return { key, low, high };
    });
    loops.sort((p, q) => p.high - p.low - (q.high - q.low) || p.low - q.low);
    const assigned: Array<{ low: number; high: number; lane: number }> = [];
    for (const loop of loops) {
      let lane = rightExtent(loop.low, loop.high) + LOOP_GAP;
      let moved = true;
      while (moved) {
        moved = false;
        for (const other of assigned) {
          const overlaps = other.low <= loop.high && loop.low <= other.high;
          if (overlaps && Math.abs(other.lane - lane) < LOOP_STEP) {
            lane = other.lane + LOOP_STEP;
            moved = true;
          }
        }
      }
      assigned.push({ low: loop.low, high: loop.high, lane });
      loopLanes.set(loop.key, lane);
    }
  }

  const routeEdge = (a: number, b: number): Array<[number, number]> => {
    const sourcePos = items[a].pos;
    const targetPos = items[b].pos;
    const key = pairKey(a, b);
    const lane = loopLanes.get(key);
    if (lane !== undefined) {
      const down = gapAfter[layerOf[a]] + LOOP_TRACK_OFFSET;
      const up = gapBefore(layerOf[b]) - LOOP_TRACK_OFFSET;
      return [
        [sourcePos, down],
        [lane, down],
        [lane, up],
        [targetPos, up],
      ];
    }

    const points: Array<[number, number]> = [];
    let current = sourcePos;
    let flow = gapAfter[layerOf[a]];
    points.push([current, flow]);
    for (const dummy of chains.get(key) ?? []) {
      if (items[dummy].pos !== current) {
        current = items[dummy].pos;
        points.push([current, flow]);
      }
      flow = gapAfter[items[dummy].layer];
      points.push([current, flow]);
    }
    if (targetPos !== current) points.push([targetPos, flow]);
    return points;
  };

  // 8. Normalise coordinates and convert to x / y
  let minCross = Number.POSITIVE_INFINITY;
  let maxCross = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    minCross = Math.min(minCross, item.pos - item.cross / 2);
    maxCross = Math.max(maxCross, item.pos + item.cross / 2);
  }
  loopLanes.forEach((lane) => (maxCross = Math.max(maxCross, lane)));
  const minFlow = backEdges.size > 0 ? Math.min(0, gapBefore(0)) : 0;

  const shiftCross = MARGIN - minCross;
  const shiftFlow = MARGIN - minFlow;
  const toPoint = (crossValue: number, flowValue: number): Point =>
    isTB
      ? { x: crossValue + shiftCross, y: flowValue + shiftFlow }
      : { x: flowValue + shiftFlow, y: crossValue + shiftCross };

  topLevel.forEach((node, i) => {
    const item = items[i];
    node.position = toPoint(item.pos - item.cross / 2, layerStart[item.layer]);
  });

  const routes = new Map<string, Point[]>();
  const routedEdges = edges.map((edge) => {
    const a = index.get(edge.from);
    const b = index.get(edge.to);
    if (a === undefined || b === undefined) return { ...edge };
    const key = pairKey(a, b);
    let points = routes.get(key);
    if (!points) {
      points = dedupe(routeEdge(a, b).map(([c, f]) => toPoint(c, f)));
      routes.set(key, points);
    }
    return { ...edge, points: points.map((p) => ({ ...p })) };
  });

  const crossExtent = maxCross - minCross + MARGIN * 2;
  const flowExtent = contentEnd - minFlow + MARGIN * 2;
  return {
    nodes: [...topLevel, ...nested],
    edges: routedEdges,
    width: Math.max(isTB ? crossExtent : flowExtent, 600),
    height: Math.max(isTB ? flowExtent : crossExtent, 400),
  };
}

function pairKey(a: number, b: number): string {
  return `${a}>${b}`;
}

function average(values: number[]): number {
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

function dedupe(points: Point[]): Point[] {
  return points.filter(
    (p, i) =>
      i === 0 ||
      Math.abs(p.x - points[i - 1].x) > 0.5 ||
      Math.abs(p.y - points[i - 1].y) > 0.5,
  );
}

/**
 * Reorders a layer by the barycenter of its neighbours in the adjacent
 * layer. Items without neighbours keep their slot.
 */
function reorder(layer: number[], items: Item[], key: "preds" | "succs") {
  const movable: Array<{ i: number; key: number }> = [];
  const slots: number[] = [];
  layer.forEach((i, slot) => {
    const neighbours = items[i][key];
    if (neighbours.length > 0) {
      movable.push({
        i,
        key: average(neighbours.map((n) => items[n].order)),
      });
      slots.push(slot);
    }
  });
  movable.sort(
    (a, b) =>
      a.key - b.key ||
      items[a.i].order - items[b.i].order ||
      items[a.i].rank - items[b.i].rank,
  );
  movable.forEach((entry, k) => (layer[slots[k]] = entry.i));
  layer.forEach((i, order) => (items[i].order = order));
}

/**
 * Counts edge crossings between a layer and the next one in
 * O(E log E), by counting inversions with a Fenwick tree.
 */
function countCrossings(upper: number[], items: Item[]): number {
  const segments: Array<[number, number]> = [];
  let maxLower = 0;
  for (const i of upper) {
    for (const s of items[i].succs) {
      segments.push([items[i].order, items[s].order]);
      maxLower = Math.max(maxLower, items[s].order);
    }
  }
  if (segments.length < 2) return 0;
  segments.sort((p, q) => p[0] - q[0] || p[1] - q[1]);

  const tree = new Int32Array(maxLower + 2);
  let crossings = 0;
  let inserted = 0;
  for (const [, lower] of segments) {
    // Number of inserted segments whose lower end is <= lower
    let notCrossing = 0;
    for (let k = lower + 1; k > 0; k -= k & -k) notCrossing += tree[k];
    crossings += inserted - notCrossing;
    for (let k = lower + 1; k < tree.length; k += k & -k) tree[k]++;
    inserted++;
  }
  return crossings;
}

/**
 * Pool-adjacent-violators: the non-decreasing sequence closest (least
 * squares) to `values`. Used to place nodes as close as possible to their
 * desired positions while keeping the minimum spacing between them.
 */
function isotonic(values: number[]): number[] {
  const means: number[] = [];
  const sizes: number[] = [];
  for (const value of values) {
    means.push(value);
    sizes.push(1);
    while (
      means.length > 1 &&
      means[means.length - 2] > means[means.length - 1]
    ) {
      const size = sizes[sizes.length - 2] + sizes[sizes.length - 1];
      const mean =
        (means[means.length - 2] * sizes[sizes.length - 2] +
          means[means.length - 1] * sizes[sizes.length - 1]) /
        size;
      means.splice(-2, 2, mean);
      sizes.splice(-2, 2, size);
    }
  }
  const result: number[] = [];
  means.forEach((mean, k) => {
    for (let j = 0; j < sizes[k]; j++) result.push(mean);
  });
  return result;
}
