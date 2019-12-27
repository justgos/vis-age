import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from 'react-three-fiber';
// import * as math from 'mathjs';
import { forceSimulation, forceManyBody, forceLink, forceCenter } from 'd3-force';
import RBush from 'rbush';
import knn from 'rbush-knn';

import { store } from '../store';
import { updateTooltip } from '../store/tooltip/actions'
import { PointShader } from '../shaders/PointShader';
import { GraphEdgeShader } from '../shaders/GraphEdgeShader'
import { PathwayEntity, Molecule, Control, TemplateReaction, Reaction } from '../core/types';
import { BufferAttribute } from 'three';

interface GraphNode extends Molecule {
  __id : number;
  x : number;
  y : number;
  vx : number;
  vy : number;
  minX? : number;
  maxX? : number;
  minY? : number;
  maxY? : number;
  location : number | undefined;
}

interface GraphEdge {
  source : number;
  target : number;
}

export const Graph = () => {
  const {
    mouse,
    camera,
    size: { width, height },
  } = useThree();
  
  const [ pathways, setPathways ] = useState({...store.getState().pathways});
  const [ expressionDataset, setExpressionDataset ] = useState({...store.getState().expressionDataset});
  const updateData = () => {
    setExpressionDataset({...store.getState().expressionDataset});
    setPathways({...store.getState().pathways});
  };
  useEffect(() => {
    store.subscribe(() => {
      updateData();
    });
    updateData();
  }, []);

  // const xpos = (row : ExpressionDataRow) => 
  //   (row.fold_change_log2 || 0) * 25.0;
  // const ypos = (row : ExpressionDataRow) => 
  //   (-Math.log(Math.max(row.p_value || 0, 1e-300))) * 0.9;

  const neutralColor = [0, 0, 0, 0.1];
  const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255, 1.0];
  const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255, 1.0];

  const posAttr = useRef<THREE.BufferAttribute>();
  const edgePosAttr = useRef<THREE.BufferAttribute>();
  const colorAttr = useRef<THREE.BufferAttribute>();
  const sizeAttr = useRef<THREE.BufferAttribute>();
  // Setup point attribute buffers
  const [ nodes, edgeMap, positions, sizes, colors, edgePositions, edgeTexcoords, simulation ] = useMemo(
    () => {
      console.log('pathways.raw.length', pathways.raw.length);
      const nodes : GraphNode[] = [];
      const nodeNameMap = new Map<string, number>();
      const edges : GraphEdge[] = [];
      const edgeMap = new Map<number, GraphEdge[]>();
      const positions : number[] = [];
      const sizes : number[] = [];
      const colors : number[] = [];
      const edgePositions : number[] = [];
      const edgeTexcoords : number[] = [];

      if(pathways.raw.length < 1) {
        return [ 
          nodes,
          edgeMap,
          new Float32Array(positions), 
          new Float32Array(sizes), 
          new Float32Array(colors), 
          new Float32Array(edgePositions),
          new Float32Array(edgeTexcoords),
          forceSimulation(),
        ];
      }

      const addNode = (data : PathwayEntity) => {
        let name = data.name;
        // if((data.type === 'molecule') && (data as Molecule).entityReference?.name)
        //   name = (data as Molecule).entityReference?.name || name;
        if(nodeNameMap.has(name))
          return nodeNameMap.get(name) as number;
        const id = nodes.length;
        let node : GraphNode = {
          ...data,
          __id: id,
          location: (data.type === 'molecule') ? 0 :  undefined,
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          vx: 0,
          vy: 0,
        };
        let color = neutralColor;
        let size = 1.0;
        if(data.type === 'molecule' && (data as Molecule).cellularLocation) {
          const cellularLocation = (data as Molecule).cellularLocation;
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
        nodeNameMap.set(node.name, id);
        nodes.push(node);
        positions.push(
          node.x,
          node.y,
          0
        );
        sizes.push(size);
        colors.push(...color);
        return id;
      };
      const addEdge = (source : number, target : number) => {
        let sourceEdges = edgeMap.get(source);
        if(!sourceEdges) {
          sourceEdges = [];
          edgeMap.set(source, sourceEdges);
        }
        sourceEdges.push({ source, target });
        edges.push({ source, target });
        edgePositions.push(
          positions[source * 3],
          positions[source * 3 + 1],
          positions[source * 3 + 2],
          positions[target * 3],
          positions[target * 3 + 1],
          positions[target * 3 + 2]
        );
        edgeTexcoords.push(0.0, 0.0, 1.0, 1.0);
      }

      for(let i_p = 0; i_p < pathways.raw.length; i_p++) {
        const pathway = pathways.raw[i_p];
        for(let i_r = 0; i_r < pathway.pathwayComponent.length; i_r++) {
          const reactionContainer = pathway.pathwayComponent[i_r];

          let reactionNodeId = addNode(reactionContainer);

          // Extract the contained reaction
          let reaction : Reaction;
          if(reactionContainer.type === 'control') {
            reaction = (reactionContainer as Control).controlled;

            let moleculeNodeId = addNode((reactionContainer as Control).controller);
            addEdge(moleculeNodeId, reactionNodeId);
            // addEdge(reactionNodeId, moleculeNodeId);
          } else if(reactionContainer.type === 'template_reaction') {
            if((reactionContainer as TemplateReaction).template) {
              let moleculeNodeId = addNode((reactionContainer as TemplateReaction).template as PathwayEntity);
              addEdge(moleculeNodeId, reactionNodeId);
              // addEdge(reactionNodeId, moleculeNodeId);
            }

            for(let i_m = 0; i_m < (reactionContainer as TemplateReaction).product.length; i_m++) {
              const molecule = (reactionContainer as TemplateReaction).product[i_m];
              let moleculeNodeId = addNode(molecule);
              addEdge(reactionNodeId, moleculeNodeId);
              // addEdge(reactionNodeId, moleculeNodeId);
            }
            reaction = reactionContainer as Reaction;
          } else {
            reaction = reactionContainer as Reaction;
          }

          // // Process reaction direction
          // if(reaction.conversionDirection === 'LEFT-TO-RIGHT') {
          //   //
          // } else if(reaction.conversionDirection === 'RIGHT-TO-LEFT') {
          //   //
          // } else {
          //   // REVERSIBLE
          // }

          // Process reaction participants
          if(reaction.left) {
            for(let i_m = 0; i_m < reaction.left.length; i_m++) {
              const molecule = reaction.left[i_m];
              let moleculeNodeId = addNode(molecule);
              // addEdge(reactionNodeId, moleculeNodeId);

              if(reaction.conversionDirection === 'LEFT_TO_RIGHT') {
                addEdge(moleculeNodeId, reactionNodeId);
              } else if(reaction.conversionDirection === 'RIGHT_TO_LEFT') {
                addEdge(reactionNodeId, moleculeNodeId);
              } else {
                // REVERSIBLE
                addEdge(moleculeNodeId, reactionNodeId);
                // addEdge(reactionNodeId, moleculeNodeId);
              }
            }
          }
          if(reaction.right) {
            for(let i_m = 0; i_m < reaction.right.length; i_m++) {
              const molecule = reaction.right[i_m];
              let moleculeNodeId = addNode(molecule);
              // addEdge(reactionNodeId, moleculeNodeId);

              if(reaction.conversionDirection === 'LEFT_TO_RIGHT') {
                addEdge(reactionNodeId, moleculeNodeId);
              } else if(reaction.conversionDirection === 'RIGHT_TO_LEFT') {
                addEdge(moleculeNodeId, reactionNodeId);
              } else {
                // REVERSIBLE
                // addEdge(moleculeNodeId, reactionNodeId);
                addEdge(reactionNodeId, moleculeNodeId);
              }
            }
          }
        }
      }

      const simulation = forceSimulation(nodes.map((n, i) => {
        return {
          x: positions[i*3],
          y: positions[i*3+1],
          ...n,
        };
      }));
      forceLink()
      
      let flatEdges = Array.from(edgeMap).map(entry => entry[1]);
      simulation
        .force('charge', forceManyBody().strength(-100))
        .force('link', forceLink(
          flatEdges.reduce((a, b) => [...a, ...b], [])
        ))
        // .force('center', forceCenter());
        .force('center', structuringForce(width / 2, height / 2, 
          (d) => {
            return undefined;
          }, 
          (d) => {
            return d.location != null ? d.location * 500 : undefined;
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
        n.minX = n.x;
        n.maxX = n.x;
        n.minY = n.y;
        n.maxY = n.y;
      });

      // Update node positions according to the simulation results
      for(let i = 0; i < simNodes.length; i++) {
        const simNode = simNodes[i];
        positions[i*3] = simNode.x;
        positions[i*3+1] = simNode.y;
      }
      // Update edge positions
      for(let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        edgePositions[i * 6] = positions[edge.source * 3];
        edgePositions[i * 6 + 1] = positions[edge.source * 3 + 1];
        edgePositions[i * 6 + 2] = positions[edge.source * 3 + 2];
        edgePositions[i * 6 + 3] = positions[edge.target * 3];
        edgePositions[i * 6 + 4] = positions[edge.target * 3 + 1];
        edgePositions[i * 6 + 5] = positions[edge.target * 3 + 2];
      }

      return [ 
        nodes,
        edgeMap,
        new Float32Array(positions), 
        new Float32Array(sizes), 
        new Float32Array(colors), 
        new Float32Array(edgePositions),
        new Float32Array(edgeTexcoords),
        simulation,
      ];
    },
    [pathways.lastUpdateTime, pathways.raw]
  );

  const [ refExpressionRows, pointTree ] = useMemo(
    () => {
      const refExpressionRows : number[] = [];
      const pointTree = new RBush();
      if(!colorAttr.current || !sizeAttr.current) {
        return [
          refExpressionRows,
          pointTree,
        ];
      }
      const colors = [];
      const sizes = [];

      console.log('filtered')

      const simNodes = simulation.nodes();
      const filteredNodes : GraphNode[] = [];

      for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let color = neutralColor;
        let size = 1.0;
        let refExpressionRow = -1;
        if(node.type === 'molecule') {
          const geneName = node.entityReference?.gene?.name;
          // console.log('geneName', geneName);
          const expressionData = expressionDataset.getByGene(geneName);
          if(expressionData != null) {
            filteredNodes.push(simNodes[i] as GraphNode);
            refExpressionRow = expressionData.__id || -1;
            let foldChange = expressionData.fold_change_log2 || 0;
            size = Math.sqrt(Math.abs(foldChange)) * 2.0;
            if(foldChange > 0)
              color = warmColor;
            else
              color = coldColor;
          }
        }
        refExpressionRows.push(refExpressionRow);
        colors.push(...color);
        sizes.push(size);
      }

      // pointTree.clear();
      pointTree.load(filteredNodes);

      colorAttr.current.array = new Float32Array(colors);
      colorAttr.current.needsUpdate = true;
      sizeAttr.current.array = new Float32Array(sizes);
      sizeAttr.current.needsUpdate = true;

      return [
        refExpressionRows,
        pointTree,
      ];
    },
    [expressionDataset.filtered, colorAttr.current, sizeAttr.current]
  );

  const [ pointShader, graphEdgeShader ] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const pointShader = new PointShader({
      pointTexture: loader.load('./textures/circle.png'),
    });
    const graphEdgeShader = new GraphEdgeShader();
    return [ pointShader, graphEdgeShader ];
  }, []);

  const [ lastTime, lastTargetId ] = useMemo(() => {
    return [
      { value: performance.now() },
      { value: 0 },
    ];
  }, []);
  const dashForNan = (val : string) => (val && val !== '' && val !== 'nan') ? val : '—';
  useFrame(() => {
    let curTime = performance.now();
    let dtime = Math.min((curTime - lastTime.value) / 1000, 0.1);
    lastTime.value = performance.now();

    let mx = (mouse.x * 0.5) * width / camera.zoom + camera.position.x;
    let my = (mouse.y * 0.5) * height / camera.zoom + camera.position.y;

    // Graph layout
    // if(posAttr.current && edgePosAttr.current) {
    //   const posArray = Array.from(posAttr.current.array);
    //   simulation.tick();
    //   const simNodes = simulation.nodes();
    //   for(let i = 0; i < simNodes.length; i++) {
    //     const simNode = simNodes[i];
    //     posArray[i*3] = simNode.x;
    //     posArray[i*3+1] = simNode.y;
    //   }

    //   // pointTree.clear();
    //   // pointTree.load(simNodes.map((n, i) => { return { 
    //   //   minX: n.x, 
    //   //   minY: n.y, 
    //   //   maxX: n.x, 
    //   //   maxY: n.y,
    //   //   ...n 
    //   // }}));

    //   posAttr.current.array = new Float32Array(posArray);
    //   posAttr.current.needsUpdate = true;

    //   edgePosAttr.current.array = new Float32Array(posArray);
    //   edgePosAttr.current.needsUpdate = true;
    // }

    // Tooltip targeting
    let nearest = knn(
      pointTree, 
      mx, 
      my, 
      1
    );
    if(nearest.length > 0) {
      const node = nodes[(nearest[0] as GraphNode).__id];
      if(node.__id !== lastTargetId.value) {
        const simNode = simulation.nodes()[node.__id];
        const refExpressionRow = refExpressionRows[node.__id]
        const row = (refExpressionRow >= 0) ? expressionDataset.raw[refExpressionRow] : undefined;
        // console.log('updateTooltip', row)
        store.dispatch(updateTooltip(
          ((simNode.x || 0) - camera.position.x) * camera.zoom + width / 2,
          height / 2 - ((simNode.y || 0) - camera.position.y) * camera.zoom,
          <>
            <div className="prop">
              <div className="name">Name</div>
              <div className="value">{dashForNan(node.name)}</div>
            </div>
            <div className="prop">
              <div className="name">Location</div>
              <div className="value">{node.cellularLocation}</div>
            </div>
            <div className="prop">
              <div className="name">log<sub>2</sub>(Fold-change)</div>
              <div className="value" style={{ color: (row?.fold_change_log2 || 0) > 0 ? "#fb6542" : "#375e97" }}>
                {row?.fold_change_log2?.toFixed(2)}
              </div>
            </div>
            <div className="prop">
              <div className="name">xref</div>
              <div className="value">{node.entityReference?.xref?.db}:{node.entityReference?.xref?.id}</div>
            </div>
          </>
        ));
        lastTargetId.value = row?.__id || -1;
      }
      // console.log(nearest[0].gene, mx, my);
    }
  });

  if(positions.length < 1) {
    return (
      <>
      </>
    );
  }

  return (
    <>
      <lineSegments
        frustumCulled={false}
        material={graphEdgeShader}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={edgePositions.length / 3}
            array={edgePositions}
            itemSize={3}
            ref={edgePosAttr}
          />
          <bufferAttribute
            attachObject={['attributes', 'uv']}
            count={edgeTexcoords.length / 2}
            array={edgeTexcoords}
            itemSize={2}
          />
          <bufferAttribute
            attachObject={['attributes', 'size']}
            count={sizes.length}
            array={sizes}
            itemSize={1}
            ref={sizeAttr}
          />
          {/* <bufferAttribute
            attachObject={['attributes', 'color']}
            count={colors.length / 4}
            array={colors}
            itemSize={4}
            // ref={colorAttr}
          /> */}
        </bufferGeometry>
        {/* <lineBasicMaterial attach="material" color={new THREE.Color(0,0,0)}/> */}
      </lineSegments>
      <points 
        frustumCulled={false}
        material={pointShader}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            ref={posAttr}
          />
          <bufferAttribute
            attachObject={['attributes', 'size']}
            count={sizes.length}
            array={sizes}
            itemSize={1}
            ref={sizeAttr}
          />
          <bufferAttribute
            attachObject={['attributes', 'color']}
            count={colors.length / 4}
            array={colors}
            itemSize={4}
            ref={colorAttr}
          />
        </bufferGeometry>
      </points>
    </>
  );
};

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
  var strength : ((d : GraphNode) => number) = (d : GraphNode) => d.location === 0 ? 0.5 : 1.0,
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
        node.vx += ((xz[i] as number) - node.x) * strengths[i] * alpha
      if(yz[i] != null)
        node.vy += ((yz[i] as number) - node.y) * strengths[i] * alpha
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

export default Graph;
