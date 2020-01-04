import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import { useGesture } from 'react-use-gesture'
import { CanvasContext } from 'react-three-fiber';

import { CombinedState } from '../store';
import Tooltip from "./Tooltip";
import RBush from 'rbush';
import knn from 'rbush-knn';
import { GraphNode, GeneAnnotation } from '../store/pathways/types';
import { updateSelection } from '../store/selection/actions';
import { Point } from '../core/types';
import { SelectionTarget } from '../store/selection/types';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    // // pathwayGraph: state.pathways.graph,
    // expressionDataset: state.expressionDataset,
    // filteredGeneExpression: state.expressionDataset.filteredGeneExpression,
    // graph: state.pathways.graph,
    // geneAnnotations: state.pathways.geneAnnotations,
    // // filterExpressionData: state.expressionDataset.filtered,
    targets: state.selection.targets,
  };
};

const mapDispatchToProps = {
  updateSelection,
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  // canvases : Map<string, CanvasReference>;
  containerRef : React.RefObject<HTMLDivElement>;
};

function TooltipController({
  containerRef,
  targets,
  updateSelection,
} : Props) {
  // const [ refExpressionRows, pointTree ] = useMemo(
  //   () => {
  //     const refExpressionRows = new Map<number, number>();
  //     const pointTree = new RBush();
      
  //     const filteredNodes : GraphNode[] = [];

  //     for(let i = 0; i < nodes.length; i++) {
  //       const node = nodes[i];
  //       let shouldInclude = false;
  //       let refExpressionRow = -1;
  //       if(node.type === 'molecule') {
  //         const geneName = node.entityReference?.gene?.name;
  //         if(geneName) {
  //           const expressionData = filteredGeneExpression.get(geneName);
  //           if(expressionData != null) {
  //             shouldInclude = true;
  //             refExpressionRow = expressionData.__id || -1;
  //             // let foldChange = expressionData.fold_change_log2 || 0;
  //           }
  //         }
  //       }
  //       if(shouldInclude)
  //         filteredNodes.push(nodes[i] as GraphNode);
  //       refExpressionRows.set(node.__id, refExpressionRow);
  //     }

  //     // pointTree.clear();
  //     pointTree.load(filteredNodes);

  //     return [
  //       refExpressionRows,
  //       pointTree,
  //     ];
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [filteredGeneExpression, nodes]
  // );

  const pointTrees = useMemo(
    () => {
      const pointTrees = new Map<string, RBush<Point>>();
      for(let [ id, target ] of targets.entries()) {
        const pointTree = new RBush<Point>();
        pointTree.load(target.points.map(p => {
          return {
            ...p,
            minX: p.x,
            maxX: p.x,
            minY: p.y,
            maxY: p.y,
          };
        }));
        pointTrees.set(id, pointTree);
      }
      return pointTrees;
    },
    [targets]
  )

  const [ targetId, setTargetId ] = useState(['', -1]);
  const [ tooltipState, setTooltipState ] = useState({
    active: false,
    x: 0,
    y: 0,
    content: <></>,
  });

  function onMouseMove(x : number, y : number) {
    // if(!canvasCtx) {
    //   console.warn('canvasCtx not set, ignoring tooltip events');
    //   return;
    // }
    let theNearestPoint : Point | null = null;
    let theNearestDist = Infinity;
    let theNearestScreenPos = [0, 0];
    let theNearestTargetId = '';
    for(let [ id, target ] of targets.entries()) {
      const pointTree = pointTrees.get(id);
      if(!pointTree)
        return;

      const mouseX = x - target.ctx.gl.domElement.offsetLeft;
      const mouseY = y - target.ctx.gl.domElement.offsetTop;
      
      const { width, height } = target.ctx.size;
      const camera = target.ctx.camera;

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
        const point = nearest[0] as Point;
        const pointScreenPos = [
          ((point.x || 0) - camera.position.x) * camera.zoom + width / 2 + target.ctx.gl.domElement.offsetLeft,
          height / 2 - ((point.y || 0) - camera.position.y) * camera.zoom + target.ctx.gl.domElement.offsetTop,
        ];
        const pointDist = Math.pow(pointScreenPos[0] - x, 2) + Math.pow(pointScreenPos[1] - y, 2);
        if(!theNearestPoint 
          || pointDist < theNearestDist) {
            theNearestPoint = point;
            theNearestDist = pointDist;
            theNearestScreenPos = pointScreenPos;
            theNearestTargetId = id;
        }
        
          // const refExpressionRow = refExpressionRows.get(node.__id);
          // const row = (refExpressionRow && refExpressionRow >= 0) ? expressionDataset.raw[refExpressionRow] : undefined;
          // // console.log('updateTooltip', row)

          // // Get depth-2 adjacent nodes
          // const firstNeighbours = Array.from(new Set(
          //   (graph.edgeMap.get(node.__id) || [])
          //     .map(e => {
          //       return {
          //         node: graph.nodes[e.source === node.__id ? e.target : e.source],
          //         relation: e.relation,
          //       };
          //     })
          //   ));
          // const selectedEdges = firstNeighbours
          //   .map(firstNeighbour => graph.edgeMap.get(firstNeighbour.node.__id) || [])
          //   .reduce((a, b) => [ ...a, ...b ], []);
          // const selectedNodes : { [key : number] : GraphNode } = {};
          // selectedEdges.forEach(e => {
          //   selectedNodes[e.source] = graph.nodes[e.source];
          //   selectedNodes[e.target] = graph.nodes[e.target];
          // });

          // const geneName = node.entityReference?.gene?.name;
          // let geneAnnotation : GeneAnnotation | undefined = undefined;
          // if(geneName)
          //   geneAnnotation = geneAnnotations.genes.get(geneName);
          
          // updateSelection(Object.values(selectedNodes), selectedEdges);

          // const renderTruncatedList = <T extends any>(
          //   list : T[] | undefined, 
          //   itemCallback : (item : T, i : number) => JSX.Element,
          //   limit : number,
          //   trunctationNoticeWrapper? : (truncationNotice : JSX.Element, i : number) => JSX.Element,
          // ) => {
          //   let i = 0;
          //   const res = [];
          //   if(list == null) {
          //     res.push(<div key={0}>—</div>);
          //     return res
          //   }
          //   while(i < list.length && i < limit) {
          //     res.push(itemCallback(list[i], i));
          //     i++;
          //   }
          //   if(i < list.length) {
          //     let truncationNotice = (
          //       <div className="list-truncation-notice" key={i+1}>
          //         {list.length - i} more..
          //       </div>
          //     );
          //     if(trunctationNoticeWrapper)
          //       truncationNotice = trunctationNoticeWrapper(truncationNotice, i+1);
          //     res.push(truncationNotice);
          //   }
          //   return res;
          // };

          // // const dashForNan = (val : string) => (val && val !== '' && val !== 'nan') ? val : '—';
          // setTooltipState({
          //   active: true,
          //   x: ((node.x || 0) - camera.position.x) * camera.zoom + width / 2,
          //   y: height / 2 - ((node.y || 0) - camera.position.y) * camera.zoom,
          //   content: <>
          //     <div className="prop">
          //       <div className="name">Name</div>
          //       <div className="value">{geneName || node.name}</div>
          //     </div>
          //     <div className="prop">
          //       <div className="name">Location</div>
          //       <div className="value">{node.cellularLocation}</div>
          //     </div>
          //     <div className="prop">
          //       <div className="name">log<sub>2</sub>(Fold-change)</div>
          //       <div className="value" style={{ color: (row?.fold_change_log2 || 0) > 0 ? "#fb6542" : "#375e97" }}>
          //         {row?.fold_change_log2?.toFixed(2)}
          //       </div>
          //     </div>
          //     <div className="prop">
          //       <div className="name">xref</div>
          //       <div className="value">{node.entityReference?.xref?.db}:{node.entityReference?.xref?.id}</div>
          //     </div>
          //     <div className="prop">
          //       <div className="name">GO terms</div>
          //       <div className="value">
          //         {renderTruncatedList(geneAnnotation?.go_terms, (gt, i) => 
          //           <div className="go-term" key={i}>{gt}</div>
          //         , 2)}
          //       </div>
          //     </div>
          //     {renderTruncatedList(firstNeighbours, (neighbour, i) => 
          //       <div className="prop" key={i}>
          //         <div className="name">
          //           <span className="accent">{neighbour.relation}</span> in
          //         </div>
          //         <div className="value">{neighbour.node.name}</div>
          //       </div>
          //     , 2, (truncationNotice, i) =>
          //       <div className="prop" key={i}>
          //         <div className="name"></div>
          //         <div className="value">{truncationNotice}</div>
          //       </div>
          //     )}
          //   </>
          // });
      }
    }

    if(theNearestPoint) {
      if(theNearestTargetId !== targetId[0] || theNearestPoint.__id !== targetId[1]) {
        setTargetId([ theNearestTargetId, theNearestPoint.__id ])
        setTooltipState({
          active: true,
          x: theNearestScreenPos[0],
          y: theNearestScreenPos[1],
          content: targets.get(theNearestTargetId)?.tooltipConstructor(theNearestPoint.__id) || <></>,
        });
      }
    }
  }

  const bind = useGesture({
    onMove: ({ xy: [x, y] }) => {
      onMouseMove(x, y);
    },
    onTouchStart: ({ touches }) => {
      onMouseMove(touches[0].pageX, touches[0].pageY);
    },
    // onClick: ({ clientX: x, clientY: y }) => {
    //   onMouseMove(x, y);
    // },
  }, {
    domTarget: containerRef,
    event: { passive: false },
  });
  useEffect(() => { bind(); }, [bind, containerRef]);

  return (
    <Tooltip {...tooltipState} />
  );
}

export default connector(TooltipController);
