import React, { useMemo, useState, useEffect } from 'react';
import colormap from 'colormap';

import { store } from '../store';
import { GraphNode, GraphEdge } from '../store/pathways/types';
import GraphEdges, { GraphEdgesProps } from './GraphEdges';
import { observeSelection } from './ObservesSelection';
import { updateTarget } from '../store/selection/actions';
import { SelectionState } from '../store/selection/types';
import GraphNodes, { GraphNodesProps } from './GraphNodes';
import { Point, CellMetadata } from '../core/types';
import { useThree } from 'react-three-fiber';

interface Props {
  id : string;
  datasetId : string;
  metadataDatasetId : string;
}

export const CellEmbedding = ({ id, datasetId, metadataDatasetId } : Props) => {
  const ctx = useThree();

  const [ cellEmbeddings, setCellEmbeddings ] = useState(
    store.getState().datasets[datasetId]
  );
  const [ cellMetadata, setCellsMetadata ] = useState(
    store.getState().datasets[metadataDatasetId]
  );
  const handleStoreUpdate = () => {
    setCellEmbeddings(store.getState().datasets[datasetId]);
    setCellsMetadata(store.getState().datasets[metadataDatasetId]);
  };
  useEffect(() => {
    const subscription = store.subscribe(() => {
      handleStoreUpdate();
    });
    handleStoreUpdate();
    return subscription;
  }, []);

  useEffect(
    () => {
      if(cellEmbeddings) {
        store.dispatch(updateTarget(
          id, 
          // cellEmbeddings.raw.filter((p, i) => cellMetadata ? (cellMetadata.raw as CellMetadata[])[i].age === '3m' : true), 
          cellEmbeddings.raw,
          ctx,
          (id) => {
            const metadata : CellMetadata = cellMetadata.raw[id];
            return (
              <>
                <div className="prop">
                  <div className="name">ID</div>
                  <div className="value">{id}</div>
                </div>
                <div className="prop">
                  <div className="name">Age</div>
                  <div className="value">{metadata.age}</div>
                </div>
                <div className="prop">
                  <div className="name">Tissue</div>
                  <div className="value">{metadata.tissue}</div>
                </div>
                <div className="prop">
                  <div className="name">Subtissue</div>
                  <div className="value">{metadata.subtissue}</div>
                </div>
                <div className="prop">
                  <div className="name">Cell type</div>
                  <div className="value">{metadata.cellOntologyClass}</div>
                </div>
              </>
            );
          }
        ));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cellEmbeddings, cellMetadata]
  );

  const neutralColor = [0, 0, 0, 0.2];
  const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255, 0.4];
  const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255, 0.4];

  const [ colors, sizes ] = useMemo(
    () => {
      const colors : number[] = [];
      const sizes : number[] = [];

      if(!cellMetadata || !cellMetadata.filterValueVocabulary.has('age')) {
        return [ colors, sizes ];
      }

      console.log('filterVocabulary', cellMetadata.filterValueVocabulary.get('age'));
      const ages = Array.from(cellMetadata.filterValueVocabulary.get('age')?.keys() || []);
      const ageColors = colormap({
        colormap: 'portland',
        nshades: ages.length,
        format: 'float',
        alpha: 0.4,
      });
      
      (cellMetadata.raw as CellMetadata[]).forEach(m => {
        let color = neutralColor;
        let size = 4.0;

        color = ageColors[ages.indexOf(m.age)];

        // if(m.age === '3m') {
        //   color = warmColor;
        //   size = 5.0;
        // } else if(m.age === '30m') {
        //   color = coldColor;
        //   size = 5.0;
        // }

        colors.push(...color);
        sizes.push(size);
      });

      return [ colors, sizes ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cellEmbeddings, cellMetadata, cellMetadata ? cellMetadata.filterValueVocabulary : null]
  );

  if(!cellEmbeddings) {
    return (
      <></>
    );
  }

  return (
    <GraphNodes {...{
      nodes: cellEmbeddings.raw as Point[], 
      colors, 
      sizes,
    }} />
  );
};
