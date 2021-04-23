/* eslint-disable @typescript-eslint/no-unused-vars */
import REGL, { Regl } from 'regl'
import parseCubeLut from 'parse-cube-lut'

export default class LutWebGLRenderer {
  private canvas: HTMLCanvasElement
  private regl: Regl
  private render: Function
  private textureLut: REGL.Texture2D
  private textureSource: REGL.Texture2D

  constructor (canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.regl = REGL(canvas)

    this.textureLut = this.regl.texture({
      height: 1,
      width: 1,
      format: 'rgb',
      mag: 'linear',
      min: 'linear'
    })

    this.textureSource = this.regl.texture({
      height: 1,
      width: 1,
      mag: 'linear',
      min: 'linear'
    })

    this.render = this.createRenderFunction()
  }

  setSize (width: number, height: number): void {
    this.canvas.height = height
    this.canvas.width = width
    this.regl.poll()
  }

  update (image: HTMLImageElement, lutCube: string) {
    this.textureSource(image)

    if (!lutCube) {
      this.render({
        lut: {
          data: [],
          size: 0
        },
        textureLut: this.textureLut,
        textureSource: this.textureSource
      })

      return
    }

    const lut = parseCubeLut(lutCube)

    this.textureLut({
      data: lut.data.flat().map((n: number) => 255 * n),
      format: 'rgb',
      height: lut.size ** 2,
      width: lut.size
    })

    this.render({
      lut,
      textureLut: this.textureLut,
      textureSource: this.textureSource
    })
  }

  private createRenderFunction () {
    return this.regl({
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
        position: this.regl.buffer([
          [-1, 1],
          [1, 1],
          [1, -1],

          [-1, 1],
          [1, -1],
          [-1, -1]
        ]),

        uv: this.regl.buffer([
          [0, 0],
          [1, 0],
          [1, 1],

          [0, 0],
          [1, 1],
          [0, 1]
        ])
      },

      uniforms: {
        uLut: (context: any, props: any) => props.textureLut,
        uLutSize: (context: any, props: any) => props.lut.size,
        uTexture: (context: any, props: any) => props.textureSource,
        uIntensity: 1
      },

      count: 6
    })
  }
}
