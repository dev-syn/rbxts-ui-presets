import { Preset } from 'presets';

class PartialPreset<TClass extends Preset<any,any,any,any>> {
    Properties: Map<string,any>;
    Preset: new (...args: any[]) => TClass;
    ParamsInOrder: string[];

    constructor(
        properties: Map<string,any>,
        presetClass: new (...args: any[]) => TClass,
        paramsInOrder: string[]
    ) {
        this.Properties = properties;
        this.Preset = presetClass;
        this.ParamsInOrder = paramsInOrder;
    }
}

export = PartialPreset;