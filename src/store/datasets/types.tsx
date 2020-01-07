import crossfilter, { NaturallyOrderedValue } from 'crossfilter2';

export type FilterValueType = string | number | boolean | undefined;

export type CustomFilterFn = 
  (filterValue : NaturallyOrderedValue) => 
    ((v : NaturallyOrderedValue) => boolean);

export interface DatasetState<T> {
  raw : T[];
  meta : any;
  filterValues : Map<string, FilterValueType>;
  filterValueVocabulary : Map<string, Map<string, number>>;
  crossfilter? : crossfilter.Crossfilter<T>;
  filterDimensions? : Map<string, crossfilter.Dimension<T, NaturallyOrderedValue>>;
  filterDimensionNames : string[];
  customFilterFunctions : Map<string, CustomFilterFn>;
  filtered : T[];
  raw2filtered : Map<number, number>;
};

export interface DatasetsState {
  [name : string] : DatasetState<any>;
}

export const UPDATE_DATASET = 'UPDATE_DATASET';
export const SET_FILTER_DIMENSIONS = 'SET_FILTER_DIMENSIONS';
export const ADD_CUSTOM_FILTER_DIMENSION = 'ADD_CUSTOM_FILTER_DIMENSION';
export const SET_FILTER_VALUE = 'SET_FILTER_VALUE';

export interface UpdateDatasetAction<T> {
  type : string;
  id : string;
  dataset : T[];
  meta : any;
};
export interface SetDatasetFilterDimensionsAction {
  type : string;
  id : string;
  dimensions : string[];
};
export interface AddCustomDatasetFilterDimensionAction<T> {
  type : string;
  id : string;
  name : string;
  selector : (row : T) => NaturallyOrderedValue;
  filterFn? : CustomFilterFn;
};
export interface SetDatasetFilterValueAction {
  type : string;
  id : string;
  name : string;
  value : FilterValueType;
};

export type DatasetActionTypes<T> = 
  UpdateDatasetAction<T>
  | SetDatasetFilterDimensionsAction
  | AddCustomDatasetFilterDimensionAction<T>
  | SetDatasetFilterValueAction;
