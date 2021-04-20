import IColorGradingSettings from './IColorGradingSettings';

export default interface ILutGenerator {
  create3D(name: string, settings: IColorGradingSettings): string;
}
