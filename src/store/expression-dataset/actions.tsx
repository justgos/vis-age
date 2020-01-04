import { ExpressionDataRow } from '../../core/types'
import { 
  UpdateExpressionDatasetAction, 
  SetExpressionDatasetFilterDimensionsAction,
  SetExpressionDatasetFilterValueAction, 
  UPDATE_EXPRESSION_DATASET, 
  SET_FILTER_VALUE,
  FilterValueType,
  SET_FILTER_DIMENSIONS,
  AddCustomExpressionDatasetFilterDimensionAction,
  ADD_CUSTOM_FILTER_DIMENSION,
  CustomFilterFn,
} from './types'
import { NaturallyOrderedValue } from 'crossfilter2';

export const updateExpressionDataset = (dataset : ExpressionDataRow[]) : UpdateExpressionDatasetAction => {
  return {
    type: UPDATE_EXPRESSION_DATASET,
    dataset,
  }
};

export const setExpressionDatasetFilterDimensions = (
  dimensions : string[]
) : SetExpressionDatasetFilterDimensionsAction => {
  return {
    type: SET_FILTER_DIMENSIONS,
    dimensions,
  }
};

export const addExpressionDatasetCustomFilterDimension = (
  name : string,
  selector : (row : ExpressionDataRow) => NaturallyOrderedValue,
  filterFn? : CustomFilterFn
) : AddCustomExpressionDatasetFilterDimensionAction => {
  return {
    type: ADD_CUSTOM_FILTER_DIMENSION,
    name,
    selector,
    filterFn,
  }
};

export const setExpressionDatasetFilterValue = (name : string, value : FilterValueType) : SetExpressionDatasetFilterValueAction => {
  return {
    type: SET_FILTER_VALUE,
    name,
    value,
  }
};
