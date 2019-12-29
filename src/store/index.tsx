import { combineReducers, createStore } from 'redux';

import { expressionDatasetReducer } from './expression-dataset/reducers'
import { pathwaysReducer } from './pathways/reducers'
import { tooltipReducer } from './tooltip/reducers'
import { TooltipState } from './tooltip/types';
import { ExpressionDatasetState } from './expression-dataset/types';
import { PathwaysState } from './pathways/types';

export interface CombinedState {
    expressionDataset : ExpressionDatasetState;
    pathways : PathwaysState;
    tooltip : TooltipState;
};

export const allReducers = combineReducers({
    expressionDataset: expressionDatasetReducer,
    pathways: pathwaysReducer,
    tooltip: tooltipReducer,
});

export const store = createStore(
    allReducers
);
