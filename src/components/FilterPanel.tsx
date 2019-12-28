import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import { Classes, Checkbox, HTMLSelect, RadioGroup, Radio } from "@blueprintjs/core";

import { ExpressionDatasetState } from '../store/expression-dataset/types'
import { setFilterValue } from '../store/expression-dataset/actions'
import { CombinedState } from '../store';
import './FilterPanel.scss';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    filterValues: state.expressionDataset.filterValues,
    filterValueVocabulary: state.expressionDataset.filterValueVocabulary,
  };
};

const mapDispatchToProps = {
  setFilterValue
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  //
};

const dimensionLabels : { [dimension : string] : string } = {
  'start_age': 'Start age',
  'end_age': 'End age',
  'sex': 'Sex',
  'tissue': 'Tissue',
  'subtissue': 'Subtissue',
  'cell_ontology_class': 'Cell type',
};

export const FilterPanel = ({ filterValues, filterValueVocabulary, setFilterValue } : Props) => {
  return (
    <div className="filter-panel">
      <input 
        className={`filter-element text-filter ${Classes.INPUT} ${Classes.MINIMAL}`} 
        type="text" 
        placeholder="filter by any text field" 
        value={filterValues.get("text") as string || ''} 
        onChange={ evt => setFilterValue("text", evt.currentTarget.value) } 
      />
      <Checkbox 
        className={`filter-element homolog-filter ${Classes.MINIMAL}`} 
        checked={filterValues.get("uniprot_daphnia") != null} 
        onChange={ evt => setFilterValue("uniprot_daphnia", evt.currentTarget.checked ? "~" : undefined) }
      >
        has Daphnia homolog
      </Checkbox>
      {[ 'start_age', 'end_age', 'sex', 'tissue', 'subtissue', 'cell_ontology_class' ].map(filter_param => 
        <div key={filter_param} className="filter-element">
          <div className="filter-element-label">
            {dimensionLabels[filter_param]}
          </div>
          <RadioGroup 
            className={`${Classes.MINIMAL}`}
            selectedValue={filterValues.get(filter_param) as string} 
            onChange={ evt => setFilterValue(filter_param, evt.currentTarget.value) } 
          >
          {[...(filterValueVocabulary.get(filter_param)?.entries() || [])].map(t => 
            <Radio key={t[0]} value={t[0]}>
              {t[0] !== '' ? t[0] : '<none>'}
              <span className="count">{t[1]}</span>
            </Radio>
          )}
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

export default connector(FilterPanel);
