import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

import { store } from '../store';
import { PointShader } from '../shaders/PointShader';
import { GraphNode, GraphEdge } from '../store/pathways/types';
import GraphEdges, { GraphEdgesProps } from './GraphEdges';
import { observeSelection } from './ObservesSelection';
import { SelectionState } from '../store/selection/types';

interface Props {
  nodes : GraphNode[];
  edges : GraphEdge[];
}

const Graph = ({ nodes, edges } : Props) => {
  const neutralColor = [0, 0, 0, 0.1];
  const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255, 1.0];
  const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255, 1.0];

  const [ filteredGeneExpression, setFilteredGeneExpression ] = useState(
    store.getState().expressionDataset.filteredGeneExpression
  );
  const handleStoreUpdate = () => {
    setFilteredGeneExpression(store.getState().expressionDataset.filteredGeneExpression);
  };
  useEffect(() => {
    const subscription = store.subscribe(() => {
      handleStoreUpdate();
    });
    handleStoreUpdate();
    return subscription;
  }, []);

  const posAttr = useRef<THREE.BufferAttribute>();
  const colorAttr = useRef<THREE.BufferAttribute>();
  const sizeAttr = useRef<THREE.BufferAttribute>();
  // Setup point attribute buffers
  const [ positions, colors, sizes ] = useMemo(
    () => {
      console.log('nodes.length', nodes.length);
      
      const positions : number[] = [];
      const colors : number[] = [];
      const sizes : number[] = [];

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

      nodes.forEach(n => addNode(n));

      return [ 
        new Float32Array(positions), 
        new Float32Array(colors),
        new Float32Array(sizes),
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
    [filteredGeneExpression, colorAttr.current, sizeAttr.current, nodes, edges]
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

  // console.log('selection.selectedEdges', selection.selectedEdges)

  const SelectionAwareGraphEdges = observeSelection(
    GraphEdges,
    (state : SelectionState, props : GraphEdgesProps) => {
      return {
        ...props,
        edges: state.selectedEdges
      };
    }
  );

  return (
    <>
      <GraphEdges edges={edges} color={[0, 0, 0, 0.2]} />
      <SelectionAwareGraphEdges edges={[]} color={[50 / 255, 136 / 255, 111 / 255, 1.0]} />
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
