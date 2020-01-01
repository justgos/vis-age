import { PathwayGraphData } from '../../core/types'
import { 
  UpdatePathwaysAction, 
  UpdatePathwaysFilterAction, 
  UPDATE_PATHWAYS, 
  UPDATE_FILTER,
  FilterValueType,
  DehydratedPathwayGraph,
  UPDATE_GENE_ANNOTATIONS,
  UpdateGeneAnnotationsAction,
  GeneAnnotation,
} from './types'

export const updatePathways = (pathways : PathwayGraphData | DehydratedPathwayGraph) : UpdatePathwaysAction => {
  return {
    type: UPDATE_PATHWAYS,
    pathways,
  }
};

export const updateGeneAnnotations = (geneAnnotations : GeneAnnotation[]) : UpdateGeneAnnotationsAction => {
  return {
    type: UPDATE_GENE_ANNOTATIONS,
    geneAnnotations,
  }
};

export const updateFilter = (name : string, value : FilterValueType) : UpdatePathwaysFilterAction => {
  return {
    type: UPDATE_FILTER,
    name,
    value,
  }
};
