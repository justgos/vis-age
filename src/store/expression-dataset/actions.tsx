import { ExpressionDataRow } from '../../core/types'
import { 
  UpdateExpressionDatasetAction, 
  UpdateExpressionDatasetFilterAction, 
  UPDATE_DATASET, 
  UPDATE_FILTER,
  FilterValueType,
} from './types'

export const updateDataset = (dataset : ExpressionDataRow[]) : UpdateExpressionDatasetAction => {
  return {
    type: UPDATE_DATASET,
    dataset,
  }
};

export const updateFilter = (name : string, value : FilterValueType) : UpdateExpressionDatasetFilterAction => {
  return {
    type: UPDATE_FILTER,
    name,
    value,
  }
};
