import React, { useEffect, useState, useMemo, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import axios from 'axios';
import * as THREE from 'three';
import * as Papa from 'papaparse';
import { Canvas, SharedCanvasContext } from 'react-three-fiber';

import { dpi } from './config'
import { CsvParseResult, ExpressionDataRow, Point, CanvasReference, CellMetadata, CellsMetadata, CellsMetadataVocabs, CellEmbeddings, CellsMetaMetadata } from './core/types'
import { loadProto } from './util/proto'
import {
  updateExpressionDataset, 
  setExpressionDatasetFilterDimensions, 
  addExpressionDatasetCustomFilterDimension,
  setExpressionDatasetFilterValue,
} from './store/expression-dataset/actions'
import {
  setFilterDimensions,
} from './store/datasets/actions'
import { updateDataset } from './store/datasets/actions'
import { updatePathways, updateGeneAnnotations } from './store/pathways/actions'
import FilterPanel from './components/FilterPanel'
import SceneController from './components/SceneController'
// import Volcano from './components/Volcano'
import './App.scss';
import Graph from './components/Graph';
import TooltipController from './components/TooltipController';
import { CombinedState } from './store';
import { GraphEdge, GraphNode, DehydratedPathwayGraph, GeneAnnotation } from './store/pathways/types';
import GraphNodes from './components/GraphNodes';
import { CellEmbedding } from './components/CellEmbedding';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    nodes: state.pathways.graph.nodes,
    edges: state.pathways.graph.edges,
  };
};

