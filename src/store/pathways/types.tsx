// import crossfilter from 'crossfilter2';
import { PathwayNode, PathwayEdge, PathwayGraphData } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface PathwaysState {
  raw : PathwayGraphData;
  graph : PathwayGraph;
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


export interface GraphNode extends PathwayNode {
  location : number;
  x : number;
  y : number;
  vx : number;
  vy : number;
  minX? : number;
  maxX? : number;
  minY? : number;
  maxY? : number;
}

export interface GraphEdge extends PathwayEdge {
  sourcePos : [number, number];
  targetPos : [number, number];
}

export interface PathwayGraph {
  nodes : GraphNode[];
  edges : GraphEdge[];
  edgeMap : Map<number, GraphEdge[]>;
}
