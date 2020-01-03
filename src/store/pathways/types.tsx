// import crossfilter from 'crossfilter2';
import { Point, PathwayNode, PathwayEdge, PathwayGraphData } from '../../core/types'

export type FilterValueType = string | number | boolean | undefined;

export interface PathwaysState {
  raw : PathwayGraphData;
  graph : PathwayGraph;
  geneAnnotations : GeneAnnotations;
  // filterValues : Map<string, FilterValueType>;
  // crossfilter? : crossfilter.Crossfilter<ExpressionDataRow>;
  // filterDimensions? : Map<string, crossfilter.Dimension<ExpressionDataRow, string>>;
  // filtered : ExpressionDataRow[];
};

export const UPDATE_PATHWAYS = 'UPDATE_PATHWAYS';
export const UPDATE_GENE_ANNOTATIONS = 'UPDATE_GENE_ANNOTATIONS';
export const UPDATE_FILTER = 'UPDATE_FILTER';

export interface UpdatePathwaysAction {
  type : string;
  pathways : PathwayGraphData | DehydratedPathwayGraph;
};
export interface UpdateGeneAnnotationsAction {
  type : string;
  geneAnnotations : GeneAnnotation[];
};
export interface UpdatePathwaysFilterAction {
  type : string;
  name : string;
  value : FilterValueType;
};

export type PathwaysActionTypes = 
  UpdatePathwaysAction 
  | UpdateGeneAnnotationsAction
  | UpdatePathwaysFilterAction;


export interface GraphNode extends PathwayNode, Point {
  location : number;
  vx? : number;
  vy? : number;
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

export interface PathwayGraph {
  nodes : GraphNode[];
  edges : GraphEdge[];
  edgeMap : Map<number, GraphEdge[]>;
}

export interface DehydratedPathwayGraph {
  nodes : GraphNode[];
  edges : [ number, number, string ][];
  dehydrated : boolean;
}

export interface GeneAnnotation {
  name : string;
  uniprot_id : string;
  go_terms : string[];
}

export interface GeneAnnotations {
  genes : Map<string, GeneAnnotation>;
}
