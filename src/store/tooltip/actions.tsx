import { ReactNode } from 'react';
import { 
  UpdateTooltipAction, 
  HideTooltipAction, 
  UPDATE_TOOLTIP, 
  HIDE_TOOLTIP 
} from './types'

export const updateTooltip = (x : number, y : number, content : ReactNode) : UpdateTooltipAction => {
  return {
    type: UPDATE_TOOLTIP,
    x,
    y,
    content,
  }
};

export const hideTooltip = () : HideTooltipAction => {
  return {
    type: HIDE_TOOLTIP,
  }
};
