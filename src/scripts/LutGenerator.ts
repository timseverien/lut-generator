import parseColor from 'color';

import IColorGradingSettings from './IColorGradingSettings';
import ILutGenerator from './ILutGenerator';

type RGB = number[];

export default class LutGenerator implements ILutGenerator {
  public create3D(
    name: string,
    settings: IColorGradingSettings,
  ) : string {
    const size = 32;

    return [
      '#Created by Online LUT generator',
      `TITLE "${name}"`,
      '',
      '#LUT size',
      `LUT_3D_SIZE ${size}`,
      '',

      // Domain is 0-1 if omitted
      // '#data domain',
      // 'DOMAIN_MIN 0.0 0.0 0.0',
      // 'DOMAIN_MAX 1.0 1.0 1.0',
      // '',

      '#LUT data points',
      this.createDataString(size, settings),
    ].join('\n');
  }

  private createDataString(size: number, settings: IColorGradingSettings): string {
    let result = '';

    for (let i = 0; i < size ** 3; i++) {
      const r = (i % size) / (size - 1);
      const g = (Math.floor(i / size) % size) / (size - 1);
      const b = (Math.floor(i / size / size)) / (size - 1);

      const [r1, g1, b1] = this.transformColor([r, g, b], settings);

      result += `${r1.toFixed(6)} ${g1.toFixed(6)} ${b1.toFixed(6)}\n`;
    }

    return result;
  }

  private transformColor([r, g, b]: RGB, settings: IColorGradingSettings): RGB {
    const rgb = [
      this.transformComponent(r, settings),
      this.transformComponent(g, settings),
      this.transformComponent(b, settings),
    ];

    const rgbWithEffects = parseColor(rgb)
      .rotate(settings.hue)
      .saturate(settings.saturation - 1)
      .rgb()
      .array();

    return rgbWithEffects;
  }

  private transformComponent(component, settings: IColorGradingSettings): number {
    const value = (
      ((component - 0.5) * settings.contrast + 0.5)
      + settings.brightness
    ) ** settings.gamma;

    return Math.min(1, Math.max(0, value));
  }
}
