import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import { useGesture } from 'react-use-gesture'
import { CanvasContext } from 'react-three-fiber';

import { CombinedState } from '../store';
import Tooltip from "./Tooltip";
import RBush from 'rbush';
import knn from 'rbush-knn';
import { GraphNode } from '../store/pathways/types';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    // pathwayGraph: state.pathways.graph,
    expressionDataset: state.expressionDataset,
    // filterExpressionData: state.expressionDataset.filtered,
  };
};

const mapDispatchToProps = {
  // setFilterValue
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  nodes : GraphNode[];
  canvasContainerRef : React.RefObject<HTMLDivElement>;
  canvasCtx : CanvasContext;
};

function TooltipController({ nodes, canvasContainerRef: canvasContainer, canvasCtx, expressionDataset } : Props) {
  const [ refExpressionRows, pointTree ] = useMemo(
    () => {
      const refExpressionRows : number[] = [];
      const pointTree = new RBush();
      
      const filteredNodes : GraphNode[] = [];

      for(let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let shouldInclude = false;
        let refExpressionRow = -1;
        // if(node.type === 'molecule') {
        //   const geneName = node.entityReference?.gene?.name;
        //   // console.log('geneName', geneName);
        //   const expressionData = expressionDataset.getByGene(geneName);
        //   if(expressionData != null) {
        //     shouldInclude = true;
        //     refExpressionRow = expressionData.__id || -1;
        //     let foldChange = expressionData.fold_change_log2 || 0;
        //   }
        // }
        // if(shouldInclude)
          filteredNodes.push(nodes[i] as GraphNode);
        refExpressionRows.push(refExpressionRow);
      }

      // pointTree.clear();
      pointTree.load(filteredNodes);

      return [
        refExpressionRows,
        pointTree,
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expressionDataset, nodes]
  );

  const [ targetId, setTargetId ] = useState(-1);
  const [ tooltipState, setTooltipState ] = useState({
    active: false,
    x: 0,
    y: 0,
    content: <></>,
  });

  function onMouseMove(x : number, y : number) {
    const mouseX = x - (canvasContainer.current?.offsetLeft || 0);
    const mouseY = y - (canvasContainer.current?.offsetTop || 0);
    
    const { width, height } = canvasCtx.size;
    const camera = canvasCtx.camera;

    let mx = (mouseX - width / 2) / camera.zoom + camera.position.x;
    let my = (height - mouseY - height / 2) / camera.zoom + camera.position.y;

    // Tooltip targeting
    let nearest = knn(
      pointTree, 
      mx, 
      my, 
      1
    );
    if(nearest.length > 0) {
      const node = nodes[(nearest[0] as GraphNode).__id];
      if(node.__id !== targetId) {
        const refExpressionRow = refExpressionRows[node.__id]
        const row = (refExpressionRow >= 0) ? expressionDataset.raw[refExpressionRow] : undefined;
        // console.log('updateTooltip', row)
        const dashForNan = (val : string) => (val && val !== '' && val !== 'nan') ? val : '—';
        setTooltipState({
          active: true,
          x: ((node.x || 0) - camera.position.x) * camera.zoom + width / 2,
          y: height / 2 - ((node.y || 0) - camera.position.y) * camera.zoom,
          content: <>
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
        });
        setTargetId(node.__id)
      }
    }
  }

  const bind = useGesture({
    onMove: ({ xy: [x, y] }) => {
      onMouseMove(x, y);
    },
  }, {
    domTarget: canvasContainer,
    event: { passive: false },
  });
  useEffect(() => { bind(); }, [bind]);

  return (
    <Tooltip {...tooltipState} />
  );
}

export default connector(TooltipController);
