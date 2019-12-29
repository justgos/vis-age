import { forceSimulation, forceManyBody, forceLink } from 'd3-force';

import { PathwayNode, PathwayEdge } from '../../core/types';
import { GraphNode, GraphEdge, PathwayGraph } from './types'

const locationDistance = 250;

export const constructGraph = (nodeData : PathwayNode[], edgeData : PathwayEdge[]) : PathwayGraph => {
  const nodes : GraphNode[] = [];
  const edges : GraphEdge[] = [];
  const edgeMap = new Map<number, GraphEdge[]>();

  const addNode = (data : PathwayNode) => {
    let node : GraphNode = {
      ...data,
      location: 0,
      x: (Math.random() - 0.5) * 1000,
      y: (Math.random() - 0.5) * 1000,
      vx: 0,
      vy: 0,
    };
    if(data.type === 'molecule' && data.cellularLocation) {
      const cellularLocation = data.cellularLocation;
      if([
        'extracellular region',
        'external side of plasma membrane',
        'cell junction',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = 5;
      } else if([ 
        'cell outer membrane',
        'cell wall',
        'cytoplasmic side of plasma membrane',
        'plasma membrane',
      ].some(l => l === cellularLocation)) {
        node.location = 4;
      } else if([ 
        'mitochondrial',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = 3;
      } else if([ 
        'cytosol',
        'host cell cytosol',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = 0;
      } else if([ 
        'Golgi',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = -3;
      } else if([ 
        'endoplasmic reticulum',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = -4;
      } else if([ 
        'nuclear envelope',
        'nucleoplasm',
        'chromosome',
        'chromosome, centromeric region',
      ].some(l => cellularLocation?.includes(l))) {
        node.location = -5;
      }
    }
    nodes.push(node);
  };

  const addEdge = (data : GraphEdge) => {
    const edge = {
      ...data,
    }
    let sourceEdges = edgeMap.get(data.source);
    if(!sourceEdges) {
      sourceEdges = [];
      edgeMap.set(data.source, sourceEdges);
    }
    sourceEdges.push(edge);
    let targetEdges = edgeMap.get(data.target);
    if(!targetEdges) {
      targetEdges = [];
      edgeMap.set(data.target, targetEdges);
    }
    targetEdges.push(edge);
    
    edges.push(edge);
  }

  nodeData.forEach(n => addNode(n));
  edgeData.forEach(e => addEdge({
    ...e,
    sourcePos: [ 0, 0 ],
    targetPos: [ 0, 0 ],
  }));

  for(let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if(node.type === 'reaction' 
      || node.type === 'control'
      || node.type === 'template_reaction'
    ) {
      const adjacentEdges = edgeMap.get(node.__id);
      if(adjacentEdges && adjacentEdges.length > 0) {
        let meanLocation = adjacentEdges.map(e => 
          nodes[e.source === node.__id ? e.target : e.source].location
        ).reduce((a, b) => a + b, 0) / adjacentEdges.length;
        node.location = meanLocation;
      }
    }
  }

  const simulation = forceSimulation(nodes);
  
  let flatEdges = JSON.parse(JSON.stringify(
    Array.from(edgeMap).map(entry => entry[1])
  )) as GraphEdge[][];
  simulation
    .force('charge', forceManyBody().strength(-30))
    .force('link', forceLink(
      flatEdges.reduce((a, b) => [...a, ...b], [])
    ).distance(l => 
      Math.max(
        Math.abs(
          ((l as any).target as GraphNode).location - ((l as any).source as GraphNode).location
        ) * locationDistance,
        10
      )
    ))
    // .force('center', forceCenter());
    .force('center', structuringForce(0, 0, 
      (d) => {
        return undefined;
      }, 
      (d) => {
        return d.location != null ? d.location * locationDistance : undefined;
      })
    );
  simulation.stop();

  const simNodes = simulation.nodes();
  let cachedPositions = JSON.parse(window.localStorage.getItem('graph/cachedPositions') || '[]');
  // console.log('cachedPositions', cachedPositions)
  if(cachedPositions.length === simNodes.length) {
    // console.log('loading from cache')
    simulation.nodes().forEach((n, i) => {
      n.x = cachedPositions[i].x;
      n.y = cachedPositions[i].y;
    })
  } else {
    simulation.tick(50);
    cachedPositions = simNodes.map(n => { return { x: n.x, y: n.y }; })
    window.localStorage.setItem('graph/cachedPositions', JSON.stringify(cachedPositions));
  }

  simulation.nodes().forEach((n, i) => {
    nodes[i].x = n.x;
    nodes[i].y = n.y;
    nodes[i].minX = n.x;
    nodes[i].maxX = n.x;
    nodes[i].minY = n.y;
    nodes[i].maxY = n.y;
  });

  edges.forEach(e => {
    e.sourcePos = [ nodes[e.source].x, nodes[e.source].y ];
    e.targetPos = [ nodes[e.target].x, nodes[e.target].y ];
  });

  return {
    nodes,
    edges,
    edgeMap,
  }
}

/*
 * Centers the graph and aligns nodes by their intended localities
 */
const structuringForce = (
  cx : number, 
  cy : number, 
  x : ((node : GraphNode, i? : number, nodes? : GraphNode[]) => number | undefined), 
  y : ((node : GraphNode, i? : number, nodes? : GraphNode[]) => number | undefined),
) => {
  let constant = (_ : number) => {return () => (_)}
  // var strength = constant(2.0),
  var strength : ((d : GraphNode) => number) = (d : GraphNode) => d.location === 0 ? 0.2 : 5.0,
      nodes : GraphNode[],
      strengths : number[],
      xz : (number | undefined)[],
      yz : (number | undefined)[];

  // if (x == null) x = 0;
  // if (y == null) y = 0;

  function force(alpha : number) {
    var i,
        n = nodes.length,
        node : GraphNode,
        sx = 0,
        sy = 0;

    for (i = 0; i < n; ++i) {
      node = nodes[i];
      sx += node.x;
      sy += node.y;
    }
    for (sx = sx / n - cx, sy = sy / n - cy, i = 0; i < n; ++i) {
      node = nodes[i]
      //node.x -= sx, node.y -= sy;
      // node.vx += (-sx) * strengths[i] * alpha
      // node.vy += (-sy) * strengths[i] * alpha
    }
    for (let i = 0, n = nodes.length; i < n; ++i) {
      node = nodes[i]
      if(xz[i] != null)
        node.vx += ((xz[i] as number) - node.x) * strengths[i] * alpha;
      if(yz[i] != null)
        node.vy += ((yz[i] as number) - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      xz[i] = x(nodes[i], i, nodes);
      yz[i] = y(nodes[i], i, nodes);
      // strengths[i] = +strength(nodes[i], i, nodes)
      strengths[i] = +strength(nodes[i]);
    }
  }

  force.initialize = function(_ : GraphNode[]) {
    nodes = _
    initialize()
  }

  force.strength = function(_ : ((d : GraphNode) => number)) {
    return arguments.length ? (strength = (typeof _ === "function") ? _ : constant(+_), initialize(), force) : strength
  }

  force.x = function(_ : number) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), initialize(), force) : x
  }

  force.y = function(_ : number) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), initialize(), force) : y
  }

  return force;
}
