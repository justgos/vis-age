import React, { useMemo, useState, useEffect } from 'react';
import colormap from 'colormap';

import { store } from '../store';
import { observeSelection } from './ObservesSelection';
import { updateTarget } from '../store/selection/actions';
import { SelectionState } from '../store/selection/types';
import GraphNodes, { GraphNodesProps } from './GraphNodes';
import { Point, CellMetadata, CellsMetadataVocabs } from '../core/types';
import { useThree } from 'react-three-fiber';

interface Props {
  id : string;
  datasetId : string;
  metadataDatasetId : string;
  goActivityDatasetId : string;
}

export const CellEmbedding = ({ id, datasetId, metadataDatasetId, goActivityDatasetId } : Props) => {
  const ctx = useThree();

  const [ cellEmbeddings, setCellEmbeddings ] = useState(
    store.getState().datasets[datasetId]
  );
  const [ cellMetadata, setCellsMetadata ] = useState(
    store.getState().datasets[metadataDatasetId]
  );
  const [ goActivity, setGOActivity ] = useState(
    store.getState().datasets[goActivityDatasetId]
  );
  const handleStoreUpdate = () => {
    setCellEmbeddings(store.getState().datasets[datasetId]);
    setCellsMetadata(store.getState().datasets[metadataDatasetId]);
    setGOActivity(store.getState().datasets[goActivityDatasetId]);
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
            const metadataVocabs : CellsMetadataVocabs = cellMetadata.meta;
            return (
              <>
                <div className="prop">
                  <div className="name">ID</div>
                  <div className="value">{id}</div>
                </div>
                <div className="prop">
                  <div className="name">Age</div>
                  <div className="value">{metadataVocabs.ageVocab[metadata.age]}</div>
                </div>
                <div className="prop">
                  <div className="name">Sex</div>
                  <div className="value">{metadataVocabs.sexVocab[metadata.sex]}</div>
                </div>
                <div className="prop">
                  <div className="name">Tissue</div>
                  <div className="value">{metadataVocabs.tissueVocab[metadata.tissue]}</div>
                </div>
                <div className="prop">
                  <div className="name">Subtissue</div>
                  <div className="value">{metadataVocabs.subtissueVocab[metadata.subtissue]}</div>
                </div>
                <div className="prop">
                  <div className="name">Cell type</div>
                  <div className="value">
                    {metadataVocabs.cellOntologyClassVocab[metadata.cellOntologyClass]}
                  </div>
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

      if(!cellMetadata) {
        return [ colors, sizes ];
      }

      const metadataVocabs : CellsMetadataVocabs = cellMetadata.meta;
      const ages = metadataVocabs.ageVocab;
      const ageColors = colormap({
        colormap: 'portland',
        nshades: ages.length,
        format: 'float',
        alpha: 0.4,
      });
      
      (cellMetadata.raw as CellMetadata[]).forEach((m, i) => {
        let color = neutralColor;
        let size = 4.0;

        color = ageColors[ages.indexOf(metadataVocabs.ageVocab[m.age])].slice();

        if(goActivity && goActivity.raw.length > 0)
          color[3] *= Math.pow(goActivity.raw[i] / 127.0, 2.0);

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
    [cellEmbeddings, cellMetadata, goActivity]
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
