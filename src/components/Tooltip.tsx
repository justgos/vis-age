import React, { useEffect, useState, useMemo } from 'react';
import { connect, ConnectedProps  } from 'react-redux';

import { CombinedState } from '../store'
import './Tooltip.scss';

const mapStateToProps = (
  state : CombinedState
) => {
  return {...state.tooltip};
};

const mapDispatchToProps = {
  //
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  //
};

export const Tooltip = ({ active, x, y, content } : Props) => {
  return (
    <div className="tooltip" style={{ left: x, top: y, display: active ? 'block' : 'none' }}>
      {content}
    </div>
  );
};

export default connector(Tooltip);
