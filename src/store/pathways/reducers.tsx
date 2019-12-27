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
      return {...state};
    case UPDATE_FILTER:
      //
      return {...state};
    default:
      return state;
  }
};
