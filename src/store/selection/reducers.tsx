import { 
  UpdateSelectionAction,
  UPDATE_SELECTION,
  SelectionActionTypes,
  SelectionState,
} from './types'

const initialState : SelectionState = {
  selectedNodes: [],
  selectedEdges: [],
}

export const selectionReducer = (
  state = initialState, 
  action : SelectionActionTypes
) : SelectionState => {
  switch(action.type) {
    case UPDATE_SELECTION:
      state.selectedNodes = (action as UpdateSelectionAction).selectedNodes;
      state.selectedEdges = (action as UpdateSelectionAction).selectedEdges;
      return {...state};
    default:
      return state;
  }
};
