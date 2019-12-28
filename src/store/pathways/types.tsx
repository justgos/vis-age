// import crossfilter from 'crossfilter2';
import { PathwayNode, PathwayEdge, PathwayGraphData } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface PathwaysState {
  raw : PathwayGraphData;
  nodes : PathwayNode[];
  nodeNameMap : Map<string , number>;
  edges : PathwayEdge[];
  // filterValues : Map<string, FilterValueType>;
  // crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  // filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, string>>;
  // filtered : ExpressionDataRow[];
};

export const UPDATE_PATHWAYS = 'UPDATE_PATHWAYS';
export const UPDATE_FILTER = 'UPDATE_FILTER';

export interface UpdatePathwaysAction {
  type : string;
  pathways : PathwayGraphData;
};
export interface UpdatePathwaysFilterAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type PathwaysActionTypes = 
  UpdatePathwaysAction 
  | UpdatePathwaysFilterAction;
