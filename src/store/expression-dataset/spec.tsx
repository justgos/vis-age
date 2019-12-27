import { createStore } from 'redux';
import { allReducers, store as templateStore } from '../'
import { updateDataset, setFilterDimensions, setFilterValue, addCustomFilterDimension } from './actions'
import { ExpressionDataRow } from '../../core/types';
import { CustomFilterFn } from './types';
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
      [ 'start_age', 'end_age', 'sex' ]
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
      []
    ));
    const textColumns = [
      'sex', 'tissue', 'subtissue', 'cell_ontology_class', 'gene', 'uniprot_mouse', 'uniprot_daphnia'
    ];
    store.dispatch(addCustomFilterDimension(
      'text',
      (row : ExpressionDataRow) => 
        textColumns.map(d => (row as any)[d]).join('|').toLowerCase(),
      (filterValue) => {
        return v => (v as string).includes((filterValue as string).toLowerCase());
      }
    ));

    const textFilterFn = store.getState().expressionDataset.customFilterFunctions.get('text');
    expect(textFilterFn).toBeDefined();
    expect((textFilterFn as CustomFilterFn)('male')('male')).toBeTruthy();
    expect((textFilterFn as CustomFilterFn)('female')('male')).toBeFalsy();

    store.dispatch(setFilterValue('text', 'male'));
    expect(store.getState().expressionDataset.filtered.length).toBe(3);
    
    store.dispatch(setFilterValue('text', 'female'));
    expect(store.getState().expressionDataset.filtered.length).toBe(1);
    
    store.dispatch(setFilterValue('text', 'brain'));
    expect(store.getState().expressionDataset.filtered.length).toBe(2);
  });

});
