// import crossfilter from 'crossfilter2';
import { 
  PathwaysState, 
  PathwaysActionTypes, 
  UpdatePathwaysAction,
  // UpdatePathwaysFilterAction,  
  UPDATE_PATHWAYS,
  UPDATE_FILTER,
  GraphEdge,
  // FilterValueType,
} from './types'
import { constructGraph } from './graphHelpers';

const initialState : PathwaysState = {
  raw: { nodes: [], edges: [] },
  graph: { nodes: [], edges: [], edgeMap: new Map<number, GraphEdge[]>() },
  // filterValues: new Map<string, FilterValueType>(),
  // filtered: [],
}

const parsePathways = (state : PathwaysState) : PathwaysState => {
  state.graph = constructGraph(
    state.raw.nodes.map(n => n),
    state.raw.edges.map(e => { return { source: e[0], target: e[1], relation: e[2] } })
  );

  return state;
}

export const pathwaysReducer = (
  state = initialState, 
  action : PathwaysActionTypes
) : PathwaysState => {
  switch(action.type) {
    case UPDATE_PATHWAYS:
      state.raw = (action as UpdatePathwaysAction).pathways;
      state = parsePathways(state);
      return {...state};
    case UPDATE_FILTER:
      //
      return {...state};
    default:
      return state;
  }
};
