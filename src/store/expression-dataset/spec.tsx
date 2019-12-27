import { createStore } from 'redux';
import { allReducers, store as templateStore } from '../'
import { updateDataset, setFilterDimensions, setFilterValue } from './actions'
// import { ExpressionDataRow } from '../../core/types'

describe('Store: expression-dataset', () => {

  let sampleDataset = [
    { start_age: '21m', end_age: '30m', sex: 'male', subtissue: 'Brain_Non-Myeloid' },
    { end_age: '21m', sex: 'female', tissue: 'Brain_Myeloid' },
    { start_age: '3m', end_age: '18m', sex: 'male', p_value: 1e-12, },
  ];

  let store : typeof templateStore;
  beforeEach(() => {
    store = createStore(
      allReducers
    );
  });

  it('Accepts a dataset', () => {
    store.dispatch(updateDataset(sampleDataset));
    const stored = store.getState().expressionDataset;
    expect(stored.raw.length).toBe(3);
    expect(stored.raw.find(r => r.sex === 'male')).toBeDefined();
    expect(stored.raw.find(r => r.p_value === 1e-12) != null).toBeDefined();
  });

  
  it('Sets default filter values', () => {
    store.dispatch(updateDataset(sampleDataset));

    store.dispatch(setFilterDimensions(
      [ 'start_age', 'end_age', 'sex' ],
      [ 'tissue', 'subtissue', 'cell_ontology_class', 'gene', 'uniprot_mouse', 'uniprot_daphnia' ]
    ));
    
    const stored = store.getState().expressionDataset;
    expect(stored.filterDimensions).toBeDefined();
    expect(stored.filterDimensions?.has('test')).toBeDefined();
    expect(stored.filterValues.get('start_age')).toBe('');
    expect(stored.filterValues.get('end_age')).toBe('18m');
    expect(stored.filterValues.get('sex')).toBe('female');
  });

  it('Filters by text', () => {
    store.dispatch(updateDataset(sampleDataset));

    store.dispatch(setFilterDimensions(
      [],
      [ 'sex', 'tissue', 'subtissue', 'cell_ontology_class', 'gene', 'uniprot_mouse', 'uniprot_daphnia' ]
    ));

    store.dispatch(setFilterValue('text', 'male'));
    expect(store.getState().expressionDataset.filtered.length).toBe(3);
    
    store.dispatch(setFilterValue('text', 'female'));
    expect(store.getState().expressionDataset.filtered.length).toBe(1);
    
    store.dispatch(setFilterValue('text', 'brain'));
    expect(store.getState().expressionDataset.filtered.length).toBe(2);
  });

});
