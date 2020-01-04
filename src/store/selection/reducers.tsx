import { 
  UpdateSelectionAction,
  UPDATE_SELECTION,
  SelectionActionTypes,
  SelectionState,
  UPDATE_TARGET,
  UpdateTargetAction,
  SelectionTarget,
} from './types'

const initialState : SelectionState = {
  targets: new Map<string, SelectionTarget>(),
  selectedNodes: [],
  selectedEdges: [],
}

export const selectionReducer = (
  state = initialState, 
  action : SelectionActionTypes
) : SelectionState => {
  switch(action.type) {
    case UPDATE_TARGET:
      const updateTarget = (action as UpdateTargetAction);
      state.targets.set(updateTarget.id, {
        points: updateTarget.points,
        ctx: updateTarget.ctx,
        tooltipConstructor: updateTarget.tooltipConstructor,
      });
      state.targets = new Map(state.targets);
      return {...state};
    case UPDATE_SELECTION:
      state.selectedNodes = (action as UpdateSelectionAction).selectedNodes;
      state.selectedEdges = (action as UpdateSelectionAction).selectedEdges;
      return {...state};
    default:
      return state;
  }
};
