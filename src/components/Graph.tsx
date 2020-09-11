import React, { useMemo, useState, useEffect } from 'react';

import { store } from '../store';
import { GraphNode, GraphEdge, GeneAnnotation } from '../store/pathways/types';
import GraphEdges, { GraphEdgesProps } from './GraphEdges';
import { observeSelection } from './ObservesSelection';
import { SelectionState } from '../store/selection/types';
import GraphNodes, { GraphNodesProps } from './GraphNodes';
import { updateSelection, updateTarget } from '../store/selection/actions';
import { useThree } from 'react-three-fiber';

interface Props {
  nodes : GraphNode[];
  edges : GraphEdge[];
}

const Graph = ({ nodes, edges } : Props) => {
  const ctx = useThree();
  
  const neutralColor = [0, 0, 0, 0.1];
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
    const filteredNodes : GraphNode[] = [];
    const refExpressionRows = new Map<number, number>();

    for(let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      let shouldInclude = false;
      let refExpressionRow = -1;
      let color = neutralColor;
      let size = 10.0;
      if(node.type === 'molecule') {
        const geneName = node.entityReference?.gene?.name;
        // console.log('geneName', geneName);
        if(geneName) {
          const expressionData = filteredGeneExpression.get(geneName);
          if(expressionData != null) {
            shouldInclude = true;
            refExpressionRow = expressionData.__id || -1;
            let foldChange = expressionData.fold_change_log2 || 0;
            size = Math.sqrt(Math.abs(foldChange)) * 2.0 * 13.0;
            if(foldChange > 0)
              color = warmColor;
            else
              color = coldColor;
          }
        }
      }
      if(emphasized) {
        color = color.slice();
        color[3] = 5.0;
      }
      if(shouldInclude)
        filteredNodes.push(nodes[i] as GraphNode);
      refExpressionRows.set(node.__id, refExpressionRow);
      colors.push(...color);
      sizes.push(size);
    }

    return {
      colors,
      sizes,
      filteredNodes,
      refExpressionRows,
    };
  }

  const { colors, sizes, filteredNodes, refExpressionRows } = useMemo(
    () => {
      return getNodeColorsAndSizes(nodes);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, filteredGeneExpression]
  );

  const renderTruncatedList = <T extends any>(
    list : T[] | undefined, 
    itemCallback : (item : T, i : number) => JSX.Element,
    limit : number,
    trunctationNoticeWrapper? : (truncationNotice : JSX.Element, i : number) => JSX.Element,
  ) => {
    let i = 0;
    const res = [];
    if(list == null) {
      res.push(<div key={0}>—</div>);
      return res
    }
    while(i < list.length && i < limit) {
      res.push(itemCallback(list[i], i));
      i++;
    }
    if(i < list.length) {
      let truncationNotice = (
        <div className="list-truncation-notice" key={i+1}>
          {list.length - i} more..
        </div>
      );
      if(trunctationNoticeWrapper)
        truncationNotice = trunctationNoticeWrapper(truncationNotice, i+1);
      res.push(truncationNotice);
    }
    return res;
  };

  useEffect(() => {
    store.dispatch(updateTarget(
      'primary', 
      // cellEmbeddings.raw.filter((p, i) => cellMetadata ? (cellMetadata.raw as CellMetadata[])[i].age === '3m' : true), 
      filteredNodes,
      ctx,
      (id) => {
        const graph = store.getState().pathways.graph;
        const node = graph.nodes[id];
        const refExpressionRow = refExpressionRows.get(node.__id);
        const row = (refExpressionRow && refExpressionRow >= 0) ? store.getState().expressionDataset.raw[refExpressionRow] : undefined;

        // Get depth-2 adjacent nodes
        const firstNeighbours = Array.from(new Set(
          (graph.edgeMap.get(node.__id) || [])
            .map(e => {
              return {
                node: graph.nodes[e.source === node.__id ? e.target : e.source],
                relation: e.relation,
              };
            })
          ));
        const selectedEdges = firstNeighbours
          .map(firstNeighbour => graph.edgeMap.get(firstNeighbour.node.__id) || [])
          .reduce((a, b) => [ ...a, ...b ], []);
        const selectedNodes : { [key : number] : GraphNode } = {};
        selectedEdges.forEach(e => {
          selectedNodes[e.source] = graph.nodes[e.source];
          selectedNodes[e.target] = graph.nodes[e.target];
        });
        store.dispatch(updateSelection(Object.values(selectedNodes), selectedEdges));

        const geneName = node.entityReference?.gene?.name;
        let geneAnnotation : GeneAnnotation | undefined = undefined;
        if(geneName)
          geneAnnotation = store.getState().pathways.geneAnnotations.genes.get(geneName);
        return (
          <>
            <div className="prop">
              <div className="name">Name</div>
              <div className="value">{geneName || node.name}</div>
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
            <div className="prop">
              <div className="name">GO terms</div>
              <div className="value">
                {renderTruncatedList(geneAnnotation?.go_terms, (gt, i) => 
                  <div className="go-term" key={i}>{gt}</div>
                , 2)}
              </div>
            </div>
            {renderTruncatedList(firstNeighbours, (neighbour, i) => 
              <div className="prop" key={i}>
                <div className="name">
                  <span className="accent">{neighbour.relation}</span> in
                </div>
                <div className="value">{neighbour.node.name}</div>
              </div>
            , 2, (truncationNotice, i) =>
              <div className="prop" key={i}>
                <div className="name"></div>
                <div className="value">{truncationNotice}</div>
              </div>
            )}
          </>
        );
      }
    ));
  }, [filteredNodes]);

  const SelectionAwareGraphNodes = observeSelection(
    GraphNodes,
    (state : SelectionState, props : GraphNodesProps) => {
      const { colors, sizes } = getNodeColorsAndSizes(state.selectedNodes, true);
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
      <SelectionAwareGraphEdges edges={[]} color={[130 / 255, 179 / 255, 54 / 255, 1.0]} />
      <GraphNodes nodes={nodes} sizes={sizes} colors={colors} />
      <SelectionAwareGraphNodes nodes={[]} sizes={[]} colors={[]} />
    </>
  );
};

export default Graph;
