import { 
  UpdateSelectionAction,
  UPDATE_SELECTION
} from './types'
import { GraphEdge } from '../pathways/types';

export const updateSelection = (selectedEdges : GraphEdge[]) : UpdateSelectionAction => {
  return {
    type: UPDATE_SELECTION,
    selectedEdges,
  }
};
