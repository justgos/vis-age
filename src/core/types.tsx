import { SharedCanvasContext } from "react-three-fiber";

export interface Point {
  __id : number;
  x : number;
  y : number;
  z? : number;
  minX? : number;
  maxX? : number;
  minY? : number;
  maxY? : number;
}

export interface CsvParseResult {
  data : Object[];
};

export interface CanvasReference {
  containerRef : React.RefObject<HTMLDivElement>;
  ctx : SharedCanvasContext;
};

export interface CellActivity {
  values : number[];
};

export interface CellEmbeddings {
  values : number[];
};

export interface CellMetadata {
  sex : number;
  age : number;
  tissue : number;
  subtissue : number;
  cellOntologyClass : number;
};

export interface CellsMetadataVocabs {
  sexVocab : string[];
  ageVocab : string[];
  tissueVocab : string[];
  subtissueVocab : string[];
  cellOntologyClassVocab : string[];
};

export interface CellsMetaMetadata extends CellsMetadataVocabs {
  goActivities : string[];
};

export interface CellsMetadata extends CellsMetaMetadata {
  cells : CellMetadata[];
};

export interface ExpressionDataRow {
  __id? : number;
  start_age? : string;
  end_age? : string;
  sex? : string;
  tissue? : string;
  subtissue? : string;
  cell_ontology_class? : string;
  gene? : string;
  fold_change_log2? : number;
  p_value? : number;

  uniprot_mouse? : string;
  uniprot_daphnia? : string;
};

export interface PathwayEntity {
  type : string;
  name : string;
};

export interface Gene {
  name : string;
  // type : string;
  // desc : string;
};

export interface XRef {
  id : string;
  db : string;
};

export interface EntityReference {
  name : string;
  gene? : Gene;
  xref? : XRef;
};

export interface Molecule extends PathwayEntity {
  cellularLocation? : string;
  entityReference? : EntityReference;
};

export interface Complex extends Molecule {
  component : (Complex | Molecule)[];
};

export interface Reaction extends PathwayEntity {
  conversionDirection? : string;
  left? : Molecule[];
  right? : Molecule[];
};

export interface Control extends PathwayEntity {
  controller : Molecule;
  controlled : Reaction;
};

export interface TemplateReaction extends PathwayEntity {
  template? : Molecule;
  product : Molecule[];
};

export interface Pathway extends PathwayEntity {
  pathwayComponent : (Control | TemplateReaction | Reaction)[];
};

export interface PathwayNode {
  __id : number;
  type : string;
  name : string;
  cellularLocation? : string;
  entityReference? : EntityReference;
  controlType? : string;
}

export interface PathwayEdge {
  source : number;
  target : number;
  relation : string;
}

export interface PathwayGraphData {
  nodes : PathwayNode[];
  edges : [ number, number, string ][];
}
