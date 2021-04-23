import IColorMatrix from './IColorMatrix'

export default interface ILutGenerator {
  create(name: string, matrix: IColorMatrix): string;
}
