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
}

export interface CsvParseResult {
  data : Object[];
};

export type ExpressionDataRow = {
  __id : number;
  sex : string;
  tissue : string;
  subtissue : string;
  cell_ontology_class : string;
  gene : string;
  fold_change_log2 : number;
  p_value : number;

  // x : number;
  // y : number;
  // fill : string;
};
