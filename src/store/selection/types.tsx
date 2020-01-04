import { GraphEdge, GraphNode } from '../pathways/types';
import { Point } from '../../core/types';
import { SharedCanvasContext } from 'react-three-fiber';

export interface SelectionTarget {
  points : Point[];
  ctx : SharedCanvasContext;
  tooltipConstructor : (id : number) => JSX.Element;
};

export interface SelectionState {
  targets : Map<string, SelectionTarget>;
  selectedNodes : GraphNode[];
  selectedEdges : GraphEdge[];
};

export const UPDATE_TARGET = 'UPDATE_TARGET';
export const UPDATE_SELECTION = 'UPDATE_SELECTION';

export interface UpdateTargetAction {
  type : string;
  id : string;
  points : Point[];
  ctx : SharedCanvasContext;
  tooltipConstructor : (id : number) => JSX.Element;
};

export interface UpdateSelectionAction {
  type : string;
  selectedNodes : GraphNode[];
  selectedEdges : GraphEdge[];
};

export type SelectionActionTypes = 
  UpdateTargetAction
  | UpdateSelectionAction;
