import { 
  UpdateSelectionAction,
  UPDATE_SELECTION
} from './types'
import { GraphEdge, GraphNode } from '../pathways/types';

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
