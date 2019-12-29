import { GraphEdge, GraphNode } from '../pathways/types';

export interface SelectionState {
  selectedNodes : GraphNode[];
  selectedEdges : GraphEdge[];
};

export const UPDATE_SELECTION = 'UPDATE_SELECTION';

export interface UpdateSelectionAction {
  type : string;
  selectedNodes : GraphNode[];
  selectedEdges : GraphEdge[];
};

export type SelectionActionTypes = 
  UpdateSelectionAction;
