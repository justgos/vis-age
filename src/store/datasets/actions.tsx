import { 
  UpdateDatasetAction, 
  SetDatasetFilterDimensionsAction,
  SetDatasetFilterValueAction, 
  UPDATE_DATASET, 
  SET_FILTER_VALUE,
  FilterValueType,
  SET_FILTER_DIMENSIONS,
  AddCustomDatasetFilterDimensionAction,
  ADD_CUSTOM_FILTER_DIMENSION,
  CustomFilterFn,
} from './types'
import { NaturallyOrderedValue } from 'crossfilter2';

export const updateDataset = <T extends any>(name : string, dataset : T[]) : UpdateDatasetAction<T> => {
  return {
    type: UPDATE_DATASET,
    id: name,
    dataset,
  }
};

export const setFilterDimensions = (
  id : string,
  dimensions : string[],
) : SetDatasetFilterDimensionsAction => {
  return {
    type: SET_FILTER_DIMENSIONS,
    id,
    dimensions,
  }
};

export const addCustomFilterDimension = <T extends any>(
  id : string,
  name : string,
  selector : (row : T) => NaturallyOrderedValue,
  filterFn? : CustomFilterFn,
) : AddCustomDatasetFilterDimensionAction<T> => {
  return {
    type: ADD_CUSTOM_FILTER_DIMENSION,
    id,
    name,
    selector,
    filterFn,
  }
};

export const setFilterValue = (
  id : string,
  name : string, 
  value : FilterValueType,
) : SetDatasetFilterValueAction => {
  return {
    type: SET_FILTER_VALUE,
    id,
    name,
    value,
  }
};
