import * as THREE from 'three'

interface Props extends THREE.ShaderMaterialParameters {
  pointTexture : THREE.Texture;
}

export class PointShader extends THREE.ShaderMaterial {
  constructor(options : Props) {
    super({
      vertexShader: `
        attribute float size;
        attribute vec4 color;
        varying vec4 vColor;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position.xyz, 1.0 );
            float projectionSize = abs((projectionMatrix[0][0] + projectionMatrix[1][1]) / 2.0 * 300.0);
            gl_PointSize = 1.0 * size * pow(projectionSize, 0.3);
            gl_Position = projectionMatrix * mvPosition;
            vColor = color;
            // if(size == 0.0)
            //   color.w = 0.0;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec4 vColor;
        void main() {
          gl_FragColor = vColor * texture2D(pointTexture, gl_PointCoord);
          // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          // gl_FragColor.w *= 0.4;
        }
      `,
      // blendSrc: THREE.SrcAlphaFactor,
      // blendDst: THREE.OneMinusSrcAlphaFactor,
      // blending: THREE.CustomBlending,
      // blendEquation: THREE.AddEquation,
      // blending: THREE.AdditiveBlending,
      // blending: THREE.NoBlending,
      blending: THREE.NormalBlending,
      // depthTest: false,
      transparent: true,
      // vertexColors: true,
    });

    this.uniforms = {
      pointTexture: { value: options.pointTexture },
    }
  }
}
