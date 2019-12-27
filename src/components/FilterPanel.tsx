import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import { Classes, Checkbox, HTMLSelect } from "@blueprintjs/core";

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

export const FilterPanel = ({ filterValues, filterValueVocabulary, setFilterValue } : Props) => {
  return (
    <div className="filter-panel">
      {[ 'start_age', 'end_age', 'sex' ].map(filter_param => 
        <HTMLSelect 
          key={filter_param}
          className="filter-element"
          options={[...(filterValueVocabulary.get(filter_param)?.entries() || [])].map(t => {
            return {
              label: `${t[0]} - ${t[1]}`,
              value: t[0],
            };
          })}
          value={filterValues.get(filter_param) as string} 
          onChange={ evt => setFilterValue(filter_param, (evt.target as HTMLSelectElement).value) } 
        />
      )}
      <input 
        className={`filter-element text-filter ${Classes.INPUT}`} 
        type="text" 
        placeholder="filter by any text field" 
        value={filterValues.get("text") as string || ''} 
        onChange={ evt => setFilterValue("text", evt.target.value) } 
      />
      <Checkbox 
        className={`filter-element homolog-filter ${Classes.BUTTON}`} 
        checked={filterValues.get("uniprot_daphnia") != null} 
        onChange={ evt => setFilterValue("uniprot_daphnia", (evt.target as HTMLInputElement).checked ? "~" : undefined) }
      >
        has Daphnia homolog
      </Checkbox>
    </div>
  );
};

export default connector(FilterPanel);
