import { combineReducers, createStore } from 'redux';

import { expressionDatasetReducer } from './expression-dataset/reducers'
import { tooltipReducer } from './tooltip/reducers'
import { TooltipState } from './tooltip/types';
import { ExpressionDatasetState } from './expression-dataset/types';

export interface CombinedState {
    expressionDataset : ExpressionDatasetState;
    tooltip : TooltipState;
};

export const allReducers = combineReducers({
    expressionDataset: expressionDatasetReducer,
    tooltip: tooltipReducer,
});

export const store = createStore(
    allReducers
);
