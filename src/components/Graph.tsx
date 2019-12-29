import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

import { PointShader } from '../shaders/PointShader';
import { GraphEdgeShader } from '../shaders/GraphEdgeShader'
import { BufferAttribute } from 'three';
import { GraphNode, GraphEdge } from '../store/pathways/types';
import { ExpressionDataRow } from '../core/types';

interface Props {
  nodes : GraphNode[];
  edges : GraphEdge[];
  filteredGeneExpression : Map<string, ExpressionDataRow>;
}

export const Graph = ({ nodes, edges, filteredGeneExpression } : Props) => {
  const neutralColor = [0, 0, 0, 0.1];
  const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255, 1.0];
  const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255, 1.0];

  const posAttr = useRef<THREE.BufferAttribute>();
  const edgePosAttr = useRef<THREE.BufferAttribute>();
  const colorAttr = useRef<THREE.BufferAttribute>();
  const sizeAttr = useRef<THREE.BufferAttribute>();
  // Setup point attribute buffers
  const [ positions, colors, sizes, edgePositions, edgeTexcoords ] = useMemo(
    () => {
      console.log('nodes.length', nodes.length);
      console.log('edges.length', edges.length);
      
      const positions : number[] = [];
      const colors : number[] = [];
      const sizes : number[] = [];
      const edgePositions : number[] = [];
      const edgeTexcoords : number[] = [];

      if(nodes.length < 1) {
        return [ 
          new Float32Array(positions), 
          new Float32Array(colors),
          new Float32Array(sizes),
          new Float32Array(edgePositions),
          new Float32Array(edgeTexcoords),
        ];
      }

      const addNode = (node : GraphNode) => {
        let color = neutralColor;
        let size = 1.0;
        positions.push(
          node.x,
          node.y,
          0
        );
        colors.push(...color);
        sizes.push(size);
      };
      const addEdge = (edge : GraphEdge) => {
        edgePositions.push(
          positions[edge.source * 3],
          positions[edge.source * 3 + 1],
          positions[edge.source * 3 + 2],
          positions[edge.target * 3],
          positions[edge.target * 3 + 1],
          positions[edge.target * 3 + 2]
        );
        edgeTexcoords.push(0.0, 0.0, 1.0, 1.0);
      }

      nodes.forEach(n => addNode(n));
      edges.forEach(e => addEdge(e));

      // Update node positions according to the simulation results
      for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        positions[i*3] = node.x;
        positions[i*3+1] = node.y;
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
        new Float32Array(positions), 
        new Float32Array(colors),
        new Float32Array(sizes),
        new Float32Array(edgePositions),
        new Float32Array(edgeTexcoords),
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, edges]
  );

  useEffect(
    () => {
      if(!colorAttr.current || !sizeAttr.current) {
        return;
      }
      const colors = [];
      const sizes = [];

      console.log('graph filtered', filteredGeneExpression.size)

      for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let color = neutralColor;
        let size = 1.0;
        if(node.type === 'molecule') {
          const geneName = node.entityReference?.gene?.name;
          // console.log('geneName', geneName);
          if(geneName) {
            const expressionData = filteredGeneExpression.get(geneName);
            if(expressionData != null) {
              let foldChange = expressionData.fold_change_log2 || 0;
              size = Math.sqrt(Math.abs(foldChange)) * 2.0;
              if(foldChange > 0)
                color = warmColor;
              else
                color = coldColor;
            }
          }
        }
        colors.push(...color);
        sizes.push(size);
      }

      colorAttr.current.array = new Float32Array(colors);
      colorAttr.current.needsUpdate = true;
      sizeAttr.current.array = new Float32Array(sizes);
      sizeAttr.current.needsUpdate = true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredGeneExpression, colorAttr.current, sizeAttr.current]
  );

  const [ pointShader, graphEdgeShader ] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const pointShader = new PointShader({
      pointTexture: loader.load('./textures/circle.png'),
    });
    const graphEdgeShader = new GraphEdgeShader();
    return [ pointShader, graphEdgeShader ];
  }, []);

  if(nodes.length < 1) {
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

export default Graph;
