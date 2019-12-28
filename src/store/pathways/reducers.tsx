// import crossfilter from 'crossfilter2';
import {
  PathwayEntity, 
  Pathway, 
  Reaction, 
  Control, 
  Molecule, 
  TemplateReaction, 
  PathwayNode,
  Complex,
} from '../../core/types'
import { 
  PathwaysState, 
  PathwaysActionTypes, 
  UpdatePathwaysAction,
  // UpdatePathwaysFilterAction,  
  UPDATE_PATHWAYS,
  UPDATE_FILTER,
  // FilterValueType,
} from './types'

const initialState : PathwaysState = {
  lastUpdateTime: 0,
  raw: [],
  nodes: [],
  nodeNameMap: new Map<string , number>(),
  edges: [],
  // filterValues: new Map<string, FilterValueType>(),
  // filtered: [],
}

const parsePathways = (state : PathwaysState) : PathwaysState => {
  const addNode = (data : PathwayEntity) => {
    let name = data.name;
    // if((data.type === 'molecule') && (data as Molecule).entityReference?.name)
    //   name = (data as Molecule).entityReference?.name || name;
    if(state.nodeNameMap.has(name))
      return state.nodeNameMap.get(name) as number;
    const id = state.nodes.length;
    const node : PathwayNode = {
      __id : id,
      type: data.type,
      name: name,
    };
    if(data.type === 'molecule') {
      node.cellularLocation = (data as Molecule).cellularLocation;
      node.entityReference = (data as Molecule).entityReference;
    }
    state.nodes.push(node);
    state.nodeNameMap.set(node.name, id);
    return id;
  };
  const addNodes = (data : PathwayEntity) => {
    const ids = [];
    if(data.type === 'complex') {
      (data as Complex).component.map(c => addNodes(c)).forEach(ii => ids.push(...ii));
    } else {
      ids.push(addNode(data));
    }
    return ids
  };

  const addEdge = (source : number, target : number) => {
    state.edges.push({ source, target });
  };

  for(let i_p = 0; i_p < state.raw.length; i_p++) {
    const pathway = state.raw[i_p];
    for(let i_r = 0; i_r < pathway.pathwayComponent.length; i_r++) {
      const reactionContainer = pathway.pathwayComponent[i_r];

      let reactionNodeId = addNode(reactionContainer);

      // Extract the contained reaction
      let reaction : Reaction;
      if(reactionContainer.type === 'control') {
        reaction = (reactionContainer as Control).controlled;

        let moleculeNodeIds = addNodes((reactionContainer as Control).controller);
        moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
        // addEdge(reactionNodeId, moleculeNodeId);
      } else if(reactionContainer.type === 'template_reaction') {
        if((reactionContainer as TemplateReaction).template) {
          let moleculeNodeIds = addNodes((reactionContainer as TemplateReaction).template as PathwayEntity);
          moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
          // addEdge(reactionNodeId, moleculeNodeId);
        }

        for(let i_m = 0; i_m < (reactionContainer as TemplateReaction).product.length; i_m++) {
          const molecule = (reactionContainer as TemplateReaction).product[i_m];
          let moleculeNodeIds = addNodes(molecule);
          moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
          // addEdge(reactionNodeId, moleculeNodeId);
        }
        reaction = reactionContainer as Reaction;
      } else {
        reaction = reactionContainer as Reaction;
      }

      // // Process reaction direction
      // if(reaction.conversionDirection === 'LEFT-TO-RIGHT') {
      //   //
      // } else if(reaction.conversionDirection === 'RIGHT-TO-LEFT') {
      //   //
      // } else {
      //   // REVERSIBLE
      // }

      // Process reaction participants
      if(reaction.left) {
        for(let i_m = 0; i_m < reaction.left.length; i_m++) {
          const molecule = reaction.left[i_m];
          let moleculeNodeIds = addNodes(molecule);
          // addEdge(reactionNodeId, moleculeNodeId);

          if(reaction.conversionDirection === 'LEFT_TO_RIGHT') {
            moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
          } else if(reaction.conversionDirection === 'RIGHT_TO_LEFT') {
            moleculeNodeIds.forEach(m => addEdge(reactionNodeId, m));
          } else {
            // REVERSIBLE
            moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
            // addEdge(reactionNodeId, moleculeNodeId);
          }
        }
      }
      if(reaction.right) {
        for(let i_m = 0; i_m < reaction.right.length; i_m++) {
          const molecule = reaction.right[i_m];
          let moleculeNodeIds = addNodes(molecule);
          // addEdge(reactionNodeId, moleculeNodeId);

          if(reaction.conversionDirection === 'LEFT_TO_RIGHT') {
            moleculeNodeIds.forEach(m => addEdge(reactionNodeId, m));
          } else if(reaction.conversionDirection === 'RIGHT_TO_LEFT') {
            moleculeNodeIds.forEach(m => addEdge(m, reactionNodeId));
          } else {
            // REVERSIBLE
            // addEdge(moleculeNodeId, reactionNodeId);
            moleculeNodeIds.forEach(m => addEdge(reactionNodeId, m));
          }
        }
      }
    }
  }
  return state;
}

export const pathwaysReducer = (
  state = initialState, 
  action : PathwaysActionTypes
) : PathwaysState => {
  switch(action.type) {
    case UPDATE_PATHWAYS:
      state.lastUpdateTime = Date.now();
      state.raw = (action as UpdatePathwaysAction).pathways;
      state = parsePathways(state);
      return {...state};
    case UPDATE_FILTER:
      //
      return {...state};
    default:
      return state;
  }
};
