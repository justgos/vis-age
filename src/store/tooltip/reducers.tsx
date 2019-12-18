import React from 'react';
import { 
  TooltipState,
  UpdateTooltipAction, 
  UPDATE_TOOLTIP, 
  HIDE_TOOLTIP,
  TooltipActionTypes,
} from './types'

const initialState : TooltipState = {
  active: false,
  x: 0,
  y: 0,
  content: <></>,
}

export const tooltipReducer = (
  state = initialState, 
  action : TooltipActionTypes
) : TooltipState => {
  switch(action.type) {
    case UPDATE_TOOLTIP:
      state.x = (action as UpdateTooltipAction).x;
      state.y = (action as UpdateTooltipAction).y;
      state.content = (action as UpdateTooltipAction).content;
      state.active = true;
      return {...state};
    case HIDE_TOOLTIP:
      state.active = false;
      return {...state};
    default:
      return state;
  }
};
