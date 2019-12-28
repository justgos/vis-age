export interface GestureData {
  dragging : boolean;
  dragX : number;
  dragY : number;
  scrolling : boolean;
  scrollX : number;
  scrollY : number;
  pinching : boolean;
  pinchD : number;
  pinchA: number;
  pinchOrigin: [ number, number ];
}

export interface CsvParseResult {
  data : Object[];
};

export type MouseMoveHook = (x : number, y : number) => void;
export interface MouseMoveHooks {
  hooks: Map<number, MouseMoveHook>;
  nextId: number;
}
export interface ObservesMouseMove {
  mouseMoveHooks : MouseMoveHooks;
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
  type : string;
  desc : string;
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
}

export interface PathwayEdge {
  source : number;
  target : number;
}
