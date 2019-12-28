import { createStore } from 'redux';
import { allReducers, store as templateStore } from '../';
import { updatePathways, updateFilter } from './actions';
import sampleDataset from './sampleDataset.json';

describe('Store: pathways', () => {
  let store : typeof templateStore;
  beforeEach(() => {
    store = createStore(
      allReducers
    );
  });

  it('Accepts a dataset', () => {
    store.dispatch(updatePathways(sampleDataset));
    const stored = store.getState().pathways;
    expect(stored.nodes.length).toBe(11);
    expect(stored.edges.length).toBe(15);
    // expect(stored.nodes.filter(n => n.type === 'reaction').length).toBe(2);
    // expect(stored.nodes.filter(n => n.type === 'molecule').length).toBe(4);
  });

  // it('Filters by text', () => {
  //   store.dispatch(updateDataset(sampleDataset));

  //   store.dispatch(updateFilter('text', 'male'));
  //   expect(store.getState().expressionDataset.filtered.length).toBe(2);
    
  //   store.dispatch(updateFilter('text', 'female'));
  //   expect(store.getState().expressionDataset.filtered.length).toBe(1);
    
  //   store.dispatch(updateFilter('text', 'brain'));
  //   expect(store.getState().expressionDataset.filtered.length).toBe(2);
  // });

});
