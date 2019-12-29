import { 
  UpdateSelectionAction,
  UPDATE_SELECTION,
  SelectionActionTypes,
  SelectionState,
} from './types'

const initialState : SelectionState = {
  selectedEdges: [],
}

export const selectionReducer = (
  state = initialState, 
  action : SelectionActionTypes
) : SelectionState => {
  switch(action.type) {
    case UPDATE_SELECTION:
      state.selectedEdges = (action as UpdateSelectionAction).selectedEdges;
      return {...state};
    default:
      return state;
  }
};
