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
  DehydratedPathwayGraph,
  GeneAnnotation,
  UPDATE_GENE_ANNOTATIONS,
  UpdateGeneAnnotationsAction,
} from './types'
import { PathwayGraphData } from '../../core/types'
import { constructGraph, rehydrateGraph } from './graphHelpers';

const initialState : PathwaysState = {
  raw: { nodes: [], edges: [] },
  graph: { nodes: [], edges: [], edgeMap: new Map<number, GraphEdge[]>() },
  geneAnnotations: { genes: new Map<string, GeneAnnotation>() },
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
      const updatePathways = action as UpdatePathwaysAction;
      if((updatePathways.pathways as DehydratedPathwayGraph).dehydrated) {
        state.graph = rehydrateGraph(updatePathways.pathways as DehydratedPathwayGraph);
      } else {
        state.raw = updatePathways.pathways as PathwayGraphData;
        state = parsePathways(state);
      }
      return {...state};
    case UPDATE_GENE_ANNOTATIONS:
      const updateGeneAnnotations = action as UpdateGeneAnnotationsAction;
      state.geneAnnotations = { genes: new Map<string, GeneAnnotation>() };
      updateGeneAnnotations.geneAnnotations.forEach(ga =>
        state.geneAnnotations.genes.set(ga.name, ga));
      return {...state};
    case UPDATE_FILTER:
      //
      return {...state};
    default:
      return state;
  }
};
