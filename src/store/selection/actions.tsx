import { 
  UpdateTargetAction,
  UpdateSelectionAction,
  UPDATE_SELECTION,
  UPDATE_TARGET
} from './types'
import { GraphEdge, GraphNode } from '../pathways/types';
import { Point } from '../../core/types';
import { SharedCanvasContext } from 'react-three-fiber';

export const updateTarget = (
  id : string,
  points : Point[],
  ctx : SharedCanvasContext,
  tooltipConstructor : (id : number) => JSX.Element,
) : UpdateTargetAction => {
  return {
    type: UPDATE_TARGET,
    id,
    points,
    ctx,
    tooltipConstructor,
  }
};

export const updateSelection = (
  selectedNodes : GraphNode[], 
  selectedEdges : GraphEdge[]
) : UpdateSelectionAction => {
  return {
    type: UPDATE_SELECTION,
    selectedNodes,
    selectedEdges,
  }
};
