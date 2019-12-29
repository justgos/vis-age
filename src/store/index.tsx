import { combineReducers, createStore } from 'redux';

import { expressionDatasetReducer } from './expression-dataset/reducers'
import { pathwaysReducer } from './pathways/reducers'
import { tooltipReducer } from './tooltip/reducers'
import { selectionReducer } from './selection/reducers'
import { TooltipState } from './tooltip/types';
import { ExpressionDatasetState } from './expression-dataset/types';
import { PathwaysState } from './pathways/types';
import { SelectionState } from './selection/types';

export interface CombinedState {
    expressionDataset : ExpressionDatasetState;
    pathways : PathwaysState;
    tooltip : TooltipState;
    selection : SelectionState;
};

export const allReducers = combineReducers({
    expressionDataset: expressionDatasetReducer,
    pathways: pathwaysReducer,
    tooltip: tooltipReducer,
    selection: selectionReducer,
});

export const store = createStore(
    allReducers
);
