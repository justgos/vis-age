import * as THREE from 'three'

export class GraphEdgeShader extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        // attribute vec2 uv;
        varying vec2 texcoord;
        // attribute vec4 color;
        // varying vec4 vColor;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position.xyz, 1.0 );
            // gl_PointSize = 10.0 * size;
            gl_Position = projectionMatrix * mvPosition;
            texcoord = uv;
            // vColor = color;
            // if(size == 0.0)
            //   color.w = 0.0;
        }
      `,
      fragmentShader: `
        // uniform sampler2D pointTexture;
        varying vec2 texcoord;
        // varying vec4 vColor;
        void main() {
          // gl_FragColor = vColor * texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          gl_FragColor.w *= (1.0 - pow(texcoord.x, 4.0));
          gl_FragColor.w *= 0.2;
        }
      `,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcColorFactor,
      blending: THREE.CustomBlending,
      // blendEquation: THREE.AddEquation,
      // blending: THREE.AdditiveBlending,
      // blending: THREE.NormalBlending,
      // depthTest: false,
      transparent: true,
      // vertexColors: true,
    });

    this.uniforms = {
      map: { value: null },  // Required by three.js for uv parameter setup
      // pointTexture: { value: options.pointTexture },
    }
  }
}
