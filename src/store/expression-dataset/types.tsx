import crossfilter from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'

export interface ExpressionDatasetState {
  lastUpdateTime : number;
  raw : ExpressionDataRow[];
  textFilter : string;
  crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  textDimensions? : crossfilter.Dimension<ExpressionDataRow, string>;
  filtered : ExpressionDataRow[];
};

export const UPDATE_DATASET = "UPDATE_DATASET";
export const UPDATE_TEXT_FILTER = "UPDATE_TEXT_FILTER";

export interface UpdateExpressionDatasetAction {
  type : string;
  dataset : ExpressionDataRow[];
};
export interface UpdateExpressionDatasetTextFilterAction {
  type : string;
  filter : string;
};

export type ExpressionDatasetActionTypes = 
  UpdateExpressionDatasetAction 
  | UpdateExpressionDatasetTextFilterAction;
