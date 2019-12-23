// import crossfilter from 'crossfilter2';
import { Pathway } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface PathwaysState {
  lastUpdateTime : number;
  raw : Pathway[];
  // filterValues : Map<string, FilterValueType>;
  // crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  // filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, string>>;
  // filtered : ExpressionDataRow[];
};

export const UPDATE_PATHWAYS = "UPDATE_PATHWAYS";
export const UPDATE_FILTER = "UPDATE_FILTER";

export interface UpdatePathwaysAction {
  type : string;
  pathways : Pathway[];
};
export interface UpdatePathwaysFilterAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type PathwaysActionTypes = 
  UpdatePathwaysAction 
  | UpdatePathwaysFilterAction;
