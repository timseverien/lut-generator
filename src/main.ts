import createRegl from 'regl';
import IColorGradingSettings from './scripts/IColorGradingSettings';
import LutGenerator from './scripts/LutGenerator';
import parseCubeLut from 'parse-cube-lut';

import './main.css';

function updateLut({
  draw,
  elementOutput,
  elementPreview,
  elementSource,
  settings,
  textureLut,
  textureSource,
} : {
  draw: Function,
  elementOutput: HTMLElement,
  elementPreview: HTMLCanvasElement,
  elementSource: HTMLImageElement,
  settings: IColorGradingSettings,
  textureSource: Function,
  textureLut: Function,
}): void {
  const lutGenerator = new LutGenerator();
  const lutCube = lutGenerator.create3D('', settings);
  const lut = parseCubeLut(lutCube);

  elementPreview.height = elementSource.clientHeight;
  elementPreview.width = elementSource.clientWidth;
  regl.poll();

  elementOutput.textContent = lutCube;

  textureLut({
    data: lut.data.flat().map((n: number) => 255 * n),
    format: 'rgb',
    height: lut.size ** 2,
    width: lut.size,
  });

  textureSource(elementSource);

  draw({
    lut,
    textureLut,
    textureSource,
  });
}

const colorGradingSettings: IColorGradingSettings = {
  brightness: 0,
  contrast: 1,
  gamma: 1,
  hue: 0,
  saturation: 1,
};

const colorGradingElements = {
  brightness: document.getElementById('input-brightness') as HTMLInputElement,
  contrast: document.getElementById('input-contrast') as HTMLInputElement,
  gamma: document.getElementById('input-gamma') as HTMLInputElement,
  hue: document.getElementById('input-hue') as HTMLInputElement,
  saturation: document.getElementById('input-saturation') as HTMLInputElement,
};

const elementOutput = document.getElementById('output') as HTMLPreElement;
const elementPreview = document.getElementById('canvas-preview') as HTMLCanvasElement;
const elementSource = document.getElementById('image-source') as HTMLImageElement;

const regl = createRegl(elementPreview);

const draw = regl({
  vert: `
    precision mediump float;

    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = vec4(position, 0, 1);
    }
  `,

  frag: `
    precision mediump float;

    vec3 lutLookup( sampler2D tex, float size, vec3 rgb ) {
      float sliceHeight = 1.0 / size;
      float yPixelHeight = 1.0 / ( size * size );

      // Get the slices on either side of the sample
      float slice = rgb.b * size;
      float interp = fract( slice );
      float slice0 = slice - interp;
      float centeredInterp = interp - 0.5;
      float slice1 = slice0 + sign( centeredInterp );

      // Pull y sample in by half a pixel in each direction to avoid color
      // bleeding from adjacent slices.
      float greenOffset = clamp( rgb.g * sliceHeight, yPixelHeight * 0.5, sliceHeight - yPixelHeight * 0.5 );
      vec2 uv0 = vec2(
        rgb.r,
        slice0 * sliceHeight + greenOffset
      );

      vec2 uv1 = vec2(
        rgb.r,
        slice1 * sliceHeight + greenOffset
      );
      vec3 sample0 = texture2D( tex, uv0 ).rgb;
      vec3 sample1 = texture2D( tex, uv1 ).rgb;
      return mix( sample0, sample1, abs( centeredInterp ) );
		}

    uniform float uLutSize;
    uniform float uIntensity;

    uniform sampler2D uLut;
    uniform sampler2D uTexture;

    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(uTexture, vUv);

      float pixelWidth = 1.0 / uLutSize;
      float halfPixelWidth = 0.5 / uLutSize;
      vec3 uvw = vec3(halfPixelWidth) + texel.rgb * (1.0 - pixelWidth);
      vec4 lutValue = vec4(lutLookup(uLut, uLutSize, uvw).rgb, texel.a);

      gl_FragColor = mix(texel, lutValue, uIntensity);
    }
  `,

  attributes: {
    position: regl.buffer([
      [-1,  1],
      [ 1,  1],
      [ 1, -1],

      [-1,  1],
      [ 1, -1],
      [-1, -1],
    ]),

    uv: regl.buffer([
      [0, 0],
      [1, 0],
      [1, 1],

      [0, 0],
      [1, 1],
      [0, 1],
    ]),
  },

  uniforms: {
    uLut: (context, props: any) => props.textureLut,
    uLutSize: (context, props) => (props as any).lut.size,
    uTexture: (context, props) => (props as any).textureSource,
    uIntensity: 1,
  },

  count: 6,
});

const textureSource = regl.texture({
  height: 1,
  width: 1,
});

const textureLut = regl.texture({
  format: 'rgb',
  height: 1,
  width: 1,
});

// Sync elements and values
for (const [property, inputElement] of Object.entries(colorGradingElements)) {
  inputElement.value = colorGradingSettings[property];

  inputElement.addEventListener('input', () => {
    colorGradingSettings[property] = Number.parseFloat(inputElement.value);

    updateLut({
      draw,
      elementOutput,
      elementPreview,
      elementSource,
      settings: colorGradingSettings,
      textureLut,
      textureSource,
    });
  });
}

elementSource.addEventListener('load', () => {
  updateLut({
    draw,
    elementOutput,
    elementPreview,
    elementSource,
    settings: colorGradingSettings,
    textureLut,
    textureSource,
  });
});

if (elementSource.naturalWidth) {
  updateLut({
    draw,
    elementOutput,
    elementPreview,
    elementSource,
    settings: colorGradingSettings,
    textureLut,
    textureSource,
  });
}
