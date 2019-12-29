import { createStore } from 'redux';
import { allReducers, store as templateStore } from '../';
import { updatePathways } from './actions';
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
    expect(stored.graph.nodes.length).toBe(11);
    expect(stored.graph.edges.length).toBe(15);
    // expect(stored.nodes.filter(n => n.type === 'reaction').length).toBe(2);
    // expect(stored.nodes.filter(n => n.type === 'molecule').length).toBe(4);
  });
});
