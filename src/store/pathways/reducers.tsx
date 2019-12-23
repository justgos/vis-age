// import crossfilter from 'crossfilter2';
import { Pathway } from '../../core/types'
import { 
  PathwaysState, 
  PathwaysActionTypes, 
  UpdatePathwaysAction,
  // UpdatePathwaysFilterAction,  
  UPDATE_PATHWAYS,
  UPDATE_FILTER,
  // FilterValueType,
} from './types'

const initialState : PathwaysState = {
  lastUpdateTime: 0,
  raw: [],
  // filterValues: new Map<string, FilterValueType>(),
  // filtered: [],
}

// const onPathwaysFilterChanged = (state : PathwaysState) : PathwaysState => {
//   if(!state.crossfilter || !state.filterDimensions)
//     return state;
//   for(let [ dimName, dim ] of state.filterDimensions.entries()) {
//     dim.filterAll()
//     let filterValue = state.filterValues.get(dimName);
//     if(filterValue == null)
//       continue;

//     if(dimName === "text") {
//       dim.filter(s => {
//         if(!s)
//           return false;
//         return (s as string).toLowerCase().includes((filterValue as string).toLowerCase());
//       });
//     } else {
//       if((filterValue as String) === "~") {
//         // Match non-empty values
//         dim.filter(s => s != null && s !== "");
//       } else {
//         dim.filter(filterValue);
//       }
//     }
//   }
//   state.filtered = state.crossfilter.allFiltered();
//   return state;
// }

export const pathwaysReducer = (
  state = initialState, 
  action : PathwaysActionTypes
) : PathwaysState => {
  switch(action.type) {
    case UPDATE_PATHWAYS:
      state.lastUpdateTime = Date.now();
      state.raw = (action as UpdatePathwaysAction).pathways;
      for(let i=0; i < state.raw.length; i++)
        state.raw[i].__id = i;
      // state.crossfilter = crossfilter(state.raw);
      // state.filterDimensions = new Map<string, crossfilter.Dimension<ExpressionDataRow, string>>();
      // // Concat all the text columns into the "text" dimension
      // state.filterDimensions.set("text", state.crossfilter.dimension(r => [
      //   r.start_age,
      //   r.end_age,
      //   r.gene,
      //   r.uniprot_mouse,
      //   r.uniprot_daphnia,
      //   r.sex,
      //   r.tissue,
      //   r.subtissue,
      //   r.cell_ontology_class,
      // ].join('|')));
      // state.filterDimensions.set("uniprot_daphnia", state.crossfilter.dimension(r => r.uniprot_daphnia || ""));
      // state = onDatasetFilterChanged(state);
      return {...state};
    case UPDATE_FILTER:
      // let a = (action as UpdatePathwaysFilterAction);
      // state.filterValues.set(a.name, a.value);
      // state = onDatasetFilterChanged(state);
      return {...state};
    default:
      return state;
  }
};
