import { createStore } from 'redux';
import { allReducers, store as templateStore } from '../'
import { updateDataset, updateFilter } from './actions'
// import { ExpressionDataRow } from '../../core/types'

describe("Store: expression-dataset", () => {

  let sampleDataset = [
    { start_age: '3m', end_age: '18m', sex: "male", subtissue: "Brain_Non-Myeloid" },
    { start_age: '3m', end_age: '18m', sex: "female", tissue: "Brain_Myeloid" },
    { p_value: 1e-12, },
  ];

  let store : typeof templateStore;
  beforeEach(() => {
    store = createStore(
      allReducers
    );
  });

  it("Accepts a dataset", () => {
    store.dispatch(updateDataset(sampleDataset));
    const stored = store.getState().expressionDataset;
    expect(stored.raw.length).toBe(3);
    expect(stored.raw.find(r => r.sex === "male")).toBeDefined();
    expect(stored.raw.find(r => r.p_value === 1e-12) != null).toBeDefined();
    expect(stored.filterDimensions).toBeDefined();
    expect(stored.filterDimensions?.has("test")).toBeDefined();
  });

  it("Filters by text", () => {
    store.dispatch(updateDataset(sampleDataset));

    // The default 'female' filter value will be applied on dataset load
    store.dispatch(updateFilter("text", "male"));
    expect(store.getState().expressionDataset.filtered.length).toBe(1);
    
    store.dispatch(updateFilter("text", "female"));
    expect(store.getState().expressionDataset.filtered.length).toBe(1);
    
    store.dispatch(updateFilter("text", "brain"));
    expect(store.getState().expressionDataset.filtered.length).toBe(1);
  });

});
