import crossfilter from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface ExpressionDatasetState {
  lastUpdateTime : number;
  raw : ExpressionDataRow[];
  gene2idxMap : Map<string, Map<string, number>>;
  filterValues : Map<string, FilterValueType>;
  filterValueVocabulary : Map<string, Map<string, number>>;
  crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, string>>;
  filterDimensionNames : string[];
  filtered : ExpressionDataRow[];
  raw2filtered : Map<number, number>;

  gene2idxKey : (...parts : string[]) => string;
  getByGene : (gene? : string) => ExpressionDataRow | null;
};

export const UPDATE_DATASET = 'UPDATE_DATASET';
export const SET_FILTER_DIMENSIONS = 'SET_FILTER_DIMENSIONS';
export const SET_FILTER_VALUE = 'SET_FILTER_VALUE';

export interface UpdateExpressionDatasetAction {
  type : string;
  dataset : ExpressionDataRow[];
};
export interface SetExpressionDatasetFilterDimensionsAction {
  type : string;
  dimensions : string[];
  textDimension : string[];
};
export interface SetExpressionDatasetFilterValueAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type ExpressionDatasetActionTypes = 
  UpdateExpressionDatasetAction 
  | SetExpressionDatasetFilterDimensionsAction
  | SetExpressionDatasetFilterValueAction;
