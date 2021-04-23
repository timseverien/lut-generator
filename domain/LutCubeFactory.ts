import IColorMatrix from './IColorMatrix'
import ILutFactory from './ILutFactory'

function clamp (value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export default class LutCubeFactory implements ILutFactory {
  public identityLut: Float32Array;

  private lutDataSize: number;
  private lutSize: number;

  constructor (size: number) {
    this.lutDataSize = 3 * (size ** 3)
    this.lutSize = size

    this.identityLut = this.createIdentityLut()
  }

  create (name: string, matrix: IColorMatrix): string {
    const lut = this.getLutData(matrix)

    return [
      '#Created by Online LUT generator',
          `TITLE "${name}"`,
          '',
          '#LUT size',
          `LUT_3D_SIZE ${this.lutSize}`,
          '',

          '#data domain',
          'DOMAIN_MIN 0 0 0',
          'DOMAIN_MAX 1 1 1',
          '',

          '#LUT data points',
          this.getLutDataString(lut)
    ].join('\n')
  }

  private createIdentityLut (): Float32Array {
    const lut = new Float32Array(this.lutDataSize)

    const lutSizeSquared = this.lutSize ** 2

    for (let z = 0; z < this.lutSize; z++) {
      for (let y = 0; y < this.lutSize; y++) {
        for (let x = 0; x < this.lutSize; x++) {
          const index = 3 * (x + (y * this.lutSize) + (z * lutSizeSquared))

          lut[index + 0] = x / this.lutSize
          lut[index + 1] = y / this.lutSize
          lut[index + 2] = z / this.lutSize
        }
      }
    }

    return lut
  }

  private getLutData (matrix: IColorMatrix): Float32Array {
    const lut = new Float32Array(this.identityLut)

    for (let i = 0; i < this.lutDataSize; i += 3) {
      const [r, g, b] = lut.slice(i, i + 3)

      lut[i + 0] = clamp(matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3])
      lut[i + 1] = clamp(matrix[4] * r + matrix[5] * g + matrix[6] * b + matrix[7])
      lut[i + 2] = clamp(matrix[8] * r + matrix[9] * g + matrix[10] * b + matrix[11])
    }

    return lut
  }

  private getLutDataString (lut: Float32Array): string {
    let lutDataString = ''

    for (let i = 0; i < this.lutDataSize; i += 3) {
      const [r, g, b] = lut.slice(i, i + 3)

      lutDataString += `${r.toFixed(5)} ${g.toFixed(5)} ${b.toFixed(5)}\n`
    }

    return lutDataString
  }
}
