import React, { useMemo } from 'react';

import { GraphEdgeShader } from '../shaders/GraphEdgeShader';
import { BufferAttribute } from 'three';
import { GraphEdge } from '../store/pathways/types';

export interface GraphEdgesProps {
  edges : GraphEdge[];
  color : number[];
}

function GraphEdges({ edges, color } : GraphEdgesProps) {
  const [ posBuf, uvBuf, colorBuf ] = useMemo(
    () => {
      console.log('edges.length', edges.length);
      
      const positions : number[] = [];
      const uvs : number[] = [];
      const colors : number[] = [];

      const addEdge = (edge : GraphEdge) => {
        positions.push(
          edge.sourcePos[0],
          edge.sourcePos[1],
          0,
          edge.targetPos[0],
          edge.targetPos[1],
          0,
        );
        uvs.push(0.0, 0.0, 1.0, 1.0);
        colors.push(...color);
        colors.push(...color);
      }

      edges.forEach(e => addEdge(e));

      return [ 
        new BufferAttribute(new Float32Array(positions), 3),
        new BufferAttribute(new Float32Array(uvs), 2),
        new BufferAttribute(new Float32Array(colors), 4),
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edges]
  );

  const [ graphEdgeShader ] = useMemo(() => {
    const graphEdgeShader = new GraphEdgeShader();
    return [ graphEdgeShader ];
  }, []);

  return (
    <lineSegments
      frustumCulled={false}
      material={graphEdgeShader}>
      <bufferGeometry attach="geometry"
        attributes={{
          position: posBuf,
          uv: uvBuf,
          color: colorBuf,
        }}
      />
      {/* <lineBasicMaterial attach="material" color={new THREE.Color(0,0,0)}/> */}
    </lineSegments>
  );
}
export default GraphEdges;
