import React, { useEffect, useState, useMemo, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import axios from 'axios';
import * as THREE from 'three';
import * as Papa from 'papaparse';
import { Canvas, CanvasContext } from 'react-three-fiber';
import { useGesture } from 'react-use-gesture'

import { dpi } from './config'
import { CsvParseResult, ExpressionDataRow, Pathway, GestureData, MouseMoveHook, MouseMoveHooks, PathwayGraphData } from './core/types'
import {
  updateDataset, 
  setFilterDimensions, 
  addCustomFilterDimension,
  setFilterValue,
} from './store/expression-dataset/actions'
import { updatePathways } from './store/pathways/actions'
import Tooltip from './components/Tooltip'
import FilterPanel from './components/FilterPanel'
import SceneController from './components/SceneController'
import Volcano from './components/Volcano'
import './App.scss';
import Graph from './components/Graph';

const mapDispatchToProps = {
  updateDataset,
  setFilterDimensions,
  addCustomFilterDimension,
  setFilterValue,
  updatePathways,
};

const connector = connect(
  null,
  mapDispatchToProps
);

function App({
  updateDataset, 
  setFilterDimensions, 
  addCustomFilterDimension,
  setFilterValue,
  updatePathways,
} : Partial<ConnectedProps<typeof connector>>) {
  const [ loading, setLoading ] = useState(true);
  useEffect(() => {
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
  }, []);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasCtx = useRef<CanvasContext>();

  const onCanvasCreated = (ctx : CanvasContext) => {
    canvasCtx.current = ctx;
  };

  const [ gestureData, lastGestureData ] = useMemo(() => {
    const initialState = {
      dragging: false,
      dragX: 0,
      dragY: 0,
      scrolling: false,
      scrollX: 0,
      scrollY: 0,
      pinching: false,
      pinchD: 0,
      pinchA: 0,
      pinchOrigin: [0, 0],
    };
    return [
      JSON.parse(JSON.stringify(initialState)) as GestureData,
      JSON.parse(JSON.stringify(initialState)) as GestureData,
    ];
  }, []);
  const mouseMoveHooks : MouseMoveHooks = useMemo(() => {
    return {
      hooks: new Map<number, MouseMoveHook>(),
      nextId: 0,
    };
  }, []);
  const bind = useGesture({
    onDrag: ({ event, last, down, movement: [mx, my] }) => {
      gestureData.dragging = down;
      gestureData.dragX = mx;
      gestureData.dragY = my;
      if(!last || last)
        event?.preventDefault();
      
      if(down)
        canvasCtx.current?.invalidate();
      // if(down)
      //   canvasRef.current.
    },
    onWheel: ({ event, last, down, xy: [x, y] }) => {
      // console.log('onWheel', down, x, y)
      gestureData.scrolling = (x !== lastGestureData.scrollX) || (y !== lastGestureData.scrollY);
      gestureData.scrollX = x;
      gestureData.scrollY = y;
      lastGestureData.scrollX = gestureData.scrollX;
      lastGestureData.scrollY = gestureData.scrollY;
      if(!last)
        event?.preventDefault();
        
      if(gestureData.scrolling)
        canvasCtx.current?.invalidate();
    },
    onPinch: ({ event, first, last, down, da: [d, a], origin }) => {
      // console.log('onPinch', d, a)
      gestureData.pinching = down;
      gestureData.pinchD = d;
      gestureData.pinchA = a;
      if(first && origin)
        gestureData.pinchOrigin = [ origin[0], origin[1] ];
      if(!last)
        event?.preventDefault();

      if(down || last)
        canvasCtx.current?.invalidate();
    },
    onMove: ({ xy: [x, y] }) => {
      const mx = x - (canvasContainerRef.current?.offsetLeft || 0);
      const my = y - (canvasContainerRef.current?.offsetTop || 0);
      for(const hook of mouseMoveHooks.hooks.values())
        hook(mx, my);
    },
  }, {
    domTarget: canvasContainerRef,
    event: { passive: false },
  });
  React.useEffect(() => { bind(); }, [bind]);

  return (
    <div className="App">
      <Tooltip />
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
          <SceneController gestureData={gestureData}>
            <Graph mouseMoveHooks={mouseMoveHooks} />
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
