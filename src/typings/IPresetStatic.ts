import { UIPreset } from '../core/presets';

export interface IPresetStatic<
T extends Instance = Instance,
TPreset extends UIPreset = UIPreset
> {
	new(...args: any[]): TPreset;

	PresetInstance: () => T;
}