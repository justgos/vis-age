import * as THREE from 'three'
import React, { useMemo, useRef, PropsWithChildren } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

import { dpi } from '../config'
import { GestureData } from '../core/types'

interface Props {
  gestureData : GestureData;
}

export default function SceneController({ children, gestureData } : PropsWithChildren<Props>) {
  const {
    mouse,
    size: { width, height },
    camera,
    gl,
  } = useThree();

  const [ fpsCount, lastTime, lastReportTime]  = useMemo(
    () => {
      return [ { value: 0 }, { value: performance.now() }, { value: performance.now() } ]
    }, []
  );
  const sceneRef = useRef();
  const mainLight = useRef();
  const viewTransform = useMemo(() => {
    return {
      x: 0,
      y: -80 + height / 2,
      k: 1.0,
    };
  }, []);
  const lastGestureData : GestureData = useMemo(() => {
      return {
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
  }, []);
  useFrame(() => {
    let curTime = performance.now();
    lastTime.value = curTime;
    fpsCount.value++;
    if(curTime > lastReportTime.value + 1000.0) {
        // console.log('fps', fpsCount.value);
        lastReportTime.value = curTime;
        fpsCount.value = 0;
    }

    let mx = (mouse.x * 0.5) * width / camera.zoom + camera.position.x;
    let my = (mouse.y * 0.5) * height / camera.zoom + camera.position.y;

    // camera.position.x = width / 2;
    if(gestureData.dragging) {
      viewTransform.x -= (gestureData.dragX - lastGestureData.dragX) / viewTransform.k;
      viewTransform.y += (gestureData.dragY - lastGestureData.dragY) / viewTransform.k;
      lastGestureData.dragX = gestureData.dragX;
      lastGestureData.dragY = gestureData.dragY;
    } else {
      lastGestureData.dragX = 0;
      lastGestureData.dragY = 0;
    }
    lastGestureData.dragging = gestureData.dragging;

    if(gestureData.scrolling) {
      const dScale = 1.0 - 0.002 * (gestureData.scrollY - lastGestureData.scrollY);
      viewTransform.x += (mx - viewTransform.x) * -(1.0 - dScale);
      viewTransform.y += (my - viewTransform.y) * -(1.0 - dScale);

      viewTransform.k *= dScale;
      lastGestureData.scrollX = gestureData.scrollX;
      lastGestureData.scrollY = gestureData.scrollY;
    } else {
      lastGestureData.scrollX = 0;
      lastGestureData.scrollY = 0;
    }
    lastGestureData.scrolling = gestureData.scrolling;

    if(gestureData.pinching) {
      if(lastGestureData.pinching) {
        let dScale = gestureData.pinchD / lastGestureData.pinchD;
        viewTransform.x += (lastGestureData.pinchOrigin[0] - viewTransform.x) * -(1.0 - dScale);
        viewTransform.y += (lastGestureData.pinchOrigin[1] - viewTransform.y) * -(1.0 - dScale);
        viewTransform.k *= dScale;
      } else {
        let px = (gestureData.pinchOrigin[0] - width * 0.5) / camera.zoom + camera.position.x;
        let py = (height - gestureData.pinchOrigin[1] - height * 0.5) / camera.zoom + camera.position.y;
        lastGestureData.pinchOrigin = [ px, py ];
      }
      lastGestureData.pinchD = gestureData.pinchD;
      lastGestureData.pinchA = gestureData.pinchA;
    } else {
      lastGestureData.pinching = false;
    }
    lastGestureData.pinching = gestureData.pinching;
    // console.log('viewTransform.k', viewTransform.k)
    // Object.assign(lastGestureData, gestureData);
    camera.position.x = viewTransform.x;
    camera.position.y = viewTransform.y;
    camera.zoom = viewTransform.k;
    camera.updateProjectionMatrix();

    if(document.scrollingElement) {
      let scrollTop = document.scrollingElement.scrollTop;

      // mainLight.current.position.x = width / 2 + 200;
      // mainLight.current.position.y = -height / 2 + 100;
      // mainLight.current.position.y = -scrollTop;

      // sceneRef.current.position.y = Math.round(scrollTop * dpi) / dpi;
    }
  });

  return (
      <scene ref={sceneRef}>
        <ambientLight intensity={0.5} />
        <directionalLight intensity={0.6} position={[0, 0, 1000]} rotation={new THREE.Euler(0, 0, 0)} castShadow ref={mainLight} />
        {/* <spotLight intensity={0.7} position={[0, 0, 1000]} rotation={new THREE.Euler(0, 0, 0)} angle={Math.PI / 2} penumbra={1} castShadow ref={mainLight} /> */}
        {children}
      </scene>
  );
}
