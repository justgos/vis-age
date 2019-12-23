import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from 'react-three-fiber';
import RBush from 'rbush';
import knn from 'rbush-knn';

import { store } from '../store';
import { updateTooltip } from '../store/tooltip/actions'
import { PointShader } from '../shaders/PointShader';
import { ExpressionDataRow } from '../core/types';

export const Volcano = () => {
  const {
    mouse,
    camera,
    size: { width, height },
  } = useThree();
  
  const [ expressionDataset, setExpressionDataset ] = useState({...store.getState().expressionDataset});
  const updateExpressionDataset = () => {
    // if(store.getState().expressionDataset.lastUpdateTime <= expressionDataset.lastUpdateTime)
    //   return;
    // console.log(store.getState().expressionDataset.lastUpdateTime, expressionDataset)
    // console.log('updateExpressionDataset', store.getState().expressionDataset)
    setExpressionDataset({...store.getState().expressionDataset});
  };
  useEffect(() => {
    store.subscribe(() => {
      updateExpressionDataset();
    });
    updateExpressionDataset();
  }, []);

  const xpos = (row : ExpressionDataRow) => 
    (row.fold_change_log2 || 0) * 25.0;
  const ypos = (row : ExpressionDataRow) => 
    (-Math.log(Math.max(row.p_value || 0, 1e-300))) * 0.9;

  const posAttr = useRef<THREE.BufferAttribute>();
  const sizeAttr = useRef<THREE.BufferAttribute>();
  // Setup point attribute buffers
  const [ positions, sizes, colors, pointTree ] = useMemo(
    () => {
      console.log('expressionDataset.raw.length', expressionDataset.raw.length)
      let positions = [];
      for(let i = 0; i < expressionDataset.raw.length; i++) {
        let row = expressionDataset.raw[i];
        positions.push(
          xpos(row),
          ypos(row),
          0
        );
      }
      let sizes = [];
      // Init sizes to zero
      for(let i = 0; i < expressionDataset.raw.length; i++) {
        sizes.push(1.0);
      }
      let colors = [];
      const warmColor = [251.0 / 255, 101.0 / 255, 66.0 / 255];
      const coldColor = [55.0 / 255, 94.0 / 255, 151.0 / 255];
      for(let i = 0; i < expressionDataset.raw.length; i++) {
        let row = expressionDataset.raw[i];
        if((row.fold_change_log2 || 0) > 0)
          colors.push(...warmColor, 1.0);
        else
          colors.push(...coldColor, 1.0);
      }
      return [ 
        new Float32Array(positions), 
        new Float32Array(sizes), 
        new Float32Array(colors), 
        new RBush() 
      ];
    },
    [expressionDataset.lastUpdateTime, expressionDataset.raw]
  );
  useEffect(
    () => {
      if(!sizeAttr.current)
        return;
      let sizes = [];
      // Init sizes to zero
      for(let i = 0; i < expressionDataset.raw.length; i+=1) {
        sizes.push(0.2);
      }
      // console.log('filtered expressionDataset.raw.length', expressionDataset.raw.length)
      // Set non-zeros sizes for the filtered points
      for(let i = 0; i < expressionDataset.filtered.length; i+=1) {
        let row = expressionDataset.filtered[i];
        if(row.__id)
          sizes[row.__id] = 1.0;
      }
      sizeAttr.current.array = new Float32Array(sizes);
      sizeAttr.current.needsUpdate = true;

      pointTree.clear();
      pointTree.load(expressionDataset.filtered.map(r => { return { 
        minX: xpos(r), 
        minY: ypos(r), 
        maxX: xpos(r), 
        maxY: ypos(r),
        ...r 
      }}));
    },
    [expressionDataset.filtered]
  );

  const [pointShader] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const pointShader = new PointShader({
      pointTexture: loader.load('./textures/circle.png'),
    });
    return [pointShader]
  }, []);

  const lastTargetId = useMemo(() => {
    return {
      value: 0,
    }
  }, []);
  const dashForNan = (val : string) => (val && val !== '' && val !== 'nan') ? val : '—';
  useFrame(() => {
    let mx = (mouse.x * 0.5) * width / camera.zoom + camera.position.x;
    let my = (mouse.y * 0.5) * height / camera.zoom + camera.position.y;

    // Tooltip targeting
    let nearest = knn(
      pointTree, 
      mx, 
      my, 
      1
    );
    if(nearest.length > 0) {
      let row = nearest[0];
      if(row.__id !== lastTargetId.value) {
        // console.log('updateTooltip', row)
        store.dispatch(updateTooltip(
          ((row.maxX + row.minX) / 2 - camera.position.x) * camera.zoom + width / 2,
          height / 2 - ((row.minY + row.maxY) / 2 - camera.position.y) * camera.zoom,
          <>
            <div className="prop">
              <div className="name">Gene</div>
              <div className="value">
                <div className="gene-name">{row.gene}</div> (
                <a href={"https://www.uniprot.org/uniprot/" + row.uniprot_mouse} target="_blank" rel="noopener noreferrer">
                  {row.uniprot_mouse}
                </a>
                )
              </div>
            </div>
            <div className="prop">
              <div className="name">Closest Daphnia homolog</div>
              <div className="value">
                <a href={"https://www.uniprot.org/uniprot/" + row.uniprot_daphnia} target="_blank" rel="noopener noreferrer">
                  {row.uniprot_daphnia}
                </a>
              </div>
            </div>
            <div className="prop">
              <div className="name">log<sub>2</sub>(Fold-change)</div>
              <div className="value" style={{ color: row.fold_change_log2 > 0 ? "#fb6542" : "#375e97" }}>
                {row.fold_change_log2?.toFixed(2)}
              </div>
            </div>
            <div className="prop">
              <div className="name">p-value</div>
              <div className="value">{row.p_value?.toExponential(6)}</div>
            </div>
            <div className="prop">
              <div className="name">Start age</div>
              <div className="value">{row.start_age}</div>
            </div>
            <div className="prop">
              <div className="name">End age</div>
              <div className="value">{row.end_age}</div>
            </div>
            <div className="prop">
              <div className="name">Sex</div>
              <div className="value">{row.sex}</div>
            </div>
            <div className="prop">
              <div className="name">Tissue</div>
              <div className="value">{dashForNan(row.tissue)}</div>
            </div>
            <div className="prop">
              <div className="name">Subtissue</div>
              <div className="value">{dashForNan(row.subtissue)}</div>
            </div>
            <div className="prop">
              <div className="name">Cell type</div>
              <div className="value">{dashForNan(row.cell_ontology_class)}</div>
            </div>
          </>
        ));
        lastTargetId.value = row.__id;
      }
      // console.log(nearest[0].gene, mx, my);
    }
  });

  if(positions.length < 1) {
    return (
      <>
      </>
    );
  }

  return (
    <>
      <points 
        frustumCulled={false}
        material={pointShader}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            ref={posAttr}
          />
          <bufferAttribute
            attachObject={['attributes', 'size']}
            count={sizes.length}
            array={sizes}
            itemSize={1}
            ref={sizeAttr}
          />
          <bufferAttribute
            attachObject={['attributes', 'color']}
            count={colors.length / 4}
            array={colors}
            itemSize={4}
            // ref={colorAttr}
          />
        </bufferGeometry>
      </points>
    </>
  );
};

export default Volcano;
