import crossfilter, { NaturallyOrderedValue } from 'crossfilter2';
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
  AddCustomExpressionDatasetFilterDimensionAction,
  ADD_CUSTOM_FILTER_DIMENSION,
  CustomFilterFn,
} from './types'

const initialState : ExpressionDatasetState = {
  lastUpdateTime: 0,
  raw: [],
  gene2idxMap: new Map<string, Map<string, number>>(),
  filterValues: new Map<string, FilterValueType>(),
  filterValueVocabulary: new Map<string, Map<string, number>>(),
  filterDimensionNames: [],
  customFilterFunctions: new Map<string, CustomFilterFn>(),
  filtered: [],
  raw2filtered : new Map<number, number>(),

  gene2idxKey: (...parts : string[]) => {
    return parts.join('|');
  },

  /* Returns the gene expression from a filtered data subset */
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
    // Get all the unique terms and sort 'em alphanumerically
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
    // TODO: re-apply filter only when the `filterValue` changes
    // Clear the applied filters
    dim.filterAll()
    let filterValue = state.filterValues.get(dimName);
    if(filterValue == null)
      continue;

    const filterFn = state.customFilterFunctions.get(dimName);
    // Apply either a custom filter function, or a default one - strict equality
    if(filterFn) {
      dim.filterFunction(filterFn(filterValue));
    } else {
      dim.filter(filterValue);
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
      state.filterDimensions = new Map<string, crossfilter.Dimension<ExpressionDataRow, NaturallyOrderedValue>>();

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

    case ADD_CUSTOM_FILTER_DIMENSION:
      let addCustomFilterDimension = (action as AddCustomExpressionDatasetFilterDimensionAction);
      if(!state.filterDimensions || !state.crossfilter) {
        console.error('Trying to add a custom filter dimension before SET_FILTER_DIMENSIONS was called');
        return state;
      }
      state.filterDimensions.set(
        addCustomFilterDimension.name, 
        state.crossfilter.dimension(addCustomFilterDimension.selector)
      );
      if(addCustomFilterDimension.filterFn)
        state.customFilterFunctions.set(addCustomFilterDimension.name, addCustomFilterDimension.filterFn);
      // state.filterValues.set(addCustomFilterDimension.name, addCustomFilterDimension.defaultValue);
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
