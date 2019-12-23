import crossfilter from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface ExpressionDatasetState {
  lastUpdateTime : number;
  raw : ExpressionDataRow[];
  filterValues : Map<string, FilterValueType>;
  crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, string>>;
  filtered : ExpressionDataRow[];
};

export const UPDATE_DATASET = "UPDATE_DATASET";
export const UPDATE_FILTER = "UPDATE_FILTER";

export interface UpdateExpressionDatasetAction {
  type : string;
  dataset : ExpressionDataRow[];
};
export interface UpdateExpressionDatasetFilterAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type ExpressionDatasetActionTypes = 
  UpdateExpressionDatasetAction 
  | UpdateExpressionDatasetFilterAction;
