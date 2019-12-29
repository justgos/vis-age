import React, { useEffect, useState, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import axios from 'axios';
import * as THREE from 'three';
import * as Papa from 'papaparse';
import { Canvas, CanvasContext } from 'react-three-fiber';

import { dpi } from './config'
import { CsvParseResult, ExpressionDataRow, PathwayGraphData } from './core/types'
import {
  updateDataset, 
  setFilterDimensions, 
  addCustomFilterDimension,
  setFilterValue,
} from './store/expression-dataset/actions'
import { updatePathways } from './store/pathways/actions'
import FilterPanel from './components/FilterPanel'
import SceneController from './components/SceneController'
// import Volcano from './components/Volcano'
import './App.scss';
import Graph from './components/Graph';
import TooltipController from './components/TooltipController';
import { CombinedState } from './store';
import { GraphEdge, GraphNode } from './store/pathways/types';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    nodes: state.pathways.graph.nodes,
    edges: state.pathways.graph.edges,
    filteredGeneExpression: state.expressionDataset.filteredGeneExpression,
  };
};

const mapDispatchToProps = {
  updateDataset,
  setFilterDimensions,
  addCustomFilterDimension,
  setFilterValue,
  updatePathways,
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

function App({
  updateDataset, 
  setFilterDimensions, 
  addCustomFilterDimension,
  setFilterValue,
  updatePathways,
  nodes,
  edges,
  filteredGeneExpression,
} : Partial<ConnectedProps<typeof connector>>) {
  const [ loading, setLoading ] = useState(true);
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
        updateDataset?.(csvData.data as ExpressionDataRow[]);
        setFilterDimensions?.(
          [ 'start_age', 'end_age', 'sex', 'tissue', 'subtissue', 'cell_ontology_class' ]
        );
        setFilterValue?.('sex', 'male');
        [ 'tissue', 'subtissue', 'cell_ontology_class' ].map(d => setFilterValue?.(d, ''));
        // Text column filter
        const textColumns = [
          'tissue', 'subtissue', 'cell_ontology_class', 'gene', 'uniprot_mouse', 'uniprot_daphnia'
        ];
        addCustomFilterDimension?.(
          'text',
          (row : ExpressionDataRow) => 
            textColumns.map(d => (row as any)[d]).join('|').toLowerCase(),
          (filterValue) => {
            return v => (v as string).includes((filterValue as string).toLowerCase());
          }
        );
        // Daphnia homolog presence filter
        addCustomFilterDimension?.(
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
        let pathways = await axios.get('./data/pathways.json');
        updatePathways?.(pathways.data as PathwayGraphData);

        setLoading(false);
      };
      loadData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasCtx = useRef<CanvasContext>();

  const onCanvasCreated = (ctx : CanvasContext) => {
    canvasCtx.current = ctx;
  };

  return (
    <div className="App">
      <TooltipController {...{ 
        nodes: nodes as GraphNode[], 
        filteredGeneExpression: filteredGeneExpression as Map<string, ExpressionDataRow>, 
        canvasContainerRef: canvasContainerRef as React.RefObject<HTMLDivElement>, 
        canvasCtx: canvasCtx.current as CanvasContext,
      }} />
      <FilterPanel />
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
          onCreated={onCanvasCreated}
          // {...bind()}
        >
          <SceneController {...{
            canvasContainerRef: canvasContainerRef as React.RefObject<HTMLDivElement>,
          }}>
            <Graph {...{
              nodes: nodes as GraphNode[], 
              edges: edges as GraphEdge[], 
              filteredGeneExpression: filteredGeneExpression as Map<string, ExpressionDataRow>,
            }} />
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
