import React from 'react';

import { store } from '../store';
import { SelectionState, SelectionTarget } from '../store/selection/types';
import { Unsubscribe } from 'redux';

interface State {
  selection : SelectionState;
};

export const observeSelection = <P extends object>(
  Wrapped : React.ComponentType<P>,
  stateSelector : (state : SelectionState, props : P) => P,
) => {
  class Wrapper extends React.Component<P, State> {
    private subscription : Unsubscribe = () => {};
    private _mounted : boolean = false;

    constructor(props : P) {
      super(props);

      this.state = {
        selection: {
          targets: new Map<string, SelectionTarget>(),
          selectedNodes: [], 
          selectedEdges: [],
        },
      };
    }
    handleStoreUpdate() {
      if(!this._mounted)
        return
      this.setState({
        selection: {...store.getState().selection},
      })
    }
    componentDidMount() {
      this._mounted = true;
      this.subscription = store.subscribe(this.handleStoreUpdate.bind(this));
      this.handleStoreUpdate();
    }
    componentWillUnmount() {
      this._mounted = false;
      // Unsubscribe from the store
      this.subscription();
    }
    render() {
      const props = stateSelector(this.state.selection, this.props);
      return <Wrapped {...props} />;
    }
  };
  return Wrapper
}

export default observeSelection;
