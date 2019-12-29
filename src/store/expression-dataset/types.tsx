import crossfilter, { NaturallyOrderedValue } from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export type CustomFilterFn = 
  (filterValue : NaturallyOrderedValue) => 
    ((v : NaturallyOrderedValue) => boolean);

export interface ExpressionDatasetState {
  raw : ExpressionDataRow[];
  filteredGeneExpression : Map<string, ExpressionDataRow>;
  filterValues : Map<string, FilterValueType>;
  filterValueVocabulary : Map<string, Map<string, number>>;
  crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, NaturallyOrderedValue>>;
  filterDimensionNames : string[];
  customFilterFunctions : Map<string, CustomFilterFn>;
  filtered : ExpressionDataRow[];
  raw2filtered : Map<number, number>;
};

export const UPDATE_DATASET = 'UPDATE_DATASET';
export const SET_FILTER_DIMENSIONS = 'SET_FILTER_DIMENSIONS';
export const ADD_CUSTOM_FILTER_DIMENSION = 'ADD_CUSTOM_FILTER_DIMENSION';
export const SET_FILTER_VALUE = 'SET_FILTER_VALUE';

export interface UpdateExpressionDatasetAction {
  type : string;
  dataset : ExpressionDataRow[];
};
export interface SetExpressionDatasetFilterDimensionsAction {
  type : string;
  dimensions : string[];
};
export interface AddCustomExpressionDatasetFilterDimensionAction {
  type : string;
  name : string;
  selector : (row : ExpressionDataRow) => NaturallyOrderedValue;
  filterFn? : CustomFilterFn;
};
export interface SetExpressionDatasetFilterValueAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type ExpressionDatasetActionTypes = 
  UpdateExpressionDatasetAction 
  | SetExpressionDatasetFilterDimensionsAction
  | AddCustomExpressionDatasetFilterDimensionAction
  | SetExpressionDatasetFilterValueAction;
