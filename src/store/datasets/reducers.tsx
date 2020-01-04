import crossfilter, { NaturallyOrderedValue } from 'crossfilter2';
import { 
  DatasetsState,
  DatasetState, 
  DatasetActionTypes, 
  UpdateDatasetAction,
  SetDatasetFilterDimensionsAction,
  SetDatasetFilterValueAction,  
  UPDATE_DATASET,
  SET_FILTER_DIMENSIONS,
  SET_FILTER_VALUE,
  FilterValueType,
  AddCustomDatasetFilterDimensionAction,
  ADD_CUSTOM_FILTER_DIMENSION,
  CustomFilterFn,
} from './types'

const initialState : DatasetsState = {
  //
}

const updateFilterVocabularies = (dataset : DatasetState<any>) : DatasetState<any> => {
  dataset.filterDimensionNames.forEach(filter_param => {
    const dim = dataset.filterDimensions?.get(filter_param);
    if(!dim)
      return;
    // Get all the unique terms and sort 'em alphanumerically
    const vocab = dim
      .group()
      .reduceCount()
      .all()
      .slice()
      .sort((a, b) => (a.key as string).localeCompare(b.key as string, 'en', { numeric: true }));
    dataset.filterValueVocabulary.set(
      filter_param, 
      new Map<string, number>(vocab.map(t => [ t.key as string, t.value as number ]))
    );
  });
  return dataset;
}

const onDatasetFilterChanged = (dataset : DatasetState<any>) : DatasetState<any> => {
  if(!dataset.crossfilter || !dataset.filterDimensions)
    return dataset;
  for(let [ dimName, dim ] of dataset.filterDimensions.entries()) {
    // TODO: re-apply filter only when the `filterValue` changes
    // Clear the applied filters
    dim.filterAll()
    let filterValue = dataset.filterValues.get(dimName);
    if(filterValue == null)
      continue;

    const filterFn = dataset.customFilterFunctions.get(dimName);
    // Apply either a custom filter function, or a default one - strict equality
    if(filterFn) {
      dim.filterFunction(filterFn(filterValue));
    } else {
      dim.filter(filterValue);
    }
  }
  dataset.filtered = dataset.crossfilter.allFiltered();
  dataset.raw2filtered.clear();
  dataset.filtered.forEach((r, i) => dataset.raw2filtered.set(r.__id || -1, i));

  // dataset.filteredGeneExpression = new Map<string, any>();
  // for(let i=0; i < dataset.filtered.length; i++) {
  //   const row = dataset.filtered[i];
  //   if(row.gene) {
  //     dataset.filteredGeneExpression.set(row.gene, row);
  //   }
  // }

  // state = updateFilterVocabularies(state);

  return dataset;
}

export const datasetsReducer = (
  state = initialState, 
  action : DatasetActionTypes<any>
) : DatasetsState => {
  switch(action.type) {
    case UPDATE_DATASET:
      const updateDataset = (action as UpdateDatasetAction<any>);
      state[updateDataset.id] = {
        raw: updateDataset.dataset,
        filterValues: new Map<string, FilterValueType>(),
        filterValueVocabulary: new Map<string, Map<string, number>>(),
        filterDimensionNames: [],
        customFilterFunctions: new Map<string, CustomFilterFn>(),
        filtered: [],
        raw2filtered : new Map<number, number>(),
      };
      // for(let i=0; i < state.raw.length; i++) {
      //   const row = state.raw[i];
      //   row.__id = i;
      // }
      return {...state};

    case SET_FILTER_DIMENSIONS:
      let setFilterDimensions = (action as SetDatasetFilterDimensionsAction);

      let dataset_sfd = state[setFilterDimensions.id];
      
      dataset_sfd.crossfilter = crossfilter(dataset_sfd.raw);
      dataset_sfd.filterDimensions = new Map<string, crossfilter.Dimension<any, NaturallyOrderedValue>>();

      // Save dimension names
      dataset_sfd.filterDimensionNames = setFilterDimensions.dimensions;
      // Construct requested dimensions
      dataset_sfd.filterDimensionNames.forEach(filter_param => {
        if(dataset_sfd.crossfilter && dataset_sfd.filterDimensions)
          dataset_sfd.filterDimensions.set(filter_param, dataset_sfd.crossfilter.dimension(r => (r as any)[filter_param] as string || ''));
      });
      // Reset the filter values
      dataset_sfd.filterValues = new Map<string, FilterValueType>();
      dataset_sfd.filterValueVocabulary = new Map<string, Map<string, number>>();
      dataset_sfd = updateFilterVocabularies(dataset_sfd);
      // // Set the initial filter values <strike>where there's none</strike>
      // dataset_sfd.filterDimensionNames.forEach(filter_param => {
      //   // if(!dataset_sfd.filterValues.has(filter_param)) {
      //     dataset_sfd.filterValues.set(
      //       filter_param, 
      //       dataset_sfd.filterValueVocabulary.get(filter_param)?.entries().next().value[0] || ''
      //     );
      //   // }
      // });

      dataset_sfd = onDatasetFilterChanged(dataset_sfd);
      state[setFilterDimensions.id] = dataset_sfd;
      return {...state};

    case ADD_CUSTOM_FILTER_DIMENSION:
      let addCustomFilterDimension = (action as AddCustomDatasetFilterDimensionAction<any>);
      let dataset_acfd = state[addCustomFilterDimension.id];
      if(!dataset_acfd.filterDimensions || !dataset_acfd.crossfilter) {
        console.error('Trying to add a custom filter dimension before SET_FILTER_DIMENSIONS was called');
        return state;
      }
      dataset_acfd.filterDimensions.set(
        addCustomFilterDimension.name, 
        dataset_acfd.crossfilter.dimension(addCustomFilterDimension.selector)
      );
      if(addCustomFilterDimension.filterFn)
        dataset_acfd.customFilterFunctions.set(addCustomFilterDimension.name, addCustomFilterDimension.filterFn);
      // dataset_acfd.filterValues.set(addCustomFilterDimension.name, addCustomFilterDimension.defaultValue);
      dataset_acfd = onDatasetFilterChanged(dataset_acfd);
      state[addCustomFilterDimension.id] = dataset_acfd;
      return {...state};

    case SET_FILTER_VALUE:
      let setFilterValue = (action as SetDatasetFilterValueAction);
      let dataset_sfv = state[setFilterValue.id];
      dataset_sfv.filterValues.set(setFilterValue.name, setFilterValue.value);
      dataset_sfv.filterValues = new Map(dataset_sfv.filterValues);
      dataset_sfv = onDatasetFilterChanged(dataset_sfv);
      state[setFilterValue.id] = dataset_sfv;
      return {...state};
    default:
      return state;
  }
};
