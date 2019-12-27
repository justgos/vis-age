import { ReactNode } from 'react';

export interface TooltipState {
  active : boolean;
  x : number;
  y : number;
  content : ReactNode;
};

export const UPDATE_TOOLTIP = 'UPDATE_TOOLTIP';
export const HIDE_TOOLTIP = 'HIDE_TOOLTIP';

export interface UpdateTooltipAction {
  type : string;
  x : number;
  y : number;
  content : ReactNode;
};
export interface HideTooltipAction {
  type : string;
};

export type TooltipActionTypes = 
  UpdateTooltipAction 
  | HideTooltipAction;
