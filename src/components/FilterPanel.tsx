import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import { Classes, Checkbox } from "@blueprintjs/core";

import { ExpressionDatasetState } from '../store/expression-dataset/types'
import { updateFilter } from '../store/expression-dataset/actions'
import { CombinedState } from '../store';
import './FilterPanel.scss';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    filterValues: state.expressionDataset.filterValues,
  };
};

const mapDispatchToProps = {
  updateFilter
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  //
};

export const FilterPanel = ({ filterValues, updateFilter } : Props) => {
  return (
    <div className="filter-panel">
      <input 
        className={`filter-element text-filter ${Classes.INPUT}`} 
        type="text" 
        placeholder="filter by any text field" 
        value={filterValues.get("text") as string} 
        onChange={ evt => updateFilter("text", evt.target.value) } 
      />
      <Checkbox 
        className={`filter-element homolog-filter ${Classes.BUTTON}`} 
        checked={filterValues.get("uniprot_daphnia") as boolean} 
        onChange={ evt => updateFilter("uniprot_daphnia", (evt.target as HTMLInputElement).checked ? "~" : undefined) }
      >
        has Daphnia homolog
      </Checkbox>
    </div>
  );
};

export default connector(FilterPanel);
