import { combineReducers, createStore } from 'redux';

import { expressionDatasetReducer } from './expression-dataset/reducers'
import { datasetsReducer } from './datasets/reducers'
import { pathwaysReducer } from './pathways/reducers'
import { tooltipReducer } from './tooltip/reducers'
import { selectionReducer } from './selection/reducers'
import { TooltipState } from './tooltip/types';
import { ExpressionDatasetState } from './expression-dataset/types';
import { PathwaysState } from './pathways/types';
import { SelectionState } from './selection/types';
import { DatasetsState } from './datasets/types';

export interface CombinedState {
    expressionDataset : ExpressionDatasetState;
    datasets : DatasetsState;
    pathways : PathwaysState;
    tooltip : TooltipState;
    selection : SelectionState;
};

export const allReducers = combineReducers({
    expressionDataset: expressionDatasetReducer,
    datasets: datasetsReducer,
    pathways: pathwaysReducer,
    tooltip: tooltipReducer,
    selection: selectionReducer,
});

export const store = createStore(
    allReducers
);
