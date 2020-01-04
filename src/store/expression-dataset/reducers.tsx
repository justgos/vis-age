import crossfilter, { NaturallyOrderedValue } from 'crossfilter2';
import { ExpressionDataRow } from '../../core/types'
import { 
  ExpressionDatasetState, 
  ExpressionDatasetActionTypes, 
  UpdateExpressionDatasetAction,
  SetExpressionDatasetFilterDimensionsAction,
  SetExpressionDatasetFilterValueAction,  
  UPDATE_EXPRESSION_DATASET,
  SET_FILTER_DIMENSIONS,
  SET_FILTER_VALUE,
  FilterValueType,
  AddCustomExpressionDatasetFilterDimensionAction,
  ADD_CUSTOM_FILTER_DIMENSION,
  CustomFilterFn,
} from './types'

const initialState : ExpressionDatasetState = {
  raw: [],
  filteredGeneExpression: new Map<string, ExpressionDataRow>(),
  filterValues: new Map<string, FilterValueType>(),
  filterValueVocabulary: new Map<string, Map<string, number>>(),
  filterDimensionNames: [],
  customFilterFunctions: new Map<string, CustomFilterFn>(),
  filtered: [],
  raw2filtered : new Map<number, number>(),
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

  state.filteredGeneExpression = new Map<string, ExpressionDataRow>();
  for(let i=0; i < state.filtered.length; i++) {
    const row = state.filtered[i];
    if(row.gene) {
      state.filteredGeneExpression.set(row.gene, row);
    }
  }

  state = updateFilterVocabularies(state);

  return state;
}

export const expressionDatasetReducer = (
  state = initialState, 
  action : ExpressionDatasetActionTypes
) : ExpressionDatasetState => {
  switch(action.type) {
    case UPDATE_EXPRESSION_DATASET:
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
