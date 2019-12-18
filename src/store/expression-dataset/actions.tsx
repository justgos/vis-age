import { ExpressionDataRow } from '../../core/types'
import { 
  UpdateExpressionDatasetAction, 
  UpdateExpressionDatasetTextFilterAction, 
  UPDATE_DATASET, 
  UPDATE_TEXT_FILTER 
} from './types'

export const updateDataset = (dataset : ExpressionDataRow[]) : UpdateExpressionDatasetAction => {
  return {
    type: UPDATE_DATASET,
    dataset,
  }
};

export const updateTextFilter = (filter : string) : UpdateExpressionDatasetTextFilterAction => {
  return {
    type: UPDATE_TEXT_FILTER,
    filter,
  }
};
