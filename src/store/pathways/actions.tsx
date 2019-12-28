import { PathwayGraphData } from '../../core/types'
import { 
  UpdatePathwaysAction, 
  UpdatePathwaysFilterAction, 
  UPDATE_PATHWAYS, 
  UPDATE_FILTER,
  FilterValueType,
} from './types'

export const updatePathways = (pathways : PathwayGraphData) : UpdatePathwaysAction => {
  return {
    type: UPDATE_PATHWAYS,
    pathways,
  }
};

export const updateFilter = (name : string, value : FilterValueType) : UpdatePathwaysFilterAction => {
  return {
    type: UPDATE_FILTER,
    name,
    value,
  }
};
