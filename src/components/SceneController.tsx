import * as THREE from 'three'
import React, { useMemo, useRef, useEffect, PropsWithChildren } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { useGesture } from 'react-use-gesture'

interface Props {
  canvasContainerRef : React.RefObject<HTMLDivElement>;
}

export default function SceneController({ children, canvasContainerRef } : PropsWithChildren<Props>) {
  const {
    mouse,
    size: { width, height },
    camera,
    invalidate,
  } = useThree();

  const [ fpsCount, lastTime, lastReportTime]  = useMemo(
    () => {
      return [ { value: 0 }, { value: performance.now() }, { value: performance.now() } ]
    }, []
  );
  const sceneRef = useRef();
  const mainLight = useRef();
  const [ targetTransform, viewTransform ] = useMemo(() => {
    return [
      new THREE.Vector3(),
      {
        x: 0,
        y: 0,  // -80 + height / 2
        z: 0,
        // k: 1.0,
        k: 0.25,
        vec: new THREE.Vector3(),
        spherical: new THREE.Spherical(),
      },
    ];
  }, []);
  
  function mousePos() {
    let mx = (mouse.x * 0.5) * width / camera.zoom + camera.position.x;
    let my = (mouse.y * 0.5) * height / camera.zoom + camera.position.y;
    return [ mx, my ];
  }
  function screen2world(x : number, y : number) {
    return [
      (x - width * 0.5) / camera.zoom + camera.position.x,
      (height - y - height * 0.5) / camera.zoom + camera.position.y,
    ];
  }

  const bind = useGesture({
    onDrag: ({ event, last, down, delta: [dx, dy], buttons, touches }) => {
      if(down && (buttons === 1 || touches === 1)) {
        // const sensitivity = 0.005;
        // viewTransform.spherical.theta -= dx / viewTransform.k * sensitivity;
        // viewTransform.spherical.phi -= dy / viewTransform.k * sensitivity;
        // viewTransform.spherical.radius = 1000 / viewTransform.k;
        // viewTransform.spherical.makeSafe();
        // viewTransform.vec.setFromSpherical(viewTransform.spherical);
        // targetTransform.x -= Math.cos(dx / viewTransform.k) - Math.sin(dy / viewTransform.k);
        // targetTransform.y += ;
        viewTransform.x -= dx / viewTransform.k;
        viewTransform.y += dy / viewTransform.k;
        invalidate();
      }
      if(!last)
        event?.preventDefault();

      if(down)
        invalidate();
    },
    onWheel: ({ event, last, delta: [dx, dy] }) => {
      if(dx !== 0 || dy !== 0) {
        const [ mx, my ] = mousePos();
        const dScale = 1.0 - 0.002 * dy;
        viewTransform.x += (mx - viewTransform.x) * -(1.0 - dScale);
        viewTransform.y += (my - viewTransform.y) * -(1.0 - dScale);
        viewTransform.k *= dScale;
        // viewTransform.spherical.radius = 1000 / viewTransform.k;
        // viewTransform.spherical.makeSafe();
        // viewTransform.vec.setFromSpherical(viewTransform.spherical);
        invalidate();
      }
      if(!last)
        event?.preventDefault();
    },
    onPinch: ({ event, first, last, down, da: [d, a], previous: [pd, pa], origin, memo }) => {
      if(down && !first) {
        let dScale = d / pd;
        viewTransform.x += (memo[0] - viewTransform.x) * -(1.0 - dScale);
        viewTransform.y += (memo[1] - viewTransform.y) * -(1.0 - dScale);
        viewTransform.k *= dScale;
        // viewTransform.spherical.radius = 1000 / viewTransform.k;
        // viewTransform.spherical.makeSafe();
        // viewTransform.vec.setFromSpherical(viewTransform.spherical);
        // invalidate();
      }
      if(!last)
        event?.preventDefault();

      if(first) {
        return screen2world(origin?.[0] || 0, origin?.[1] || 0);
      }
      return memo;
    },
  }, {
    domTarget: canvasContainerRef,
    event: { passive: false },
  });
  useEffect(() => { bind(); }, [bind]);

  useFrame(() => {
    let curTime = performance.now();
    lastTime.value = curTime;
    fpsCount.value++;
    if(curTime > lastReportTime.value + 1000.0) {
        // console.log('fps', fpsCount.value);
        lastReportTime.value = curTime;
        fpsCount.value = 0;
    }

    // console.log('viewTransform.vec', viewTransform.vec)
    // camera.position.set(viewTransform.vec.x, viewTransform.vec.y, viewTransform.vec.z);
    // camera.rotation.x = viewTransform.spherical.phi;
    // camera.rotation.y = viewTransform.spherical.theta;
    // camera.lookAt(targetTransform);
    camera.position.x = viewTransform.x;
    camera.position.y = viewTransform.y;
    camera.zoom = viewTransform.k;
    camera.updateProjectionMatrix();
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