const mapDispatchToProps = {
  updateDataset,
  setFilterDimensions,
  updateExpressionDataset,
  setExpressionDatasetFilterDimensions,
  addExpressionDatasetCustomFilterDimension,
  setExpressionDatasetFilterValue,
  updatePathways,
  updateGeneAnnotations,
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

export type DataMode = 'pathways' | 'embeddings';

function App({
  updateDataset,
  setFilterDimensions,
  updateExpressionDataset, 
  setExpressionDatasetFilterDimensions, 
  addExpressionDatasetCustomFilterDimension,
  setExpressionDatasetFilterValue,
  updatePathways,
  updateGeneAnnotations,
  nodes,
  edges,
} : Partial<ConnectedProps<typeof connector>>) {
  const [ loading, setLoading ] = useState(true);

  const [ mode, setMode ] = useState<DataMode>('pathways');

  useEffect(
    () => {
      const loadData = async () => {
        // Load the expression data
        const csvData : CsvParseResult = await new Promise(
          function(complete, error) {
            Papa.parse(
              // './data/facs-18m-24m-cell_ontology_class.csv', 
              './data/merged_augmented.csv', 
              {
                delimiter: ',',
                header: true,
                download: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete, 
                error
              }
            );
        });
        updateExpressionDataset?.(csvData.data as ExpressionDataRow[]);
        setExpressionDatasetFilterDimensions?.(
          [ 'start_age', 'end_age', 'sex', 'tissue', 'subtissue', 'cell_ontology_class' ]
        );
        setExpressionDatasetFilterValue?.('sex', 'male');
        [ 'tissue', 'subtissue', 'cell_ontology_class' ].map(d => setExpressionDatasetFilterValue?.(d, ''));
        // Text column filter
        const textColumns = [
          'tissue', 'subtissue', 'cell_ontology_class', 'gene', 'uniprot_mouse', 'uniprot_daphnia'
        ];
        addExpressionDatasetCustomFilterDimension?.(
          'text',
          (row : ExpressionDataRow) => 
            textColumns.map(d => (row as any)[d]).join('|').toLowerCase(),
          (filterValue) => {
            return v => (v as string).includes((filterValue as string).toLowerCase());
          }
        );
        // Daphnia homolog presence filter
        addExpressionDatasetCustomFilterDimension?.(
          'uniprot_daphnia',
          (row : ExpressionDataRow) => 
            row.uniprot_daphnia || '',
          (filterValue) => {
            if((filterValue as String) === '~') {
              // Match non-empty values
              return v => v != null && v !== '';
            }
            return v => v === filterValue;
          }
        );

        // Load pathways
        let pathways = await axios.get('./data/pathways_preprocessed.json');
        updatePathways?.(pathways.data as DehydratedPathwayGraph);
        // Load gene annotations
        let gene_annotations = await axios.get('./data/gene_annotations.json');
        updateGeneAnnotations?.(gene_annotations.data as GeneAnnotation[]);

        const cellEmbeddingsContainer = await loadProto<CellEmbeddings>('Coords', './data/cell_embeddings.bin');
        const cellEmbeddings = cellEmbeddingsContainer.values;
        const embeddingPoints : Point[] = [];
        const embeddingsScale = 4;
        for(let i = 0; i < cellEmbeddings.length; i+=2) {
          embeddingPoints.push({
            __id: Math.trunc(i / 2),
            x: cellEmbeddings[i] * embeddingsScale, 
            y: cellEmbeddings[i + 1] * embeddingsScale,
            // z: cellEmbeddings[i + 2],
          });
        }
        updateDataset?.('cellEmbeddings', embeddingPoints);

        const cellsMetadata = await loadProto<CellsMetadata>('CellsMetadata', './data/cell_metadata.bin');
        const cellsMetaMetadata : CellsMetaMetadata = {
          sexVocab: cellsMetadata.sexVocab,
          ageVocab: cellsMetadata.ageVocab,
          tissueVocab: cellsMetadata.tissueVocab,
          subtissueVocab: cellsMetadata.subtissueVocab,
          cellOntologyClassVocab: cellsMetadata.cellOntologyClassVocab,
          goActivities: cellsMetadata.goActivities,
        };
        updateDataset?.('cellMetadata', cellsMetadata.cells, cellsMetaMetadata);

        // setFilterDimensions?.(
        //   'cellMetadata',
        //   [ 'age' ]
        // );

        setLoading(false);
      };
      loadData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const canvases = useMemo(() => new Map<string, CanvasReference>(), []);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const onCanvasCreated = (id : string, ctx : SharedCanvasContext, containerRef : React.RefObject<HTMLDivElement>) => {
    canvases.set(id, {
      ctx,
      containerRef,
    });
  };

  const displayNodes = useMemo(() => {
    return (nodes?.filter(n => n.entityReference?.gene) || []) as GraphNode[];
  }, [nodes]);

  return (
    <div className="App">
      <TooltipController {...{ 
        containerRef: canvasContainerRef
      }} />
      <FilterPanel
        mode={mode}
        setMode={mode => {
          setMode(mode);
          setTimeout(() => canvases.get('embeddings')?.ctx.invalidate(), 100);
        }}
      />
      <div className="main-canvas" ref={canvasContainerRef}>
        <Canvas
          // id="gl-canvas"
          camera={{
            fov: 75,
            near: 1.0,
            far: 10000,
            position: [0, 0, 1000],
            rotation: new THREE.Euler(0, 0, 0)
          }}
          orthographic={true}
          pixelRatio={dpi}
          invalidateFrameloop={true}
          gl2={true}
          onCreated={(ctx) => onCanvasCreated('embeddings', ctx, canvasContainerRef)}
          // {...bind()}
        >
          <SceneController {...{
            canvasContainerRef: canvasContainerRef as React.RefObject<HTMLDivElement>,
          }}>
            {mode === 'embeddings' &&
              <CellEmbedding 
                id='cellEmbeddings' 
                datasetId='cellEmbeddings' 
                metadataDatasetId='cellMetadata'
                goActivityDatasetId='goActivity'
              />
            }
            {mode === 'pathways' &&
              <Graph {...{
                nodes: displayNodes, 
                edges: [] as GraphEdge[], 
              }} />
            }
            {/* <Volcano /> */}
          </SceneController>
        </Canvas>
      </div>
      {loading && 
        <div className="loading">
          <div className="lds-ripple"><div></div><div></div></div>
        </div>
      }
    </div>
  );
}

export default connector(App);
