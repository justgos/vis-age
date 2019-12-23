import React, { useEffect, useState, useMemo, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import axios from 'axios';
import * as THREE from 'three';
import * as Papa from 'papaparse';
import { Canvas } from 'react-three-fiber';
import { useGesture } from 'react-use-gesture'

import { dpi } from './config'
import { CsvParseResult, ExpressionDataRow, Pathway, GestureData } from './core/types'
import { updateDataset } from './store/expression-dataset/actions'
import { updatePathways } from './store/pathways/actions'
import Tooltip from './components/Tooltip'
import FilterPanel from './components/FilterPanel'
import SceneController from './components/SceneController'
import Volcano from './components/Volcano'
import './App.scss';
import Graph from './components/Graph';

const mapDispatchToProps = {
  updateDataset: updateDataset,
  updatePathways: updatePathways,
};

const connector = connect(
  null,
  mapDispatchToProps
);

function App({ updateDataset, updatePathways } : Partial<ConnectedProps<typeof connector>>) {
  const [ loading, setLoading ] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      // // Load the expression data
      // const csvData : CsvParseResult = await new Promise(
      //   function(complete, error) {
      //     Papa.parse(
      //       // './data/facs-18m-24m-cell_ontology_class.csv', 
      //       './data/merged_augmented.csv', 
      //       {
      //         delimiter: ',',
      //         header: true,
      //         download: true,
      //         dynamicTyping: true,
      //         complete, 
      //         error
      //       }
      //     );
      // });
      // updateDataset?.(csvData.data as ExpressionDataRow[]);

      // Load pathways
      let pathways = await axios.get('./data/pathways.json');
      updatePathways?.(pathways.data as Pathway[]);

      setLoading(false);
    };
    loadData();
  }, []);

  const canvasRef = useRef(null);

  const gestureData : GestureData = {
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
  const bind = useGesture({
    onDrag: ({ event, last, down, movement: [mx, my] }) => {
      gestureData.dragging = down;
      gestureData.dragX = mx;
      gestureData.dragY = my;
      if(!last)
        event?.preventDefault();
    },
    onWheel: ({ event, last, down, xy: [x, y] }) => {
      // console.log('onWheel', down, x, y)
      gestureData.scrolling = (x !== 0) || (y !== 0);
      gestureData.scrollX = x;
      gestureData.scrollY = y;
      if(!last)
        event?.preventDefault();
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
    },
  }, {
    domTarget: canvasRef,
    event: { passive: false },
  });
  React.useEffect(() => { bind(); }, [bind]);

  return (
    <div className="App">
      <Tooltip />
      <FilterPanel />
      <div className="main-canvas" ref={canvasRef}>
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
          gl2={true}
          // {...bind()}
        >
          <SceneController gestureData={gestureData}>
            <Graph />
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
