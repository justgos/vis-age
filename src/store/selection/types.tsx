import { GraphEdge } from '../pathways/types';

export interface SelectionState {
  selectedEdges : GraphEdge[];
};

export const UPDATE_SELECTION = 'UPDATE_SELECTION';

export interface UpdateSelectionAction {
  type : string;
  selectedEdges : GraphEdge[];
};

export type SelectionActionTypes = 
  UpdateSelectionAction;
