import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';

import { ExpressionDatasetState } from '../store/expression-dataset/types'
import { updateTextFilter } from '../store/expression-dataset/actions'
import { CombinedState } from '../store';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    textFilter: state.expressionDataset.textFilter,
  };
};

const mapDispatchToProps = {
  updateTextFilter
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  //
};

export const FilterPanel = ({ textFilter, updateTextFilter } : Props) => {
  return (
    <div className="filter-panel">
      <input className="text-filter" type="text" placeholder="filter by any text field" value={textFilter} onChange={ evt => updateTextFilter(evt.target.value) } />
    </div>
  );
};

export default connector(FilterPanel);
