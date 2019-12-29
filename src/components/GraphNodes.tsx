import React, { useMemo } from 'react';
import * as THREE from 'three';

import { PointShader } from '../shaders/PointShader';
import { BufferAttribute } from 'three';
import { GraphNode } from '../store/pathways/types';

export interface GraphNodesProps {
  nodes : GraphNode[];
  sizes : number[];
  colors : number[];
}

function GraphNodes({ nodes, sizes, colors } : GraphNodesProps) {
  const [ posBuf ] = useMemo(
    () => {
      console.log('nodes.length', nodes.length);

      const positions : number[] = [];
      const addNode = (node : GraphNode) => {
        positions.push(
          node.x,
          node.y,
          0
        );
      };

      nodes.forEach(n => addNode(n));

      return [ 
        new BufferAttribute(new Float32Array(positions), 3),
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes]
  );

  const [ sizeBuf, colorBuf ] = useMemo(
    () => {
      return [ 
        new BufferAttribute(new Float32Array(sizes), 1),
        new BufferAttribute(new Float32Array(colors), 4),
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sizes, colors]
  );

  const [ pointShader ] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const pointShader = new PointShader({
      pointTexture: loader.load('./textures/circle.png'),
    });
    return [ pointShader ];
  }, []);

  if(nodes.length < 1) {
    return (
      <>
      </>
    );
  }

  return (
    <points
      frustumCulled={false}
      material={pointShader}>
      <bufferGeometry attach="geometry"
        attributes={{
          position: posBuf,
          size: sizeBuf,
          color: colorBuf,
        }}
      />
      {/* <lineBasicMaterial attach="material" color={new THREE.Color(0,0,0)}/> */}
    </points>
  );
};

export default GraphNodes;
