import crossfilter from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'
import { 
  ExpressionDatasetState, 
  ExpressionDatasetActionTypes, 
  UpdateExpressionDatasetAction,
  SetExpressionDatasetFilterDimensionsAction,
  SetExpressionDatasetFilterValueAction,  
  UPDATE_DATASET,
  SET_FILTER_DIMENSIONS,
  SET_FILTER_VALUE,
  FilterValueType,
} from './types'

const initialState : ExpressionDatasetState = {
  lastUpdateTime: 0,
  raw: [],
  gene2idxMap: new Map<string, Map<string, number>>(),
  filterValues: new Map<string, FilterValueType>(),
  filterValueVocabulary: new Map<string, Map<string, number>>(),
  filterDimensionNames: [],
  filtered: [],
  raw2filtered : new Map<number, number>(),

  gene2idxKey: (...parts : string[]) => {
    return parts.join('|');
  },
  getByGene : function(gene? : string) {
    if(!gene)
      return null;
    const key = this.gene2idxKey(
      ...this.filterDimensionNames.map(n => this.filterValues.get(n) as string)
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

const updateFilterVocabularies = (state : ExpressionDatasetState) : ExpressionDatasetState => {
  state.filterDimensionNames.forEach(filter_param => {
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
  });
  return state;
}

const onDatasetFilterChanged = (state : ExpressionDatasetState) : ExpressionDatasetState => {
  if(!state.crossfilter || !state.filterDimensions)
    return state;
  for(let [ dimName, dim ] of state.filterDimensions.entries()) {
    dim.filterAll()
    let filterValue = state.filterValues.get(dimName);
    if(filterValue == null)
      continue;

    if(dimName === 'text') {
      filterValue = (filterValue as string).toLowerCase();
      dim.filter(s => {
        if(!s)
          return false;
        return (s as string).includes(filterValue as string);
      });
    } else {
      if((filterValue as String) === '~') {
        // Match non-empty values
        dim.filter(s => s != null && s !== '');
      } else {
        dim.filter(filterValue);
      }
    }
  }
  state.filtered = state.crossfilter.allFiltered();
  state.raw2filtered.clear();
  state.filtered.forEach((r, i) => state.raw2filtered.set(r.__id || -1, i));

  state = updateFilterVocabularies(state);

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
      for(let i=0; i < state.raw.length; i++) {
        const row = state.raw[i];
        row.__id = i;
      }
      return {...state};

    case SET_FILTER_DIMENSIONS:
      let setFilterDimensions = (action as SetExpressionDatasetFilterDimensionsAction);
      
      state.crossfilter = crossfilter(state.raw);
      state.filterDimensions = new Map<string, crossfilter.Dimension<ExpressionDataRow, string>>();
      // Concat all the text columns into the 'text' dimension
      state.filterDimensions.set('text', state.crossfilter.dimension(r => 
        setFilterDimensions.textDimension.map(d => (r as any)[d]).join('|').toLowerCase()
      ));
      state.filterValues.set('text', '');
      state.filterDimensions.set('uniprot_daphnia', state.crossfilter.dimension(r => r.uniprot_daphnia || ''));
      state.filterValues.set('uniprot_daphnia', undefined);

      // Save dimension names
      state.filterDimensionNames = setFilterDimensions.dimensions;
      // Construct requested dimensions
      state.filterDimensionNames.forEach(filter_param => {
        if(state.crossfilter && state.filterDimensions)
          state.filterDimensions.set(filter_param, state.crossfilter.dimension(r => (r as any)[filter_param] as string || ''));
      });
      // Reset the filter values
      state.filterValues = new Map<string, FilterValueType>();
      state = updateFilterVocabularies(state);
      // Set the initial filter values <strike>where there's none</strike>
      state.filterDimensionNames.forEach(filter_param => {
        // if(!state.filterValues.has(filter_param)) {
          state.filterValues.set(
            filter_param, 
            state.filterValueVocabulary.get(filter_param)?.entries().next().value[0] || ''
          );
        // }
      });

      state.gene2idxMap = new Map<string, Map<string, number>>();
      for(let i=0; i < state.raw.length; i++) {
        const row = state.raw[i];
        let key = state.gene2idxKey(...state.filterDimensionNames.map(n => (row as any)[n] as string));
        if(!state.gene2idxMap.has(key)) {
          state.gene2idxMap.set(key, new Map<string, number>());
        }
        state.gene2idxMap.get(key)?.set(row.gene || '', i);
      }

      state = onDatasetFilterChanged(state);
      return {...state};

    case SET_FILTER_VALUE:
      let setFilterValue = (action as SetExpressionDatasetFilterValueAction);
      state.filterValues.set(setFilterValue.name, setFilterValue.value);
      state.filterValues = new Map(state.filterValues);
      state = onDatasetFilterChanged(state);
      return {...state};
    default:
      return state;
  }
};
