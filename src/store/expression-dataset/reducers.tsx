import crossfilter from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'
import { 
  ExpressionDatasetState, 
  ExpressionDatasetActionTypes, 
  UpdateExpressionDatasetAction,
  UpdateExpressionDatasetFilterAction,  
  UPDATE_DATASET,
  UPDATE_FILTER,
  FilterValueType,
} from './types'

const initialState : ExpressionDatasetState = {
  lastUpdateTime: 0,
  raw: [],
  gene2idxMap: new Map<string, Map<string, number>>(),
  filterValues: new Map<string, FilterValueType>(),
  filterValueVocabulary: new Map<string, Map<string, number>>(),
  filtered: [],
  raw2filtered : new Map<number, number>(),

  gene2idxKey: (start_age? : string, end_age? : string, sex? : string) => {
    return [ start_age, end_age, sex ].join('|');
  },
  getByGene : function(gene? : string) {
    if(!gene)
      return null;
    const key = this.gene2idxKey(
      this.filterValues.get('start_age') as string, 
      this.filterValues.get('end_age') as string, 
      this.filterValues.get('sex') as string
    );
    const rawIdx = this.gene2idxMap.get(key)?.get(gene);
    if(!rawIdx || rawIdx < 0)
      return null;
    const filteredIdx = this.raw2filtered.get(rawIdx);
    if(!filteredIdx || filteredIdx < 0)
      return null;
    return this.filtered[filteredIdx];
  },
}

const onDatasetFilterChanged = (state : ExpressionDatasetState) : ExpressionDatasetState => {
  if(!state.crossfilter || !state.filterDimensions)
    return state;
  for(let [ dimName, dim ] of state.filterDimensions.entries()) {
    dim.filterAll()
    let filterValue = state.filterValues.get(dimName);
    if(filterValue == null)
      continue;

    if(dimName === "text") {
      dim.filter(s => {
        if(!s)
          return false;
        return (s as string).toLowerCase().includes((filterValue as string).toLowerCase());
      });
    } else {
      if((filterValue as String) === "~") {
        // Match non-empty values
        dim.filter(s => s != null && s !== "");
      } else {
        dim.filter(filterValue);
      }
    }
  }
  state.filtered = state.crossfilter.allFiltered();
  state.raw2filtered.clear();
  state.filtered.forEach((r, i) => state.raw2filtered.set(r.__id || -1, i));

  [ 'start_age', 'end_age', 'sex' ].forEach(filter_param => {
    const dim = state.filterDimensions?.get(filter_param);
    if(!dim)
      return;
    const vocab = dim
      .group()
      .reduceCount()
      .all()
      .slice()
      .sort((a, b) => (a.key as string).localeCompare(b.key as string, 'en', { numeric: true }));
    state.filterValueVocabulary.set(
      filter_param, 
      new Map<string, number>(vocab.map(t => [ t.key as string, t.value as number ]))
    );
    // Set the initial filter value is there's none
    if(!state.filterValues.has(filter_param)) {
      state.filterValues.set(
        filter_param, 
        state.filterValueVocabulary.get(filter_param)?.entries().next().value[0] || ''
        // ([...state.filterValueVocabulary.get(filter_param)?.entries().next().value || '']])[0]
      );
    }
  });

  return state;
}

export const expressionDatasetReducer = (
  state = initialState, 
  action : ExpressionDatasetActionTypes
) : ExpressionDatasetState => {
  switch(action.type) {
    case UPDATE_DATASET:
      state.lastUpdateTime = Date.now();
      state.raw = (action as UpdateExpressionDatasetAction).dataset;
      state.gene2idxMap = new Map<string, Map<string, number>>();
      for(let i=0; i < state.raw.length; i++) {
        const row = state.raw[i];
        row.__id = i;
        // TODO: break by age groups / sex
        let key = state.gene2idxKey(row.start_age, row.end_age, row.sex);
        if(!state.gene2idxMap.has(key)) {
          state.gene2idxMap.set(key, new Map<string, number>());
        }
        state.gene2idxMap.get(key)?.set(row.gene || '', i);
      }
      state.crossfilter = crossfilter(state.raw);
      state.filterDimensions = new Map<string, crossfilter.Dimension<ExpressionDataRow, string>>();
      [ 'start_age', 'end_age', 'sex' ].forEach(filter_param => {
        if(state.crossfilter && state.filterDimensions)
          state.filterDimensions.set(filter_param, state.crossfilter.dimension(r => (r as any)[filter_param] as string));
      });
      // Concat all the text columns into the "text" dimension
      state.filterDimensions.set("text", state.crossfilter.dimension(r => [
        r.start_age,
        r.end_age,
        r.gene,
        r.uniprot_mouse,
        r.uniprot_daphnia,
        r.sex,
        r.tissue,
        r.subtissue,
        r.cell_ontology_class,
      ].join('|')));
      state.filterValues.set('text', '');
      state.filterDimensions.set("uniprot_daphnia", state.crossfilter.dimension(r => r.uniprot_daphnia || ""));
      state.filterValues.set('uniprot_daphnia', undefined);
      state.filterValueVocabulary = new Map<string, Map<string, number>>();
      state = onDatasetFilterChanged(state);
      return {...state};
    case UPDATE_FILTER:
      let a = (action as UpdateExpressionDatasetFilterAction);
      state.filterValues.set(a.name, a.value);
      state.filterValues = new Map(state.filterValues);
      state = onDatasetFilterChanged(state);
      return {...state};
    default:
      return state;
  }
};
