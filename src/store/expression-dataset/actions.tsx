import { ExpressionDataRow } from '../../core/types'
import { 
  UpdateExpressionDatasetAction, 
  SetExpressionDatasetFilterDimensionsAction,
  SetExpressionDatasetFilterValueAction, 
  UPDATE_DATASET, 
  SET_FILTER_VALUE,
  FilterValueType,
  SET_FILTER_DIMENSIONS,
} from './types'

export const updateDataset = (dataset : ExpressionDataRow[]) : UpdateExpressionDatasetAction => {
  return {
    type: UPDATE_DATASET,
    dataset,
  }
};

export const setFilterDimensions = (
  dimensions : string[], 
  textDimension : string[]
) : SetExpressionDatasetFilterDimensionsAction => {
  return {
    type: SET_FILTER_DIMENSIONS,
    dimensions,
    textDimension,
  }
};

export const setFilterValue = (name : string, value : FilterValueType) : SetExpressionDatasetFilterValueAction => {
  return {
    type: SET_FILTER_VALUE,
    name,
    value,
  }
};
