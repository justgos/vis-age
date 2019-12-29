import React, { useMemo, useState, useEffect } from 'react';

import { store } from '../store';
import { GraphNode, GraphEdge } from '../store/pathways/types';
import GraphEdges, { GraphEdgesProps } from './GraphEdges';
import { observeSelection } from './ObservesSelection';
import { SelectionState } from '../store/selection/types';
import GraphNodes, { GraphNodesProps } from './GraphNodes';

interface Props {
  nodes : GraphNode[];
  edges : GraphEdge[];
}

const Graph = ({ nodes, edges } : Props) => {
  const neutralColor = [0, 0, 0, 0.05];
  const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255, 0.4];
  const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255, 0.4];

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

  function getNodeColorsAndSizes(nodes : GraphNode[], emphasized : boolean = false) {
    const colors : number[] = [];
    const sizes : number[] = [];

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
      if(emphasized) {
        color = color.slice();
        color[3] = 1.0;
      }
      colors.push(...color);
      sizes.push(size);
    }

    return [ 
      colors,
      sizes,
    ];
  }

  const [ colors, sizes ] = useMemo(
    () => {
      return getNodeColorsAndSizes(nodes);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, filteredGeneExpression]
  );

  const SelectionAwareGraphNodes = observeSelection(
    GraphNodes,
    (state : SelectionState, props : GraphNodesProps) => {
      const [ colors, sizes ] = getNodeColorsAndSizes(state.selectedNodes, true);
      return {
        ...props,
        nodes: state.selectedNodes,
        colors,
        sizes,
      };
    }
  );

  const SelectionAwareGraphEdges = observeSelection(
    GraphEdges,
    (state : SelectionState, props : GraphEdgesProps) => {
      return {
        ...props,
        edges: state.selectedEdges,
      };
    }
  );

  return (
    <>
      <GraphEdges edges={edges} color={[0, 0, 0, 0.2]} />
      <SelectionAwareGraphEdges edges={[]} color={[50 / 255, 136 / 255, 111 / 255, 1.0]} />
      <GraphNodes nodes={nodes} sizes={sizes} colors={colors} />
      <SelectionAwareGraphNodes nodes={[]} sizes={[]} colors={[]} />
    </>
  );
};

export default Graph;
