import crossfilter from 'crossfilter2';
import { 
  ExpressionDatasetState, 
  ExpressionDatasetActionTypes, 
  UpdateExpressionDatasetAction,
  UpdateExpressionDatasetTextFilterAction,  
  UPDATE_DATASET,
  UPDATE_TEXT_FILTER,
} from './types'

const initialState : ExpressionDatasetState = {
  lastUpdateTime: 0,
  raw: [],
  textFilter: "",
  filtered: [],
}

const onDatasetFilterChanged = (state : ExpressionDatasetState) : ExpressionDatasetState => {
  if(!state.crossfilter || !state.textDimensions)
    return state;
  state.textDimensions
    .filterAll()
    .filter((s) => {
      if(!s)
        return false;
      return (s as string).toLowerCase().includes(state.textFilter.toLowerCase());
    });
  state.filtered = state.crossfilter.allFiltered();
  return state;
}

export const expressionDatasetReducer = (
  state = initialState, 
  action : ExpressionDatasetActionTypes
) : ExpressionDatasetState => {
  switch(action.type) {
    case UPDATE_DATASET:
      state.lastUpdateTime = Date.now();
      state.raw = (action as UpdateExpressionDatasetAction).dataset;
      for(let i=0; i < state.raw.length; i++)
        state.raw[i].__id = i;
      state.crossfilter = crossfilter(state.raw);
      state.textDimensions = state.crossfilter.dimension(r => [
        r.gene,
        r.sex,
        r.tissue,
        r.subtissue,
        r.cell_ontology_class,
      ].join('|'));
      state = onDatasetFilterChanged(state);
      return {...state};
    case UPDATE_TEXT_FILTER:
      state.textFilter = (action as UpdateExpressionDatasetTextFilterAction).filter;
      state = onDatasetFilterChanged(state);
      return {...state};
    default:
      return state;
  }
};
